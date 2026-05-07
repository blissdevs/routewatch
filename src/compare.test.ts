import { describe, it, expect } from "bun:test";
import { compareByPath, formatCompare } from "./compare";
import type { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    method: "GET",
    url: "/api/hello",
    requestHeaders: {},
    requestBody: null,
    status: 200,
    responseHeaders: {},
    responseBody: { ok: true },
    duration: 50,
    tags: [],
    ...overrides,
  };
}

describe("compareByPath", () => {
  it("matches entries with same method and url", () => {
    const a = [makeEntry({ url: "/api/users", status: 200 })];
    const b = [makeEntry({ url: "/api/users", status: 201 })];
    const result = compareByPath(a, b);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].statusMatch).toBe(false);
    expect(result.onlyInA).toHaveLength(0);
    expect(result.onlyInB).toHaveLength(0);
  });

  it("reports entries only in A", () => {
    const a = [makeEntry({ url: "/api/only-a" })];
    const b: LogEntry[] = [];
    const result = compareByPath(a, b);
    expect(result.onlyInA).toHaveLength(1);
    expect(result.matched).toHaveLength(0);
  });

  it("reports entries only in B", () => {
    const a: LogEntry[] = [];
    const b = [makeEntry({ url: "/api/only-b" })];
    const result = compareByPath(a, b);
    expect(result.onlyInB).toHaveLength(1);
  });

  it("marks bodyMatch true when response bodies are equal", () => {
    const body = { data: 42 };
    const a = [makeEntry({ responseBody: body })];
    const b = [makeEntry({ responseBody: body })];
    const result = compareByPath(a, b);
    expect(result.matched[0].bodyMatch).toBe(true);
  });

  it("marks bodyMatch false when response bodies differ", () => {
    const a = [makeEntry({ responseBody: { x: 1 } })];
    const b = [makeEntry({ responseBody: { x: 2 } })];
    const result = compareByPath(a, b);
    expect(result.matched[0].bodyMatch).toBe(false);
  });

  it("handles multiple entries for same route, matching one-to-one", () => {
    const a = [makeEntry({ url: "/q" }), makeEntry({ url: "/q" })];
    const b = [makeEntry({ url: "/q" })];
    const result = compareByPath(a, b);
    expect(result.matched).toHaveLength(1);
    expect(result.onlyInA).toHaveLength(1);
  });
});

describe("formatCompare", () => {
  it("includes matched count", () => {
    const a = [makeEntry({ url: "/api/x", status: 200 })];
    const b = [makeEntry({ url: "/api/x", status: 200 })];
    const result = compareByPath(a, b);
    const output = formatCompare(result);
    expect(output).toContain("Matched: 1");
  });

  it("shows only-in-A section when present", () => {
    const result = compareByPath([makeEntry({ url: "/a" })], []);
    expect(formatCompare(result)).toContain("Only in A");
  });

  it("shows only-in-B section when present", () => {
    const result = compareByPath([], [makeEntry({ url: "/b" })]);
    expect(formatCompare(result)).toContain("Only in B");
  });
});
