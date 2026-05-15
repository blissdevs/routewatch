/**
 * indent.ts — Pretty-print / indent JSON and body payloads in log entries
 */

import type { LogEntry } from "./logger";

export interface IndentOptions {
  spaces?: number;
  fallbackRaw?: boolean;
}

const DEFAULT_SPACES = 2;

export function indentJson(raw: string, spaces = DEFAULT_SPACES): string {
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, spaces);
  } catch {
    return raw;
  }
}

export function isJsonContentType(contentType: string | undefined): boolean {
  if (!contentType) return false;
  return contentType.includes("application/json");
}

export function indentEntryBody(
  body: string | undefined,
  contentType: string | undefined,
  options: IndentOptions = {}
): string | undefined {
  if (!body) return body;
  const { spaces = DEFAULT_SPACES, fallbackRaw = true } = options;

  if (isJsonContentType(contentType)) {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, spaces);
    } catch {
      return fallbackRaw ? body : undefined;
    }
  }

  return body;
}

export function indentEntry(
  entry: LogEntry,
  options: IndentOptions = {}
): LogEntry {
  const reqContentType = entry.request.headers?.["content-type"];
  const resContentType = entry.response?.headers?.["content-type"];

  return {
    ...entry,
    request: {
      ...entry.request,
      body: indentEntryBody(entry.request.body, reqContentType, options),
    },
    response: entry.response
      ? {
          ...entry.response,
          body: indentEntryBody(entry.response.body, resContentType, options),
        }
      : entry.response,
  };
}

export function indentEntries(
  entries: LogEntry[],
  options: IndentOptions = {}
): LogEntry[] {
  return entries.map((e) => indentEntry(e, options));
}
