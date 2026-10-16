import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type GeminiKeyRow = { id: string; accountName: string; masked: string; exhaustedAt: string | null };

const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;

export const listGeminiKeys = createServerFn({ method: "GET" }).handler(async (): Promise<GeminiKeyRow[]> => {
  const { data } = await (await admin()).from("gemini_keys").select("id, account_name, api_key, exhausted_at").order("created_at");
  return (data ?? []).map((r: any) => ({ id: r.id, accountName: r.account_name, masked: `••••${String(r.api_key).slice(-4)}`, exhaustedAt: r.exhausted_at }));
});

export const saveGeminiKey = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid().optional(), accountName: z.string().trim().min(1).max(100), apiKey: z.string().trim().max(200).optional() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    if (data.id) {
      const patch: any = { account_name: data.accountName };
      if (data.apiKey) { patch.api_key = data.apiKey; patch.exhausted_at = null; }
      const { error } = await db.from("gemini_keys").update(patch).eq("id", data.id);
      return { error: error?.message };
    }
    if (!data.apiKey || data.apiKey.length < 20) return { error: "Enter a valid API key" };
    const { error } = await db.from("gemini_keys").insert({ account_name: data.accountName, api_key: data.apiKey });
    return { error: error?.message };
  });

export const deleteGeminiKey = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => { await (await admin()).from("gemini_keys").delete().eq("id", data.id); return { ok: true }; });

export const resetGeminiKey = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => { await (await admin()).from("gemini_keys").update({ exhausted_at: null }).eq("id", data.id); return { ok: true }; });
