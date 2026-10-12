import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Party = { id: string; name: string; active: boolean; phone?: string; creditLimit?: number | undefined };
export type RateRow = { id: string; date: string; rate: number };
export type Product = { id: string; name: string; rates: RateRow[] };
export type Vehicle = { id: string; number: string; partyId?: string | undefined; tankCapacity?: number | undefined };
export type Entry = {
  id: string; date: string; partyId: string; partyName: string;
  vehicle: string; litres: number; amount: number; image?: string | undefined; createdAt: number;
  productId?: string | undefined; productName?: string | undefined; rate?: number | undefined;
  signature?: string | undefined; shift?: string | undefined;
  ocr?: { litres: number | null; amount: number | null; date: string | null } | undefined; verified?: boolean | undefined;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = any;
const db = supabase as any;
const un = <T,>(v: T | null | undefined) => (v === null ? undefined : v) as T | undefined;
const num = (v: any) => (v == null ? undefined : Number(v));

/** Live list from one or more tables. `save(next)` writes only the differences, then realtime refreshes everyone. */
function useLive<T extends { id: string }>(tables: string[], load: () => Promise<T[]>, persist: (prev: T[], next: T[]) => Promise<void>) {
  const [val, setVal] = useState<T[]>([]);
  const cur = useRef<T[]>([]);
  const refresh = useCallback(async () => { try { const v = await load(); cur.current = v; setVal(v); } catch (e) { console.error(e); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    refresh();
    const ch = supabase.channel(`live-${tables.join("-")}-${Math.random().toString(36).slice(2)}`);
    for (const t of tables) ch.on("postgres_changes" as any, { event: "*", schema: "public", table: t }, () => refresh());
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useCallback(async (next: T[]) => {
    const prev = cur.current; cur.current = next; setVal(next);
    try { await persist(prev, next); } catch (e) { alert("Save failed: " + (e as Error).message); }
    refresh();
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps
  return [val, save] as const;
}

async function sync(table: string, prev: Row[], next: Row[]) {
  const ids = new Set(next.map((r) => r.id));
  const del = prev.filter((r) => !ids.has(r.id)).map((r) => r.id);
  const old = new Map(prev.map((r) => [r.id, JSON.stringify(r)]));
  const up = next.filter((r) => old.get(r.id) !== JSON.stringify(r));
  if (del.length) { const { error } = await db.from(table).delete().in("id", del); if (error) throw error; }
  if (up.length) { const { error } = await db.from(table).upsert(up); if (error) throw error; }
}
const must = ({ data, error }: { data: any; error: any }): any => { if (error) throw error; return data; };

const partyRow = (p: Party) => ({ id: p.id, name: p.name, active: p.active, credit_limit: p.creditLimit ?? null });
export const useParties = () => useLive<Party>(["parties"],
  async () => must(await db.from("parties").select("*").order("name")).map((r: Row) => ({ id: r.id, name: r.name, active: r.active, creditLimit: num(r.credit_limit) })),
  (a, b) => sync("parties", a.map(partyRow), b.map(partyRow)));

const vehRow = (v: Vehicle) => ({ id: v.id, number: v.number, party_id: v.partyId ?? null, tank_capacity: v.tankCapacity ?? null });
export const useVehicles = () => useLive<Vehicle>(["vehicles"],
  async () => must(await db.from("vehicles").select("*").order("number")).map((r: Row) => ({ id: r.id, number: r.number, partyId: un(r.party_id), tankCapacity: num(r.tank_capacity) })),
  (a, b) => sync("vehicles", a.map(vehRow), b.map(vehRow)));

const rateRows = (ps: Product[]) => ps.flatMap((p) => p.rates.map((r) => ({ id: r.id, product_id: p.id, rate_date: r.date, rate: r.rate })));
export const useProducts = () => useLive<Product>(["products", "product_rates"],
  async () => {
    const [ps, rs] = await Promise.all([db.from("products").select("*").order("name"), db.from("product_rates").select("*")]);
    const rates = must(rs) as Row[];
    return (must(ps) as Row[]).map((p) => ({ id: p.id, name: p.name,
      rates: rates.filter((r) => r.product_id === p.id).map((r) => ({ id: r.id, date: r.rate_date, rate: Number(r.rate) })) }));
  },
  async (a, b) => {
    await sync("products", a.map((p) => ({ id: p.id, name: p.name })), b.map((p) => ({ id: p.id, name: p.name })));
    await sync("product_rates", rateRows(a), rateRows(b));
  });

const entryRow = (e: Entry) => ({ id: e.id, entry_date: e.date, party_id: e.partyId || null, party_name: e.partyName, vehicle: e.vehicle,
  litres: e.litres, amount: e.amount, image: e.image ?? null, product_id: e.productId ?? null, product_name: e.productName ?? null,
  rate: e.rate ?? null, signature: e.signature ?? null, shift: e.shift ?? null, ocr: e.ocr ?? null, verified: !!e.verified,
  created_at: new Date(e.createdAt).toISOString() });
export const useEntries = () => useLive<Entry>(["fuel_entries"],
  async () => must(await db.from("fuel_entries").select("*").order("created_at", { ascending: false }).limit(1000)).map((r: Row) => ({
    id: r.id, date: r.entry_date, partyId: r.party_id ?? "", partyName: r.party_name, vehicle: r.vehicle, litres: Number(r.litres), amount: Number(r.amount),
    image: un(r.image), createdAt: new Date(r.created_at).getTime(), productId: un(r.product_id), productName: un(r.product_name), rate: num(r.rate),
    signature: un(r.signature), shift: un(r.shift), ocr: un(r.ocr), verified: r.verified })),
  (a, b) => sync("fuel_entries", a.map(entryRow), b.map(entryRow)));

/** Rate applicable on `date`: latest rate whose effective date is on or before `date`. */
export function rateOn(rates: RateRow[], date: string): number | undefined {
  let best: RateRow | undefined;
  for (const r of rates) if (r.date <= date && (!best || r.date > best.date)) best = r;
  return best?.rate;
}

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}-${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m) - 1]}-${y}`;
};
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Entry is verified when slip OCR litres and amount both match the saved entry (±1%). */
export function isVerified(e: { litres: number; amount: number }, ocr?: { litres: number | null; amount: number | null } | null) {
  if (!ocr || ocr.litres == null || ocr.amount == null) return false;
  const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.05, b * 0.01);
  return near(ocr.litres, e.litres) && near(ocr.amount, e.amount);
}

/** Entries can be edited for 60 days after the entry date. */
export const canEdit = (date: string, today = todayISO()) => (Date.parse(today) - Date.parse(date)) / 86400000 <= 60;
/** Slip dates: always use the current year. */
export const withYear = (iso: string, year = new Date().getFullYear()) => `${year}${iso.slice(4)}`;
