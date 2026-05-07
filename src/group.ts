import { LogEntry } from "./logger";

export type GroupByField = "method" | "status" | "host" | "path";

export interface GroupResult {
  key: string;
  entries: LogEntry[];
  count: number;
}

export function getGroupKey(entry: LogEntry, field: GroupByField): string {
  switch (field) {
    case "method":
      return entry.request.method.toUpperCase();
    case "status":
      return entry.response ? String(entry.response.status) : "no-response";
    case "host": {
      const url = new URL(entry.request.url);
      return url.hostname;
    }
    case "path": {
      const url = new URL(entry.request.url);
      return url.pathname;
    }
    default:
      return "unknown";
  }
}

export function groupEntries(
  entries: LogEntry[],
  field: GroupByField
): GroupResult[] {
  const map = new Map<string, LogEntry[]>();

  for (const entry of entries) {
    const key = getGroupKey(entry, field);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(entry);
  }

  return Array.from(map.entries())
    .map(([key, entries]) => ({ key, entries, count: entries.length }))
    .sort((a, b) => b.count - a.count);
}

export function formatGroup(result: GroupResult): string {
  return `[${result.key}] ${result.count} request${result.count !== 1 ? "s" : ""}`;
}

export function printGroups(results: GroupResult[]): void {
  if (results.length === 0) {
    console.log("No entries to group.");
    return;
  }
  for (const r of results) {
    console.log(formatGroup(r));
  }
}
