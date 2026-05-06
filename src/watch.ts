import * as fs from "fs";
import * as path from "path";
import { LogEntry, readAll } from "./logger";

export type WatchCallback = (newEntries: LogEntry[]) => void;

export interface Watcher {
  stop: () => void;
}

export function watchLog(
  logPath: string,
  callback: WatchCallback,
  intervalMs: number = 500
): Watcher {
  let lastSize = 0;

  try {
    const stat = fs.statSync(logPath);
    lastSize = stat.size;
  } catch {
    lastSize = 0;
  }

  const interval = setInterval(() => {
    let currentSize = 0;
    try {
      const stat = fs.statSync(logPath);
      currentSize = stat.size;
    } catch {
      return;
    }

    if (currentSize <= lastSize) return;

    const raw = fs.readFileSync(logPath, "utf-8");
    const lines = raw.trim().split("\n").filter(Boolean);
    const allEntries: LogEntry[] = [];

    for (const line of lines) {
      try {
        allEntries.push(JSON.parse(line));
      } catch {
        // skip malformed lines
      }
    }

    const prevLineCount = lastSize === 0 ? 0 : countLines(logPath, lastSize);
    const newEntries = allEntries.slice(prevLineCount);

    lastSize = currentSize;

    if (newEntries.length > 0) {
      callback(newEntries);
    }
  }, intervalMs);

  return {
    stop: () => clearInterval(interval),
  };
}

function countLines(logPath: string, byteOffset: number): number {
  const buf = Buffer.alloc(byteOffset);
  const fd = fs.openSync(logPath, "r");
  fs.readSync(fd, buf, 0, byteOffset, 0);
  fs.closeSync(fd);
  const text = buf.toString("utf-8");
  return text.split("\n").filter(Boolean).length;
}
