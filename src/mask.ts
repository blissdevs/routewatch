/**
 * mask.ts — Utilities for masking sensitive values in log entries.
 *
 * Unlike redact (which removes fields entirely), masking replaces
 * part of the value with asterisks, preserving structure for debugging.
 */

import type { LogEntry } from "./logger";

export interface MaskOptions {
  /** Number of characters to reveal at the start (default: 4) */
  prefixLength?: number;
  /** Number of characters to reveal at the end (default: 0) */
  suffixLength?: number;
  /** Character to use for masking (default: '*') */
  maskChar?: string;
}

const DEFAULT_OPTIONS: Required<MaskOptions> = {
  prefixLength: 4,
  suffixLength: 0,
  maskChar: "*",
};

/**
 * Masks a string value, revealing only a prefix and/or suffix.
 * e.g. maskValue("supersecret", { prefixLength: 2 }) => "su*********"
 */
export function maskValue(value: string, options: MaskOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { prefixLength, suffixLength, maskChar } = opts;

  if (value.length <= prefixLength + suffixLength) {
    return maskChar.repeat(value.length);
  }

  const prefix = value.slice(0, prefixLength);
  const suffix = suffixLength > 0 ? value.slice(-suffixLength) : "";
  const maskedLength = value.length - prefixLength - suffixLength;
  const masked = maskChar.repeat(maskedLength);

  return `${prefix}${masked}${suffix}`;
}

/**
 * Masks specific header values in a headers record.
 * Header name matching is case-insensitive.
 */
export function maskHeaders(
  headers: Record<string, string>,
  headerNames: string[],
  options: MaskOptions = {}
): Record<string, string> {
  const lower = headerNames.map((h) => h.toLowerCase());
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (lower.includes(key.toLowerCase())) {
      result[key] = maskValue(value, options);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Masks specific fields within a JSON body string.
 * Non-JSON bodies are returned unchanged.
 */
export function maskBodyFields(
  body: string,
  fieldNames: string[],
  options: MaskOptions = {}
): string {
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed !== "object" || parsed === null) return body;

    const masked = { ...parsed };
    for (const field of fieldNames) {
      if (typeof masked[field] === "string") {
        masked[field] = maskValue(masked[field], options);
      }
    }

    return JSON.stringify(masked);
  } catch {
    return body;
  }
}

export interface MaskConfig {
  headers?: string[];
  bodyFields?: string[];
  options?: MaskOptions;
}

/**
 * Applies masking to a log entry's request and response headers and body.
 */
export function maskEntry(entry: LogEntry, config: MaskConfig): LogEntry {
  const { headers = [], bodyFields = [], options = {} } = config;

  return {
    ...entry,
    request: {
      ...entry.request,
      headers: maskHeaders(entry.request.headers ?? {}, headers, options),
      body:
        entry.request.body && bodyFields.length > 0
          ? maskBodyFields(entry.request.body, bodyFields, options)
          : entry.request.body,
    },
    response: {
      ...entry.response,
      headers: maskHeaders(entry.response.headers ?? {}, headers, options),
      body:
        entry.response.body && bodyFields.length > 0
          ? maskBodyFields(entry.response.body, bodyFields, options)
          : entry.response.body,
    },
  };
}

/**
 * Applies masking to an array of log entries.
 */
export function maskEntries(entries: LogEntry[], config: MaskConfig): LogEntry[] {
  return entries.map((entry) => maskEntry(entry, config));
}
