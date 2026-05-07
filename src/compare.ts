import { LogEntry } from "./logger";

export interface CompareResult {
  onlyInA: LogEntry[];
  onlyInB: LogEntry[];
  matched: Array<{ a: LogEntry; b: LogEntry; statusMatch: boolean; bodyMatch: boolean }>;
}

export function compareByPath(a: LogEntry[], b: LogEntry[]): CompareResult {
  const result: CompareResult = { onlyInA: [], onlyInB: [], matched: [] };

  const bMap = new Map<string, LogEntry[]>();
  for (const entry of b) {
    const key = `${entry.method}:${entry.url}`;
    if (!bMap.has(key)) bMap.set(key, []);
    bMap.get(key)!.push(entry);
  }

  const usedB = new Set<LogEntry>();

  for (const entryA of a) {
    const key = `${entryA.method}:${entryA.url}`;
    const candidates = bMap.get(key) ?? [];
    const match = candidates.find((e) => !usedB.has(e));

    if (match) {
      usedB.add(match);
      result.matched.push({
        a: entryA,
        b: match,
        statusMatch: entryA.status === match.status,
        bodyMatch: JSON.stringify(entryA.responseBody) === JSON.stringify(match.responseBody),
      });
    } else {
      result.onlyInA.push(entryA);
    }
  }

  for (const entryB of b) {
    if (!usedB.has(entryB)) {
      result.onlyInB.push(entryB);
    }
  }

  return result;
}

export function formatCompare(result: CompareResult): string {
  const lines: string[] = [];

  lines.push(`Matched: ${result.matched.length}`);
  for (const m of result.matched) {
    const statusIcon = m.statusMatch ? "✓" : "✗";
    const bodyIcon = m.bodyMatch ? "✓" : "✗";
    lines.push(`  [status:${statusIcon} body:${bodyIcon}] ${m.a.method} ${m.a.url} → ${m.a.status} vs ${m.b.status}`);
  }

  if (result.onlyInA.length > 0) {
    lines.push(`Only in A (${result.onlyInA.length}):`);
    for (const e of result.onlyInA) lines.push(`  ${e.method} ${e.url}`);
  }

  if (result.onlyInB.length > 0) {
    lines.push(`Only in B (${result.onlyInB.length}):`);
    for (const e of result.onlyInB) lines.push(`  ${e.method} ${e.url}`);
  }

  return lines.join("\n");
}

export function printCompare(result: CompareResult): void {
  console.log(formatCompare(result));
}
