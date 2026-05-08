import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { entryToCurlCommand, formatCurlCommands } from "./curl";
import { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry["request"]> = {}): LogEntry {
  return {
    id: "test-id",
    timestamp: new Date().toISOString(),
    request: {
      method: "GET",
      url: "http://localhost:3000/api/users",
      headers: { "content-type": "application/json" },
      body: "",
      ...overrides,
    },
    response: {
      status: 200,
      headers: {},
      body: "",
      duration: 42,
    },
  };
}

describe("entryToCurlCommand", () => {
  it("generates a basic GET curl command", () => {
    const entry = makeEntry();
    const cmd = entryToCurlCommand(entry);
    assert.ok(cmd.startsWith("curl"));
    assert.ok(cmd.includes("http://localhost:3000/api/users"));
    assert.ok(!cmd.includes("-X GET"), "GET should be omitted");
  });

  it("includes -X for non-GET methods", () => {
    const entry = makeEntry({ method: "POST" });
    const cmd = entryToCurlCommand(entry);
    assert.ok(cmd.includes("-X POST"));
  });

  it("includes headers", () => {
    const entry = makeEntry({ headers: { authorization: "Bearer abc123" } });
    const cmd = entryToCurlCommand(entry);
    assert.ok(cmd.includes("-H 'authorization: Bearer abc123'"));
  });

  it("includes body with --data", () => {
    const entry = makeEntry({
      method: "POST",
      body: '{"name":"Alice"}',
    });
    const cmd = entryToCurlCommand(entry);
    assert.ok(cmd.includes("--data"));
    assert.ok(cmd.includes('{"name":"Alice"}'));
  });

  it("escapes single quotes in body", () => {
    const entry = makeEntry({
      method: "POST",
      body: "it's a test",
    });
    const cmd = entryToCurlCommand(entry);
    assert.ok(cmd.includes("it'\\''s a test"));
  });

  it("escapes single quotes in header values", () => {
    const entry = makeEntry({ headers: { "x-custom": "val'ue" } });
    const cmd = entryToCurlCommand(entry);
    assert.ok(cmd.includes("val'\\''ue"));
  });
});

describe("formatCurlCommands", () => {
  it("joins multiple entries with newlines", () => {
    const entries = [
      makeEntry({ url: "http://localhost:3000/a" }),
      makeEntry({ url: "http://localhost:3000/b" }),
    ];
    const result = formatCurlCommands(entries);
    const lines = result.split("\n");
    assert.equal(lines.length, 2);
    assert.ok(lines[0].includes("/a"));
    assert.ok(lines[1].includes("/b"));
  });

  it("returns empty string for no entries", () => {
    assert.equal(formatCurlCommands([]), "");
  });
});
