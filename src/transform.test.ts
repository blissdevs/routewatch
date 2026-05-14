import { describe, it, expect } from "bun:test";
import {
  applyTransform,
  applyTransforms,
  renameHeader,
  setHeader,
  rewriteUrl,
  formatTransformSummary,
} from "./transform";
import type { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry["request"]> = {}): LogEntry {
  return {
    id: "test-1",
    timestamp: new Date().toISOString(),
    request: {
      method: "GET",
      url: "http://localhost:3000/api/users",
      headers: { "content-type": "application/json", authorization: "Bearer token" },
      body: "",
      ...overrides,
    },
    response: {
      status: 200,
      headers: {},
      body: "{}",
      duration: 42,
    },
  };
}

describe("renameHeader", () => {
  it("renames an existing header", () => {
    const rule = renameHeader("authorization", "x-auth-token");
    const result = applyTransform(makeEntry(), rule);
    expect(result.request.headers["x-auth-token"]).toBe("Bearer token");
    expect(result.request.headers["authorization"]).toBeUndefined();
  });

  it("leaves entry unchanged if header not found", () => {
    const rule = renameHeader("x-missing", "x-other");
    const entry = makeEntry();
    const result = applyTransform(entry, rule);
    expect(result.request.headers).toEqual(entry.request.headers);
  });
});

describe("setHeader", () => {
  it("adds a new header", () => {
    const rule = setHeader("x-custom", "hello");
    const result = applyTransform(makeEntry(), rule);
    expect(result.request.headers["x-custom"]).toBe("hello");
  });

  it("overwrites an existing header", () => {
    const rule = setHeader("content-type", "text/plain");
    const result = applyTransform(makeEntry(), rule);
    expect(result.request.headers["content-type"]).toBe("text/plain");
  });
});

describe("rewriteUrl", () => {
  it("replaces a pattern in the URL", () => {
    const rule = rewriteUrl(/\/api/, "/v2");
    const result = applyTransform(makeEntry(), rule);
    expect(result.request.url).toBe("http://localhost:3000/v2/users");
  });

  it("leaves URL unchanged if pattern does not match", () => {
    const rule = rewriteUrl(/\/graphql/, "/v2");
    const entry = makeEntry();
    const result = applyTransform(entry, rule);
    expect(result.request.url).toBe(entry.request.url);
  });
});

describe("applyTransforms", () => {
  it("applies multiple rules in order", () => {
    const rules = [
      setHeader("x-step", "1"),
      setHeader("x-step", "2"),
    ];
    const result = applyTransforms(makeEntry(), rules);
    expect(result.request.headers["x-step"]).toBe("2");
  });
});

describe("formatTransformSummary", () => {
  it("returns message for empty rules", () => {
    expect(formatTransformSummary([])).toBe("No transforms applied.");
  });

  it("lists rules by name", () => {
    const rules = [setHeader("x-a", "1"), rewriteUrl(/a/, "b")];
    const output = formatTransformSummary(rules);
    expect(output).toContain("set-header:x-a");
    expect(output).toContain("rewrite-url");
  });
});
