import type { LogEntry } from "./logger";

export type HighlightRule = {
  field: "method" | "status" | "path" | "tag";
  value: string;
  color: string;
  label?: string;
};

export type HighlightResult = {
  entry: LogEntry;
  rule: HighlightRule;
  label: string;
};

const ANSI: Record<string, string> = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

export function applyColor(text: string, color: string): string {
  const code = ANSI[color] ?? "";
  return `${code}${text}${ANSI.reset}`;
}

export function matchesRule(entry: LogEntry, rule: HighlightRule): boolean {
  switch (rule.field) {
    case "method":
      return entry.request.method.toUpperCase() === rule.value.toUpperCase();
    case "status":
      return String(entry.response?.status) === String(rule.value);
    case "path":
      return entry.request.path.includes(rule.value);
    case "tag":
      return Array.isArray((entry as any).tags) && (entry as any).tags.includes(rule.value);
    default:
      return false;
  }
}

export function highlightEntries(
  entries: LogEntry[],
  rules: HighlightRule[]
): HighlightResult[] {
  const results: HighlightResult[] = [];
  for (const entry of entries) {
    for (const rule of rules) {
      if (matchesRule(entry, rule)) {
        results.push({
          entry,
          rule,
          label: rule.label ?? `${rule.field}=${rule.value}`,
        });
        break;
      }
    }
  }
  return results;
}

export function formatHighlight(result: HighlightResult): string {
  const { entry, rule, label } = result;
  const method = applyColor(entry.request.method.padEnd(6), rule.color);
  const status = entry.response?.status ?? "---";
  const path = entry.request.path;
  const tag = applyColor(`[${label}]`, rule.color);
  return `${tag} ${method} ${status} ${path}`;
}

export function printHighlights(results: HighlightResult[]): void {
  if (results.length === 0) {
    console.log("No matching entries.");
    return;
  }
  for (const result of results) {
    console.log(formatHighlight(result));
  }
}
