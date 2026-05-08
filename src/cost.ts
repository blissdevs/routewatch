import { LogEntry } from "./logger";

export interface CostEntry {
  path: string;
  method: string;
  durationMs: number;
  responseSize: number;
  estimatedCost: number;
}

export interface CostSummary {
  totalRequests: number;
  totalDurationMs: number;
  totalResponseBytes: number;
  estimatedTotalCost: number;
  byPath: Record<string, CostEntry>;
}

// Cost model: $0.000001 per ms of duration + $0.000002 per KB of response
const COST_PER_MS = 0.000001;
const COST_PER_KB = 0.000002;

export function estimateCost(durationMs: number, responseSize: number): number {
  const durationCost = durationMs * COST_PER_MS;
  const sizeCost = (responseSize / 1024) * COST_PER_KB;
  return parseFloat((durationCost + sizeCost).toFixed(8));
}

export function computeCost(entries: LogEntry[]): CostSummary {
  const byPath: Record<string, CostEntry> = {};
  let totalDurationMs = 0;
  let totalResponseBytes = 0;
  let estimatedTotalCost = 0;

  for (const entry of entries) {
    const durationMs = entry.durationMs ?? 0;
    const responseSize = entry.response?.body
      ? Buffer.byteLength(entry.response.body, "utf8")
      : 0;
    const cost = estimateCost(durationMs, responseSize);
    const key = `${entry.method} ${entry.path}`;

    if (!byPath[key]) {
      byPath[key] = { path: entry.path, method: entry.method, durationMs: 0, responseSize: 0, estimatedCost: 0 };
    }

    byPath[key].durationMs += durationMs;
    byPath[key].responseSize += responseSize;
    byPath[key].estimatedCost = parseFloat((byPath[key].estimatedCost + cost).toFixed(8));

    totalDurationMs += durationMs;
    totalResponseBytes += responseSize;
    estimatedTotalCost = parseFloat((estimatedTotalCost + cost).toFixed(8));
  }

  return {
    totalRequests: entries.length,
    totalDurationMs,
    totalResponseBytes,
    estimatedTotalCost,
    byPath,
  };
}

export function formatCost(summary: CostSummary): string {
  const lines: string[] = [
    `Cost Summary`,
    `  Requests:        ${summary.totalRequests}`,
    `  Total Duration:  ${summary.totalDurationMs}ms`,
    `  Total Response:  ${(summary.totalResponseBytes / 1024).toFixed(2)} KB`,
    `  Estimated Cost:  $${summary.estimatedTotalCost.toFixed(8)}`,
    ``,
    `By Endpoint:`,
  ];

  for (const [key, entry] of Object.entries(summary.byPath)) {
    lines.push(
      `  ${key}`,
      `    Duration: ${entry.durationMs}ms  Size: ${(entry.responseSize / 1024).toFixed(2)} KB  Cost: $${entry.estimatedCost.toFixed(8)}`
    );
  }

  return lines.join("\n");
}

export function printCost(summary: CostSummary): void {
  console.log(formatCost(summary));
}
