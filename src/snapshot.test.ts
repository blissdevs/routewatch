import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  deleteSnapshot,
  Snapshot,
} from "./snapshot";
import { LogEntry } from "./logger";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "snapshot-test-"));
}

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: "entry-1",
    timestamp: new Date().toISOString(),
    method: "GET",
    url: "http://localhost:3000/api/test",
    requestHeaders: {},
    requestBody: "",
    status: 200,
    responseHeaders: {},
    responseBody: '{"ok":true}',
    duration: 42,
    ...overrides,
  };
}

describe("createSnapshot", () => {
  it("creates a snapshot with label and entries", () => {
    const entries = [makeEntry()];
    const snap = createSnapshot("my-snap", entries);
    expect(snap.label).toBe("my-snap");
    expect(snap.entries).toHaveLength(1);
    expect(snap.id).toMatch(/^snap_/);
    expect(snap.createdAt).toBeTruthy();
  });

  it("creates a snapshot with an empty entries array", () => {
    const snap = createSnapshot("empty", []);
    expect(snap.entries).toHaveLength(0);
    expect(snap.label).toBe("empty");
  });
});

describe("saveSnapshot / loadSnapshot", () => {
  it("round-trips a snapshot to disk", () => {
    const dir = makeTempDir();
    const snap = createSnapshot("round-trip", [makeEntry()]);
    const filepath = saveSnapshot(dir, snap);
    const loaded = loadSnapshot(filepath);
    expect(loaded.id).toBe(snap.id);
    expect(loaded.label).toBe("round-trip");
    expect(loaded.entries).toHaveLength(1);
  });

  it("creates the directory if it does not exist", () => {
    const dir = path.join(makeTempDir(), "nested", "snapshots");
    const snap = createSnapshot("nested", []);
    saveSnapshot(dir, snap);
    expect(fs.existsSync(dir)).toBe(true);
  });

  it("preserves all entry fields after round-trip", () => {
    const dir = makeTempDir();
    const entry = makeEntry({ id: "e-42", status: 404, duration: 99 });
    const snap = createSnapshot("fields", [entry]);
    const filepath = saveSnapshot(dir, snap);
    const loaded = loadSnapshot(filepath);
    const loadedEntry = loaded.entries[0];
    expect(loadedEntry.id).toBe("e-42");
    expect(loadedEntry.status).toBe(404);
    expect(loadedEntry.duration).toBe(99);
  });
});

describe("listSnapshots", () => {
  it("returns empty array for missing directory", () => {
    expect(listSnapshots("/nonexistent/path")).toEqual([]);
  });

  it("lists all saved snapshots sorted by createdAt", () => {
    const dir = makeTempDir();
    const s1 = createSnapshot("first", [makeEntry()]);
    const s2 = createSnapshot("second", [makeEntry(), makeEntry()]);
    saveSnapshot(dir, s1);
    saveSnapshot(dir, s2);
    const list = listSnapshots(dir);
    expect(list).toHaveLength(2);
    expect(list[0].label).toBe("first");
  });
});

describe("deleteSnapshot", () => {
  it("deletes an existing snapshot and returns true", () => {
    const dir = makeTempDir();
    const snap = createSnapshot("to-delete", []);
    saveSnapshot(dir, snap);
    expect(deleteSnapshot(dir, snap.id)).toBe(true);
    expect(listSnapshots(dir)).toHaveLength(0);
  });

  it("returns false for a non-existent snapshot", () => {
    const dir = makeTempDir();
    expect(deleteSnapshot(dir, "snap_missing_abc")).toBe(false);
  });
});
