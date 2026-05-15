import { describe, it, expect } from "bun:test";
import { flattenEntry, flattenEntries, flattenToCsv } from "./flatten";
import type { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    timestamp: "2024-01-01T00:00:00.000Z",
    request: {
      method: "GET",
      url: "http://localhost/api/users",
      headers: { "content-type": "application/json", "x-request-id": "abc123" },
      body: "",
    },
    response: {
      status: 200,
      headers: { "content-type": "application/json" },
      body: '{"ok":true}',
    },
    durationMs: 42,
    ...overrides,
  } as LogEntry;
}

describe("flattenEntry", () => {
  it("includes top-level scalar fields", () => {
    const flat = flattenEntry(makeEntry());
    expect(flat.method).toBe("GET");
    expect(flat.url).toBe("http://localhost/api/users");
    expect(flat.statusCode).toBe(200);
    expect(flat.durationMs).toBe(42);
  });

  it("extracts request and response content-type", () => {
    const flat = flattenEntry(makeEntry());
    expect(flat.requestContentType).toBe("application/json");
    expect(flat.responseContentType).toBe("application/json");
  });

  it("computes body sizes", () => {
    const flat = flattenEntry(
      makeEntry({ request: { method: "POST", url: "/x", headers: {}, body: "hello" } })
    );
    expect(flat.requestBodySize).toBe(5);
  });

  it("flattens request headers with req_header_ prefix", () => {
    const flat = flattenEntry(makeEntry());
    expect(flat["req_header_x_request_id"]).toBe("abc123");
  });

  it("flattens response headers with res_header_ prefix", () => {
    const flat = flattenEntry(makeEntry());
    expect(flat["res_header_content_type"]).toBe("application/json");
  });

  it("handles missing response gracefully", () => {
    const entry = makeEntry({ response: undefined });
    const flat = flattenEntry(entry);
    expect(flat.statusCode).toBe(0);
    expect(flat.responseContentType).toBe("");
    expect(flat.responseBodySize).toBe(0);
  });
});

describe("flattenEntries", () => {
  it("maps all entries", () => {
    const entries = [makeEntry(), makeEntry({ durationMs: 99 })];
    const result = flattenEntries(entries);
    expect(result).toHaveLength(2);
    expect(result[1].durationMs).toBe(99);
  });
});

describe("flattenToCsv", () => {
  it("returns empty string for no entries", () => {
    expect(flattenToCsv([])).toBe("");
  });

  it("produces a header row and data rows", () => {
    const csv = flattenToCsv([makeEntry()]);
    const lines = csv.split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines[0]).toContain("method");
    expect(lines[0]).toContain("statusCode");
    expect(lines[1]).toContain("GET");
  });

  it("escapes commas in values", () => {
    const entry = makeEntry({
      request: {
        method: "GET",
        url: "http://localhost/a,b",
        headers: {},
        body: "",
      },
    });
    const csv = flattenToCsv([entry]);
    expect(csv).toContain('"http://localhost/a,b"');
  });
});
