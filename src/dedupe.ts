import { LogEntry } from "./logger";

export interface DedupeOptions {
  ignoreHeaders?: string[];
  ignoreQuery?: boolean;
}

const DEFAULT_IGNORE_HEADERS = ["date", "x-request-id", "x-correlation-id"];

export function normalizeHeaders(
  headers: Record<string, string>,
  ignoreHeaders: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!ignoreHeaders.includes(key.toLowerCase())) {
      result[key.toLowerCase()] = value;
    }
  }
  return result;
}

export function entryFingerprint(
  entry: LogEntry,
  options: DedupeOptions = {}
): string {
  const ignoreHeaders = [
    ...DEFAULT_IGNORE_HEADERS,
    ...(options.ignoreHeaders ?? []).map((h) => h.toLowerCase()),
  ];

  let url = entry.request.url;
  if (options.ignoreQuery) {
    try {
      const parsed = new URL(url);
      parsed.search = "";
      url = parsed.toString();
    } catch {
      url = url.split("?")[0];
    }
  }

  const headers = normalizeHeaders(
    entry.request.headers ?? {},
    ignoreHeaders
  );

  return JSON.stringify({
    method: entry.request.method.toUpperCase(),
    url,
    headers,
    body: entry.request.body ?? "",
  });
}

export function dedupeEntries(
  entries: LogEntry[],
  options: DedupeOptions = {}
): LogEntry[] {
  const seen = new Set<string>();
  const result: LogEntry[] = [];

  for (const entry of entries) {
    const fp = entryFingerprint(entry, options);
    if (!seen.has(fp)) {
      seen.add(fp);
      result.push(entry);
    }
  }

  return result;
}

export function findDuplicates(
  entries: LogEntry[],
  options: DedupeOptions = {}
): Map<string, LogEntry[]> {
  const groups = new Map<string, LogEntry[]>();

  for (const entry of entries) {
    const fp = entryFingerprint(entry, options);
    if (!groups.has(fp)) {
      groups.set(fp, []);
    }
    groups.get(fp)!.push(entry);
  }

  const duplicates = new Map<string, LogEntry[]>();
  for (const [fp, group] of groups) {
    if (group.length > 1) {
      duplicates.set(fp, group);
    }
  }

  return duplicates;
}
