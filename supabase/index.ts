// ============================================================================
// send-due-reminders — Supabase Edge Function (Web Push V2)
// ============================================================================
// Invoked by ONE pg_cron job every 5 minutes (see supabase/webpush_v2.sql).
// One invocation batch-processes due reminders for ALL users:
//
//   1. Select reminder_schedules where status='active' AND next_reminder_at <= now()
//      (LIMIT + loop so a big backlog can't time the function out).
//   2. For each row: CLAIM it first by advancing/retiring it with an
//      optimistic compare on next_reminder_at (prevents double-sends if two
//      invocations ever overlap), THEN send Web Push to that user's enabled
//      subscriptions.
//   3. One-time events  → status='sent'.
//      Recurring events → next_reminder_at rolled forward to the next valid
//      occurrence (recurrence logic ported 1:1 from the client's
//      recurrenceMatches in script.js section 11B — including its quirk that
//      'daily' ignores interval — so push and local reminders always agree).
//   4. Push endpoints returning 404/410 are deleted; other per-notification
//      failures are logged and never crash the batch.
//   5. Roughly once a day it also calls cleanup_webpush_rows() (no second
//      cron job needed).
//
// Deploy:   supabase functions deploy send-due-reminders --no-verify-jwt
// Secrets:  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET
// (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
//
// Privacy: payloads carry title (already truncated at write time), a
// when-string, and IDs — never event notes/details. Nothing is logged beyond
// counts, event IDs, and error strings. No permanent notification log exists.
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// --- Config / tuning ---------------------------------------------------------

const BATCH_SIZE = 50;              // rows per DB page
const MAX_BATCHES = 8;              // hard cap per invocation (≤400 reminders)
const SKIP_IF_LATE_MS = 60 * 60 * 1000; // >1h stale (function was down) → advance silently, don't spam
const HORIZON_DAYS = 800;           // how far ahead to search for the next occurrence
const PUSH_TTL_SECONDS = 900;       // push service may drop after 15 min (reminder is stale by then)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// --- Types --------------------------------------------------------------------

interface RecurrenceJson {
  freq?: string;
  interval?: number;
  until?: string;
  days?: number[];
  exceptions?: string[];
}

interface ScheduleRow {
  user_id: string;
  event_id: string;
  status: string;
  next_reminder_at: string;
  title: string | null;
  start_date: string;       // 'YYYY-MM-DD'
  start_minutes: number;
  offset_minutes: number;
  timezone: string;
  recurrence: RecurrenceJson;
}

interface SubRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// --- Date helpers (UTC-based; exact integer day math, DST-proof) ---------------

