import { LogEntry } from "./logger";

export type TransformFn = (entry: LogEntry) => LogEntry;

export interface TransformRule {
  name: string;
  transform: TransformFn;
}

export function applyTransform(entry: LogEntry, rule: TransformRule): LogEntry {
  return rule.transform(entry);
}

export function applyTransforms(entry: LogEntry, rules: TransformRule[]): LogEntry {
  return rules.reduce((e, rule) => applyTransform(e, rule), entry);
}

export function renameHeader(from: string, to: string): TransformRule {
  return {
    name: `rename-header:${from}->${to}`,
    transform: (entry) => {
      const headers = { ...entry.request.headers };
      const val = headers[from] ?? headers[from.toLowerCase()];
      if (val !== undefined) {
        delete headers[from];
        delete headers[from.toLowerCase()];
        headers[to] = val;
      }
      return { ...entry, request: { ...entry.request, headers } };
    },
  };
}

export function setHeader(name: string, value: string): TransformRule {
  return {
    name: `set-header:${name}`,
    transform: (entry) => ({
      ...entry,
      request: {
        ...entry.request,
        headers: { ...entry.request.headers, [name]: value },
      },
    }),
  };
}

export function rewriteUrl(pattern: RegExp, replacement: string): TransformRule {
  return {
    name: `rewrite-url:${pattern}`,
    transform: (entry) => ({
      ...entry,
      request: {
        ...entry.request,
        url: entry.request.url.replace(pattern, replacement),
      },
    }),
  };
}

export function formatTransformSummary(rules: TransformRule[]): string {
  if (rules.length === 0) return "No transforms applied.";
  return `Transforms (${rules.length}):\n` + rules.map((r) => `  - ${r.name}`).join("\n");
}

export function printTransformSummary(rules: TransformRule[]): void {
  console.log(formatTransformSummary(rules));
}
