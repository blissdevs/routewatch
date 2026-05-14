import { LogEntry } from "./logger";

export interface Cluster {
  key: string;
  entries: LogEntry[];
  count: number;
  avgDuration: number;
  errorRate: number;
}

export type ClusterBy = "path" | "status" | "method" | "host";

export function getClusterKey(entry: LogEntry, by: ClusterBy): string {
  switch (by) {
    case "path": {
      const url = new URL(entry.request.url);
      return url.pathname;
    }
    case "status":
      return String(entry.response?.status ?? "no-response");
    case "method":
      return entry.request.method.toUpperCase();
    case "host": {
      const url = new URL(entry.request.url);
      return url.host;
    }
  }
}

export function clusterEntries(entries: LogEntry[], by: ClusterBy): Cluster[] {
  const map = new Map<string, LogEntry[]>();

  for (const entry of entries) {
    const key = getClusterKey(entry, by);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }

  const clusters: Cluster[] = [];

  for (const [key, group] of map.entries()) {
    const durations = group
      .filter((e) => e.duration != null)
      .map((e) => e.duration as number);
    const avgDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;
    const errors = group.filter(
      (e) => e.response && e.response.status >= 500
    ).length;
    const errorRate = group.length > 0 ? errors / group.length : 0;

    clusters.push({
      key,
      entries: group,
      count: group.length,
      avgDuration: Math.round(avgDuration),
      errorRate: Math.round(errorRate * 100) / 100,
    });
  }

  return clusters.sort((a, b) => b.count - a.count);
}

export function formatCluster(cluster: Cluster): string {
  const lines: string[] = [];
  lines.push(`[${cluster.key}]`);
  lines.push(`  count:       ${cluster.count}`);
  lines.push(`  avg duration: ${cluster.avgDuration}ms`);
  lines.push(`  error rate:  ${(cluster.errorRate * 100).toFixed(0)}%`);
  return lines.join("\n");
}

export function printClusters(clusters: Cluster[]): void {
  if (clusters.length === 0) {
    console.log("No entries to cluster.");
    return;
  }
  for (const cluster of clusters) {
    console.log(formatCluster(cluster));
    console.log();
  }
}
