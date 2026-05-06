import * as fs from "fs";
import * as path from "path";
import { LogEntry } from "./logger";

export interface Snapshot {
  id: string;
  label: string;
  createdAt: string;
  entries: LogEntry[];
}

export function createSnapshot(label: string, entries: LogEntry[]): Snapshot {
  return {
    id: generateId(),
    label,
    createdAt: new Date().toISOString(),
    entries,
  };
}

export function saveSnapshot(dir: string, snapshot: Snapshot): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filename = `${snapshot.id}.json`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2), "utf-8");
  return filepath;
}

export function loadSnapshot(filepath: string): Snapshot {
  const raw = fs.readFileSync(filepath, "utf-8");
  return JSON.parse(raw) as Snapshot;
}

export function listSnapshots(dir: string): Snapshot[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => loadSnapshot(path.join(dir, f)))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function deleteSnapshot(dir: string, id: string): boolean {
  const filepath = path.join(dir, `${id}.json`);
  if (!fs.existsSync(filepath)) return false;
  fs.unlinkSync(filepath);
  return true;
}

function generateId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
