import { describe, it, expect } from "bun:test";
import {
  indentJson,
  isJsonContentType,
  indentEntryBody,
  indentEntry,
  indentEntries,
} from "./indent";
import type { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "test-id",
    timestamp: new Date().toISOString(),
    request: {
      method: "POST",
      url: "http://localhost/api",
      headers: { "content-type": "application/json" },
      body: '{"a":1,"b":2}',
    },
    response: {
      status: 200,
      headers: { "content-type": "application/json" },
      body: '{"ok":true}',
    },
    ...overrides,
  };
}

describe("indentJson", () => {
  it("pretty-prints valid JSON", () => {
    const result = indentJson('{"a":1}', 2);
    expect(result).toBe('{\n  "a": 1\n}');
  });

  it("returns raw string for invalid JSON", () => {
    const raw = "not json";
    expect(indentJson(raw)).toBe(raw);
  });

  it("respects custom spaces", () => {
    const result = indentJson('{"x":9}', 4);
    expect(result).toContain("    ");
  });
});

describe("isJsonContentType", () => {
  it("returns true for application/json", () => {
    expect(isJsonContentType("application/json")).toBe(true);
  });

  it("returns true for application/json; charset=utf-8", () => {
    expect(isJsonContentType("application/json; charset=utf-8")).toBe(true);
  });

  it("returns false for text/plain", () => {
    expect(isJsonContentType("text/plain")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isJsonContentType(undefined)).toBe(false);
  });
});

describe("indentEntryBody", () => {
  it("indents JSON body when content-type is application/json", () => {
    const result = indentEntryBody('{"k":"v"}', "application/json");
    expect(result).toBe('{\n  "k": "v"\n}');
  });

  it("returns body unchanged for non-JSON content type", () => {
    const body = "hello world";
    expect(indentEntryBody(body, "text/plain")).toBe(body);
  });

  it("returns undefined when body is undefined", () => {
    expect(indentEntryBody(undefined, "application/json")).toBeUndefined();
  });

  it("falls back to raw when JSON parse fails and fallbackRaw=true", () => {
    expect(indentEntryBody("bad json", "application/json", { fallbackRaw: true })).toBe("bad json");
  });
});

describe("indentEntry", () => {
  it("indents request and response bodies", () => {
    const entry = makeEntry();
    const result = indentEntry(entry);
    expect(result.request.body).toContain("\n");
    expect(result.response?.body).toContain("\n");
  });

  it("handles entry with no response", () => {
    const entry = makeEntry({ response: undefined });
    const result = indentEntry(entry);
    expect(result.response).toBeUndefined();
  });

  it("does not mutate original entry", () => {
    const entry = makeEntry();
    const original = entry.request.body;
    indentEntry(entry);
    expect(entry.request.body).toBe(original);
  });
});

describe("indentEntries", () => {
  it("applies indentEntry to all entries", () => {
    const entries = [makeEntry(), makeEntry()];
    const results = indentEntries(entries);
    expect(results).toHaveLength(2);
    results.forEach((r) => {
      expect(r.request.body).toContain("\n");
    });
  });

  it("returns empty array for empty input", () => {
    expect(indentEntries([])).toEqual([]);
  });
});
