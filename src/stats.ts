import { LogEntry } from "./logger";

export interface EntryStats {
  totalRequests: number;
  uniquePaths: number;
  methodCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  avgResponseTime: number | null;
  slowestEntry: LogEntry | null;
  fastestEntry: LogEntry | null;
  errorRate: number;
}

export function computeStats(entries: LogEntry[]): EntryStats {
  if (entries.length === 0) {
    return {
      totalRequests: 0,
      uniquePaths: 0,
      methodCounts: {},
      statusCounts: {},
      avgResponseTime: null,
      slowestEntry: null,
      fastestEntry: null,
      errorRate: 0,
    };
  }

  const methodCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const paths = new Set<string>();
  let totalDuration = 0;
  let durationCount = 0;
  let slowest: LogEntry | null = null;
  let fastest: LogEntry | null = null;
  let errorCount = 0;

  for (const entry of entries) {
    const method = entry.request.method.toUpperCase();
    methodCounts[method] = (methodCounts[method] ?? 0) + 1;

    const status = String(entry.response.status);
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;

    paths.add(entry.request.path);

    if (typeof entry.duration === "number") {
      totalDuration += entry.duration;
      durationCount++;
      if (slowest === null || entry.duration > (slowest.duration ?? 0)) {
        slowest = entry;
      }
      if (fastest === null || entry.duration < (fastest.duration ?? Infinity)) {
        fastest = entry;
      }
    }

    if (entry.response.status >= 400) {
      errorCount++;
    }
  }

  return {
    totalRequests: entries.length,
    uniquePaths: paths.size,
    methodCounts,
    statusCounts,
    avgResponseTime: durationCount > 0 ? totalDuration / durationCount : null,
    slowestEntry: slowest,
    fastestEntry: fastest,
    errorRate: entries.length > 0 ? errorCount / entries.length : 0,
  };
}

export function formatStats(stats: EntryStats): string {
  const lines: string[] = [];
  lines.push(`Total Requests : ${stats.totalRequests}`);
  lines.push(`Unique Paths   : ${stats.uniquePaths}`);
  lines.push(`Error Rate     : ${(stats.errorRate * 100).toFixed(1)}%`);

  if (stats.avgResponseTime !== null) {
    lines.push(`Avg Duration   : ${stats.avgResponseTime.toFixed(1)}ms`);
  }
  if (stats.slowestEntry) {
    lines.push(`Slowest        : ${stats.slowestEntry.request.method} ${stats.slowestEntry.request.path} (${stats.slowestEntry.duration}ms)`);
  }
  if (stats.fastestEntry) {
    lines.push(`Fastest        : ${stats.fastestEntry.request.method} ${stats.fastestEntry.request.path} (${stats.fastestEntry.duration}ms)`);
  }

  const methods = Object.entries(stats.methodCounts)
    .map(([m, c]) => `${m}:${c}`)
    .join(" ");
  lines.push(`Methods        : ${methods}`);

  const statuses = Object.entries(stats.statusCounts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([s, c]) => `${s}:${c}`)
    .join(" ");
  lines.push(`Statuses       : ${statuses}`);

  return lines.join("\n");
}

export function printStats(stats: EntryStats): void {
  console.log(formatStats(stats));
}
