import { describe, it, expect } from "vitest";
import {
  createPipeline,
  addStep,
  runPipeline,
  parsePipelineArgs,
  formatPipelineResult,
} from "./pipeline";
import { LogEntry } from "./logger";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "test-id",
    timestamp: new Date().toISOString(),
    method: "GET",
    url: "http://localhost/api/test",
    requestHeaders: {},
    requestBody: "",
    status: 200,
    responseHeaders: {},
    responseBody: "",
    duration: 50,
    ...overrides,
  };
}

describe("createPipeline", () => {
  it("creates an empty pipeline", () => {
    const p = createPipeline();
    expect(p.steps).toHaveLength(0);
  });
});

describe("addStep", () => {
  it("adds a step without mutating original", () => {
    const p = createPipeline();
    const step = (e: LogEntry[]) => e;
    const p2 = addStep(p, step);
    expect(p.steps).toHaveLength(0);
    expect(p2.steps).toHaveLength(1);
  });
});

describe("runPipeline", () => {
  it("runs steps in order", () => {
    const entries = [makeEntry({ status: 200 }), makeEntry({ status: 404 })];
    let p = createPipeline();
    p = addStep(p, (e) => e.filter((x) => x.status === 200));
    const result = runPipeline(p, entries);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(200);
  });

  it("returns all entries for empty pipeline", () => {
    const entries = [makeEntry(), makeEntry()];
    const result = runPipeline(createPipeline(), entries);
    expect(result).toHaveLength(2);
  });
});

describe("parsePipelineArgs", () => {
  it("parses --limit", () => {
    const entries = [makeEntry(), makeEntry(), makeEntry()];
    const steps = parsePipelineArgs(["--limit", "2"]);
    const result = steps.reduce((acc, s) => s(acc), entries);
    expect(result).toHaveLength(2);
  });

  it("parses --skip", () => {
    const entries = [makeEntry(), makeEntry(), makeEntry()];
    const steps = parsePipelineArgs(["--skip", "1"]);
    const result = steps.reduce((acc, s) => s(acc), entries);
    expect(result).toHaveLength(2);
  });

  it("parses --status", () => {
    const entries = [makeEntry({ status: 200 }), makeEntry({ status: 500 })];
    const steps = parsePipelineArgs(["--status", "200"]);
    const result = steps.reduce((acc, s) => s(acc), entries);
    expect(result).toHaveLength(1);
  });

  it("parses --method", () => {
    const entries = [makeEntry({ method: "GET" }), makeEntry({ method: "POST" })];
    const steps = parsePipelineArgs(["--method", "POST"]);
    const result = steps.reduce((acc, s) => s(acc), entries);
    expect(result).toHaveLength(1);
    expect(result[0].method).toBe("POST");
  });

  it("chains multiple steps", () => {
    const entries = [
      makeEntry({ method: "GET", status: 200 }),
      makeEntry({ method: "GET", status: 500 }),
      makeEntry({ method: "POST", status: 200 }),
    ];
    const steps = parsePipelineArgs(["--method", "GET", "--status", "200"]);
    const result = steps.reduce((acc, s) => s(acc), entries);
    expect(result).toHaveLength(1);
  });
});

describe("formatPipelineResult", () => {
  it("formats entries as method/url/status lines", () => {
    const entries = [makeEntry({ method: "GET", url: "http://localhost/api", status: 200 })];
    const out = formatPipelineResult(entries);
    expect(out).toContain("[GET]");
    expect(out).toContain("http://localhost/api");
    expect(out).toContain("200");
  });

  it("returns empty string for no entries", () => {
    expect(formatPipelineResult([])).toBe("");
  });
});