function isoToUtcMidnight(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcMidnightToIso(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

function isoWeekday(iso: string): number {
  return new Date(isoToUtcMidnight(iso)).getUTCDay(); // 0=Sun..6=Sat, same as client getDay()
}

function isoDayOfMonth(iso: string): number {
  return Number(iso.slice(8, 10));
}

function isoMonth(iso: string): number {
  return Number(iso.slice(5, 7)); // 1..12
}

// --- Timezone: local wall-clock (date + minutes) → UTC instant -----------------
// Standard two-pass Intl offset trick. DST-safe for all real occurrences;
// during the nonexistent spring-forward hour it resolves to an adjacent valid
// instant, which matches how the client's local Date would behave anyway.

function tzOffsetMs(atUtcMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(atUtcMs))) parts[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  return asUtc - atUtcMs; // positive = zone is ahead of UTC
}

function zonedWallTimeToUtcMs(dateISO: string, minutes: number, timeZone: string): number {
  const naive = isoToUtcMidnight(dateISO) + minutes * 60000; // pretend it's UTC
  let ts = naive - tzOffsetMs(naive, timeZone);              // first correction
  ts = naive - tzOffsetMs(ts, timeZone);                     // second pass nails DST edges
  return ts;
}

// --- Recurrence engine: 1:1 port of client recurrenceMatches (section 11B) -----
// Do NOT "fix" behavior here; matching the client exactly is the requirement.
// Quirks preserved on purpose:
//   * 'daily' ignores interval (fires every day) — matches the client.
//   * 'weekly'/'weeklyDays' anchor week counting at start_date via
//     floor(diffDays / 7), exactly like the client.
//   * 'monthly' = same day-of-month (naturally skips e.g. Feb for a 31st).
//   * 'yearly'  = same month + day.

function recurrenceMatchesServer(row: ScheduleRow, targetISO: string): boolean {
  const r = row.recurrence || {};
  const freq = r.freq || "none";
  if (freq === "none") return false;
  const start = row.start_date;
  if (!start) return false;

  if (targetISO < start) return false;
  if (r.until && targetISO > r.until) return false;

  if (freq === "daily") return true; // interval intentionally ignored (client parity)

  const diffDays = Math.floor((isoToUtcMidnight(targetISO) - isoToUtcMidnight(start)) / 86400000);

  if (freq === "weekly") {
    if (isoWeekday(targetISO) !== isoWeekday(start)) return false;
    const interval = Math.max(1, Math.floor(Number(r.interval) || 1));
    return Math.floor(diffDays / 7) % interval === 0;
  }

  if (freq === "weeklyDays") {
    const interval = Math.max(1, Math.floor(Number(r.interval) || 1));
    const days = Array.isArray(r.days) ? r.days : [];
    if (!days.includes(isoWeekday(targetISO))) return false;
    if (diffDays < 0) return false;
    return Math.floor(diffDays / 7) % interval === 0;
  }

  if (freq === "monthly") return isoDayOfMonth(targetISO) === isoDayOfMonth(start);
  if (freq === "yearly") {
    return isoDayOfMonth(targetISO) === isoDayOfMonth(start) &&
           isoMonth(targetISO) === isoMonth(start);
  }

  return false; // unknown freq → caller marks the row 'error' rather than guessing
}

function isKnownFreq(freq: string): boolean {
  return ["none", "daily", "weekly", "weeklyDays", "monthly", "yearly"].includes(freq);
}

// Next occurrence strictly AFTER afterISO whose reminder time is > nowMs.
// Missed occurrences (reminder time already past) are skipped, not spammed.
function findNextReminder(
  row: ScheduleRow,
  afterISO: string,
  nowMs: number,
): { occISO: string; reminderMs: number } | null {
  const exceptions = Array.isArray(row.recurrence?.exceptions) ? row.recurrence.exceptions : [];
  const until = (row.recurrence?.until || "").toString();
  let cursor = isoToUtcMidnight(afterISO);

  for (let i = 0; i < HORIZON_DAYS; i++) {
    cursor += 86400000;
    const iso = utcMidnightToIso(cursor);
    if (until && iso > until) return null; // series ended
    if (exceptions.includes(iso)) continue;
    if (!recurrenceMatchesServer(row, iso)) continue;

    const startUtcMs = zonedWallTimeToUtcMs(iso, row.start_minutes, row.timezone);
    const reminderMs = startUtcMs - row.offset_minutes * 60000;
    if (reminderMs > nowMs) return { occISO: iso, reminderMs };
    // reminder already in the past (we were down) → keep scanning forward
  }
  return null; // nothing within horizon → retire the row (client re-creates if needed)
}

// --- Payload building -----------------------------------------------------------

const OFFSET_LABELS: Record<number, string> = {
  0: "At time of event",
  5: "5 minutes before",
  15: "15 minutes before",
  30: "30 minutes before",
  60: "1 hour before",
  1440: "1 day before",
};

function minutesToClockLabel(mins: number): string {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
}

function dayLabel(occISO: string, timeZone: string, nowMs: number): string {
  const fmt = (ms: number) =>
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
  const todayISO = fmt(nowMs);
  if (occISO === todayISO) return "Today";
  if (occISO === fmt(nowMs + 86400000)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", {
    timeZone, weekday: "short", month: "short", day: "numeric",
  }).format(new Date(zonedWallTimeToUtcMs(occISO, 720, timeZone))); // noon avoids date-edge issues
}

// Deterministic V1-compatible reminder ID — identical to the client's
// buildReminderId(), so push and local notifications share a tag and dedupe.
function buildReminderId(row: ScheduleRow, occISO: string): string {
  return `v1|${row.event_id}|${occISO}|${row.start_minutes}|${row.offset_minutes}`;
}

function buildPayload(row: ScheduleRow, occISO: string, nowMs: number): string {
  const offsetLabel = OFFSET_LABELS[row.offset_minutes] || `${row.offset_minutes} minutes before`;
  const when = `${minutesToClockLabel(row.start_minutes)} · ${dayLabel(occISO, row.timezone, nowMs)}`;
  return JSON.stringify({
    reminderId: buildReminderId(row, occISO),
    eventId: row.event_id,
    occDate: occISO,
    title: (row.title || "Untitled event").slice(0, 80), // small payload, no details/notes
    body: `${when} (${offsetLabel})`,
  });
}

