import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mirrorEntry,
  mirrorEntries,
  formatMirrorResult,
  MirrorTarget,
} from "./mirror";
import type { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry["request"]> = {}): LogEntry {
  return {
    id: "abc123",
    timestamp: new Date().toISOString(),
    request: {
      method: "GET",
      path: "/api/test",
      headers: { "content-type": "application/json" },
      body: "",
      ...overrides,
    },
    response: {
      status: 200,
      headers: {},
      body: "{}",
    },
    durationMs: 42,
  };
}

const target: MirrorTarget = { url: "http://mirror.example.com" };

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("mirrorEntry", () => {
  it("returns ok result on successful fetch", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, ok: true }));
    const result = await mirrorEntry(makeEntry(), target);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.target).toBe("http://mirror.example.com/api/test");
  });

  it("returns error result when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const result = await mirrorEntry(makeEntry(), target);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.error).toContain("ECONNREFUSED");
  });

  it("strips trailing slash from target url", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 201, ok: true }));
    const result = await mirrorEntry(makeEntry(), { url: "http://mirror.example.com/" });
    expect(result.target).toBe("http://mirror.example.com/api/test");
  });

  it("merges extra headers from target", async () => {
    const spy = vi.fn().mockResolvedValue({ status: 200, ok: true });
    vi.stubGlobal("fetch", spy);
    await mirrorEntry(makeEntry(), { url: "http://mirror.example.com", headers: { "x-env": "staging" } });
    const calledHeaders = spy.mock.calls[0][1].headers;
    expect(calledHeaders["x-env"]).toBe("staging");
  });
});

describe("mirrorEntries", () => {
  it("mirrors all entries and returns results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, ok: true }));
    const entries = [makeEntry(), makeEntry({ path: "/api/other" })];
    const results = await mirrorEntries(entries, target);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.ok)).toBe(true);
  });
});

describe("formatMirrorResult", () => {
  it("formats a successful result", () => {
    const result = { entry: makeEntry(), target: "http://x.com/api/test", status: 200, ok: true, durationMs: 55 };
    const line = formatMirrorResult(result);
    expect(line).toContain("/api/test");
    expect(line).toContain("200");
    expect(line).toContain("55ms");
  });

  it("includes error message on failure", () => {
    const result = { entry: makeEntry(), target: "http://x.com/api/test", status: 0, ok: false, error: "timeout", durationMs: 100 };
    const line = formatMirrorResult(result);
    expect(line).toContain("timeout");
  });
});
