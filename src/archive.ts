import * as fs from "fs";
import * as path from "path";
import { LogEntry } from "./logger";

export interface ArchiveOptions {
  olderThanMs?: number;
  maxEntries?: number;
}

export interface ArchiveResult {
  archived: number;
  remaining: number;
  archivePath: string;
}

export function shouldArchive(entry: LogEntry, opts: ArchiveOptions): boolean {
  if (opts.olderThanMs !== undefined) {
    const age = Date.now() - new Date(entry.timestamp).getTime();
    if (age >= opts.olderThanMs) return true;
  }
  return false;
}

export function partitionEntries(
  entries: LogEntry[],
  opts: ArchiveOptions
): { toArchive: LogEntry[]; toKeep: LogEntry[] } {
  if (opts.maxEntries !== undefined && entries.length > opts.maxEntries) {
    const sorted = [...entries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const excess = entries.length - opts.maxEntries;
    return { toArchive: sorted.slice(0, excess), toKeep: sorted.slice(excess) };
  }

  const toArchive: LogEntry[] = [];
  const toKeep: LogEntry[] = [];
  for (const entry of entries) {
    if (shouldArchive(entry, opts)) {
      toArchive.push(entry);
    } else {
      toKeep.push(entry);
    }
  }
  return { toArchive, toKeep };
}

export function archiveEntries(
  logPath: string,
  archiveDir: string,
  opts: ArchiveOptions
): ArchiveResult {
  const raw = fs.existsSync(logPath)
    ? fs.readFileSync(logPath, "utf-8")
    : "";
  const entries: LogEntry[] = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const { toArchive, toKeep } = partitionEntries(entries, opts);

  if (toArchive.length === 0) {
    return { archived: 0, remaining: toKeep.length, archivePath: "" };
  }

  fs.mkdirSync(archiveDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archivePath = path.join(archiveDir, `archive-${timestamp}.ndjson`);

  const archiveLines = toArchive.map((e) => JSON.stringify(e)).join("\n");
  fs.writeFileSync(archivePath, archiveLines + "\n", "utf-8");

  const keepLines = toKeep.map((e) => JSON.stringify(e)).join("\n");
  fs.writeFileSync(logPath, keepLines ? keepLines + "\n" : "", "utf-8");

  return { archived: toArchive.length, remaining: toKeep.length, archivePath };
}

export function printArchiveResult(result: ArchiveResult): void {
  if (result.archived === 0) {
    console.log("Nothing to archive.");
    return;
  }
  console.log(`Archived ${result.archived} entries → ${result.archivePath}`);
  console.log(`${result.remaining} entries remain in the active log.`);
}
