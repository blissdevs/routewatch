import { describe, it, expect } from "bun:test";
import {
  normalizeHeaders,
  entryFingerprint,
  dedupeEntries,
  findDuplicates,
} from "./dedupe";
import { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry["request"]> = {}): LogEntry {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    request: {
      method: "GET",
      url: "http://localhost:3000/api/users",
      headers: { "content-type": "application/json", date: "Mon, 01 Jan 2024" },
      body: "",
      ...overrides,
    },
    response: {
      status: 200,
      headers: {},
      body: "",
      duration: 42,
    },
  };
}

describe("normalizeHeaders", () => {
  it("lowercases all header keys", () => {
    const result = normalizeHeaders({ "Content-Type": "application/json" }, []);
    expect(result).toEqual({ "content-type": "application/json" });
  });

  it("removes ignored headers", () => {
    const result = normalizeHeaders(
      { "content-type": "application/json", date: "Mon" },
      ["date"]
    );
    expect(result).not.toHaveProperty("date");
    expect(result).toHaveProperty("content-type");
  });
});

describe("entryFingerprint", () => {
  it("returns same fingerprint for identical entries", () => {
    const a = makeEntry();
    const b = { ...a, id: "different-id", timestamp: "2099-01-01T00:00:00Z" };
    expect(entryFingerprint(a)).toBe(entryFingerprint(b));
  });

  it("differs for different methods", () => {
    const a = makeEntry({ method: "GET" });
    const b = makeEntry({ method: "POST" });
    expect(entryFingerprint(a)).not.toBe(entryFingerprint(b));
  });

  it("ignores query params when ignoreQuery is true", () => {
    const a = makeEntry({ url: "http://localhost:3000/api?page=1" });
    const b = makeEntry({ url: "http://localhost:3000/api?page=2" });
    expect(entryFingerprint(a, { ignoreQuery: true })).toBe(
      entryFingerprint(b, { ignoreQuery: true })
    );
  });

  it("strips default ignored headers like date", () => {
    const a = makeEntry({ headers: { date: "Mon" } });
    const b = makeEntry({ headers: { date: "Tue" } });
    expect(entryFingerprint(a)).toBe(entryFingerprint(b));
  });

  it("differs for different URLs", () => {
    const a = makeEntry({ url: "http://localhost:3000/api/users" });
    const b = makeEntry({ url: "http://localhost:3000/api/posts" });
    expect(entryFingerprint(a)).not.toBe(entryFingerprint(b));
  });
});

describe("dedupeEntries", () => {
  it("removes duplicate entries keeping first occurrence", () => {
    const a = makeEntry();
    const b = { ...a, id: "dup", timestamp: "2099-01-01T00:00:00Z" };
    const result = dedupeEntries([a, b]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(a.id);
  });

  it("keeps entries with different methods", () => {
    const a = makeEntry({ method: "GET" });
    const b = makeEntry({ method: "POST" });
    expect(dedupeEntries([a, b])).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(dedupeEntries([])).toEqual([]);
  });
});

describe("findDuplicates", () => {
  it("groups duplicate entries by fingerprint", () => {
    const a = makeEntry();
    const b = { ...a, id: "dup1" };
    const result = findDuplicates([a, b]);
    const groups = Object.values(result);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
    expect(groups[0].map((e) => e.id)).toContain(a.id);
    expect(groups[0].map((e) => e.id)).toContain("dup1");
  });

  it("returns empty object when no duplicates exist", () => {
    const a = makeEntry({ method: "GET" });
    const b = makeEntry({ method: "POST" });
    expect(findDuplicates([a, b])).toEqual({});
  });

  it("returns empty object for empty input", () => {
    expect(findDuplicates([])).toEqual({});
  });
});
