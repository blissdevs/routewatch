import { describe, it, expect } from "bun:test";
import {
  lintEntry,
  lintEntries,
  formatLintResult,
  LintResult,
} from "./lint";
import { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "entry-1",
    timestamp: new Date().toISOString(),
    method: "GET",
    url: "http://localhost:3000/api/test",
    status: 200,
    requestHeaders: {},
    responseHeaders: {},
    requestBody: "",
    responseBody: "",
    durationMs: 100,
    ...overrides,
  };
}

describe("lintEntry", () => {
  it("returns no issues for a clean GET request", () => {
    const entry = makeEntry();
    expect(lintEntry(entry)).toEqual([]);
  });

  it("warns when POST body is missing Content-Type", () => {
    const entry = makeEntry({
      method: "POST",
      requestBody: '{"key":"value"}',
      requestHeaders: {},
    });
    const issues = lintEntry(entry);
    expect(issues.some((i) => i.rule === "missing-content-type")).toBe(true);
    expect(issues.find((i) => i.rule === "missing-content-type")?.severity).toBe("warn");
  });

  it("does not warn when POST body has Content-Type", () => {
    const entry = makeEntry({
      method: "POST",
      requestBody: '{"key":"value"}',
      requestHeaders: { "content-type": "application/json" },
    });
    const issues = lintEntry(entry);
    expect(issues.some((i) => i.rule === "missing-content-type")).toBe(false);
  });

  it("warns for large response payload", () => {
    const entry = makeEntry({ responseBody: "x".repeat(600 * 1024) });
    const issues = lintEntry(entry);
    expect(issues.some((i) => i.rule === "large-payload")).toBe(true);
  });

  it("errors on 5xx responses", () => {
    const entry = makeEntry({ status: 503 });
    const issues = lintEntry(entry);
    expect(issues.some((i) => i.rule === "server-error")).toBe(true);
    expect(issues.find((i) => i.rule === "server-error")?.severity).toBe("error");
  });

  it("warns on slow responses", () => {
    const entry = makeEntry({ durationMs: 3500 });
    const issues = lintEntry(entry);
    expect(issues.some((i) => i.rule === "slow-response")).toBe(true);
  });

  it("does not warn for responses within threshold", () => {
    const entry = makeEntry({ durationMs: 500 });
    const issues = lintEntry(entry);
    expect(issues.some((i) => i.rule === "slow-response")).toBe(false);
  });
});

describe("lintEntries", () => {
  it("aggregates issues across multiple entries", () => {
    const entries = [
      makeEntry({ id: "a", status: 500 }),
      makeEntry({ id: "b", durationMs: 9999 }),
      makeEntry({ id: "c" }),
    ];
    const result = lintEntries(entries);
    expect(result.errorCount).toBe(1);
    expect(result.warnCount).toBe(1);
    expect(result.issues.length).toBe(2);
  });
});

describe("formatLintResult", () => {
  it("returns success message when no issues", () => {
    const result: LintResult = { issues: [], errorCount: 0, warnCount: 0 };
    expect(formatLintResult(result)).toContain("No lint issues");
  });

  it("formats issues with icons and counts", () => {
    const result = lintEntries([
      makeEntry({ id: "x", status: 500 }),
      makeEntry({ id: "y", durationMs: 5000 }),
    ]);
    const output = formatLintResult(result);
    expect(output).toContain("✖");
    expect(output).toContain("⚠");
    expect(output).toContain("1 error(s)");
    expect(output).toContain("1 warning(s)");
  });
});
