import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  shouldArchive,
  partitionEntries,
  archiveEntries,
} from "./archive";
import { LogEntry } from "./logger";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "routewatch-archive-"));
}

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "abc123",
    timestamp: new Date().toISOString(),
    method: "GET",
    url: "http://localhost/api/test",
    requestHeaders: {},
    requestBody: "",
    status: 200,
    responseHeaders: {},
    responseBody: "",
    durationMs: 42,
    ...overrides,
  };
}

function makeOldEntry(ageMs: number): LogEntry {
  return makeEntry({
    timestamp: new Date(Date.now() - ageMs).toISOString(),
  });
}

describe("shouldArchive", () => {
  it("returns true when entry is older than threshold", () => {
    const entry = makeOldEntry(10_000);
    expect(shouldArchive(entry, { olderThanMs: 5_000 })).toBe(true);
  });

  it("returns false when entry is newer than threshold", () => {
    const entry = makeOldEntry(1_000);
    expect(shouldArchive(entry, { olderThanMs: 5_000 })).toBe(false);
  });

  it("returns false when no olderThanMs is specified", () => {
    const entry = makeOldEntry(100_000);
    expect(shouldArchive(entry, {})).toBe(false);
  });
});

describe("partitionEntries", () => {
  it("splits by age", () => {
    const old = makeOldEntry(20_000);
    const recent = makeOldEntry(1_000);
    const { toArchive, toKeep } = partitionEntries([old, recent], {
      olderThanMs: 10_000,
    });
    expect(toArchive).toHaveLength(1);
    expect(toKeep).toHaveLength(1);
    expect(toArchive[0].timestamp).toBe(old.timestamp);
  });

  it("trims oldest entries when maxEntries exceeded", () => {
    const entries = [
      makeOldEntry(5_000),
      makeOldEntry(3_000),
      makeOldEntry(1_000),
    ];
    const { toArchive, toKeep } = partitionEntries(entries, { maxEntries: 2 });
    expect(toArchive).toHaveLength(1);
    expect(toKeep).toHaveLength(2);
  });

  it("keeps all when within maxEntries", () => {
    const entries = [makeEntry(), makeEntry()];
    const { toArchive, toKeep } = partitionEntries(entries, { maxEntries: 5 });
    expect(toArchive).toHaveLength(0);
    expect(toKeep).toHaveLength(2);
  });
});

describe("archiveEntries", () => {
  it("writes old entries to archive file and removes from log", () => {
    const dir = makeTempDir();
    const logPath = path.join(dir, "log.ndjson");
    const archiveDir = path.join(dir, "archives");

    const old = makeOldEntry(30_000);
    const recent = makeOldEntry(500);
    fs.writeFileSync(
      logPath,
      [JSON.stringify(old), JSON.stringify(recent)].join("\n") + "\n"
    );

    const result = archiveEntries(logPath, archiveDir, { olderThanMs: 10_000 });

    expect(result.archived).toBe(1);
    expect(result.remaining).toBe(1);
    expect(fs.existsSync(result.archivePath)).toBe(true);

    const archivedLines = fs
      .readFileSync(result.archivePath, "utf-8")
      .split("\n")
      .filter(Boolean);
    expect(archivedLines).toHaveLength(1);
    expect(JSON.parse(archivedLines[0]).timestamp).toBe(old.timestamp);

    const remainingLines = fs
      .readFileSync(logPath, "utf-8")
      .split("\n")
      .filter(Boolean);
    expect(remainingLines).toHaveLength(1);
  });

  it("returns archived=0 when nothing qualifies", () => {
    const dir = makeTempDir();
    const logPath = path.join(dir, "log.ndjson");
    const archiveDir = path.join(dir, "archives");
    const entry = makeOldEntry(100);
    fs.writeFileSync(logPath, JSON.stringify(entry) + "\n");

    const result = archiveEntries(logPath, archiveDir, { olderThanMs: 60_000 });
    expect(result.archived).toBe(0);
    expect(result.archivePath).toBe("");
  });
});
