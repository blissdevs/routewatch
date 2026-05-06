import { describe, it, expect } from "bun:test";
import {
  matchesFilter,
  filterEntries,
  parseFilterArgs,
  LogEntry,
} from "./filter";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "abc123",
    timestamp: "2024-06-01T12:00:00.000Z",
    method: "GET",
    url: "/api/users",
    status: 200,
    durationMs: 42,
    ...overrides,
  };
}

describe("matchesFilter", () => {
  it("returns true when no filters set", () => {
    expect(matchesFilter(makeEntry(), {})).toBe(true);
  });

  it("filters by method (case-insensitive)", () => {
    expect(matchesFilter(makeEntry({ method: "POST" }), { method: "post" })).toBe(true);
    expect(matchesFilter(makeEntry({ method: "GET" }), { method: "POST" })).toBe(false);
  });

  it("filters by statusMin and statusMax", () => {
    const entry = makeEntry({ status: 404 });
    expect(matchesFilter(entry, { statusMin: 400, statusMax: 499 })).toBe(true);
    expect(matchesFilter(entry, { statusMin: 500 })).toBe(false);
    expect(matchesFilter(entry, { statusMax: 399 })).toBe(false);
  });

  it("filters by path substring", () => {
    expect(matchesFilter(makeEntry({ url: "/api/users/42" }), { pathPattern: "/api/users" })).toBe(true);
    expect(matchesFilter(makeEntry({ url: "/health" }), { pathPattern: "/api" })).toBe(false);
  });

  it("filters by path regex", () => {
    const re = /^\/api\/users\/\d+$/;
    expect(matchesFilter(makeEntry({ url: "/api/users/99" }), { pathPattern: re })).toBe(true);
    expect(matchesFilter(makeEntry({ url: "/api/users/abc" }), { pathPattern: re })).toBe(false);
  });

  it("filters by since", () => {
    const entry = makeEntry({ timestamp: "2024-06-01T12:00:00.000Z" });
    expect(matchesFilter(entry, { since: new Date("2024-06-01T11:00:00.000Z") })).toBe(true);
    expect(matchesFilter(entry, { since: new Date("2024-06-01T13:00:00.000Z") })).toBe(false);
  });

  it("filters by until", () => {
    const entry = makeEntry({ timestamp: "2024-06-01T12:00:00.000Z" });
    expect(matchesFilter(entry, { until: new Date("2024-06-01T13:00:00.000Z") })).toBe(true);
    expect(matchesFilter(entry, { until: new Date("2024-06-01T11:00:00.000Z") })).toBe(false);
  });
});

describe("filterEntries", () => {
  it("returns only matching entries", () => {
    const entries = [
      makeEntry({ method: "GET", status: 200 }),
      makeEntry({ method: "POST", status: 201 }),
      makeEntry({ method: "GET", status: 500 }),
    ];
    const result = filterEntries(entries, { method: "GET", statusMax: 299 });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(200);
  });
});

describe("parseFilterArgs", () => {
  it("parses method", () => {
    expect(parseFilterArgs({ method: "DELETE" }).method).toBe("DELETE");
  });

  it("parses single status", () => {
    const opts = parseFilterArgs({ status: "404" });
    expect(opts.statusMin).toBe(404);
    expect(opts.statusMax).toBe(404);
  });

  it("parses status range", () => {
    const opts = parseFilterArgs({ status: "400-499" });
    expect(opts.statusMin).toBe(400);
    expect(opts.statusMax).toBe(499);
  });

  it("parses since and until", () => {
    const opts = parseFilterArgs({
      since: "2024-01-01T00:00:00.000Z",
      until: "2024-12-31T23:59:59.000Z",
    });
    expect(opts.since).toBeInstanceOf(Date);
    expect(opts.until).toBeInstanceOf(Date);
  });
});
