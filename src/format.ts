import type { LogEntry } from "./logger";

export type FormatStyle = "compact" | "pretty" | "table" | "json";

export interface FormatOptions {
  style: FormatStyle;
  includeHeaders?: boolean;
  includeBody?: boolean;
  colorize?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  "2": "\x1b[32m",
  "3": "\x1b[36m",
  "4": "\x1b[33m",
  "5": "\x1b[31m",
};

const RESET = "\x1b[0m";

function colorStatus(status: number, text: string, colorize: boolean): string {
  if (!colorize) return text;
  const key = String(status)[0];
  const color = STATUS_COLORS[key] ?? "";
  return `${color}${text}${RESET}`;
}

export function formatCompact(entry: LogEntry, opts: FormatOptions): string {
  const status = colorStatus(entry.status, String(entry.status), opts.colorize ?? false);
  const duration = entry.duration != null ? ` ${entry.duration}ms` : "";
  return `${entry.method} ${entry.url} → ${status}${duration}`;
}

export function formatPretty(entry: LogEntry, opts: FormatOptions): string {
  const lines: string[] = [];
  lines.push(`► ${entry.method} ${entry.url}`);
  lines.push(`  Status  : ${colorStatus(entry.status, String(entry.status), opts.colorize ?? false)}`);
  if (entry.duration != null) lines.push(`  Duration: ${entry.duration}ms`);
  if (entry.timestamp) lines.push(`  Time    : ${entry.timestamp}`);
  if (opts.includeHeaders && entry.requestHeaders) {
    lines.push("  Request Headers:");
    for (const [k, v] of Object.entries(entry.requestHeaders)) {
      lines.push(`    ${k}: ${v}`);
    }
  }
  if (opts.includeBody && entry.requestBody) {
    lines.push(`  Body: ${entry.requestBody}`);
  }
  return lines.join("\n");
}

export function formatTable(entries: LogEntry[], opts: FormatOptions): string {
  const header = "METHOD  STATUS  DURATION  URL";
  const sep = "-".repeat(60);
  const rows = entries.map((e) => {
    const method = e.method.padEnd(7);
    const status = colorStatus(e.status, String(e.status).padEnd(7), opts.colorize ?? false);
    const duration = (e.duration != null ? `${e.duration}ms` : "-").padEnd(9);
    return `${method} ${status} ${duration} ${e.url}`;
  });
  return [header, sep, ...rows].join("\n");
}

export function formatEntry(entry: LogEntry, opts: FormatOptions): string {
  switch (opts.style) {
    case "compact": return formatCompact(entry, opts);
    case "pretty":  return formatPretty(entry, opts);
    case "json":    return JSON.stringify(entry, null, 2);
    default:        return formatCompact(entry, opts);
  }
}

export function formatEntries(entries: LogEntry[], opts: FormatOptions): string {
  if (opts.style === "table") return formatTable(entries, opts);
  return entries.map((e) => formatEntry(e, opts)).join("\n");
}

export function printEntries(entries: LogEntry[], opts: FormatOptions): void {
  console.log(formatEntries(entries, opts));
}
