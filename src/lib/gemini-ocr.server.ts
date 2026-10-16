// Fallback OCR through the user's own Gemini keys, rotating to the next key when one is exhausted.
const COOLDOWN_MS = 60 * 60 * 1000;

export async function geminiOcr(prompt: string, image: string): Promise<{ text?: string; error?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  const { data: keys } = await db.from("gemini_keys").select("id, account_name, api_key, exhausted_at").order("created_at");
  const now = Date.now();
  const usable = (keys ?? []).filter((k: any) => !k.exhausted_at || now - new Date(k.exhausted_at).getTime() > COOLDOWN_MS);
  if (!usable.length) return { error: keys?.length ? "All Gemini keys exhausted" : "AI credits exhausted — add Gemini keys in Masters" };
  const m = image.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!m) return { error: "Bad image" };
  for (const k of usable) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": k.api_key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: m[1], data: m[2] } }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (res.ok) {
      const j: any = await res.json();
      const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
      if (text) return { text };
      continue;
    }
    console.error(`Gemini key "${k.account_name}" failed [${res.status}]: ${(await res.text()).slice(0, 300)}`);
    if ([429, 403, 401, 400].includes(res.status)) await db.from("gemini_keys").update({ exhausted_at: new Date().toISOString() }).eq("id", k.id);
  }
  return { error: "All Gemini keys failed" };
}
