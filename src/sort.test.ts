import { describe, it, expect } from "bun:test";
import { sortEntries, parseSortArgs, formatSort, SortOptions } from "./sort";
import { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "entry-1",
    timestamp: new Date().toISOString(),
    request: { method: "GET", url: "/api/test", headers: {}, body: "" },
    response: { status: 200, headers: {}, body: "ok" },
    duration: 100,
    tags: [],
    ...overrides,
  };
}

describe("sortEntries", () => {
  it("sorts by timestamp ascending", () => {
    const a = makeEntry({ id: "a", timestamp: "2024-01-01T00:00:01Z" });
    const b = makeEntry({ id: "b", timestamp: "2024-01-01T00:00:03Z" });
    const c = makeEntry({ id: "c", timestamp: "2024-01-01T00:00:02Z" });
    const result = sortEntries([a, b, c], { field: "timestamp", order: "asc" });
    expect(result.map((e) => e.id)).toEqual(["a", "c", "b"]);
  });

  it("sorts by timestamp descending", () => {
    const a = makeEntry({ id: "a", timestamp: "2024-01-01T00:00:01Z" });
    const b = makeEntry({ id: "b", timestamp: "2024-01-01T00:00:03Z" });
    const result = sortEntries([a, b], { field: "timestamp", order: "desc" });
    expect(result.map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("sorts by status code", () => {
    const a = makeEntry({ id: "a", response: { status: 500, headers: {}, body: "" } });
    const b = makeEntry({ id: "b", response: { status: 200, headers: {}, body: "" } });
    const c = makeEntry({ id: "c", response: { status: 404, headers: {}, body: "" } });
    const result = sortEntries([a, b, c], { field: "status", order: "asc" });
    expect(result.map((e) => e.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by duration", () => {
    const a = makeEntry({ id: "a", duration: 300 });
    const b = makeEntry({ id: "b", duration: 50 });
    const c = makeEntry({ id: "c", duration: 150 });
    const result = sortEntries([a, b, c], { field: "duration", order: "asc" });
    expect(result.map((e) => e.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by method alphabetically", () => {
    const a = makeEntry({ id: "a", request: { method: "POST", url: "/", headers: {}, body: "" } });
    const b = makeEntry({ id: "b", request: { method: "DELETE", url: "/", headers: {}, body: "" } });
    const c = makeEntry({ id: "c", request: { method: "GET", url: "/", headers: {}, body: "" } });
    const result = sortEntries([a, b, c], { field: "method", order: "asc" });
    expect(result.map((e) => e.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate original array", () => {
    const entries = [makeEntry({ id: "a" }), makeEntry({ id: "b" })];
    const original = [...entries];
    sortEntries(entries, { field: "timestamp", order: "desc" });
    expect(entries.map((e) => e.id)).toEqual(original.map((e) => e.id));
  });
});

describe("parseSortArgs", () => {
  it("returns defaults when no args provided", () => {
    expect(parseSortArgs([])).toEqual({ field: "timestamp", order: "asc" });
  });

  it("parses field and order", () => {
    expect(parseSortArgs(["--sort=duration", "--order=desc"])).toEqual({
      field: "duration",
      order: "desc",
    });
  });

  it("throws on invalid field", () => {
    expect(() => parseSortArgs(["--sort=invalid"])).toThrow(/Invalid sort field/);
  });

  it("throws on invalid order", () => {
    expect(() => parseSortArgs(["--order=sideways"])).toThrow(/Invalid sort order/);
  });
});

describe("formatSort", () => {
  it("includes header with field and order", () => {
    const entries = [makeEntry()];
    const opts: SortOptions = { field: "status", order: "asc" };
    const output = formatSort(entries, opts);
    expect(output).toContain("Sorted by status (asc)");
    expect(output).toContain("1 entries");
  });

  it("formats entry lines with method, url, status, duration", () => {
    const entry = makeEntry({
      request: { method: "POST", url: "/submit", headers: {}, body: "" },
      response: { status: 201, headers: {}, body: "" },
      duration: 42,
    });
    const output = formatSort([entry], { field: "timestamp", order: "asc" });
    expect(output).toContain("POST");
    expect(output).toContain("/submit");
    expect(output).toContain("201");
    expect(output).toContain("42ms");
  });
});
