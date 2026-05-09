import { describe, it, expect, beforeEach } from "bun:test";
import {
  getPreset,
  parseThrottleArgs,
  computeTransferDelay,
  applyThrottle,
  formatThrottle,
} from "./throttle";

describe("getPreset", () => {
  it("returns correct options for slow3g", () => {
    const p = getPreset("slow3g");
    expect(p.delayMs).toBe(400);
    expect(p.bytesPerSecond).toBe(50_000);
  });

  it("returns zero delay for none", () => {
    const p = getPreset("none");
    expect(p.delayMs).toBe(0);
    expect(p.bytesPerSecond).toBeUndefined();
  });
});

describe("parseThrottleArgs", () => {
  it("parses --throttle preset", () => {
    const opts = parseThrottleArgs(["--throttle", "fast3g"]);
    expect(opts.delayMs).toBe(100);
    expect(opts.bytesPerSecond).toBe(180_000);
  });

  it("parses --delay value", () => {
    const opts = parseThrottleArgs(["--delay", "250"]);
    expect(opts.delayMs).toBe(250);
    expect(opts.bytesPerSecond).toBeUndefined();
  });

  it("returns zero delay when no flags provided", () => {
    const opts = parseThrottleArgs([]);
    expect(opts.delayMs).toBe(0);
  });

  it("throws on unknown preset", () => {
    expect(() => parseThrottleArgs(["--throttle", "dialup"])).toThrow(
      /Unknown throttle preset/
    );
  });

  it("throws on invalid delay", () => {
    expect(() => parseThrottleArgs(["--delay", "abc"])).toThrow(
      /non-negative integer/
    );
  });
});

describe("computeTransferDelay", () => {
  it("calculates delay based on bytes and bandwidth", () => {
    // 100KB at 50KB/s => 2000ms
    const ms = computeTransferDelay(100_000, { delayMs: 0, bytesPerSecond: 50_000 });
    expect(ms).toBe(2000);
  });

  it("returns 0 when no bytesPerSecond set", () => {
    expect(computeTransferDelay(99999, { delayMs: 50 })).toBe(0);
  });
});

describe("applyThrottle", () => {
  it("resolves immediately when delayMs is 0 and no bandwidth", async () => {
    const start = Date.now();
    await applyThrottle(0, { delayMs: 0 });
    expect(Date.now() - start).toBeLessThan(50);
  });

  it("waits at least delayMs milliseconds", async () => {
    const start = Date.now();
    await applyThrottle(0, { delayMs: 80 });
    expect(Date.now() - start).toBeGreaterThanOrEqual(75);
  });
});

describe("formatThrottle", () => {
  it("formats delay only", () => {
    expect(formatThrottle({ delayMs: 100 })).toBe("delay=100ms");
  });

  it("formats delay and bandwidth", () => {
    expect(formatThrottle({ delayMs: 400, bytesPerSecond: 50_000 })).toBe(
      "delay=400ms, bandwidth=50KB/s"
    );
  });
});
