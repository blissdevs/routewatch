import { describe, it, expect } from "bun:test";
import {
  applyColor,
  matchesRule,
  highlightEntries,
  formatHighlight,
  type HighlightRule,
} from "./highlight";
import type { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "test-id",
    timestamp: new Date().toISOString(),
    request: {
      method: "GET",
      path: "/api/users",
      headers: {},
      body: "",
    },
    response: {
      status: 200,
      headers: {},
      body: "",
    },
    ...overrides,
  } as LogEntry;
}

describe("applyColor", () => {
  it("wraps text with ansi codes for known colors", () => {
    const result = applyColor("hello", "red");
    expect(result).toContain("hello");
    expect(result).toContain("\x1b[");
  });

  it("returns plain text for unknown colors", () => {
    const result = applyColor("hello", "ultraviolet");
    expect(result).toContain("hello");
  });
});

describe("matchesRule", () => {
  it("matches by method", () => {
    const entry = makeEntry({ request: { method: "POST", path: "/x", headers: {}, body: "" } });
    expect(matchesRule(entry, { field: "method", value: "POST", color: "red" })).toBe(true);
    expect(matchesRule(entry, { field: "method", value: "GET", color: "red" })).toBe(false);
  });

  it("matches by status", () => {
    const entry = makeEntry();
    expect(matchesRule(entry, { field: "status", value: "200", color: "green" })).toBe(true);
    expect(matchesRule(entry, { field: "status", value: "404", color: "red" })).toBe(false);
  });

  it("matches by path substring", () => {
    const entry = makeEntry();
    expect(matchesRule(entry, { field: "path", value: "/api", color: "blue" })).toBe(true);
    expect(matchesRule(entry, { field: "path", value: "/admin", color: "blue" })).toBe(false);
  });

  it("matches by tag", () => {
    const entry = { ...makeEntry(), tags: ["important"] } as any;
    expect(matchesRule(entry, { field: "tag", value: "important", color: "yellow" })).toBe(true);
    expect(matchesRule(entry, { field: "tag", value: "boring", color: "yellow" })).toBe(false);
  });
});

describe("highlightEntries", () => {
  it("returns matching entries with their rules", () => {
    const entries = [
      makeEntry(),
      makeEntry({ request: { method: "POST", path: "/submit", headers: {}, body: "" } }),
    ];
    const rules: HighlightRule[] = [
      { field: "method", value: "POST", color: "red", label: "write" },
    ];
    const results = highlightEntries(entries, rules);
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe("write");
  });

  it("uses first matching rule only", () => {
    const entry = makeEntry();
    const rules: HighlightRule[] = [
      { field: "method", value: "GET", color: "blue", label: "first" },
      { field: "status", value: "200", color: "green", label: "second" },
    ];
    const results = highlightEntries([entry], rules);
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe("first");
  });

  it("returns empty when no rules match", () => {
    const entry = makeEntry();
    const rules: HighlightRule[] = [{ field: "status", value: "500", color: "red" }];
    expect(highlightEntries([entry], rules)).toHaveLength(0);
  });
});

describe("formatHighlight", () => {
  it("includes method, status, path and label", () => {
    const entry = makeEntry();
    const rule: HighlightRule = { field: "method", value: "GET", color: "cyan", label: "read" };
    const result = formatHighlight({ entry, rule, label: "read" });
    expect(result).toContain("GET");
    expect(result).toContain("200");
    expect(result).toContain("/api/users");
    expect(result).toContain("read");
  });
});
