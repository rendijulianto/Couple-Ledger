import { describe, expect, it } from "bun:test";
import { formatRupiah } from "../src/utils/currency";

describe("formatRupiah", () => {
  it("formats positive amount correctly without decimals", () => {
    const formatted = formatRupiah(25000);
    // Note: Intl formatting may use non-breaking space (nbsp), check format contains Rp and 25.000
    expect(formatted.replace(/\s/g, " ")).toBe("Rp 25.000");
  });

  it("formats zero amount correctly", () => {
    const formatted = formatRupiah(0);
    expect(formatted.replace(/\s/g, " ")).toBe("Rp 0");
  });

  it("formats large amounts with thousands separators", () => {
    const formatted = formatRupiah(15000000);
    expect(formatted.replace(/\s/g, " ")).toBe("Rp 15.000.000");
  });
});

