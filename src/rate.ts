import { LogEntry } from "./logger";

export interface RateWindow {
  windowMs: number;
  entries: LogEntry[];
}

export interface RateResult {
  requestsPerSecond: number;
  requestsPerMinute: number;
  peakRps: number;
  slowestMs: number;
  fastestMs: number;
  avgMs: number;
  windowMs: number;
  totalRequests: number;
}

export function computeRate(entries: LogEntry[], windowMs = 60_000): RateResult {
  if (entries.length === 0) {
    return { requestsPerSecond: 0, requestsPerMinute: 0, peakRps: 0, slowestMs: 0, fastestMs: 0, avgMs: 0, windowMs, totalRequests: 0 };
  }

  const now = Date.now();
  const cutoff = now - windowMs;
  const windowed = entries.filter(e => new Date(e.timestamp).getTime() >= cutoff);

  const durations = windowed
    .map(e => e.durationMs ?? 0)
    .filter(d => d > 0);

  const slowestMs = durations.length ? Math.max(...durations) : 0;
  const fastestMs = durations.length ? Math.min(...durations) : 0;
  const avgMs = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const requestsPerMinute = windowed.length;
  const requestsPerSecond = parseFloat((windowed.length / (windowMs / 1000)).toFixed(2));

  // Compute peak RPS using 1-second buckets
  const buckets = new Map<number, number>();
  for (const e of windowed) {
    const sec = Math.floor(new Date(e.timestamp).getTime() / 1000);
    buckets.set(sec, (buckets.get(sec) ?? 0) + 1);
  }
  const peakRps = buckets.size ? Math.max(...buckets.values()) : 0;

  return { requestsPerSecond, requestsPerMinute, peakRps, slowestMs, fastestMs, avgMs, windowMs, totalRequests: windowed.length };
}

export function formatRate(result: RateResult): string {
  const lines: string[] = [
    `Rate Analysis (window: ${result.windowMs / 1000}s)`,
    `  Total Requests : ${result.totalRequests}`,
    `  Req/sec (avg)  : ${result.requestsPerSecond}`,
    `  Req/min        : ${result.requestsPerMinute}`,
    `  Peak RPS       : ${result.peakRps}`,
    `  Fastest        : ${result.fastestMs}ms`,
    `  Slowest        : ${result.slowestMs}ms`,
    `  Avg Duration   : ${result.avgMs}ms`,
  ];
  return lines.join("\n");
}

export function printRate(result: RateResult): void {
  console.log(formatRate(result));
}
