export type Payment = { id: string; date: string; partyId: string; partyName: string; amount: number; tds: number; tcs: number; final: number; remark?: string | undefined; createdAt: number };
export type LedgerRow = { date: string; type: "Bill" | "Payment"; vehicle: string; remark: string; bill: number; payment: number; tds: number; tcs: number; balance: number; key: string };

/** TDS/TCS applies once billing crosses ₹50 lakh. */
export const TAX_LIMIT = 5_000_000;
export const finalPayment = (amount: number, tds: number, tcs: number) => amount - tds + tcs;
/** Indian financial year start (1 April) for a date. */
export const fyStart = (iso: string) => { const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7)); return `${m >= 4 ? y : y - 1}-04-01`; };

type Bill = { id: string; date: string; vehicle: string; amount: number; createdAt: number };

/** Opening balance = bills − payments before `from`; rows in range carry a running closing balance. */
export function buildLedger(bills: Bill[], pays: Payment[], from: string, to: string) {
  let opening = 0;
  for (const b of bills) if (b.date < from) opening += b.amount;
  for (const p of pays) if (p.date < from) opening -= p.final;
  const items = [
    ...bills.filter((b) => b.date >= from && b.date <= to).map((b) => ({ date: b.date, t: b.createdAt, type: "Bill" as const, vehicle: b.vehicle, remark: "", bill: b.amount, payment: 0, tds: 0, tcs: 0, key: "b" + b.id })),
    ...pays.filter((p) => p.date >= from && p.date <= to).map((p) => ({ date: p.date, t: p.createdAt, type: "Payment" as const, vehicle: "", remark: p.remark ?? "", bill: 0, payment: p.final, tds: p.tds, tcs: p.tcs, key: "p" + p.id })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.t - b.t);
  let bal = opening;
  const rows: LedgerRow[] = items.map(({ t: _t, ...r }) => { bal += r.bill - r.payment; return { ...r, balance: bal }; });
  return { opening, rows, closing: bal };
}
