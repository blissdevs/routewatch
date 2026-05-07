import { describe, it, expect, beforeEach } from "bun:test";
import { computeRate, formatRate } from "./rate";
import { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    method: "GET",
    url: "http://localhost/api/test",
    requestHeaders: {},
    requestBody: "",
    status: 200,
    responseHeaders: {},
    responseBody: "",
    durationMs: 50,
    ...overrides,
  };
}

function makeEntryAt(offsetMs: number, durationMs = 50): LogEntry {
  return makeEntry({
    timestamp: new Date(Date.now() - offsetMs).toISOString(),
    durationMs,
  });
}

describe("computeRate", () => {
  it("returns zeros for empty entries", () => {
    const result = computeRate([]);
    expect(result.totalRequests).toBe(0);
    expect(result.requestsPerSecond).toBe(0);
    expect(result.peakRps).toBe(0);
  });

  it("counts only entries within window", () => {
    const entries = [
      makeEntryAt(500),        // within 60s window
      makeEntryAt(5_000),      // within 60s window
      makeEntryAt(70_000),     // outside 60s window
    ];
    const result = computeRate(entries, 60_000);
    expect(result.totalRequests).toBe(2);
  });

  it("computes avg, fastest, slowest durations", () => {
    const entries = [
      makeEntryAt(1000, 100),
      makeEntryAt(2000, 200),
      makeEntryAt(3000, 300),
    ];
    const result = computeRate(entries, 60_000);
    expect(result.fastestMs).toBe(100);
    expect(result.slowestMs).toBe(300);
    expect(result.avgMs).toBe(200);
  });

  it("computes peak RPS from 1-second buckets", () => {
    const now = Date.now();
    const entries = [
      makeEntry({ timestamp: new Date(now - 100).toISOString(), durationMs: 10 }),
      makeEntry({ timestamp: new Date(now - 200).toISOString(), durationMs: 10 }),
      makeEntry({ timestamp: new Date(now - 300).toISOString(), durationMs: 10 }),
      makeEntry({ timestamp: new Date(now - 5000).toISOString(), durationMs: 10 }),
    ];
    const result = computeRate(entries, 60_000);
    expect(result.peakRps).toBeGreaterThanOrEqual(3);
  });

  it("respects custom windowMs", () => {
    const entries = [
      makeEntryAt(500),
      makeEntryAt(1500),
      makeEntryAt(3000),
    ];
    const result = computeRate(entries, 2_000);
    expect(result.totalRequests).toBe(2);
  });

  it("handles entries with no duration", () => {
    const entries = [makeEntryAt(500, 0), makeEntryAt(1000, 0)];
    const result = computeRate(entries, 60_000);
    expect(result.avgMs).toBe(0);
    expect(result.slowestMs).toBe(0);
  });
});

describe("formatRate", () => {
  it("includes all key labels", () => {
    const result = computeRate([makeEntryAt(500, 80)]);
    const output = formatRate(result);
    expect(output).toContain("Rate Analysis");
    expect(output).toContain("Req/sec");
    expect(output).toContain("Peak RPS");
    expect(output).toContain("Avg Duration");
  });

  it("shows window in seconds", () => {
    const result = computeRate([], 30_000);
    const output = formatRate(result);
    expect(output).toContain("window: 30s");
  });
});
