import { describe, it, expect } from "bun:test";
import {
  getChainId,
  buildChains,
  formatChain,
  printChains,
} from "./chain";
import type { LogEntry } from "./logger";

function makeEntry(
  url: string,
  correlationId?: string,
  timestamp = new Date().toISOString(),
  status = 200
): LogEntry {
  return {
    timestamp,
    request: {
      method: "GET",
      url,
      headers: correlationId ? { "x-correlation-id": correlationId } : {},
      body: "",
    },
    response: { status, headers: {}, body: "" },
  } as unknown as LogEntry;
}

describe("getChainId", () => {
  it("returns the header value when present", () => {
    const entry = makeEntry("/a", "abc-123");
    expect(getChainId(entry)).toBe("abc-123");
  });

  it("returns undefined when header is absent", () => {
    const entry = makeEntry("/a");
    expect(getChainId(entry)).toBeUndefined();
  });

  it("is case-insensitive for the header name", () => {
    const entry = makeEntry("/a");
    (entry.request as any).headers["X-Correlation-ID"] = "xyz";
    expect(getChainId(entry, "x-correlation-id")).toBe("xyz");
  });
});

describe("buildChains", () => {
  it("groups entries by correlation id", () => {
    const entries = [
      makeEntry("/a", "chain-1", "2024-01-01T00:00:00.000Z"),
      makeEntry("/b", "chain-2", "2024-01-01T00:00:01.000Z"),
      makeEntry("/c", "chain-1", "2024-01-01T00:00:02.000Z"),
    ];
    const chains = buildChains(entries);
    expect(chains).toHaveLength(2);
    const c1 = chains.find((c) => c.id === "chain-1")!;
    expect(c1.entries).toHaveLength(2);
    expect(c1.durationMs).toBe(2000);
  });

  it("ignores entries without a correlation id", () => {
    const entries = [
      makeEntry("/no-id"),
      makeEntry("/with-id", "chain-1"),
    ];
    const chains = buildChains(entries);
    expect(chains).toHaveLength(1);
  });

  it("sorts entries within a chain by timestamp", () => {
    const entries = [
      makeEntry("/second", "c", "2024-01-01T00:00:02.000Z"),
      makeEntry("/first", "c", "2024-01-01T00:00:00.000Z"),
    ];
    const [chain] = buildChains(entries);
    expect(chain.entries[0].request!.url).toBe("/first");
  });

  it("returns empty array when no entries match", () => {
    expect(buildChains([])).toEqual([]);
    expect(buildChains([makeEntry("/x")])).toEqual([]);
  });
});

describe("formatChain", () => {
  it("includes the chain id and request details", () => {
    const chain = buildChains([
      makeEntry("/api/users", "req-99", "2024-01-01T00:00:00.000Z", 201),
    ])[0];
    const out = formatChain(chain);
    expect(out).toContain("req-99");
    expect(out).toContain("/api/users");
    expect(out).toContain("201");
  });
});

describe("printChains", () => {
  it("prints 'No chains found.' when list is empty", () => {
    const messages: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => messages.push(msg);
    printChains([]);
    console.log = orig;
    expect(messages[0]).toBe("No chains found.");
  });
});
