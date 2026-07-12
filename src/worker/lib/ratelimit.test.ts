import { describe, expect, it } from "bun:test";
import { clientIp, rateLimitKey } from "./ratelimit-key";

describe("rateLimitKey", () => {
  it.each([
    ["1.2.3.4", "/api/validate", "1.2.3.4:/api/validate"],
    ["anon", "/api/proxy", "anon:/api/proxy"],
  ])("rateLimitKey(%s, %s) => %s", (ip, path, expected) => {
    expect(rateLimitKey(ip, path)).toBe(expected);
  });
});

describe("clientIp", () => {
  it("prefers cf-connecting-ip", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.7",
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    });
    expect(clientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to the first x-forwarded-for entry", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    });
    expect(clientIp(headers)).toBe("198.51.100.1");
  });

  it("returns anon when no ip headers are present", () => {
    expect(clientIp(new Headers())).toBe("anon");
  });
});
