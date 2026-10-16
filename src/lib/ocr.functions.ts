import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type OcrResult = { date: string | null; partyName: string | null; vehicle: string | null; product: string | null; litres: number | null; amount: number | null; rate: number | null };

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["date", "partyName", "vehicle", "product", "litres", "amount", "rate"],
  properties: {
    date: { type: ["string", "null"], description: "Date on slip as YYYY-MM-DD" },
    partyName: { type: ["string", "null"] },
    vehicle: { type: ["string", "null"], description: "Vehicle registration number e.g. MH12AB1234, no spaces" },
    product: { type: ["string", "null"], description: "Fuel/product name e.g. Diesel, Petrol" },
    litres: { type: ["number", "null"] },
    amount: { type: ["number", "null"], description: "Total amount in rupees" },
    rate: { type: ["number", "null"], description: "Rate per litre" },
  },
};

const SYSTEM = "You read photos of Indian fuel dispenser meters (digital/7-segment or mechanical displays, usually rows labelled Sale/Amount Rs, Volume/Litres, Rate/Price per litre) and fuel slips/receipts. For a dispenser meter, read the digits exactly including the decimal point; the Volume/Litres row goes to litres, the Amount/Sale row to amount, the Rate row to rate. If only two of litres/amount/rate are visible, leave the third null. Ignore totalizer/cumulative counters. Extract fields; use null when not visible. Dates on slips are Indian DD/MM/YYYY; return YYYY-MM-DD. If a party name is visible, return the closest match from the known parties list. If a vehicle number is visible, return the closest match from the known vehicles list. Product should match the known products list when possible.";

export const readSlip = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ image: z.string().startsWith("data:image/").max(4_000_000), parties: z.array(z.string()).max(500), vehicles: z.array(z.string()).max(2000).default([]), products: z.array(z.string()).max(100) }).parse(d))
  .handler(async ({ data }): Promise<{ result?: OcrResult; error?: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "AI not configured" };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        text: { format: { type: "json_schema", name: "fuel_slip", strict: true, schema } },
        input: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [
            { type: "input_text", text: `Known parties: ${data.parties.join("; ") || "none"}\nKnown products: ${data.products.join("; ") || "none"}\nKnown vehicles: ${data.vehicles.join("; ") || "none"}` },
            { type: "input_image", image_url: data.image },
          ] },
        ],
      }),
    });
    if (!res.ok || !res.body) {
      const body = await res.text();
      console.error(`OCR failed [${res.status}]: ${body}`);
      if ([402, 403, 429].includes(res.status) || res.status >= 500) {
        const { geminiOcr } = await import("./gemini-ocr.server");
        const g = await geminiOcr(`${SYSTEM}\n\nKnown parties: ${data.parties.join("; ") || "none"}\nKnown products: ${data.products.join("; ") || "none"}\nKnown vehicles: ${data.vehicles.join("; ") || "none"}\n\nReturn ONLY JSON with keys date, partyName, vehicle, product, litres, amount, rate (null when not visible).`, data.image);
        if (!g.text) return { error: g.error ?? "Could not read slip" };
        try { return { result: JSON.parse(g.text.replace(/^```(json)?|```$/g, "").trim()) as OcrResult }; } catch { return { error: "Could not read slip" }; }
      }
      return { error: `Could not read slip (${res.status})` };
    }
    const reader = res.body.getReader(); const dec = new TextDecoder();
    let buf = "", text = "", err = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        const p = l.slice(5).trim(); if (!p || p === "[DONE]") continue;
        try {
          const ev = JSON.parse(p);
          if (ev.type === "response.output_text.delta") text += ev.delta;
          else if (ev.type === "error" || ev.type === "response.failed") err = ev.message || ev.response?.error?.message || "failed";
        } catch { /* ignore */ }
      }
    }
    if (!text) return { error: err || "Nothing read from image" };
    try { return { result: JSON.parse(text) as OcrResult }; } catch { return { error: "Could not read slip" }; }
  });
