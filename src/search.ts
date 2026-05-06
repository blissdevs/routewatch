/**
 * search.ts — Search log entries by keyword across URL, headers, and body.
 */

import type { LogEntry } from "./filter";

export interface SearchOptions {
  query: string;
  caseSensitive?: boolean;
  fields?: Array<"url" | "body" | "requestHeaders" | "responseHeaders">;
}

const DEFAULT_FIELDS: SearchOptions["fields"] = [
  "url",
  "body",
  "requestHeaders",
  "responseHeaders",
];

function headersToString(headers?: Record<string, string>): string {
  if (!headers) return "";
  return Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function entryMatchesSearch(entry: LogEntry, opts: SearchOptions): boolean {
  const fields = opts.fields ?? DEFAULT_FIELDS;
  const needle = opts.caseSensitive ? opts.query : opts.query.toLowerCase();

  const normalize = (s: string) =>
    opts.caseSensitive ? s : s.toLowerCase();

  for (const field of fields) {
    let haystack = "";
    if (field === "url") haystack = entry.url;
    else if (field === "body") haystack = entry.body ?? "";
    else if (field === "requestHeaders") haystack = headersToString(entry.requestHeaders);
    else if (field === "responseHeaders") haystack = headersToString(entry.responseHeaders);

    if (normalize(haystack).includes(needle)) return true;
  }

  return false;
}

export function searchEntries(
  entries: LogEntry[],
  opts: SearchOptions
): LogEntry[] {
  if (!opts.query.trim()) return entries;
  return entries.filter((e) => entryMatchesSearch(e, opts));
}

export function highlight(text: string, query: string, caseSensitive = false): string {
  const flags = caseSensitive ? "g" : "gi";
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, flags), (match) => `\x1b[33m${match}\x1b[0m`);
}
