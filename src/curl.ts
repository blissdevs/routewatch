import { LogEntry } from "./logger";

/**
 * Converts a LogEntry into a runnable curl command string.
 */
export function entryToCurlCommand(entry: LogEntry): string {
  const parts: string[] = ["curl"];

  // Method
  if (entry.request.method !== "GET") {
    parts.push(`-X ${entry.request.method}`);
  }

  // Headers
  for (const [key, value] of Object.entries(entry.request.headers ?? {})) {
    const safeKey = key.replace(/'/g, "'\\''");
    const safeVal = String(value).replace(/'/g, "'\\''");
    parts.push(`-H '${safeKey}: ${safeVal}'`);
  }

  // Body
  if (entry.request.body) {
    const body = entry.request.body.replace(/'/g, "'\\''");
    parts.push(`--data '${body}'`);
  }

  // URL
  parts.push(`'${entry.request.url}'`);

  return parts.join(" ");
}

/**
 * Formats multiple entries as curl commands, one per line.
 */
export function formatCurlCommands(entries: LogEntry[]): string {
  return entries.map(entryToCurlCommand).join("\n");
}

/**
 * Prints curl commands for the given entries to stdout.
 */
export function printCurlCommands(entries: LogEntry[]): void {
  console.log(formatCurlCommands(entries));
}
