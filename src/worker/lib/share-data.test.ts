import { describe, expect, it } from "bun:test";
import { safeParseShare, toPublic, ttlSeconds } from "./share-data";

describe("safeParseShare", () => {
  it.each([
    { input: null, expected: null, label: "null" },
    { input: "", expected: null, label: "empty string" },
    { input: "{", expected: null, label: "corrupt JSON" },
    {
      input: '{"spec":"x","config":{}}',
      expected: { spec: "x", config: {} },
      label: "valid JSON",
    },
    {
      input: '{"spec":"x","config":{},"sessionToken":"tok"}',
      expected: { spec: "x", config: {}, sessionToken: "tok" },
      label: "valid JSON with sessionToken",
    },
  ])("returns $label → $expected", ({ input, expected }) => {
    expect(safeParseShare(input)).toEqual(expected);
  });
});

describe("toPublic", () => {
  it("strips sessionToken from ShareData", () => {
    const data = {
      spec: "openapi: 3.0.0",
      config: { extends: [] },
      sessionToken: "secret",
    };
    const pub = toPublic(data);
    expect(pub).toEqual({ spec: "openapi: 3.0.0", config: { extends: [] } });
    expect("sessionToken" in pub).toBe(false);
  });

  it("handles missing sessionToken gracefully", () => {
    const data = { spec: "x", config: {} };
    const pub = toPublic(data);
    expect(pub).toEqual({ spec: "x", config: {} });
  });
});

describe("ttlSeconds", () => {
  it.each([
    [1, 86_400],
    [30, 2_592_000],
    [0, 0],
  ])("ttlSeconds(%d) => %d", (days, expected) => {
    expect(ttlSeconds(days)).toBe(expected);
  });
});
