import { describe, it, expect } from "bun:test";
import { parseCompareArgs } from "./compare-cli";

describe("parseCompareArgs", () => {
  it("returns null when no arguments given", () => {
    expect(parseCompareArgs(["node", "compare-cli.ts"])).toBeNull();
  });

  it("returns null when only one file given", () => {
    expect(parseCompareArgs(["node", "compare-cli.ts", "a.log"])).toBeNull();
  });

  it("parses two file paths", () => {
    const result = parseCompareArgs(["node", "compare-cli.ts", "a.log", "b.log"]);
    expect(result).not.toBeNull();
    expect(result!.fileA).toBe("a.log");
    expect(result!.fileB).toBe("b.log");
  });

  it("ignores extra arguments beyond two files", () => {
    const result = parseCompareArgs(["node", "compare-cli.ts", "a.log", "b.log", "--extra"]);
    expect(result!.fileA).toBe("a.log");
    expect(result!.fileB).toBe("b.log");
  });
});
