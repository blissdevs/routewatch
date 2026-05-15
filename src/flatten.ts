import type { LogEntry } from "./logger";

export interface FlatEntry {
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
  requestContentType: string;
  responseContentType: string;
  requestBodySize: number;
  responseBodySize: number;
  [key: string]: string | number;
}

export function flattenEntry(entry: LogEntry): FlatEntry {
  const reqHeaders = entry.request.headers ?? {};
  const resHeaders = entry.response?.headers ?? {};

  const requestBody = entry.request.body ?? "";
  const responseBody = entry.response?.body ?? "";

  const flat: FlatEntry = {
    timestamp: entry.timestamp,
    method: entry.request.method,
    url: entry.request.url,
    statusCode: entry.response?.status ?? 0,
    durationMs: entry.durationMs ?? 0,
    requestContentType: reqHeaders["content-type"] ?? "",
    responseContentType: resHeaders["content-type"] ?? "",
    requestBodySize: Buffer.byteLength(requestBody, "utf8"),
    responseBodySize: Buffer.byteLength(responseBody, "utf8"),
  };

  for (const [key, value] of Object.entries(reqHeaders)) {
    flat[`req_header_${key.toLowerCase().replace(/-/g, "_")}`] = value;
  }

  for (const [key, value] of Object.entries(resHeaders)) {
    flat[`res_header_${key.toLowerCase().replace(/-/g, "_")}`] = value;
  }

  return flat;
}

export function flattenEntries(entries: LogEntry[]): FlatEntry[] {
  return entries.map(flattenEntry);
}

export function flattenToCsv(entries: LogEntry[]): string {
  if (entries.length === 0) return "";

  const flattened = flattenEntries(entries);
  const allKeys = Array.from(
    new Set(flattened.flatMap((f) => Object.keys(f)))
  );

  const header = allKeys.join(",");
  const rows = flattened.map((f) =>
    allKeys
      .map((k) => {
        const val = f[k] ?? "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

export function printFlatten(entries: LogEntry[]): void {
  console.log(flattenToCsv(entries));
}
