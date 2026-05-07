import { describe, it, expect } from "bun:test";
import {
  redactHeaders,
  redactBodyFields,
  redactEntry,
  redactEntries,
} from "./redact";
import { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "test-id",
    timestamp: new Date().toISOString(),
    request: {
      method: "POST",
      url: "http://localhost:3000/api/login",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
      body: JSON.stringify({ username: "alice", password: "hunter2" }),
    },
    response: {
      status: 200,
      headers: { "set-cookie": "session=abc", "content-type": "application/json" },
      body: JSON.stringify({ token: "tok_xyz", user: "alice" }),
    },
    durationMs: 42,
    ...overrides,
  };
}

describe("redactHeaders", () => {
  it("replaces sensitive headers with default replacement", () => {
    const headers = { authorization: "Bearer secret", "content-type": "application/json" };
    const result = redactHeaders(headers, ["authorization"]);
    expect(result["authorization"]).toBe("[REDACTED]");
    expect(result["content-type"]).toBe("application/json");
  });

  it("is case-insensitive for header keys", () => {
    const headers = { Authorization: "Bearer secret" };
    const result = redactHeaders(headers, ["authorization"]);
    expect(result["Authorization"]).toBe("[REDACTED]");
  });

  it("uses custom replacement string", () => {
    const headers = { "x-api-key": "my-key" };
    const result = redactHeaders(headers, ["x-api-key"], "***");
    expect(result["x-api-key"]).toBe("***");
  });
});

describe("redactBodyFields", () => {
  it("redacts specified JSON fields", () => {
    const body = JSON.stringify({ username: "alice", password: "hunter2" });
    const result = redactBodyFields(body, ["password"]);
    const parsed = JSON.parse(result);
    expect(parsed.password).toBe("[REDACTED]");
    expect(parsed.username).toBe("alice");
  });

  it("returns body unchanged if not valid JSON", () => {
    const body = "not-json";
    const result = redactBodyFields(body, ["password"]);
    expect(result).toBe("not-json");
  });

  it("returns body unchanged if JSON is not an object", () => {
    const body = JSON.stringify([1, 2, 3]);
    const result = redactBodyFields(body, ["password"]);
    expect(result).toBe(body);
  });

  it("ignores fields not present in body", () => {
    const body = JSON.stringify({ username: "alice" });
    const result = redactBodyFields(body, ["password"]);
    const parsed = JSON.parse(result);
    expect(parsed.username).toBe("alice");
  });
});

describe("redactEntry", () => {
  it("redacts default sensitive headers automatically", () => {
    const entry = makeEntry();
    const result = redactEntry(entry);
    expect(result.request.headers["authorization"]).toBe("[REDACTED]");
    expect(result.response.headers["set-cookie"]).toBe("[REDACTED]");
  });

  it("preserves non-sensitive headers", () => {
    const entry = makeEntry();
    const result = redactEntry(entry);
    expect(result.request.headers["content-type"]).toBe("application/json");
  });

  it("redacts body fields when specified", () => {
    const entry = makeEntry();
    const result = redactEntry(entry, { bodyFields: ["password"] });
    const body = JSON.parse(result.request.body ?? "");
    expect(body.password).toBe("[REDACTED]");
    expect(body.username).toBe("alice");
  });

  it("supports custom header list", () => {
    const entry = makeEntry({
      request: {
        method: "GET",
        url: "http://localhost:3000/",
        headers: { "x-custom-secret": "shh", accept: "*/*" },
        body: "",
      },
      response: { status: 200, headers: {}, body: "" },
    });
    const result = redactEntry(entry, { headers: ["x-custom-secret"] });
    expect(result.request.headers["x-custom-secret"]).toBe("[REDACTED]");
    expect(result.request.headers["accept"]).toBe("*/*");
  });
});

describe("redactEntries", () => {
  it("applies redaction to all entries", () => {
    const entries = [makeEntry(), makeEntry()];
    const results = redactEntries(entries, { bodyFields: ["password"] });
    for (const r of results) {
      const body = JSON.parse(r.request.body ?? "");
      expect(body.password).toBe("[REDACTED]");
    }
  });
});
