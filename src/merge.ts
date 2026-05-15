import { LogEntry } from "./logger";

export interface MergeOptions {
  dedupe?: boolean;
  sortBy?: "timestamp" | "method" | "url";
}

export interface MergeResult {
  entries: LogEntry[];
  totalSources: number;
  duplicatesRemoved: number;
}

export function mergeEntries(
  sources: LogEntry[][],
  options: MergeOptions = {}
): MergeResult {
  const { dedupe = false, sortBy = "timestamp" } = options;

  let merged: LogEntry[] = ([] as LogEntry[]).concat(...sources);
  let duplicatesRemoved = 0;

  if (dedupe) {
    const seen = new Set<string>();
    const deduped: LogEntry[] = [];
    for (const entry of merged) {
      const key = `${entry.method}:${entry.url}:${entry.status}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(entry);
      } else {
        duplicatesRemoved++;
      }
    }
    merged = deduped;
  }

  merged.sort((a, b) => {
    if (sortBy === "timestamp") {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    if (sortBy === "method") {
      return a.method.localeCompare(b.method);
    }
    if (sortBy === "url") {
      return a.url.localeCompare(b.url);
    }
    return 0;
  });

  return {
    entries: merged,
    totalSources: sources.length,
    duplicatesRemoved,
  };
}

export function formatMergeResult(result: MergeResult): string {
  const lines: string[] = [];
  lines.push(`Merged ${result.entries.length} entries from ${result.totalSources} source(s)`);
  if (result.duplicatesRemoved > 0) {
    lines.push(`Removed ${result.duplicatesRemoved} duplicate(s)`);
  }
  return lines.join("\n");
}

export function printMergeResult(result: MergeResult): void {
  console.log(formatMergeResult(result));
}
