import { LogEntry } from "./logger";

export interface RedactOptions {
  headers?: string[];
  bodyFields?: string[];
  replacement?: string;
}

const DEFAULT_REPLACEMENT = "[REDACTED]";

const DEFAULT_SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
];

export function redactHeaders(
  headers: Record<string, string>,
  keys: string[],
  replacement: string = DEFAULT_REPLACEMENT
): Record<string, string> {
  const lower = keys.map((k) => k.toLowerCase());
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = lower.includes(key.toLowerCase()) ? replacement : value;
  }
  return result;
}

export function redactBodyFields(
  body: string,
  fields: string[],
  replacement: string = DEFAULT_REPLACEMENT
): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return body;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return body;
  }
  const obj = { ...(parsed as Record<string, unknown>) };
  for (const field of fields) {
    if (field in obj) {
      obj[field] = replacement;
    }
  }
  return JSON.stringify(obj);
}

export function redactEntry(
  entry: LogEntry,
  options: RedactOptions = {}
): LogEntry {
  const replacement = options.replacement ?? DEFAULT_REPLACEMENT;
  const headerKeys = [
    ...DEFAULT_SENSITIVE_HEADERS,
    ...(options.headers ?? []),
  ];

  const redactedRequestHeaders = redactHeaders(
    entry.request.headers,
    headerKeys,
    replacement
  );

  const redactedResponseHeaders = redactHeaders(
    entry.response.headers,
    headerKeys,
    replacement
  );

  let requestBody = entry.request.body ?? "";
  let responseBody = entry.response.body ?? "";

  if (options.bodyFields && options.bodyFields.length > 0) {
    requestBody = redactBodyFields(requestBody, options.bodyFields, replacement);
    responseBody = redactBodyFields(responseBody, options.bodyFields, replacement);
  }

  return {
    ...entry,
    request: {
      ...entry.request,
      headers: redactedRequestHeaders,
      body: requestBody,
    },
    response: {
      ...entry.response,
      headers: redactedResponseHeaders,
      body: responseBody,
    },
  };
}

export function redactEntries(
  entries: LogEntry[],
  options: RedactOptions = {}
): LogEntry[] {
  return entries.map((e) => redactEntry(e, options));
}
