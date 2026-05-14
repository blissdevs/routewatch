import { describe, it, expect } from "bun:test";
import { sampleEntries, formatSample } from "./sample";
import { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    method: "GET",
    url: "http://localhost/api/test",
    requestHeaders: {},
    requestBody: "",
    status: 200,
    responseHeaders: {},
    responseBody: "{}",
    duration: 42,
    ...overrides,
  };
}

describe("sampleEntries", () => {
  it("returns the requested number of entries", () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ url: `http://localhost/api/${i}` })
    );
    const result = sampleEntries(entries, { count: 5, seed: 42 });
    expect(result).toHaveLength(5);
  });

  it("returns all entries if count >= pool size", () => {
    const entries = [makeEntry(), makeEntry()];
    const result = sampleEntries(entries, { count: 10 });
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    const result = sampleEntries([], { count: 3 });
    expect(result).toHaveLength(0);
  });

  it("filters by method", () => {
    const entries = [
      makeEntry({ method: "GET" }),
      makeEntry({ method: "POST" }),
      makeEntry({ method: "GET" }),
      makeEntry({ method: "POST" }),
    ];
    const result = sampleEntries(entries, { count: 1, method: "POST", seed: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].method).toBe("POST");
  });

  it("returns no duplicates", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ id: `id-${i}` })
    );
    const result = sampleEntries(entries, { count: 8, seed: 7 });
    const ids = result.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is deterministic with the same seed", () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ id: `id-${i}` })
    );
    const a = sampleEntries(entries, { count: 5, seed: 99 });
    const b = sampleEntries(entries, { count: 5, seed: 99 });
    expect(a.map((e) => e.id)).toEqual(b.map((e) => e.id));
  });
});

describe("formatSample", () => {
  it("formats entries as numbered list", () => {
    const entries = [
      makeEntry({ method: "GET", url: "http://localhost/a", status: 200, duration: 10 }),
      makeEntry({ method: "POST", url: "http://localhost/b", status: 201, duration: 55 }),
    ];
    const output = formatSample(entries);
    expect(output).toContain("[1] GET http://localhost/a → 200 (10ms)");
    expect(output).toContain("[2] POST http://localhost/b → 201 (55ms)");
  });

  it("returns message for empty array", () => {
    expect(formatSample([])).toBe("No entries sampled.");
  });
});
