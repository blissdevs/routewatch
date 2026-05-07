import { describe, it, expect } from "bun:test";
import {
  groupEntries,
  getGroupKey,
  formatGroup,
  GroupByField,
} from "./group";
import { LogEntry } from "./logger";

function makeEntry(
  method: string,
  url: string,
  status: number
): LogEntry {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    request: {
      method,
      url,
      headers: {},
      body: "",
    },
    response: {
      status,
      headers: {},
      body: "",
      duration: 100,
    },
  };
}

describe("getGroupKey", () => {
  it("returns method", () => {
    const e = makeEntry("get", "http://api.example.com/users", 200);
    expect(getGroupKey(e, "method")).toBe("GET");
  });

  it("returns status", () => {
    const e = makeEntry("POST", "http://api.example.com/users", 404);
    expect(getGroupKey(e, "status")).toBe("404");
  });

  it("returns host", () => {
    const e = makeEntry("GET", "http://api.example.com/users", 200);
    expect(getGroupKey(e, "host")).toBe("api.example.com");
  });

  it("returns path", () => {
    const e = makeEntry("GET", "http://api.example.com/users/42", 200);
    expect(getGroupKey(e, "path")).toBe("/users/42");
  });

  it("returns no-response when response is undefined", () => {
    const e = makeEntry("GET", "http://api.example.com/", 200);
    (e as any).response = undefined;
    expect(getGroupKey(e, "status")).toBe("no-response");
  });
});

describe("groupEntries", () => {
  it("groups by method", () => {
    const entries = [
      makeEntry("GET", "http://example.com/a", 200),
      makeEntry("POST", "http://example.com/b", 201),
      makeEntry("GET", "http://example.com/c", 200),
    ];
    const result = groupEntries(entries, "method");
    expect(result).toHaveLength(2);
    const get = result.find((r) => r.key === "GET");
    expect(get?.count).toBe(2);
  });

  it("groups by status", () => {
    const entries = [
      makeEntry("GET", "http://example.com/a", 200),
      makeEntry("GET", "http://example.com/b", 404),
      makeEntry("GET", "http://example.com/c", 200),
    ];
    const result = groupEntries(entries, "status");
    const ok = result.find((r) => r.key === "200");
    expect(ok?.count).toBe(2);
  });

  it("returns empty array for no entries", () => {
    expect(groupEntries([], "method")).toEqual([]);
  });

  it("sorts by count descending", () => {
    const entries = [
      makeEntry("DELETE", "http://example.com/x", 204),
      makeEntry("GET", "http://example.com/a", 200),
      makeEntry("GET", "http://example.com/b", 200),
      makeEntry("GET", "http://example.com/c", 200),
    ];
    const result = groupEntries(entries, "method");
    expect(result[0].key).toBe("GET");
    expect(result[0].count).toBe(3);
  });
});

describe("formatGroup", () => {
  it("formats singular", () => {
    expect(formatGroup({ key: "GET", entries: [], count: 1 })).toBe(
      "[GET] 1 request"
    );
  });

  it("formats plural", () => {
    expect(formatGroup({ key: "POST", entries: [], count: 3 })).toBe(
      "[POST] 3 requests"
    );
  });
});
