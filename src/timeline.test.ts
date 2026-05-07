import { describe, it, expect } from "bun:test";
import { buildTimeline, formatTimeline } from "./timeline";
import type { LogEntry } from "./logger";

function makeEntry(offsetMs: number): LogEntry {
  return {
    id: `entry-${offsetMs}`,
    timestamp: new Date(1_700_000_000_000 + offsetMs).toISOString(),
    method: "GET",
    url: "http://localhost/api/test",
    requestHeaders: {},
    requestBody: "",
    status: 200,
    responseHeaders: {},
    responseBody: "",
    durationMs: 10,
  };
}

describe("buildTimeline", () => {
  it("returns empty timeline for no entries", () => {
    const t = buildTimeline([]);
    expect(t.buckets).toHaveLength(0);
    expect(t.totalDuration).toBe(0);
  });

  it("puts a single entry in one bucket", () => {
    const t = buildTimeline([makeEntry(0)]);
    expect(t.buckets).toHaveLength(1);
    expect(t.buckets[0].count).toBe(1);
  });

  it("groups entries into correct buckets", () => {
    const entries = [makeEntry(0), makeEntry(500), makeEntry(1200), makeEntry(1800)];
    const t = buildTimeline(entries, 1000);
    expect(t.buckets[0].count).toBe(2);
    expect(t.buckets[1].count).toBe(2);
  });

  it("calculates totalDuration correctly", () => {
    const entries = [makeEntry(0), makeEntry(3000)];
    const t = buildTimeline(entries, 1000);
    expect(t.totalDuration).toBe(3000);
  });

  it("places last entry in last bucket, not out of bounds", () => {
    const entries = [makeEntry(0), makeEntry(1000), makeEntry(2000)];
    const t = buildTimeline(entries, 1000);
    const total = t.buckets.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(3);
  });

  it("respects custom bucketMs", () => {
    const entries = [makeEntry(0), makeEntry(200), makeEntry(400)];
    const t = buildTimeline(entries, 500);
    expect(t.buckets[0].count).toBe(3);
  });
});

describe("formatTimeline", () => {
  it("returns no-entries message for empty timeline", () => {
    const t = buildTimeline([]);
    expect(formatTimeline(t)).toBe("(no entries)");
  });

  it("includes bucket count in output", () => {
    const entries = [makeEntry(0), makeEntry(500), makeEntry(1500)];
    const t = buildTimeline(entries, 1000);
    const output = formatTimeline(t);
    expect(output).toContain("2");
    expect(output).toContain("1");
  });

  it("output has a line per bucket", () => {
    const entries = [makeEntry(0), makeEntry(1200), makeEntry(2400)];
    const t = buildTimeline(entries, 1000);
    const lines = formatTimeline(t).split("\n").filter((l) => l.includes("|"));
    expect(lines).toHaveLength(t.buckets.length);
  });
});
