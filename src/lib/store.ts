import { useEffect, useState, useCallback } from "react";

export type Party = { id: string; name: string; active: boolean; phone?: string };
export type Entry = {
  id: string; date: string; partyId: string; partyName: string;
  vehicle: string; litres: number; amount: number; image?: string | undefined; createdAt: number;
};

const PK = "fl_parties", EK = "fl_entries";
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

export const useParties = () => useLS<Party[]>(PK, seed);
export const useEntries = () => useLS<Entry[]>(EK, []);
export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
