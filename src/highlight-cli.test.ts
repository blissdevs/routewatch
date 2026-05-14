import { describe, it, expect } from "bun:test";
import { parseHighlightArgs, type HighlightCliArgs } from "./highlight-cli";

describe("parseHighlightArgs", () => {
  it("parses a single rule", () => {
    const result = parseHighlightArgs(["--rule", "status:500:red"]);
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]).toEqual({
      field: "status",
      value: "500",
      color: "red",
      label: undefined,
    });
  });

  it("parses a rule with a label", () => {
    const result = parseHighlightArgs(["--rule", "method:POST:blue:write-ops"]);
    expect(result.rules[0].label).toBe("write-ops");
  });

  it("parses multiple rules", () => {
    const result = parseHighlightArgs([
      "--rule", "status:200:green",
      "--rule", "method:DELETE:red:danger",
    ]);
    expect(result.rules).toHaveLength(2);
    expect(result.rules[1].field).toBe("method");
  });

  it("parses --log option", () => {
    const result = parseHighlightArgs(["--log", "my.log", "--rule", "path:/api:cyan"]);
    expect(result.logFile).toBe("my.log");
  });

  it("ignores rules with invalid field", () => {
    const result = parseHighlightArgs(["--rule", "body:foo:red"]);
    expect(result.rules).toHaveLength(0);
  });

  it("ignores rules with invalid color", () => {
    const result = parseHighlightArgs(["--rule", "status:404:purple"]);
    expect(result.rules).toHaveLength(0);
  });

  it("ignores rules with missing parts", () => {
    const result = parseHighlightArgs(["--rule", "status:404"]);
    expect(result.rules).toHaveLength(0);
  });

  it("returns empty rules and no log when no args given", () => {
    const result = parseHighlightArgs([]);
    expect(result.rules).toHaveLength(0);
    expect(result.logFile).toBeUndefined();
  });

  it("handles path field with colon in label", () => {
    const result = parseHighlightArgs(["--rule", "path:/api/v2:magenta:api-v2"]);
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].value).toBe("/api/v2");
    expect(result.rules[0].label).toBe("api-v2");
  });
});
