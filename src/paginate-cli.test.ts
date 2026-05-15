import { describe, it, expect } from "bun:test";
import { parsePaginateArgs } from "./paginate-cli";

describe("parsePaginateArgs", () => {
  it("returns defaults when no args given", () => {
    const result = parsePaginateArgs([]);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("parses --page flag", () => {
    const result = parsePaginateArgs(["--page", "3"]);
    expect(result.page).toBe(3);
  });

  it("parses -p short flag", () => {
    const result = parsePaginateArgs(["-p", "5"]);
    expect(result.page).toBe(5);
  });

  it("parses --page-size flag", () => {
    const result = parsePaginateArgs(["--page-size", "50"]);
    expect(result.pageSize).toBe(50);
  });

  it("parses -n short flag", () => {
    const result = parsePaginateArgs(["-n", "25"]);
    expect(result.pageSize).toBe(25);
  });

  it("parses --page=N inline syntax", () => {
    const result = parsePaginateArgs(["--page=4"]);
    expect(result.page).toBe(4);
  });

  it("parses --page-size=N inline syntax", () => {
    const result = parsePaginateArgs(["--page-size=15"]);
    expect(result.pageSize).toBe(15);
  });

  it("ignores invalid page values", () => {
    const result = parsePaginateArgs(["--page", "abc"]);
    expect(result.page).toBe(1);
  });

  it("ignores zero or negative page values", () => {
    const result = parsePaginateArgs(["-p", "0"]);
    expect(result.page).toBe(1);
  });

  it("parses both flags together", () => {
    const result = parsePaginateArgs(["--page", "2", "--page-size", "30"]);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(30);
  });
});
