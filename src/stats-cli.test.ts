import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { parseStatsArgs, runStats } from "./stats-cli";
import { LogEntry } from "./logger";

async function makeTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "routewatch-stats-"));
}

function makeEntry(method: string, path: string, status: number, duration?: number): LogEntry {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    request: { method, path, headers: {}, body: "" },
    response: { status, headers: {}, body: "" },
    duration,
  };
}

let tmpDir: string;
let logFile: string;

beforeAll(async () => {
  tmpDir = await makeTempDir();
  logFile = join(tmpDir, "test.log");
  const entries = [
    makeEntry("GET", "/api/users", 200, 50),
    makeEntry("POST", "/api/users", 201, 80),
    makeEntry("GET", "/api/users/1", 404, 20),
    makeEntry("DELETE", "/api/users/1", 500, 30),
  ];
  const lines = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  await writeFile(logFile, lines, "utf-8");
});

afterAll(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("parseStatsArgs", () => {
  it("defaults to routewatch.log", () => {
    const args = parseStatsArgs(["node", "stats-cli.ts"]);
    expect(args.logFile).toBe("routewatch.log");
  });

  it("picks up custom log file", () => {
    const args = parseStatsArgs(["node", "stats-cli.ts", "custom.log"]);
    expect(args.logFile).toBe("custom.log");
  });

  it("detects --json flag", () => {
    const args = parseStatsArgs(["node", "stats-cli.ts", "--json"]);
    expect(args.json).toBe(true);
  });

  it("collects filter args", () => {
    const args = parseStatsArgs(["node", "stats-cli.ts", "--method=GET", "--status=200"]);
    expect(args.filterArgs).toContain("--method=GET");
    expect(args.filterArgs).toContain("--status=200");
  });
});

describe("runStats", () => {
  it("runs without error on valid log file", async () => {
    await expect(
      runStats({ logFile, filterArgs: [], json: false })
    ).resolves.toBeUndefined();
  });

  it("runs with --json flag", async () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => logs.push(msg);
    await runStats({ logFile, filterArgs: [], json: true });
    console.log = orig;
    const parsed = JSON.parse(logs.join(""));
    expect(parsed.totalRequests).toBe(4);
    expect(parsed.errorRate).toBe(0.5);
  });

  it("applies method filter", async () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => logs.push(msg);
    await runStats({ logFile, filterArgs: ["--method=GET"], json: true });
    console.log = orig;
    const parsed = JSON.parse(logs.join(""));
    expect(parsed.totalRequests).toBe(2);
    expect(parsed.methodCounts["GET"]).toBe(2);
  });

  it("throws on missing log file", async () => {
    await expect(
      runStats({ logFile: "/nonexistent/path.log", filterArgs: [], json: false })
    ).rejects.toThrow();
  });
});
