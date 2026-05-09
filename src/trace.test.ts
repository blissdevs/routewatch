import { describe, it, expect } from "bun:test";
import { buildTrace, formatTrace, TraceStep } from "./trace";
import { LogEntry } from "./logger";

function makeEntry(
  overrides: Partial<{
    method: string;
    url: string;
    status: number;
    durationMs: number;
    timestamp: string;
  }> = {}
): LogEntry {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    request: {
      method: overrides.method ?? "GET",
      url: overrides.url ?? "http://localhost/api/test",
      headers: {},
      body: "",
    },
    response: {
      status: overrides.status ?? 200,
      headers: {},
      body: "",
    },
    durationMs: overrides.durationMs ?? 100,
  };
}

describe("buildTrace", () => {
  it("throws on empty entries", () => {
    expect(() => buildTrace([])).toThrow();
  });

  it("builds a trace from a single entry", () => {
    const entry = makeEntry({ timestamp: "2024-01-01T00:00:00.000Z" });
    const trace = buildTrace([entry]);
    expect(trace.steps).toHaveLength(1);
    expect(trace.steps[0].method).toBe("GET");
    expect(trace.steps[0].status).toBe(200);
    expect(trace.id).toMatch(/^trace-/);
  });

  it("sorts entries by timestamp", () => {
    const e1 = makeEntry({ timestamp: "2024-01-01T00:00:02.000Z", url: "http://localhost/second" });
    const e2 = makeEntry({ timestamp: "2024-01-01T00:00:01.000Z", url: "http://localhost/first" });
    const trace = buildTrace([e1, e2]);
    expect(trace.steps[0].url).toBe("http://localhost/first");
    expect(trace.steps[1].url).toBe("http://localhost/second");
  });

  it("computes totalDurationMs correctly", () => {
    const e1 = makeEntry({ timestamp: "2024-01-01T00:00:00.000Z" });
    const e2 = makeEntry({ timestamp: "2024-01-01T00:00:05.000Z" });
    const trace = buildTrace([e1, e2]);
    expect(trace.totalDurationMs).toBe(5000);
  });

  it("assigns sequential indexes", () => {
    const entries = [
      makeEntry({ timestamp: "2024-01-01T00:00:01.000Z" }),
      makeEntry({ timestamp: "2024-01-01T00:00:02.000Z" }),
      makeEntry({ timestamp: "2024-01-01T00:00:03.000Z" }),
    ];
    const trace = buildTrace(entries);
    expect(trace.steps.map((s: TraceStep) => s.index)).toEqual([0, 1, 2]);
  });
});

describe("formatTrace", () => {
  it("includes trace id in output", () => {
    const trace = buildTrace([makeEntry({ timestamp: "2024-01-01T00:00:00.000Z" })]);
    const output = formatTrace(trace);
    expect(output).toContain(trace.id);
  });

  it("shows method and status for each step", () => {
    const entries = [
      makeEntry({ method: "POST", status: 201, timestamp: "2024-01-01T00:00:01.000Z" }),
      makeEntry({ method: "GET", status: 404, timestamp: "2024-01-01T00:00:02.000Z" }),
    ];
    const trace = buildTrace(entries);
    const output = formatTrace(trace);
    expect(output).toContain("POST");
    expect(output).toContain("201");
    expect(output).toContain("GET");
    expect(output).toContain("404");
  });

  it("labels server errors as ERR", () => {
    const trace = buildTrace([makeEntry({ status: 500, timestamp: "2024-01-01T00:00:00.000Z" })]);
    expect(formatTrace(trace)).toContain("ERR");
  });
});
