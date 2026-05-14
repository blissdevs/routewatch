import { describe, it, expect } from "bun:test";
import { parseTransformArgs } from "./transform-cli";
import type { LogEntry } from "./logger";
import { applyTransforms } from "./transform";

function makeEntry(): LogEntry {
  return {
    id: "e1",
    timestamp: new Date().toISOString(),
    request: {
      method: "POST",
      url: "http://localhost/api/items",
      headers: { authorization: "Bearer abc" },
      body: "",
    },
    response: { status: 200, headers: {}, body: "", duration: 10 },
  };
}

describe("parseTransformArgs", () => {
  it("parses --set-header", () => {
    const { rules, errors } = parseTransformArgs(["--set-header", "x-env:prod"]);
    expect(errors).toHaveLength(0);
    expect(rules).toHaveLength(1);
    const result = applyTransforms(makeEntry(), rules);
    expect(result.request.headers["x-env"]).toBe("prod");
  });

  it("parses --rename-header", () => {
    const { rules, errors } = parseTransformArgs(["--rename-header", "authorization->x-auth"]);
    expect(errors).toHaveLength(0);
    const result = applyTransforms(makeEntry(), rules);
    expect(result.request.headers["x-auth"]).toBe("Bearer abc");
    expect(result.request.headers["authorization"]).toBeUndefined();
  });

  it("parses --rewrite-url", () => {
    const { rules, errors } = parseTransformArgs(["--rewrite-url", "/api->/v2"]);
    expect(errors).toHaveLength(0);
    const result = applyTransforms(makeEntry(), rules);
    expect(result.request.url).toContain("/v2/items");
  });

  it("records error for invalid --set-header", () => {
    const { errors } = parseTransformArgs(["--set-header", "badvalue"]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("--set-header");
  });

  it("records error for invalid --rename-header", () => {
    const { errors } = parseTransformArgs(["--rename-header", "nope"]);
    expect(errors).toHaveLength(1);
  });

  it("records error for invalid --rewrite-url", () => {
    const { errors } = parseTransformArgs(["--rewrite-url", "nope"]);
    expect(errors).toHaveLength(1);
  });

  it("parses multiple rules", () => {
    const { rules, errors } = parseTransformArgs([
      "--set-header", "x-a:1",
      "--set-header", "x-b:2",
    ]);
    expect(errors).toHaveLength(0);
    expect(rules).toHaveLength(2);
  });
});
