import { describe, it, expect } from "bun:test";
import { scoreEntry, scoreEntries, formatScore } from "./score";
import type { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "test-id",
    timestamp: new Date().toISOString(),
    request: {
      method: "GET",
      url: "http://localhost/api/test",
      headers: {},
      body: "",
    },
    response: {
      status: 200,
      headers: { "content-type": "application/json" },
      body: '{"ok":true}',
      duration: 100,
    },
    ...overrides,
  } as LogEntry;
}

describe("scoreEntry", () => {
  it("gives a high score to a fast, successful, small response", () => {
    const result = scoreEntry(makeEntry());
    expect(result.score).toBeGreaterThan(100);
    expect(result.score).toBeLessThanOrEqual(100); // clamped
  });

  it("clamps score to 100 maximum", () => {
    const result = scoreEntry(makeEntry());
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("penalizes 5xx errors", () => {
    const ok = scoreEntry(makeEntry({ response: { status: 200, headers: {"content-type":"application/json"}, body: "ok", duration: 100 } }));
    const err = scoreEntry(makeEntry({ response: { status: 500, headers: {"content-type":"application/json"}, body: "err", duration: 100 } }));
    expect(err.score).toBeLessThan(ok.score);
    expect(err.breakdown).toHaveProperty("statusError");
  });

  it("penalizes 4xx errors less than 5xx", () => {
    const e5 = scoreEntry(makeEntry({ response: { status: 500, headers: {}, body: "", duration: 100 } }));
    const e4 = scoreEntry(makeEntry({ response: { status: 404, headers: {}, body: "", duration: 100 } }));
    expect(e4.score).toBeGreaterThan(e5.score);
  });

  it("penalizes slow responses", () => {
    const fast = scoreEntry(makeEntry({ response: { status: 200, headers: {"content-type":"application/json"}, body: "hi", duration: 50 } }));
    const slow = scoreEntry(makeEntry({ response: { status: 200, headers: {"content-type":"application/json"}, body: "hi", duration: 3000 } }));
    expect(slow.score).toBeLessThan(fast.score);
    expect(slow.breakdown).toHaveProperty("slowResponse");
  });

  it("penalizes missing content-type", () => {
    const with_ = scoreEntry(makeEntry());
    const without = scoreEntry(makeEntry({ response: { status: 200, headers: {}, body: "x", duration: 100 } }));
    expect(without.score).toBeLessThan(with_.score);
  });

  it("includes breakdown keys", () => {
    const result = scoreEntry(makeEntry());
    expect(typeof result.breakdown).toBe("object");
  });
});

describe("scoreEntries", () => {
  it("returns sorted results descending by score", () => {
    const entries = [
      makeEntry({ response: { status: 500, headers: {}, body: "", duration: 3000 } }),
      makeEntry({ response: { status: 200, headers: { "content-type": "application/json" }, body: "ok", duration: 80 } }),
      makeEntry({ response: { status: 404, headers: {}, body: "", duration: 200 } }),
    ];
    const results = scoreEntries(entries);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
  });
});

describe("formatScore", () => {
  it("includes score and URL", () => {
    const result = scoreEntry(makeEntry());
    const output = formatScore(result);
    expect(output).toContain("/100");
    expect(output).toContain("GET");
    expect(output).toContain("/api/test");
  });

  it("includes breakdown lines", () => {
    const result = scoreEntry(makeEntry({ response: { status: 500, headers: {}, body: "", duration: 5000 } }));
    const output = formatScore(result);
    expect(output).toContain("statusError");
    expect(output).toContain("slowResponse");
  });
});
