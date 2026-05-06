import { describe, it, expect } from "bun:test";
import {
  truncateString,
  truncateBody,
  isTruncated,
  truncateEntry,
} from "./truncate";

describe("truncateString", () => {
  it("returns the string unchanged if within maxLength", () => {
    expect(truncateString("hello", { maxLength: 10 })).toBe("hello");
  });

  it("truncates and appends default indicator", () => {
    const result = truncateString("abcdefgh", { maxLength: 4 });
    expect(result).toBe("abcd... [truncated]");
  });

  it("uses custom indicator when provided", () => {
    const result = truncateString("abcdefgh", { maxLength: 4, indicator: "..." });
    expect(result).toBe("abcd...");
  });

  it("handles empty string", () => {
    expect(truncateString("", { maxLength: 10 })).toBe("");
  });

  it("handles exact length boundary", () => {
    expect(truncateString("abcd", { maxLength: 4 })).toBe("abcd");
  });
});

describe("truncateBody", () => {
  it("returns empty string for null", () => {
    expect(truncateBody(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(truncateBody(undefined)).toBe("");
  });

  it("serializes objects before truncating", () => {
    const obj = { key: "value" };
    const result = truncateBody(obj, { maxLength: 5 });
    expect(result.startsWith('{"key')).toBe(true);
  });

  it("handles plain strings", () => {
    expect(truncateBody("hello world", { maxLength: 100 })).toBe("hello world");
  });
});

describe("isTruncated", () => {
  it("returns false when string is within limit", () => {
    expect(isTruncated("short", 100)).toBe(false);
  });

  it("returns true when string exceeds limit", () => {
    expect(isTruncated("a very long string", 5)).toBe(true);
  });

  it("uses default max length", () => {
    const short = "x".repeat(512);
    expect(isTruncated(short)).toBe(false);
    const long = "x".repeat(513);
    expect(isTruncated(long)).toBe(true);
  });
});

describe("truncateEntry", () => {
  it("truncates requestBody and responseBody fields", () => {
    const entry = {
      method: "POST",
      url: "/api/test",
      requestBody: "x".repeat(600),
      responseBody: "y".repeat(600),
    };
    const result = truncateEntry(entry, { maxLength: 50 });
    expect((result.requestBody as string).length).toBeLessThan(600);
    expect((result.responseBody as string).length).toBeLessThan(600);
    expect(result.method).toBe("POST");
  });

  it("does not mutate the original entry", () => {
    const original = { requestBody: "x".repeat(600) };
    truncateEntry(original, { maxLength: 10 });
    expect(original.requestBody.length).toBe(600);
  });

  it("skips fields that are not present", () => {
    const entry = { method: "GET", url: "/ping" };
    const result = truncateEntry(entry, { maxLength: 10 });
    expect(result).not.toHaveProperty("requestBody");
    expect(result).not.toHaveProperty("responseBody");
  });
});
