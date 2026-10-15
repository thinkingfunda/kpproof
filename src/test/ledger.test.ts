import { describe, it, expect } from "vitest";
import { buildLedger, finalPayment, fyStart } from "@/lib/ledger";

describe("ledger", () => {
  it("final payment = amount - TDS + TCS", () => expect(finalPayment(1000, 10, 5)).toBe(995));
  it("financial year starts 1 April", () => { expect(fyStart("2026-03-31")).toBe("2025-04-01"); expect(fyStart("2026-04-01")).toBe("2026-04-01"); });
  it("opening and closing balance", () => {
    const bills = [{ id: "1", date: "2026-09-20", vehicle: "A", amount: 500, createdAt: 1 }, { id: "2", date: "2026-10-02", vehicle: "A", amount: 300, createdAt: 2 }];
    const pays = [{ id: "p", date: "2026-10-05", partyId: "x", partyName: "X", amount: 200, tds: 0, tcs: 0, final: 200, createdAt: 3 }];
    const r = buildLedger(bills, pays, "2026-10-01", "2026-10-15");
    expect(r.opening).toBe(500);
    expect(r.rows.map((x) => x.balance)).toEqual([800, 600]);
    expect(r.closing).toBe(600);
  });
});
