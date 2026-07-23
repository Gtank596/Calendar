// fake-supabase.global.js — deterministic in-memory Supabase fake.
//
// One implementation, two consumers:
//   * Vitest: tests/helpers/loadApp.js evaluates this file INSIDE each jsdom
//     window before script.js runs, so the fake lives in the same realm as
//     the app.
//   * Playwright: tests/e2e/helpers.js serves this file in place of the real
//     supabase CDN bundle, so the browser gets window.supabase from here.
//
// It emulates the client patterns Vanguard Calendar actually uses:
//   auth (getSession / onAuthStateChange / signUp / signInWithPassword /
//   signOut), from().select().eq().gt().is().in().order().limit().range(),
//   insert / update / upsert (onConflict) / soft delete via update,
//   rpc(), channel().on().subscribe() realtime, removeChannel().
//
// "RLS" here is a client-side emulation for testing CLIENT behavior only:
//   * calendar_cloud_state: reads/writes restricted to the signed-in user.
//   * calendar_events: viewers match 0 rows on UPDATE (like real RLS) and
//     get a 42501 error on INSERT.
// It proves nothing about the real database policies — see TESTING.md.
//
// No network, no credentials, fully deterministic.

(function (global) {
  "use strict";

  function deepClone(value) {
    return value === undefined ? value : JSON.parse(JSON.stringify(value));
  }

  function nowISO() {
    return new Date().toISOString();
  }

  let idCounter = 0;
  function fakeId(prefix) {
    idCounter += 1;
    return (prefix || "row") + "-" + String(idCounter).padStart(4, "0");
  }

  // ---------------------------------------------------------------------------
  // Server: owns durable state (users, tables, session) plus runtime state
  // (auth listeners, realtime channels, injected failures).
  // ---------------------------------------------------------------------------
  function createServer(persistentState) {
    const state = persistentState || {};
    state.users = state.users || [];          // { id, email, password }
    state.session = state.session || null;    // { user: { id, email } }
    state.tables = state.tables || {};        // { tableName: rows[] }

    const runtime = {
      authListeners: [],
      channels: [],                            // active (subscribed) channels
      channelsEverCreated: 0,
      injectedErrors: [],                      // { table, op, error, times }
      offline: false,
      queryLog: [],                            // { table, op, filters }
    };

    function table(name) {
      if (!state.tables[name]) state.tables[name] = [];
      return state.tables[name];
    }

    function currentUser() {
      return state.session ? state.session.user : null;
    }

    function ensureUser(email, password) {
      let u = state.users.find((x) => x.email === email);
      if (!u) {
        u = { id: "user-" + email.replace(/[^a-z0-9]/gi, "_"), email: email, password: password || "pw" };
        state.users.push(u);
      }
      return u;
    }

    function fireAuth(event, session) {
      for (const cb of runtime.authListeners.slice()) {
        try { cb(event, session); } catch (err) { console.error("fakeSupabase auth listener error:", err); }
      }
    }

    function takeInjectedError(tableName, op) {
      const idx = runtime.injectedErrors.findIndex(
        (e) => (e.table === "*" || e.table === tableName) && (e.op === "*" || e.op === op)
      );
      if (idx === -1) return null;
      const entry = runtime.injectedErrors[idx];
      entry.times -= 1;
      if (entry.times <= 0) runtime.injectedErrors.splice(idx, 1);
      return entry.error;
    }

    // --- role helpers for the calendar_events policy emulation ---------------
    function roleForCalendar(userId, calendarId) {
      const cal = table("calendars").find((c) => c.id === calendarId);
      if (!cal) return null;
      if (cal.owner_user_id === userId) return "owner";
      const m = table("calendar_members").find(
        (x) => x.calendar_id === calendarId && x.user_id === userId
      );
      return m ? m.role : null;
    }

    function canWriteCalendarEvents(userId, calendarId) {
      const role = roleForCalendar(userId, calendarId);
      return role === "owner" || role === "editor";
    }

    function visibleCalendarIds(userId) {
      const ids = [];
      for (const c of table("calendars")) {
        if (c.owner_user_id === userId) ids.push(c.id);
      }
      for (const m of table("calendar_members")) {
        if (m.user_id === userId && !ids.includes(m.calendar_id)) ids.push(m.calendar_id);
      }
      return ids;
    }

    // --- read-policy emulation ------------------------------------------------
    function applyReadPolicy(tableName, rows) {
      const user = currentUser();
      if (!user) return [];
      if (tableName === "calendar_cloud_state") {
        return rows.filter((r) => r.user_id === user.id);
      }
      if (tableName === "calendars") {
        const ids = visibleCalendarIds(user.id);
        return rows.filter((r) => ids.includes(r.id));
      }
      if (tableName === "calendar_events") {
        const ids = visibleCalendarIds(user.id);
        return rows.filter((r) => ids.includes(r.calendar_id));
      }
      if (tableName === "calendar_members") {
        const owned = table("calendars")
          .filter((c) => c.owner_user_id === user.id)
          .map((c) => c.id);
        return rows.filter((r) => r.user_id === user.id || owned.includes(r.calendar_id));
      }
      if (tableName === "calendar_invites") {
        const owned = table("calendars")
          .filter((c) => c.owner_user_id === user.id)
          .map((c) => c.id);
        const myEmail = (user.email || "").toLowerCase();
        return rows.filter(
          (r) => owned.includes(r.calendar_id) || (r.invitee_email || "").toLowerCase() === myEmail
        );
      }
      return rows;
    }

    // --- write-policy emulation ----------------------------------------------
    // Returns { error } for hard rejections (like INSERT RLS violations) or
    // { filterTo } to silently restrict which rows an UPDATE may touch (like
    // real RLS on UPDATE: non-permitted rows simply do not match).
    function writePolicy(tableName, op, payloadRows) {
      const user = currentUser();
      if (!user) return { error: { message: "not authenticated", code: "401" } };

      if (tableName === "calendar_cloud_state") {
        const bad = (payloadRows || []).find((r) => r.user_id && r.user_id !== user.id);
        if (bad) {
          return { error: { message: "new row violates row-level security policy", code: "42501" } };
        }
        return { filterTo: (r) => r.user_id === user.id };
      }

      if (tableName === "calendar_events") {
        if (op === "insert") {
          const bad = (payloadRows || []).find((r) => !canWriteCalendarEvents(user.id, r.calendar_id));
          if (bad) {
            return { error: { message: "new row violates row-level security policy for table \"calendar_events\"", code: "42501" } };
          }
          return {};
        }
        // UPDATE (incl. soft delete): only rows in writable calendars match.
        return { filterTo: (r) => canWriteCalendarEvents(user.id, r.calendar_id) };
      }

      if (tableName === "calendar_members" || tableName === "calendar_invites") {
        return {}; // owner-only nuances are exercised through the RPCs below
      }

      return {};
    }

    // --- rpc emulation --------------------------------------------------------
    const rpcHandlers = {
      ensure_personal_calendar(args) {
        const user = currentUser();
        if (!user) return { data: null, error: { message: "not authenticated" } };
        let cal = table("calendars").find(
          (c) => c.owner_user_id === user.id && c.kind === "personal"
        );
        if (!cal) {
          cal = {
            id: fakeId("cal-personal"),
            owner_user_id: user.id,
            owner_email: user.email,
            name: "Personal calendar (" + user.email + ")",
            kind: "personal",
            color: "#7a5aff",
            created_at: nowISO(),
          };
          table("calendars").push(cal);
        }
        return { data: cal.id, error: null };
      },
      create_shared_calendar(args) {
        const user = currentUser();
        if (!user) return { data: null, error: { message: "not authenticated" } };
        const cal = {
          id: fakeId("cal-shared"),
          owner_user_id: user.id,
          owner_email: user.email,
          name: (args && args.p_name) || "Shared calendar",
          kind: "shared",
          color: "#4a90d9",
          created_at: nowISO(),
        };
        table("calendars").push(cal);
        return { data: cal.id, error: null };
      },
      accept_calendar_invite(args) {
        const user = currentUser();
        const inv = table("calendar_invites").find((i) => i.id === (args && args.p_invite_id));
        if (!user || !inv) return { data: null, error: { message: "invite not found" } };
        if ((inv.invitee_email || "").toLowerCase() !== (user.email || "").toLowerCase()) {
          return { data: null, error: { message: "permission denied", code: "42501" } };
        }
        inv.status = "accepted";
        table("calendar_members").push({
          id: fakeId("member"),
          calendar_id: inv.calendar_id,
          user_id: user.id,
          member_email: user.email,
          role: inv.role || "viewer",
        });
        return { data: true, error: null };
      },
      decline_calendar_invite(args) {
        const inv = table("calendar_invites").find((i) => i.id === (args && args.p_invite_id));
        if (!inv) return { data: null, error: { message: "invite not found" } };
        inv.status = "declined";
        return { data: true, error: null };
      },
      get_shared_calendar_events(args) {
        // V1 legacy sharing: sanitized share payload for a given owner.
        const rows = table("shared_v1_events").filter(
          (r) => r.owner_id === (args && args.p_owner_id)
        );
        return { data: deepClone(rows), error: null };
      },
    };

    // --- realtime -------------------------------------------------------------
    function emitPostgresChange(tableName, record) {
      for (const ch of runtime.channels.slice()) {
        for (const binding of ch.bindings) {
          if (binding.opts.table !== tableName) continue;
          const filter = binding.opts.filter || "";
          const m = filter.match(/^(\w+)=eq\.(.+)$/);
          if (m && String(record[m[1]]) !== m[2]) continue;
          try { binding.callback({ new: deepClone(record), table: tableName }); }
          catch (err) { console.error("fakeSupabase realtime callback error:", err); }
        }
      }
    }

    // --- the public server control surface ------------------------------------
    const server = {
      state: state,
      runtime: runtime,

      addUser(email, password) { return ensureUser(email, password); },

      // Drives the same auth listener path the real client uses.
      async signIn(email) {
        const u = ensureUser(email);
        state.session = { user: { id: u.id, email: u.email } };
        fireAuth("SIGNED_IN", deepClone(state.session));
        return deepClone(state.session.user);
      },
      async signOut() {
        state.session = null;
        fireAuth("SIGNED_OUT", null);
      },

      seedRows(tableName, rows) {
        for (const r of rows) table(tableName).push(deepClone(r));
      },
      getRows(tableName) { return deepClone(table(tableName)); },
      setRows(tableName, rows) { state.tables[tableName] = deepClone(rows); },

      makeCalendar(opts) {
        const cal = {
          id: opts.id || fakeId("cal"),
          owner_user_id: opts.ownerId,
          owner_email: opts.ownerEmail || "",
          name: opts.name || "Calendar",
          kind: opts.kind || "shared",
          color: opts.color || "#4a90d9",
          created_at: nowISO(),
        };
        table("calendars").push(cal);
        return cal;
      },
      addMember(calendarId, user, role) {
        const m = {
          id: fakeId("member"),
          calendar_id: calendarId,
          user_id: user.id,
          member_email: user.email,
          role: role,
        };
        table("calendar_members").push(m);
        return m;
      },
      makeSharedEvent(opts) {
        const row = {
          id: opts.id || fakeId("evt"),
          calendar_id: opts.calendarId,
          source_event_id: opts.sourceEventId || fakeId("src"),
          title: opts.title || "Shared event",
          details: opts.details || "",
          start_date: opts.startDate,
          start_time: opts.startTime || "",
          end_time: opts.endTime || "",
          color: opts.color || "#4a90d9",
          category_id: opts.categoryId || "other",
          recurrence: opts.recurrence || { freq: "none" },
          version: opts.version || 1,
          deleted_at: opts.deletedAt || null,
          created_at: nowISO(),
        };
        table("calendar_events").push(row);
        return row;
      },

      injectError(tableName, op, error, times) {
        runtime.injectedErrors.push({
          table: tableName || "*",
          op: op || "*",
          error: error || { message: "injected failure" },
          times: times || 1,
        });
      },
      setOffline(v) { runtime.offline = !!v; },

      emitPostgresChange: emitPostgresChange,
      activeChannelCount() { return runtime.channels.length; },
      channelsEverCreated() { return runtime.channelsEverCreated; },

      _internals: {
        table: table,
        currentUser: currentUser,
        applyReadPolicy: applyReadPolicy,
        writePolicy: writePolicy,
        rpcHandlers: rpcHandlers,
        fireAuth: fireAuth,
        takeInjectedError: takeInjectedError,
      },
    };

    return server;
  }

  // ---------------------------------------------------------------------------
  // Client: what window.supabase.createClient() returns, bound to a server.
  // ---------------------------------------------------------------------------
  function createClientForServer(server) {
    const S = server._internals;
    const runtime = server.runtime;
    const state = server.state;

    function opResult(tableName, op, fn) {
      // Thenable, like a real PostgrestBuilder.
      const promise = (async () => {
        if (runtime.offline) {
          return { data: null, error: { message: "TypeError: Failed to fetch (offline)", code: "network" } };
        }
        const injected = S.takeInjectedError(tableName, op);
        if (injected) return { data: null, error: injected };
        try {
          return fn();
        } catch (err) {
          return { data: null, error: { message: String(err && err.message || err) } };
        }
      })();
      return promise;
    }

    function makeBuilder(tableName) {
      const q = {
        filters: [],       // { kind: eq|gt|is|in, col, value }
        order: null,
        limitN: null,
        rangeFrom: null,
        rangeTo: null,
        op: "select",
        payload: null,
        upsertOptions: null,
        wantRows: false,   // .select() after a write
      };

      function rowMatches(row) {
        for (const f of q.filters) {
          const v = row[f.col];
          if (f.kind === "eq" && String(v) !== String(f.value)) return false;
          if (f.kind === "gt" && !(String(v) > String(f.value))) return false;
          if (f.kind === "is" && v !== f.value) return false;
          if (f.kind === "in" && !f.value.map(String).includes(String(v))) return false;
        }
        return true;
      }

      function runSelect() {
        let rows = S.applyReadPolicy(tableName, S.table(tableName)).filter(rowMatches);
        if (q.order) {
          const { col, ascending } = q.order;
          rows = rows.slice().sort((a, b) => {
            const av = a[col], bv = b[col];
            if (av === bv) return 0;
            return (av > bv ? 1 : -1) * (ascending ? 1 : -1);
          });
        }
        if (q.rangeFrom !== null) rows = rows.slice(q.rangeFrom, q.rangeTo + 1);
        if (q.limitN !== null) rows = rows.slice(0, q.limitN);
        runtime.queryLog.push({ table: tableName, op: "select", filters: deepClone(q.filters) });
        return { data: deepClone(rows), error: null };
      }

      function runInsert() {
        const rows = Array.isArray(q.payload) ? q.payload : [q.payload];
        const policy = S.writePolicy(tableName, "insert", rows);
        if (policy.error) return { data: null, error: policy.error };
        const inserted = rows.map((r) => {
          const row = Object.assign({ id: fakeId(tableName), version: 1, deleted_at: null, created_at: nowISO() }, deepClone(r));
          S.table(tableName).push(row);
          server.emitPostgresChange(tableName, row);
          return row;
        });
        runtime.queryLog.push({ table: tableName, op: "insert" });
        return { data: q.wantRows ? deepClone(inserted) : null, error: null };
      }

      function runUpdate() {
        const policy = S.writePolicy(tableName, "update", null);
        if (policy.error) return { data: null, error: policy.error };
        const updated = [];
        for (const row of S.table(tableName)) {
          if (!rowMatches(row)) continue;
          if (policy.filterTo && !policy.filterTo(row)) continue; // RLS: silently no match
          Object.assign(row, deepClone(q.payload));
          // Emulate the version-bump trigger used by optimistic locking.
          if (tableName === "calendar_events" && typeof row.version === "number") {
            row.version += 1;
          }
          updated.push(row);
          server.emitPostgresChange(tableName, row);
        }
        runtime.queryLog.push({ table: tableName, op: "update", matched: updated.length });
        return { data: q.wantRows ? deepClone(updated) : null, error: null };
      }

      function runUpsert() {
        const rows = Array.isArray(q.payload) ? q.payload : [q.payload];
        const policy = S.writePolicy(tableName, "upsert", rows);
        if (policy.error) return { data: null, error: policy.error };
        // onConflict may be a composite key, e.g. "calendar_id,source_event_id".
        const conflictCols = ((q.upsertOptions && q.upsertOptions.onConflict) || "id")
          .split(",").map((c) => c.trim());
        for (const r of rows) {
          const existing = S.table(tableName).find((x) =>
            conflictCols.every((col) => String(x[col]) === String(r[col]))
          );
          if (existing) Object.assign(existing, deepClone(r));
          else S.table(tableName).push(Object.assign({ id: fakeId(tableName), created_at: nowISO() }, deepClone(r)));
        }
        runtime.queryLog.push({ table: tableName, op: "upsert", rows: rows.length });
        return { data: null, error: null };
      }

      function runDelete() {
        const policy = S.writePolicy(tableName, "delete", null);
        if (policy.error) return { data: null, error: policy.error };
        const all = S.table(tableName);
        const kept = [];
        let removed = 0;
        for (const row of all) {
          const hit = rowMatches(row) && (!policy.filterTo || policy.filterTo(row));
          if (hit) removed++;
          else kept.push(row);
        }
        state.tables[tableName] = kept;
        runtime.queryLog.push({ table: tableName, op: "delete", removed: removed });
        return { data: null, error: null };
      }

      const builder = {
        select(cols) {
          if (q.op === "select") { /* initial read */ }
          else q.wantRows = true; // .select() chained after insert/update
          return builder;
        },
        insert(payload) { q.op = "insert"; q.payload = payload; return builder; },
        update(payload) { q.op = "update"; q.payload = payload; return builder; },
        upsert(payload, options) { q.op = "upsert"; q.payload = payload; q.upsertOptions = options; return builder; },
        delete() { q.op = "delete"; return builder; },
        eq(col, value) { q.filters.push({ kind: "eq", col: col, value: value }); return builder; },
        gt(col, value) { q.filters.push({ kind: "gt", col: col, value: value }); return builder; },
        is(col, value) { q.filters.push({ kind: "is", col: col, value: value }); return builder; },
        in(col, values) { q.filters.push({ kind: "in", col: col, value: values }); return builder; },
        order(col, opts) { q.order = { col: col, ascending: !opts || opts.ascending !== false }; return builder; },
        limit(n) { q.limitN = n; return builder; },
        range(from, to) { q.rangeFrom = from; q.rangeTo = to; return builder; },
        then(onFulfilled, onRejected) {
          const run = { select: runSelect, insert: runInsert, update: runUpdate, upsert: runUpsert, delete: runDelete }[q.op];
          return opResult(tableName, q.op, run).then(onFulfilled, onRejected);
        },
        catch(onRejected) { return builder.then(undefined, onRejected); },
      };
      return builder;
    }

    function makeChannel(name) {
      const channel = {
        name: name,
        bindings: [],
        subscribed: false,
        on(type, opts, callback) {
          channel.bindings.push({ type: type, opts: opts || {}, callback: callback });
          return channel;
        },
        subscribe(statusCallback) {
          runtime.channelsEverCreated += 1;
          if (!runtime.channels.includes(channel)) runtime.channels.push(channel);
          channel.subscribed = true;
          if (statusCallback) {
            Promise.resolve().then(() => { if (channel.subscribed) statusCallback("SUBSCRIBED"); });
          }
          return channel;
        },
        unsubscribe() {
          channel.subscribed = false;
          const i = runtime.channels.indexOf(channel);
          if (i !== -1) runtime.channels.splice(i, 1);
        },
      };
      return channel;
    }

    const client = {
      auth: {
        async getSession() {
          return { data: { session: deepClone(state.session) }, error: null };
        },
        onAuthStateChange(callback) {
          runtime.authListeners.push(callback);
          return {
            data: {
              subscription: {
                unsubscribe() {
                  const i = runtime.authListeners.indexOf(callback);
                  if (i !== -1) runtime.authListeners.splice(i, 1);
                },
              },
            },
          };
        },
        async signUp(creds) {
          const u = S.currentUser();
          const user = server.addUser(creds.email, creds.password);
          state.session = { user: { id: user.id, email: user.email } };
          S.fireAuth("SIGNED_IN", deepClone(state.session));
          return { data: { user: deepClone(state.session.user), session: deepClone(state.session) }, error: null };
        },
        async signInWithPassword(creds) {
          const u = state.users.find((x) => x.email === creds.email);
          if (!u || (u.password && creds.password !== u.password)) {
            return { data: { user: null, session: null }, error: { message: "Invalid login credentials" } };
          }
          state.session = { user: { id: u.id, email: u.email } };
          S.fireAuth("SIGNED_IN", deepClone(state.session));
          return { data: { user: deepClone(state.session.user), session: deepClone(state.session) }, error: null };
        },
        async signOut() {
          state.session = null;
          S.fireAuth("SIGNED_OUT", null);
          return { error: null };
        },
      },
      from(tableName) { return makeBuilder(tableName); },
      rpc(name, args) {
        return opResult("rpc:" + name, "rpc", () => {
          const handler = S.rpcHandlers[name];
          if (!handler) {
            return { data: null, error: { message: "function " + name + " does not exist", code: "PGRST202" } };
          }
          return handler(args);
        });
      },
      channel(name) { return makeChannel(name); },
      removeChannel(channel) { if (channel && channel.unsubscribe) channel.unsubscribe(); },
    };

    return client;
  }

  const api = {
    createServer: createServer,
    createClientForServer: createClientForServer,
    // Builds the `window.supabase` UMD-style namespace bound to a server.
    createNamespace(server) {
      return {
        createClient: function () { return createClientForServer(server); },
        __fakeServer: server,
      };
    },
  };

  global.__VANGUARD_FAKE_SUPABASE__ = api;

  // Browser (Playwright CDN replacement): install window.supabase immediately
  // with a self-owned server, unless a harness already provided one.
  if (typeof window !== "undefined" && !global.__VANGUARD_FAKE_SUPABASE_MANAGED__) {
    const server = createServer(global.__VANGUARD_FAKE_SUPABASE_STATE__ || undefined);
    global.__vanguardFakeSupabaseServer = server;
    global.supabase = api.createNamespace(server);
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
