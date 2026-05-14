import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeHeaders, normalizeUrl, normalizeEntry, normalizeEntries } from "./normalize";
import type { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "test-1",
    timestamp: new Date().toISOString(),
    request: {
      method: "GET",
      url: "http://localhost/api/users?z=1&a=2",
      headers: { "Content-Type": "application/json", "X-Token": "abc" },
      body: undefined,
    },
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: '  { "ok": true }  ',
    },
    ...overrides,
  };
}

describe("normalizeHeaders", () => {
  it("lowercases header keys", () => {
    const result = normalizeHeaders({ "Content-Type": "text/plain", "X-ID": "1" });
    assert.ok("content-type" in result);
    assert.ok("x-id" in result);
  });

  it("sorts header keys alphabetically", () => {
    const result = normalizeHeaders({ "z-header": "1", "a-header": "2" });
    const keys = Object.keys(result);
    assert.deepEqual(keys, ["a-header", "z-header"]);
  });

  it("preserves values", () => {
    const result = normalizeHeaders({ Authorization: "Bearer token" });
    assert.equal(result["authorization"], "Bearer token");
  });
});

describe("normalizeUrl", () => {
  it("sorts query parameters", () => {
    const result = normalizeUrl("http://localhost/api?z=1&a=2&m=3");
    assert.equal(result, "http://localhost/api?a=2&m=3&z=1");
  });

  it("returns original url if invalid", () => {
    const bad = "/relative/path?b=1&a=2";
    assert.equal(normalizeUrl(bad), bad);
  });
});

describe("normalizeEntry", () => {
  it("normalizes request headers and url", () => {
    const entry = makeEntry();
    const result = normalizeEntry(entry);
    assert.ok("content-type" in result.request.headers);
    assert.ok(result.request.url.includes("a=2&z=1"));
  });

  it("normalizes response body JSON", () => {
    const entry = makeEntry();
    const result = normalizeEntry(entry);
    assert.equal(result.response?.body, '{"ok":true}');
  });

  it("handles missing response", () => {
    const entry = makeEntry({ response: undefined });
    const result = normalizeEntry(entry);
    assert.equal(result.response, undefined);
  });

  it("respects options to skip normalization", () => {
    const entry = makeEntry();
    const result = normalizeEntry(entry, { lowercaseHeaders: false, sortHeaders: false, trimBody: false, normalizeUrl: false });
    assert.ok("Content-Type" in result.request.headers);
    assert.equal(result.request.url, entry.request.url);
  });
});

describe("normalizeEntries", () => {
  it("normalizes all entries", () => {
    const entries = [makeEntry(), makeEntry({ id: "test-2" })];
    const results = normalizeEntries(entries);
    assert.equal(results.length, 2);
    results.forEach((r) => assert.ok("content-type" in r.request.headers));
  });
});
