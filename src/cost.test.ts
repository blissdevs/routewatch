import { describe, it, expect } from "bun:test";
import { computeCost, estimateCost, formatCost } from "./cost";
import { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "test-id",
    timestamp: new Date().toISOString(),
    method: "GET",
    path: "/api/test",
    statusCode: 200,
    durationMs: 100,
    request: { headers: {}, body: "" },
    response: { headers: {}, body: "hello world" },
    ...overrides,
  };
}

describe("estimateCost", () => {
  it("returns 0 for zero duration and size", () => {
    expect(estimateCost(0, 0)).toBe(0);
  });

  it("calculates cost based on duration", () => {
    const cost = estimateCost(1000, 0);
    expect(cost).toBeCloseTo(0.001, 5);
  });

  it("calculates cost based on response size", () => {
    const cost = estimateCost(0, 1024);
    expect(cost).toBeCloseTo(0.000002, 8);
  });

  it("combines duration and size costs", () => {
    const cost = estimateCost(500, 2048);
    expect(cost).toBeGreaterThan(0);
  });
});

describe("computeCost", () => {
  it("returns zero summary for empty entries", () => {
    const summary = computeCost([]);
    expect(summary.totalRequests).toBe(0);
    expect(summary.totalDurationMs).toBe(0);
    expect(summary.estimatedTotalCost).toBe(0);
    expect(Object.keys(summary.byPath)).toHaveLength(0);
  });

  it("aggregates a single entry", () => {
    const entry = makeEntry({ durationMs: 200 });
    const summary = computeCost([entry]);
    expect(summary.totalRequests).toBe(1);
    expect(summary.totalDurationMs).toBe(200);
    expect(summary.estimatedTotalCost).toBeGreaterThan(0);
  });

  it("groups entries by method and path", () => {
    const entries = [
      makeEntry({ method: "GET", path: "/api/users" }),
      makeEntry({ method: "POST", path: "/api/users" }),
      makeEntry({ method: "GET", path: "/api/users" }),
    ];
    const summary = computeCost(entries);
    expect(Object.keys(summary.byPath)).toHaveLength(2);
    expect(summary.byPath["GET /api/users"].durationMs).toBe(200);
  });

  it("handles missing durationMs", () => {
    const entry = makeEntry({ durationMs: undefined });
    const summary = computeCost([entry]);
    expect(summary.totalDurationMs).toBe(0);
  });

  it("handles missing response body", () => {
    const entry = makeEntry({ response: { headers: {}, body: "" } });
    const summary = computeCost([entry]);
    expect(summary.totalResponseBytes).toBe(0);
  });

  it("sums costs across multiple entries", () => {
    const entries = [
      makeEntry({ durationMs: 100 }),
      makeEntry({ durationMs: 200 }),
    ];
    const summary = computeCost(entries);
    expect(summary.totalDurationMs).toBe(300);
    expect(summary.totalRequests).toBe(2);
  });
});

describe("formatCost", () => {
  it("includes summary header", () => {
    const summary = computeCost([makeEntry()]);
    const output = formatCost(summary);
    expect(output).toContain("Cost Summary");
  });

  it("includes endpoint breakdown", () => {
    const summary = computeCost([makeEntry({ path: "/api/items" })]);
    const output = formatCost(summary);
    expect(output).toContain("/api/items");
  });

  it("shows estimated cost in dollars", () => {
    const summary = computeCost([makeEntry()]);
    const output = formatCost(summary);
    expect(output).toContain("$");
  });
});
