import { describe, expect, it } from "bun:test";
import { formatJakartaDateISO } from "../src/utils/date";

describe("formatJakartaDateISO", () => {
  it("formats date to YYYY-MM-DD correctly in Jakarta timezone", () => {
    // 2026-10-12T00:00:00Z is 2026-10-12T07:00:00 WIB
    const date = new Date("2026-10-12T00:00:00Z");
    const result = formatJakartaDateISO(date);
    expect(result).toBe("2026-10-12");
  });
});

