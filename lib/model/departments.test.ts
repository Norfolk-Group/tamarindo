import { describe, expect, it } from "vitest";
import { monthDepartmentCash } from "@/lib/model/departments";
import { defaultValues } from "@/lib/model/variables";

describe("department cash", () => {
  it("pays the four named US roles at half for the first 8 months", () => {
    const start = monthDepartmentCash(defaultValues(), 0, 0, 0);
    const full = monthDepartmentCash(defaultValues(), 0, 0, 8);
    const named = 26_973 + 16_805 + 26_973 + 16_805;
    expect(start.us.leadership).toBe(named * 0.5);
    expect(full.us.leadership).toBe(named);
    expect(start.colombia.gm).toBe(18_150);
  });

  it("adds WhatsApp / voice once CS heads grow with the book", () => {
    const thin = monthDepartmentCash(defaultValues(), 5, 1, 3);
    const thick = monthDepartmentCash(defaultValues(), 200, 8, 24);
    expect(thick.us.success).toBeGreaterThan(thin.us.success);
    expect(thick.colombia.success).toBeGreaterThan(thin.colombia.success);
  });

  it("opens the auto desk after the start month", () => {
    const before = monthDepartmentCash(defaultValues(), 10, 2, 5);
    const after = monthDepartmentCash(defaultValues(), 10, 2, 6);
    expect(before.us.autoDesk).toBe(0);
    expect(after.us.autoDesk).toBeGreaterThan(0);
  });

  it("pays marketing, sales, and accounting as named desks", () => {
    const cash = monthDepartmentCash(defaultValues(), 10, 2, 3);
    expect(cash.us.marketing).toBeGreaterThan(0);
    expect(cash.us.sales).toBeGreaterThan(0);
    expect(cash.us.accounting).toBeGreaterThan(0);
  });
});
