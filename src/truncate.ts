/**
 * Utilities for truncating long request/response bodies in log output.
 */

export interface TruncateOptions {
  maxLength: number;
  indicator?: string;
}

const DEFAULT_MAX_LENGTH = 512;
const DEFAULT_INDICATOR = "... [truncated]";

/**
 * Truncates a string to the given max length, appending an indicator if truncated.
 */
export function truncateString(
  value: string,
  options: TruncateOptions = { maxLength: DEFAULT_MAX_LENGTH }
): string {
  const { maxLength, indicator = DEFAULT_INDICATOR } = options;
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + indicator;
}

/**
 * Truncates a body that may be a string or a JSON-serializable object.
 * Objects are serialized before truncation.
 */
export function truncateBody(
  body: unknown,
  options: TruncateOptions = { maxLength: DEFAULT_MAX_LENGTH }
): string {
  if (body === null || body === undefined) return "";
  const str = typeof body === "string" ? body : JSON.stringify(body);
  return truncateString(str, options);
}

/**
 * Returns true if the given string was truncated (i.e., exceeds maxLength).
 */
export function isTruncated(value: string, maxLength: number = DEFAULT_MAX_LENGTH): boolean {
  return value.length > maxLength;
}

/**
 * Applies truncation to both request and response bodies of a log entry
 * (non-mutating — returns a shallow copy with truncated body fields).
 */
export function truncateEntry(
  entry: Record<string, unknown>,
  options: TruncateOptions = { maxLength: DEFAULT_MAX_LENGTH }
): Record<string, unknown> {
  const result = { ...entry };
  if (typeof result.requestBody !== "undefined") {
    result.requestBody = truncateBody(result.requestBody, options);
  }
  if (typeof result.responseBody !== "undefined") {
    result.responseBody = truncateBody(result.responseBody, options);
  }
  return result;
}
