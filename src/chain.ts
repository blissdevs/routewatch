import { LogEntry } from "./logger";

/**
 * A chain groups a sequence of log entries that share the same
 * correlation ID or session token, allowing you to trace a
 * multi-step request flow end-to-end.
 */
export interface Chain {
  id: string;
  entries: LogEntry[];
  startedAt: string;
  endedAt: string;
  durationMs: number;
}

/** Extract a chain ID from an entry via a header name (case-insensitive). */
export function getChainId(
  entry: LogEntry,
  headerName = "x-correlation-id"
): string | undefined {
  const key = headerName.toLowerCase();
  const headers = entry.request?.headers ?? {};
  for (const [h, v] of Object.entries(headers)) {
    if (h.toLowerCase() === key) return String(v);
  }
  return undefined;
}

/** Group entries into chains by the given header. */
export function buildChains(
  entries: LogEntry[],
  headerName = "x-correlation-id"
): Chain[] {
  const map = new Map<string, LogEntry[]>();

  for (const entry of entries) {
    const id = getChainId(entry, headerName);
    if (!id) continue;
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(entry);
  }

  const chains: Chain[] = [];
  for (const [id, chainEntries] of map.entries()) {
    const sorted = [...chainEntries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const startedAt = sorted[0].timestamp;
    const endedAt = sorted[sorted.length - 1].timestamp;
    const durationMs =
      new Date(endedAt).getTime() - new Date(startedAt).getTime();
    chains.push({ id, entries: sorted, startedAt, endedAt, durationMs });
  }

  return chains.sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );
}

/** Format a single chain for display. */
export function formatChain(chain: Chain): string {
  const lines: string[] = [
    `Chain: ${chain.id}  (${chain.entries.length} requests, ${chain.durationMs}ms)`,
  ];
  for (const entry of chain.entries) {
    const method = entry.request?.method ?? "?";
    const url = entry.request?.url ?? "?";
    const status = entry.response?.status ?? "?";
    lines.push(`  ${method} ${url} → ${status}`);
  }
  return lines.join("\n");
}

/** Print all chains to stdout. */
export function printChains(chains: Chain[]): void {
  if (chains.length === 0) {
    console.log("No chains found.");
    return;
  }
  for (const chain of chains) {
    console.log(formatChain(chain));
    console.log();
  }
}
