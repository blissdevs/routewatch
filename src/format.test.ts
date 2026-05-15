import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatCompact,
  formatPretty,
  formatTable,
  formatEntry,
  formatEntries,
} from "./format";
import type { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    method: "GET",
    url: "http://localhost/api/data",
    status: 200,
    duration: 42,
    timestamp: "2024-01-01T00:00:00.000Z",
    requestHeaders: { "content-type": "application/json" },
    requestBody: "",
    responseHeaders: {},
    responseBody: "{}",
    ...overrides,
  };
}

describe("formatCompact", () => {
  it("includes method, url, and status", () => {
    const out = formatCompact(makeEntry(), { style: "compact" });
    assert.ok(out.includes("GET"));
    assert.ok(out.includes("http://localhost/api/data"));
    assert.ok(out.includes("200"));
  });

  it("includes duration when present", () => {
    const out = formatCompact(makeEntry({ duration: 99 }), { style: "compact" });
    assert.ok(out.includes("99ms"));
  });

  it("omits duration when absent", () => {
    const out = formatCompact(makeEntry({ duration: undefined }), { style: "compact" });
    assert.ok(!out.includes("ms"));
  });
});

describe("formatPretty", () => {
  it("includes labeled fields", () => {
    const out = formatPretty(makeEntry(), { style: "pretty" });
    assert.ok(out.includes("Status"));
    assert.ok(out.includes("Duration"));
    assert.ok(out.includes("Time"));
  });

  it("includes request headers when requested", () => {
    const out = formatPretty(makeEntry(), { style: "pretty", includeHeaders: true });
    assert.ok(out.includes("content-type"));
  });

  it("omits headers when not requested", () => {
    const out = formatPretty(makeEntry(), { style: "pretty", includeHeaders: false });
    assert.ok(!out.includes("content-type"));
  });
});

describe("formatTable", () => {
  it("renders header row", () => {
    const out = formatTable([makeEntry()], { style: "table" });
    assert.ok(out.includes("METHOD"));
    assert.ok(out.includes("STATUS"));
    assert.ok(out.includes("URL"));
  });

  it("renders each entry as a row", () => {
    const entries = [makeEntry({ url: "/a" }), makeEntry({ url: "/b" })];
    const out = formatTable(entries, { style: "table" });
    assert.ok(out.includes("/a"));
    assert.ok(out.includes("/b"));
  });
});

describe("formatEntry", () => {
  it("json style returns valid JSON", () => {
    const out = formatEntry(makeEntry(), { style: "json" });
    const parsed = JSON.parse(out);
    assert.equal(parsed.method, "GET");
  });
});

describe("formatEntries", () => {
  it("delegates to formatTable for table style", () => {
    const out = formatEntries([makeEntry()], { style: "table" });
    assert.ok(out.includes("METHOD"));
  });

  it("joins compact entries with newlines", () => {
    const entries = [makeEntry({ url: "/x" }), makeEntry({ url: "/y" })];
    const out = formatEntries(entries, { style: "compact" });
    assert.ok(out.includes("/x"));
    assert.ok(out.includes("/y"));
  });
});
