import { describe, it, expect } from "bun:test";
import { parseSampleArgs, printSampleUsage } from "./sample-cli";

describe("parseSampleArgs", () => {
  it("returns defaults when no args given", () => {
    const args = parseSampleArgs([]);
    expect(args.logFile).toBe("requests.log");
    expect(args.count).toBe(10);
    expect(args.method).toBeUndefined();
    expect(args.seed).toBeUndefined();
  });

  it("parses --file", () => {
    const args = parseSampleArgs(["--file", "my.log"]);
    expect(args.logFile).toBe("my.log");
  });

  it("parses -f shorthand", () => {
    const args = parseSampleArgs(["-f", "short.log"]);
    expect(args.logFile).toBe("short.log");
  });

  it("parses --count", () => {
    const args = parseSampleArgs(["--count", "25"]);
    expect(args.count).toBe(25);
  });

  it("parses -n shorthand", () => {
    const args = parseSampleArgs(["-n", "7"]);
    expect(args.count).toBe(7);
  });

  it("parses --method", () => {
    const args = parseSampleArgs(["--method", "POST"]);
    expect(args.method).toBe("POST");
  });

  it("parses --seed", () => {
    const args = parseSampleArgs(["--seed", "123"]);
    expect(args.seed).toBe(123);
  });

  it("parses combined flags", () => {
    const args = parseSampleArgs([
      "-f", "prod.log",
      "-n", "50",
      "--method", "GET",
      "--seed", "42",
    ]);
    expect(args.logFile).toBe("prod.log");
    expect(args.count).toBe(50);
    expect(args.method).toBe("GET");
    expect(args.seed).toBe(42);
  });
});

describe("printSampleUsage", () => {
  it("runs without throwing", () => {
    expect(() => printSampleUsage()).not.toThrow();
  });
});
