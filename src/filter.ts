/**
 * filter.ts — Filter log entries by method, status, path pattern, or time range.
 */

export interface FilterOptions {
  method?: string;
  statusMin?: number;
  statusMax?: number;
  pathPattern?: string | RegExp;
  since?: Date;
  until?: Date;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  body?: string;
}

export function matchesFilter(entry: LogEntry, opts: FilterOptions): boolean {
  if (opts.method && entry.method.toUpperCase() !== opts.method.toUpperCase()) {
    return false;
  }

  if (opts.statusMin !== undefined && entry.status < opts.statusMin) {
    return false;
  }

  if (opts.statusMax !== undefined && entry.status > opts.statusMax) {
    return false;
  }

  if (opts.pathPattern) {
    const url = new URL(entry.url, "http://localhost");
    const path = url.pathname;
    if (typeof opts.pathPattern === "string") {
      if (!path.includes(opts.pathPattern)) return false;
    } else {
      if (!opts.pathPattern.test(path)) return false;
    }
  }

  const ts = new Date(entry.timestamp);
  if (opts.since && ts < opts.since) return false;
  if (opts.until && ts > opts.until) return false;

  return true;
}

export function filterEntries(
  entries: LogEntry[],
  opts: FilterOptions
): LogEntry[] {
  return entries.filter((e) => matchesFilter(e, opts));
}

export function parseFilterArgs(args: Record<string, string | undefined>): FilterOptions {
  const opts: FilterOptions = {};

  if (args.method) opts.method = args.method;
  if (args.status) {
    const [min, max] = args.status.split("-").map(Number);
    opts.statusMin = min;
    opts.statusMax = isNaN(max) ? min : max;
  }
  if (args.path) {
    opts.pathPattern = args.path.startsWith("/")
      ? new RegExp(args.path.slice(1, args.path.lastIndexOf("/")), args.path.slice(args.path.lastIndexOf("/") + 1))
      : args.path;
  }
  if (args.since) opts.since = new Date(args.since);
  if (args.until) opts.until = new Date(args.until);

  return opts;
}
