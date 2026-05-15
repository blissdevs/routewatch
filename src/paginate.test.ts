import { describe, it, expect } from "bun:test";
import { paginateEntries, formatPaginate } from "./paginate";
import { LogEntry } from "./logger";

function makeEntry(i: number): LogEntry {
  return {
    id: `entry-${i}`,
    timestamp: new Date(Date.now() + i * 1000).toISOString(),
    method: "GET",
    url: `/api/resource/${i}`,
    requestHeaders: {},
    requestBody: "",
    response: {
      status: 200,
      headers: {},
      body: `{\"id\":${i}}`,
      duration: 50 + i,
    },
  };
}

describe("paginateEntries", () => {
  const entries = Array.from({ length: 25 }, (_, i) => makeEntry(i));

  it("returns correct items for page 1", () => {
    const result = paginateEntries(entries, { page: 1, pageSize: 10 });
    expect(result.items).toHaveLength(10);
    expect(result.items[0].id).toBe("entry-0");
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(false);
  });

  it("returns correct items for page 2", () => {
    const result = paginateEntries(entries, { page: 2, pageSize: 10 });
    expect(result.items).toHaveLength(10);
    expect(result.items[0].id).toBe("entry-10");
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it("returns last page with remaining items", () => {
    const result = paginateEntries(entries, { page: 3, pageSize: 10 });
    expect(result.items).toHaveLength(5);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
  });

  it("clamps page above totalPages", () => {
    const result = paginateEntries(entries, { page: 99, pageSize: 10 });
    expect(result.page).toBe(3);
  });

  it("clamps page below 1", () => {
    const result = paginateEntries(entries, { page: 0, pageSize: 10 });
    expect(result.page).toBe(1);
  });

  it("handles empty entries", () => {
    const result = paginateEntries([], { page: 1, pageSize: 10 });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(false);
  });
});

describe("formatPaginate", () => {
  it("includes page info and entry lines", () => {
    const entries = Array.from({ length: 5 }, (_, i) => makeEntry(i));
    const result = paginateEntries(entries, { page: 1, pageSize: 5 });
    const output = formatPaginate(result);
    expect(output).toContain("Page 1 of 1");
    expect(output).toContain("5 total entries");
    expect(output).toContain("/api/resource/0");
  });

  it("shows next page hint when applicable", () => {
    const entries = Array.from({ length: 15 }, (_, i) => makeEntry(i));
    const result = paginateEntries(entries, { page: 1, pageSize: 10 });
    const output = formatPaginate(result);
    expect(output).toContain("Next: page 2");
  });

  it("shows prev page hint when applicable", () => {
    const entries = Array.from({ length: 15 }, (_, i) => makeEntry(i));
    const result = paginateEntries(entries, { page: 2, pageSize: 10 });
    const output = formatPaginate(result);
    expect(output).toContain("Prev: page 1");
  });
});
