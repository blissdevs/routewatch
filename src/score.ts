import type { LogEntry } from "./logger";

export interface ScoreResult {
  entry: LogEntry;
  score: number;
  breakdown: Record<string, number>;
}

const WEIGHTS = {
  statusError: -30,
  slowResponse: -20,
  largePayload: -10,
  missingContentType: -5,
  fastResponse: 10,
  smallPayload: 5,
  success: 15,
};

export function scoreEntry(entry: LogEntry): ScoreResult {
  const breakdown: Record<string, number> = {};
  let score = 100;

  const status = entry.response?.status ?? 0;
  const duration = entry.response?.duration ?? 0;
  const bodySize = entry.response?.body ? Buffer.byteLength(entry.response.body, "utf8") : 0;
  const contentType = entry.response?.headers?.["content-type"] ?? "";

  if (status >= 500) {
    breakdown.statusError = WEIGHTS.statusError;
    score += WEIGHTS.statusError;
  } else if (status >= 400) {
    breakdown.statusError = Math.round(WEIGHTS.statusError / 2);
    score += Math.round(WEIGHTS.statusError / 2);
  } else if (status >= 200 && status < 300) {
    breakdown.success = WEIGHTS.success;
    score += WEIGHTS.success;
  }

  if (duration > 2000) {
    breakdown.slowResponse = WEIGHTS.slowResponse;
    score += WEIGHTS.slowResponse;
  } else if (duration < 200) {
    breakdown.fastResponse = WEIGHTS.fastResponse;
    score += WEIGHTS.fastResponse;
  }

  if (bodySize > 100_000) {
    breakdown.largePayload = WEIGHTS.largePayload;
    score += WEIGHTS.largePayload;
  } else if (bodySize > 0 && bodySize < 10_000) {
    breakdown.smallPayload = WEIGHTS.smallPayload;
    score += WEIGHTS.smallPayload;
  }

  if (!contentType) {
    breakdown.missingContentType = WEIGHTS.missingContentType;
    score += WEIGHTS.missingContentType;
  }

  return { entry, score: Math.max(0, Math.min(100, score)), breakdown };
}

export function scoreEntries(entries: LogEntry[]): ScoreResult[] {
  return entries.map(scoreEntry).sort((a, b) => b.score - a.score);
}

export function formatScore(result: ScoreResult): string {
  const lines: string[] = [];
  const { entry, score, breakdown } = result;
  const method = entry.request.method;
  const url = entry.request.url;
  lines.push(`[${score}/100] ${method} ${url}`);
  for (const [key, delta] of Object.entries(breakdown)) {
    const sign = delta >= 0 ? "+" : "";
    lines.push(`  ${sign}${delta}  ${key}`);
  }
  return lines.join("\n");
}

export function printScores(results: ScoreResult[]): void {
  for (const result of results) {
    console.log(formatScore(result));
    console.log();
  }
}
