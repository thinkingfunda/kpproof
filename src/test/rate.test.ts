import { describe, it, expect } from "vitest";
import { rateOn } from "@/lib/store";

const rates = [
  { id: "a", date: "2026-05-05", rate: 95 },
  { id: "b", date: "2026-06-01", rate: 97 },
];

describe("rateOn", () => {
  it("uses 05-May rate for any date up to 31-May", () => {
    expect(rateOn(rates, "2026-05-05")).toBe(95);
    expect(rateOn(rates, "2026-05-30")).toBe(95);
  });
  it("uses 01-June rate from that date onward until next change", () => {
    expect(rateOn(rates, "2026-06-01")).toBe(97);
    expect(rateOn(rates, "2026-10-09")).toBe(97);
  });
  it("has no rate before the first rate date", () => {
    expect(rateOn(rates, "2026-05-04")).toBeUndefined();
  });
});

import { isVerified } from "@/lib/store";
describe("isVerified", () => {
  it("verified when slip litres and amount match", () => expect(isVerified({ litres: 150, amount: 14175 }, { litres: 150, amount: 14175 })).toBe(true));
  it("not verified when amount differs", () => expect(isVerified({ litres: 150, amount: 14175 }, { litres: 150, amount: 13000 })).toBe(false));
  it("not verified without OCR", () => expect(isVerified({ litres: 150, amount: 14175 }, null)).toBe(false));
});

import { groupTotals, monthKey } from "@/lib/totals";
describe("groupTotals", () => {
  it("sums litres, amount and verified per month", () => {
    const e = (date: string, l: number, a: number, v: boolean) => ({ id: date + l, date, partyId: "", partyName: "", vehicle: "", litres: l, amount: a, createdAt: 0, verified: v });
    const [t] = groupTotals([e("2026-05-05", 10, 950, true), e("2026-05-30", 20, 1900, false)], monthKey);
    expect(t).toMatchObject({ key: "2026-05", count: 2, litres: 30, amount: 2850, verified: 1 });
  });
});

import { canEdit, withYear } from "@/lib/store";
describe("edit window & slip year", () => {
  it("allows edit at 60 days", () => expect(canEdit("2026-08-13", "2026-10-12")).toBe(true));
  it("blocks edit at 61 days", () => expect(canEdit("2026-08-12", "2026-10-12")).toBe(false));
  it("forces current year", () => expect(withYear("2024-10-09", 2026)).toBe("2026-10-09"));
});
