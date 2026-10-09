import { supabase } from "@/integrations/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;
const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const KEYS = ["fl_parties", "fl_products", "fl_vehicles", "fl_entries"];
const DONE = "fl_imported_v1";

/** One-time push of data saved on this phone (before online sync) into the shared database. */
export async function importLocalData(): Promise<number> {
  if (typeof window === "undefined" || localStorage.getItem(DONE)) return 0;
  const read = (k: string): any[] => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
  const parties = read("fl_parties"), products = read("fl_products"), vehicles = read("fl_vehicles"), entries = read("fl_entries");
  if (!entries.length && !products.length && !vehicles.length) { localStorage.setItem(DONE, "1"); return 0; }

  const idMap = new Map<string, string>();
  const fix = (id?: string) => { if (!id) return null; if (isUuid(id)) return id; if (!idMap.has(id)) idMap.set(id, crypto.randomUUID()); return idMap.get(id)!; };
  const usedParty = new Set([...entries.map((e) => e.partyId), ...vehicles.map((v) => v.partyId)].filter(Boolean));
  // Skip the old sample parties unless real entries/vehicles use them.
  const realParties = parties.filter((p) => isUuid(p.id) || usedParty.has(p.id));

  const run = async (table: string, rows: any[]) => {
    if (!rows.length) return;
    const { error } = await db.from(table).upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  };
  await run("parties", realParties.map((p) => ({ id: fix(p.id), name: p.name, active: !!p.active, credit_limit: p.creditLimit ?? null })));
  await run("products", products.map((p) => ({ id: fix(p.id), name: p.name })));
  await run("product_rates", products.flatMap((p) => (p.rates ?? []).map((r: any) => ({ id: fix(r.id), product_id: fix(p.id), rate_date: r.date, rate: r.rate }))));
  await run("vehicles", vehicles.map((v) => ({ id: fix(v.id), number: v.number, party_id: fix(v.partyId), tank_capacity: v.tankCapacity ?? null })));
  await run("fuel_entries", entries.map((e) => ({
    id: fix(e.id), entry_date: e.date, party_id: fix(e.partyId), party_name: e.partyName, vehicle: e.vehicle,
    litres: e.litres, amount: e.amount, image: e.image ?? null, product_id: fix(e.productId), product_name: e.productName ?? null,
    rate: e.rate ?? null, signature: e.signature ?? null, shift: e.shift ?? null, ocr: e.ocr ?? null, verified: !!e.verified,
    created_at: new Date(e.createdAt || Date.now()).toISOString(),
  })));
  localStorage.setItem(DONE, "1");
  KEYS.forEach((k) => { const v = localStorage.getItem(k); if (v) { localStorage.setItem(k + "_backup", v); localStorage.removeItem(k); } });
  return entries.length;
}
