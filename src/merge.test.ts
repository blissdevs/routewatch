import { describe, it, expect } from "bun:test";
import { mergeEntries, formatMergeResult } from "./merge";
import { parseMergeArgs, toMergeOptions, printMergeUsage } from "./merge-cli";
import type { LogEntry } from "./logger";

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
    responseBody: "",
    duration: 50,
    ...overrides,
  };
}

describe("mergeEntries", () => {
  it("merges multiple sources into one array", () => {
    const a = [makeEntry({ url: "http://localhost/a" })];
    const b = [makeEntry({ url: "http://localhost/b" })];
    const result = mergeEntries([a, b]);
    expect(result.entries).toHaveLength(2);
    expect(result.totalSources).toBe(2);
    expect(result.duplicatesRemoved).toBe(0);
  });

  it("removes duplicates when dedupe is true", () => {
    const entry = makeEntry({ method: "GET", url: "http://localhost/api", status: 200 });
    const dup = makeEntry({ method: "GET", url: "http://localhost/api", status: 200 });
    const result = mergeEntries([[entry], [dup]], { dedupe: true });
    expect(result.entries).toHaveLength(1);
    expect(result.duplicatesRemoved).toBe(1);
  });

  it("sorts by timestamp by default", () => {
    const older = makeEntry({ timestamp: "2024-01-01T00:00:00Z" });
    const newer = makeEntry({ timestamp: "2024-06-01T00:00:00Z" });
    const result = mergeEntries([[newer], [older]]);
    expect(result.entries[0].timestamp).toBe("2024-01-01T00:00:00Z");
  });

  it("sorts by url when specified", () => {
    const a = makeEntry({ url: "http://localhost/z" });
    const b = makeEntry({ url: "http://localhost/a" });
    const result = mergeEntries([[a], [b]], { sortBy: "url" });
    expect(result.entries[0].url).toBe("http://localhost/a");
  });
});

describe("formatMergeResult", () => {
  it("formats result without duplicates", () => {
    const result = { entries: [], totalSources: 2, duplicatesRemoved: 0 };
    const out = formatMergeResult(result);
    expect(out).toContain("2 source(s)");
    expect(out).not.toContain("duplicate");
  });

  it("mentions duplicates when removed", () => {
    const result = { entries: [], totalSources: 3, duplicatesRemoved: 5 };
    const out = formatMergeResult(result);
    expect(out).toContain("5 duplicate(s)");
  });
});

describe("parseMergeArgs", () => {
  it("parses file arguments", () => {
    const args = parseMergeArgs(["a.log", "b.log"]);
    expect(args.files).toEqual(["a.log", "b.log"]);
    expect(args.dedupe).toBe(false);
    expect(args.sortBy).toBe("timestamp");
  });

  it("parses --dedupe flag", () => {
    const args = parseMergeArgs(["a.log", "b.log", "--dedupe"]);
    expect(args.dedupe).toBe(true);
  });

  it("parses --sort option", () => {
    const args = parseMergeArgs(["a.log", "b.log", "--sort", "method"]);
    expect(args.sortBy).toBe("method");
  });

  it("throws on invalid sort field", () => {
    expect(() => parseMergeArgs(["a.log", "b.log", "--sort", "invalid"])).toThrow();
  });

  it("throws when fewer than two files provided", () => {
    expect(() => parseMergeArgs(["a.log"])).toThrow();
  });

  it("parses --output option", () => {
    const args = parseMergeArgs(["a.log", "b.log", "--output", "out.log"]);
    expect(args.output).toBe("out.log");
  });

  it("converts args to merge options", () => {
    const args = parseMergeArgs(["a.log", "b.log", "--dedupe", "--sort", "url"]);
    const opts = toMergeOptions(args);
    expect(opts.dedupe).toBe(true);
    expect(opts.sortBy).toBe("url");
  });
});
