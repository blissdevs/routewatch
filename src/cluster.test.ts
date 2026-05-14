import { describe, it, expect } from "bun:test";
import {
  getClusterKey,
  clusterEntries,
  formatCluster,
  Cluster,
} from "./cluster";
import { LogEntry } from "./logger";

function makeEntry(
  url: string,
  method: string,
  status: number,
  duration?: number
): LogEntry {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    request: {
      url,
      method,
      headers: {},
      body: undefined,
    },
    response: {
      status,
      headers: {},
      body: undefined,
    },
    duration,
  };
}

describe("getClusterKey", () => {
  it("returns pathname for 'path'", () => {
    const entry = makeEntry("http://localhost/api/users", "GET", 200);
    expect(getClusterKey(entry, "path")).toBe("/api/users");
  });

  it("returns status string for 'status'", () => {
    const entry = makeEntry("http://localhost/api/users", "GET", 404);
    expect(getClusterKey(entry, "status")).toBe("404");
  });

  it("returns method for 'method'", () => {
    const entry = makeEntry("http://localhost/api/users", "post", 201);
    expect(getClusterKey(entry, "method")).toBe("POST");
  });

  it("returns host for 'host'", () => {
    const entry = makeEntry("http://api.example.com/v1/items", "GET", 200);
    expect(getClusterKey(entry, "host")).toBe("api.example.com");
  });
});

describe("clusterEntries", () => {
  it("groups entries by path", () => {
    const entries = [
      makeEntry("http://localhost/api/users", "GET", 200, 100),
      makeEntry("http://localhost/api/users", "GET", 200, 200),
      makeEntry("http://localhost/api/items", "GET", 200, 50),
    ];
    const clusters = clusterEntries(entries, "path");
    expect(clusters).toHaveLength(2);
    const userCluster = clusters.find((c) => c.key === "/api/users");
    expect(userCluster?.count).toBe(2);
    expect(userCluster?.avgDuration).toBe(150);
  });

  it("computes error rate correctly", () => {
    const entries = [
      makeEntry("http://localhost/api/fail", "GET", 500, 10),
      makeEntry("http://localhost/api/fail", "GET", 200, 10),
    ];
    const clusters = clusterEntries(entries, "path");
    expect(clusters[0].errorRate).toBe(0.5);
  });

  it("sorts clusters by count descending", () => {
    const entries = [
      makeEntry("http://localhost/a", "GET", 200),
      makeEntry("http://localhost/b", "GET", 200),
      makeEntry("http://localhost/b", "GET", 200),
    ];
    const clusters = clusterEntries(entries, "path");
    expect(clusters[0].key).toBe("/b");
  });

  it("returns empty array for no entries", () => {
    expect(clusterEntries([], "method")).toEqual([]);
  });
});

describe("formatCluster", () => {
  it("formats cluster output", () => {
    const cluster: Cluster = {
      key: "/api/users",
      entries: [],
      count: 5,
      avgDuration: 123,
      errorRate: 0.2,
    };
    const output = formatCluster(cluster);
    expect(output).toContain("/api/users");
    expect(output).toContain("5");
    expect(output).toContain("123ms");
    expect(output).toContain("20%");
  });
});
