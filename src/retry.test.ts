import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { retryEntry, formatRetryResult, RetryResult } from "./retry";
import { LogEntry } from "./logger";

let serverUrl = "";
let failCount = 0;
let server: ReturnType<typeof createServer>;

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "test-id",
    timestamp: new Date().toISOString(),
    method: "GET",
    url: `${serverUrl}/ok`,
    requestHeaders: {},
    requestBody: "",
    status: 200,
    responseHeaders: {},
    responseBody: "",
    durationMs: 10,
    ...overrides,
  };
}

beforeAll(async () => {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/flaky") {
      failCount++;
      if (failCount < 3) {
        res.writeHead(503);
        res.end("unavailable");
        return;
      }
      failCount = 0;
    }
    if (req.url === "/error") {
      res.writeHead(500);
      res.end("error");
      return;
    }
    res.writeHead(200);
    res.end("ok");
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address() as { port: number };
  serverUrl = `http://localhost:${addr.port}`;
});

afterAll(() => {
  server.close();
});

describe("retryEntry", () => {
  it("succeeds on first attempt for healthy endpoint", async () => {
    const entry = makeEntry({ url: `${serverUrl}/ok` });
    const result = await retryEntry(entry, { maxAttempts: 3, delayMs: 10 });
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(1);
    expect(result.lastStatus).toBe(200);
  });

  it("retries and eventually succeeds on flaky endpoint", async () => {
    failCount = 0;
    const entry = makeEntry({ url: `${serverUrl}/flaky` });
    const result = await retryEntry(entry, { maxAttempts: 3, delayMs: 10, backoff: false });
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3);
  });

  it("fails after exhausting attempts on error endpoint", async () => {
    const entry = makeEntry({ url: `${serverUrl}/error` });
    const result = await retryEntry(entry, { maxAttempts: 2, delayMs: 10 });
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(2);
    expect(result.lastStatus).toBe(500);
  });

  it("fails with error on unreachable host", async () => {
    const entry = makeEntry({ url: "http://localhost:1" });
    const result = await retryEntry(entry, { maxAttempts: 2, delayMs: 5 });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("formatRetryResult", () => {
  it("formats a successful result", () => {
    const result: RetryResult = {
      entry: makeEntry(),
      attempts: 1,
      success: true,
      lastStatus: 200,
    };
    const out = formatRetryResult(result);
    expect(out).toContain("SUCCESS");
    expect(out).toContain("HTTP 200");
    expect(out).toContain("1 attempt");
  });

  it("formats a failed result with error", () => {
    const result: RetryResult = {
      entry: makeEntry(),
      attempts: 3,
      success: false,
      error: "connection refused",
    };
    const out = formatRetryResult(result);
    expect(out).toContain("FAILED");
    expect(out).toContain("connection refused");
    expect(out).toContain("3 attempt");
  });
});
