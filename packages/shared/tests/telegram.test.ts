import { describe, expect, it } from "bun:test";
import { escapeTelegramHtml } from "../src/utils/telegram";

describe("escapeTelegramHtml", () => {
  it("escapes &, <, and > special characters", () => {
    const raw = "<script>alert('A & B > C')</script>";
    const escaped = escapeTelegramHtml(raw);
    expect(escaped).toBe("&lt;script&gt;alert('A &amp; B &gt; C')&lt;/script&gt;");
  });

  it("leaves standard characters unaffected", () => {
    const raw = "Makan Siang Rp 25.000";
    expect(escapeTelegramHtml(raw)).toBe("Makan Siang Rp 25.000");
  });
});

