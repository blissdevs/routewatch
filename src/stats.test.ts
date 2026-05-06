import { describe, it, expect } from "bun:test";
import { computeStats, formatStats } from "./stats";
import { LogEntry } from "./logger";

function makeEntry(
  method: string,
  path: string,
  status: number,
  duration?: number
): LogEntry {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    request: {
      method,
      path,
      headers: {},
      body: "",
    },
    response: {
      status,
      headers: {},
      body: "",
    },
    duration,
  };
}

describe("computeStats", () => {
  it("returns zero stats for empty entries", () => {
    const stats = computeStats([]);
    expect(stats.totalRequests).toBe(0);
    expect(stats.uniquePaths).toBe(0);
    expect(stats.avgResponseTime).toBeNull();
    expect(stats.errorRate).toBe(0);
  });

  it("counts total requests", () => {
    const entries = [
      makeEntry("GET", "/a", 200),
      makeEntry("POST", "/b", 201),
      makeEntry("GET", "/a", 404),
    ];
    const stats = computeStats(entries);
    expect(stats.totalRequests).toBe(3);
  });

  it("counts unique paths", () => {
    const entries = [
      makeEntry("GET", "/a", 200),
      makeEntry("GET", "/a", 200),
      makeEntry("GET", "/b", 200),
    ];
    const stats = computeStats(entries);
    expect(stats.uniquePaths).toBe(2);
  });

  it("counts methods correctly", () => {
    const entries = [
      makeEntry("GET", "/a", 200),
      makeEntry("GET", "/b", 200),
      makeEntry("POST", "/c", 201),
    ];
    const stats = computeStats(entries);
    expect(stats.methodCounts["GET"]).toBe(2);
    expect(stats.methodCounts["POST"]).toBe(1);
  });

  it("counts status codes correctly", () => {
    const entries = [
      makeEntry("GET", "/a", 200),
      makeEntry("GET", "/b", 404),
      makeEntry("POST", "/c", 500),
    ];
    const stats = computeStats(entries);
    expect(stats.statusCounts["200"]).toBe(1);
    expect(stats.statusCounts["404"]).toBe(1);
    expect(stats.statusCounts["500"]).toBe(1);
  });

  it("calculates average response time", () => {
    const entries = [
      makeEntry("GET", "/a", 200, 100),
      makeEntry("GET", "/b", 200, 200),
      makeEntry("GET", "/c", 200, 300),
    ];
    const stats = computeStats(entries);
    expect(stats.avgResponseTime).toBe(200);
  });

  it("identifies slowest and fastest entries", () => {
    const slow = makeEntry("GET", "/slow", 200, 500);
    const fast = makeEntry("GET", "/fast", 200, 10);
    const mid = makeEntry("GET", "/mid", 200, 100);
    const stats = computeStats([slow, fast, mid]);
    expect(stats.slowestEntry?.request.path).toBe("/slow");
    expect(stats.fastestEntry?.request.path).toBe("/fast");
  });

  it("calculates error rate", () => {
    const entries = [
      makeEntry("GET", "/a", 200),
      makeEntry("GET", "/b", 404),
      makeEntry("GET", "/c", 500),
      makeEntry("GET", "/d", 200),
    ];
    const stats = computeStats(entries);
    expect(stats.errorRate).toBe(0.5);
  });

  it("skips duration stats when no duration provided", () => {
    const entries = [makeEntry("GET", "/a", 200)];
    const stats = computeStats(entries);
    expect(stats.avgResponseTime).toBeNull();
    expect(stats.slowestEntry).toBeNull();
    expect(stats.fastestEntry).toBeNull();
  });
});

describe("formatStats", () => {
  it("includes key labels in output", () => {
    const entries = [makeEntry("GET", "/api", 200, 42)];
    const stats = computeStats(entries);
    const output = formatStats(stats);
    expect(output).toContain("Total Requests");
    expect(output).toContain("Unique Paths");
    expect(output).toContain("Error Rate");
    expect(output).toContain("Avg Duration");
    expect(output).toContain("Methods");
    expect(output).toContain("Statuses");
  });

  it("shows zero error rate correctly", () => {
    const entries = [makeEntry("GET", "/ok", 200)];
    const stats = computeStats(entries);
    const output = formatStats(stats);
    expect(output).toContain("0.0%");
  });
});
