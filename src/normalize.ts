import { LogEntry } from "./logger";

export interface NormalizeOptions {
  lowercaseHeaders?: boolean;
  sortHeaders?: boolean;
  trimBody?: boolean;
  normalizeUrl?: boolean;
}

const DEFAULT_OPTIONS: NormalizeOptions = {
  lowercaseHeaders: true,
  sortHeaders: true,
  trimBody: true,
  normalizeUrl: true,
};

export function normalizeHeaders(
  headers: Record<string, string>,
  opts: NormalizeOptions = DEFAULT_OPTIONS
): Record<string, string> {
  let result: Record<string, string> = { ...headers };
  if (opts.lowercaseHeaders) {
    result = Object.fromEntries(
      Object.entries(result).map(([k, v]) => [k.toLowerCase(), v])
    );
  }
  if (opts.sortHeaders) {
    result = Object.fromEntries(
      Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
    );
  }
  return result;
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.sort();
    return parsed.toString();
  } catch {
    return url;
  }
}

export function normalizeBody(body: string | undefined, trim: boolean): string | undefined {
  if (body === undefined) return undefined;
  const trimmed = trim ? body.trim() : body;
  try {
    return JSON.stringify(JSON.parse(trimmed));
  } catch {
    return trimmed;
  }
}

export function normalizeEntry(
  entry: LogEntry,
  opts: NormalizeOptions = DEFAULT_OPTIONS
): LogEntry {
  return {
    ...entry,
    request: {
      ...entry.request,
      url: opts.normalizeUrl ? normalizeUrl(entry.request.url) : entry.request.url,
      headers: normalizeHeaders(entry.request.headers ?? {}, opts),
      body: normalizeBody(entry.request.body, opts.trimBody ?? true),
    },
    response: entry.response
      ? {
          ...entry.response,
          headers: normalizeHeaders(entry.response.headers ?? {}, opts),
          body: normalizeBody(entry.response.body, opts.trimBody ?? true),
        }
      : entry.response,
  };
}

export function normalizeEntries(
  entries: LogEntry[],
  opts: NormalizeOptions = DEFAULT_OPTIONS
): LogEntry[] {
  return entries.map((e) => normalizeEntry(e, opts));
}
