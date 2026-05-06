import { describe, it, expect } from "bun:test";
import { entryMatchesSearch, searchEntries, highlight } from "./search";
import type { LogEntry } from "./filter";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "test-1",
    timestamp: "2024-06-01T12:00:00.000Z",
    method: "GET",
    url: "/api/products?category=shoes",
    status: 200,
    durationMs: 30,
    body: '{"name":"Air Max","price":120}',
    requestHeaders: { "content-type": "application/json", authorization: "Bearer token123" },
    responseHeaders: { "x-request-id": "req-abc" },
    ...overrides,
  };
}

describe("entryMatchesSearch", () => {
  it("matches query in URL", () => {
    expect(entryMatchesSearch(makeEntry(), { query: "products" })).toBe(true);
  });

  it("matches query in body", () => {
    expect(entryMatchesSearch(makeEntry(), { query: "Air Max" })).toBe(true);
  });

  it("is case-insensitive by default", () => {
    expect(entryMatchesSearch(makeEntry(), { query: "air max" })).toBe(true);
  });

  it("respects caseSensitive option", () => {
    expect(
      entryMatchesSearch(makeEntry(), { query: "air max", caseSensitive: true })
    ).toBe(false);
    expect(
      entryMatchesSearch(makeEntry(), { query: "Air Max", caseSensitive: true })
    ).toBe(true);
  });

  it("matches in request headers", () => {
    expect(entryMatchesSearch(makeEntry(), { query: "token123" })).toBe(true);
  });

  it("matches in response headers", () => {
    expect(entryMatchesSearch(makeEntry(), { query: "req-abc" })).toBe(true);
  });

  it("returns false when no match", () => {
    expect(entryMatchesSearch(makeEntry(), { query: "unicorn" })).toBe(false);
  });

  it("restricts search to specified fields", () => {
    const entry = makeEntry({ url: "/plain", body: "hello world" });
    expect(
      entryMatchesSearch(entry, { query: "hello", fields: ["url"] })
    ).toBe(false);
    expect(
      entryMatchesSearch(entry, { query: "hello", fields: ["body"] })
    ).toBe(true);
  });

  it("returns false for empty body when searching body", () => {
    const entry = makeEntry({ body: undefined });
    expect(entryMatchesSearch(entry, { query: "anything", fields: ["body"] })).toBe(false);
  });
});

describe("searchEntries", () => {
  it("returns all entries for empty query", () => {
    const entries = [makeEntry(), makeEntry({ url: "/other" })];
    expect(searchEntries(entries, { query: "   " })).toHaveLength(2);
  });

  it("filters entries by query", () => {
    const entries = [
      makeEntry({ url: "/api/users" }),
      makeEntry({ url: "/api/products" }),
    ];
    const result = searchEntries(entries, { query: "users" });
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("/api/users");
  });
});

describe("highlight", () => {
  it("wraps matched text with ANSI codes", () => {
    const result = highlight("hello world", "world");
    expect(result).toContain("\x1b[33mworld\x1b[0m");
  });

  it("is case-insensitive by default", () => {
    const result = highlight("Hello World", "hello");
    expect(result).toContain("\x1b[33mHello\x1b[0m");
  });

  it("respects caseSensitive flag", () => {
    const result = highlight("Hello World", "hello", true);
    expect(result).toBe("Hello World");
  });
});
