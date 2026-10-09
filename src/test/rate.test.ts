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
