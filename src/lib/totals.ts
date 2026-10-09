import type { Entry } from "./store";

export type Total = { key: string; count: number; litres: number; amount: number; verified: number };

/** Group entries by a key and sum litres, amount and verified count. */
export function groupTotals(entries: Entry[], keyOf: (e: Entry) => string): Total[] {
  const m = new Map<string, Total>();
  for (const e of entries) {
    const k = keyOf(e);
    const t = m.get(k) ?? { key: k, count: 0, litres: 0, amount: 0, verified: 0 };
    t.count++; t.litres += e.litres; t.amount += e.amount; if (e.verified) t.verified++;
    m.set(k, t);
  }
  return [...m.values()];
}

export const monthKey = (e: Entry) => e.date.slice(0, 7);
export const shiftKey = (e: Entry) => e.shift ?? "No shift";
export const monthLabel = (k: string) => {
  const [y, m] = k.split("-");
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m) - 1]} ${y}`;
};
