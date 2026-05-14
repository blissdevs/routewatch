import { LogEntry } from "./logger";

export interface MirrorTarget {
  url: string;
  headers?: Record<string, string>;
}

export interface MirrorResult {
  entry: LogEntry;
  target: string;
  status: number;
  ok: boolean;
  error?: string;
  durationMs: number;
}

export async function mirrorEntry(
  entry: LogEntry,
  target: MirrorTarget
): Promise<MirrorResult> {
  const url = target.url.replace(/\/$/, "") + entry.request.path;
  const start = Date.now();

  try {
    const headers: Record<string, string> = {
      ...entry.request.headers,
      ...target.headers,
    };

    const res = await fetch(url, {
      method: entry.request.method,
      headers,
      body: entry.request.body ? entry.request.body : undefined,
    });

    return {
      entry,
      target: url,
      status: res.status,
      ok: res.ok,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      entry,
      target: url,
      status: 0,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}

export async function mirrorEntries(
  entries: LogEntry[],
  target: MirrorTarget
): Promise<MirrorResult[]> {
  return Promise.all(entries.map((e) => mirrorEntry(e, target)));
}

export function formatMirrorResult(result: MirrorResult): string {
  const status = result.ok
    ? `\x1b[32m${result.status}\x1b[0m`
    : `\x1b[31m${result.status || "ERR"}\x1b[0m`;
  const method = result.entry.request.method.padEnd(6);
  const path = result.entry.request.path;
  const ms = `${result.durationMs}ms`;
  const err = result.error ? ` (${result.error})` : "";
  return `${method} ${path} → ${result.target} [${status}] ${ms}${err}`;
}

export function printMirrorResults(results: MirrorResult[]): void {
  const ok = results.filter((r) => r.ok).length;
  console.log(`\nMirror results: ${ok}/${results.length} succeeded\n`);
  for (const r of results) {
    console.log(formatMirrorResult(r));
  }
}
