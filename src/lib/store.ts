import { useEffect, useState, useCallback } from "react";

export type Party = { id: string; name: string; active: boolean; phone?: string };
export type RateRow = { id: string; date: string; rate: number };
export type Product = { id: string; name: string; rates: RateRow[] };
export type Vehicle = { id: string; number: string; partyId?: string | undefined };
export type Entry = {
  id: string; date: string; partyId: string; partyName: string;
  vehicle: string; litres: number; amount: number; image?: string | undefined; createdAt: number;
  productId?: string | undefined; productName?: string | undefined; rate?: number | undefined;
};

const seed: Party[] = [
  { id: "p1", name: "Apex Logistics Pvt Ltd", active: true },
  { id: "p2", name: "Shree Transport Co", active: true },
  { id: "p3", name: "Metro Movers", active: false },
];

function useLS<T>(key: string, init: T) {
  const [val, setVal] = useState<T>(init);
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw) setVal(JSON.parse(raw));
    else localStorage.setItem(key, JSON.stringify(init));
  }, [key]);
  const save = useCallback((v: T) => {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { alert("Storage full – delete old entries."); }
  }, [key]);
  return [val, save] as const;
}

/** Rate applicable on `date`: latest rate whose effective date is on or before `date`. */
export function rateOn(rates: RateRow[], date: string): number | undefined {
  let best: RateRow | undefined;
  for (const r of rates) if (r.date <= date && (!best || r.date > best.date)) best = r;
  return best?.rate;
}

export const useParties = () => useLS<Party[]>("fl_parties", seed);
export const useEntries = () => useLS<Entry[]>("fl_entries", []);
export const useProducts = () => useLS<Product[]>("fl_products", []);
export const useVehicles = () => useLS<Vehicle[]>("fl_vehicles", []);
export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}-${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m) - 1]}-${y}`;
};
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
