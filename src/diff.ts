/**
 * diff.ts
 * Utilities for comparing two log entries and displaying differences.
 * Useful for spotting changes between replayed and original responses.
 */

import type { LogEntry } from "./logger";

export interface DiffResult {
  field: string;
  original: string;
  replayed: string;
  changed: boolean;
}

export interface EntryDiff {
  hasDifferences: boolean;
  results: DiffResult[];
}

/**
 * Normalizes a value to a comparable string.
 */
function normalize(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

/**
 * Compares two header objects and returns per-key diff results.
 */
function diffHeaders(
  original: Record<string, string>,
  replayed: Record<string, string>
): DiffResult[] {
  const keys = new Set([
    ...Object.keys(original),
    ...Object.keys(replayed),
  ]);

  const results: DiffResult[] = [];
  for (const key of keys) {
    const a = original[key] ?? "";
    const b = replayed[key] ?? "";
    results.push({
      field: `header:${key}`,
      original: a,
      replayed: b,
      changed: a !== b,
    });
  }
  return results;
}

/**
 * Compares two log entries field by field.
 * Returns a structured diff with a top-level flag indicating any differences.
 */
export function diffEntries(original: LogEntry, replayed: LogEntry): EntryDiff {
  const scalarFields: Array<keyof LogEntry> = [
    "method",
    "url",
    "status",
    "body",
    "responseBody",
  ];

  const results: DiffResult[] = [];

  for (const field of scalarFields) {
    const a = normalize(original[field]);
    const b = normalize(replayed[field]);
    results.push({ field, original: a, replayed: b, changed: a !== b });
  }

  // Diff response headers if present
  const origHeaders = (original as any).responseHeaders ?? {};
  const repHeaders = (replayed as any).responseHeaders ?? {};
  results.push(...diffHeaders(origHeaders, repHeaders));

  const hasDifferences = results.some((r) => r.changed);
  return { hasDifferences, results };
}

/**
 * Formats a diff result for human-readable CLI output.
 * Changed fields are prefixed with '-' (original) and '+' (replayed).
 */
export function formatDiff(diff: EntryDiff): string {
  if (!diff.hasDifferences) {
    return "No differences found.\n";
  }

  const lines: string[] = [];
  for (const result of diff.results) {
    if (!result.changed) continue;
    lines.push(`  [${result.field}]`);
    lines.push(`  - ${result.original || "(empty)"}`);
    lines.push(`  + ${result.replayed || "(empty)"}`);
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Prints a diff between two entries to stdout.
 */
export function printDiff(original: LogEntry, replayed: LogEntry): void {
  const diff = diffEntries(original, replayed);
  console.log(formatDiff(diff));
}