// --- Main -----------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // Deployed with --no-verify-jwt; this shared secret (also stored in Vault
  // for the cron job) is the gate. Without it, nobody can trigger sends.
  if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error("send-due-reminders: VAPID keys are not configured");
    return new Response("vapid not configured", { status: 500 });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const stats = { scanned: 0, sent: 0, skippedStale: 0, advanced: 0, retired: 0, errors: 0, deadSubs: 0 };

  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    // 1) Due rows across ALL users (partial index on next_reminder_at makes
    //    this cheap even as the table grows).
    const { data: due, error: dueErr } = await sb
      .from("reminder_schedules")
      .select("*")
      .eq("status", "active")
      .lte("next_reminder_at", nowIso)
      .order("next_reminder_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (dueErr) {
      console.error("send-due-reminders: due query failed:", dueErr.message);
      break;
    }
    if (!due || due.length === 0) break;
    stats.scanned += due.length;

    // 2) All enabled subscriptions for this batch's users, one query.
    const userIds = [...new Set(due.map((r: ScheduleRow) => r.user_id))];
    const { data: subs, error: subErr } = await sb
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .in("user_id", userIds)
      .eq("enabled", true);

    if (subErr) {
      console.error("send-due-reminders: subscription query failed:", subErr.message);
      break;
    }
    const subsByUser = new Map<string, SubRow[]>();
    for (const s of (subs || []) as SubRow[]) {
      const list = subsByUser.get(s.user_id) || [];
      list.push(s);
      subsByUser.set(s.user_id, list);
    }

    // 3) Process each due schedule; one bad row must never sink the batch.
    for (const row of due as ScheduleRow[]) {
      try {
        const dueMs = new Date(row.next_reminder_at).getTime();
        const freq = row.recurrence?.freq || "none";

        // Unknown recurrence / bad tz → mark 'error' and stop retrying,
        // rather than risk sending wrong reminders forever.
        if (!isKnownFreq(freq) || !row.timezone) {
          await sb.from("reminder_schedules")
            .update({ status: "error", next_reminder_at: null, last_error: `unsupported recurrence/timezone (freq=${freq})`, updated_at: nowIso })
            .eq("user_id", row.user_id).eq("event_id", row.event_id);
          stats.errors++;
          console.warn(`schedule error: user=${row.user_id} event=${row.event_id} freq=${freq}`);
          continue;
        }

        // Current occurrence = reminder time + offset, dated in the event tz.
        const occStartMs = dueMs + row.offset_minutes * 60000;
        const occISO = new Intl.DateTimeFormat("en-CA", {
          timeZone: row.timezone, year: "numeric", month: "2-digit", day: "2-digit",
        }).format(new Date(occStartMs));

        // Where does this row go AFTER this occurrence?
        const isOneTime = freq === "none";
        const next = isOneTime ? null : findNextReminder(row, occISO, nowMs);

        // 3a) CLAIM: advance/retire the row first, with an optimistic
        //     compare on next_reminder_at. If another overlapping invocation
        //     already claimed it, 0 rows match and we skip — no double push.
        const claimUpdate = isOneTime
          ? { status: "sent", next_reminder_at: null, last_sent_at: nowIso, updated_at: nowIso }
          : next
            ? { next_reminder_at: new Date(next.reminderMs).toISOString(), last_sent_at: nowIso, updated_at: nowIso }
            : { status: "disabled", next_reminder_at: null, last_sent_at: nowIso, last_error: "series completed or beyond horizon", updated_at: nowIso };

        const { data: claimed, error: claimErr } = await sb
          .from("reminder_schedules")
          .update(claimUpdate)
          .eq("user_id", row.user_id)
          .eq("event_id", row.event_id)
          .eq("status", "active")
          .eq("next_reminder_at", row.next_reminder_at)
          .select("event_id");

        if (claimErr) {
          stats.errors++;
          console.warn(`claim failed: event=${row.event_id}: ${claimErr.message}`);
          continue;
        }
        if (!claimed || claimed.length === 0) continue; // someone else claimed it
        if (!isOneTime && next) stats.advanced++;
        if (!isOneTime && !next) stats.retired++;

        // 3b) Very stale (function was down for a while)? Advance silently —
        //     a "reminder" arriving hours late is worse than none.
        if (nowMs - dueMs > SKIP_IF_LATE_MS) {
          stats.skippedStale++;
          continue;
        }

        // 3c) Send to every enabled subscription this user has.
        const userSubs = subsByUser.get(row.user_id) || [];
        if (userSubs.length === 0) continue; // schedule still rolls forward

        const payload = buildPayload(row, occISO, nowMs);
        for (const sub of userSubs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
              { TTL: PUSH_TTL_SECONDS, urgency: "high" },
            );
            stats.sent++;
          } catch (err) {
            const code = (err as { statusCode?: number })?.statusCode;
            if (code === 404 || code === 410) {
              // Endpoint is gone/expired → delete so we never retry it.
              await sb.from("push_subscriptions").delete().eq("id", sub.id);
              stats.deadSubs++;
            } else {
              stats.errors++;
              console.warn(`push failed: event=${row.event_id} status=${code ?? "?"}: ${(err as Error)?.message}`);
            }
          }
        }
      } catch (err) {
        // Catch-all: never let one schedule crash the whole batch.
        stats.errors++;
        console.warn(`schedule processing failed: event=${row.event_id}:`, (err as Error)?.message);
      }
    }

    if (due.length < BATCH_SIZE) break; // backlog drained
  }

  // Daily-ish cleanup (~03:00–03:05 UTC run) — keeps row counts predictable
  // without a second cron job. Deletes old sent/disabled rows and stale
  // disabled subscriptions (see cleanup_webpush_rows in webpush_v2.sql).
  const nowD = new Date();
  if (nowD.getUTCHours() === 3 && nowD.getUTCMinutes() < 5) {
    const { error: cleanErr } = await sb.rpc("cleanup_webpush_rows");
    if (cleanErr) console.warn("cleanup_webpush_rows failed:", cleanErr.message);
  }

  console.info("send-due-reminders:", JSON.stringify(stats));
  return new Response(JSON.stringify({ ok: true, ...stats }), {
    headers: { "Content-Type": "application/json" },
  });
});
