// Supabase Edge Function: scan-receipt
// Privacy note: this function does not save receipt photos.
// It receives a temporary base64 image, sends it to Google Vision, parses the text,
// returns suggested transaction fields, and then lets the request end.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type ReceiptResult = {
  storeName: string;
  total: number | null;
  date: string;
  rawText: string;
};

function jsonResponse(body: unknown, status = 200){
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function cleanLine(line: string){
  return String(line || "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseReceiptDate(text: string){
  const patterns = [
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/,
    /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/
  ];

  for(const pattern of patterns){
    const match = text.match(pattern);
    if(!match) continue;

    if(pattern === patterns[1]){
      const [, yyyy, mm, dd] = match;
      return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    }

    let [, mm, dd, yy] = match;
    let year = Number(yy);
    if(year < 100) year += year >= 70 ? 1900 : 2000;

    const month = Number(mm);
    const day = Number(dd);

    if(month >= 1 && month <= 12 && day >= 1 && day <= 31){
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return "";
}

function parseMoney(value: string){
  const normalized = String(value || "").replace(/[^\d.,]/g, "").replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function parseReceiptTotal(lines: string[]){
  const joined = lines.join("\n");

  const strongTotalPatterns = [
    /\b(?:grand\s+total|amount\s+due|balance\s+due|total\s+due|sale\s+total|order\s+total|total)\b[^\d$]{0,24}\$?\s*(\d{1,5}(?:[.,]\d{2}))/gi,
    /\$?\s*(\d{1,5}(?:[.,]\d{2}))\s*\b(?:total|amount\s+due|balance\s+due)\b/gi
  ];

  const candidates: number[] = [];

  for(const pattern of strongTotalPatterns){
    let match;
    while((match = pattern.exec(joined)) !== null){
      const amount = parseMoney(match[1]);
      if(amount && amount > 0 && amount < 100000){
        candidates.push(amount);
      }
    }
  }

  if(candidates.length){
    return candidates[candidates.length - 1];
  }

  const moneyValues = joined
    .match(/\$?\s*\d{1,5}[.,]\d{2}\b/g)
    ?.map(parseMoney)
    .filter((n): n is number => !!n && n > 0 && n < 100000) || [];

  if(!moneyValues.length) return null;

  // Fallback: receipts often list subtotal/tax before total, so the largest value
  // is a reasonable beta guess when no explicit total label is found.
  return Math.max(...moneyValues);
}

function parseStoreName(lines: string[]){
  const badLine = /\b(receipt|invoice|terminal|cashier|date|time|total|subtotal|tax|visa|mastercard|debit|credit|approved|auth|change|balance|amount)\b/i;

  for(const line of lines.slice(0, 8)){
    const cleaned = cleanLine(line);
    if(cleaned.length < 2 || cleaned.length > 42) continue;
    if(/\d{3,}/.test(cleaned)) continue;
    if(badLine.test(cleaned)) continue;
    return cleaned;
  }

  return cleanLine(lines[0] || "Receipt");
}

function parseReceiptText(text: string): ReceiptResult{
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  return {
    storeName: parseStoreName(lines),
    total: parseReceiptTotal(lines),
    date: parseReceiptDate(text),
    rawText: text
  };
}

Deno.serve(async (req) => {
  if(req.method === "OPTIONS"){
    return new Response("ok", { headers: corsHeaders });
  }

  if(req.method !== "POST"){
    return jsonResponse({ ok:false, error:"Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
  if(!apiKey){
    return jsonResponse({ ok:false, error:"Missing GOOGLE_VISION_API_KEY Supabase secret" }, 500);
  }

  try{
    const body = await req.json();
    const imageBase64 = String(body?.imageBase64 || "").trim();

    if(!imageBase64){
      return jsonResponse({ ok:false, error:"Missing receipt image" }, 400);
    }

    if(imageBase64.length > 8_000_000){
      return jsonResponse({ ok:false, error:"Receipt image is too large after compression" }, 413);
    }

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }]
            }
          ]
        })
      }
    );

    const visionJson = await visionRes.json();

    if(!visionRes.ok){
      return jsonResponse({
        ok:false,
        error: visionJson?.error?.message || "Google Vision request failed"
      }, visionRes.status);
    }

    const response = visionJson?.responses?.[0] || {};
    const rawText =
      response?.fullTextAnnotation?.text ||
      response?.textAnnotations?.[0]?.description ||
      "";

    if(!rawText.trim()){
      return jsonResponse({ ok:false, error:"No text found on receipt" }, 422);
    }

    const receipt = parseReceiptText(rawText);

    return jsonResponse({
      ok: true,
      receipt
    });
  }catch(err){
    return jsonResponse({
      ok:false,
      error: err instanceof Error ? err.message : String(err)
    }, 500);
  }
});
