import type { ReplayResult } from './replay';

export interface ReplaySummary {
  total: number;
  succeeded: number;
  failed: number;
  avgDurationMs: number;
  results: ReplayResult[];
}

export function summarize(results: ReplayResult[]): ReplaySummary {
  const succeeded = results.filter((r) => r.statusCode >= 200 && r.statusCode < 300).length;
  const failed = results.length - succeeded;
  const avgDurationMs =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.durationMs, 0) / results.length)
      : 0;

  return { total: results.length, succeeded, failed, avgDurationMs, results };
}

export function formatSummary(summary: ReplaySummary): string {
  const lines: string[] = [
    `Replay complete: ${summary.total} request(s)`,
    `  ✓ Succeeded : ${summary.succeeded}`,
    `  ✗ Failed    : ${summary.failed}`,
    `  ⏱ Avg time  : ${summary.avgDurationMs}ms`,
    '',
    'Details:',
  ];

  for (const r of summary.results) {
    const status = r.statusCode >= 200 && r.statusCode < 300 ? '✓' : '✗';
    lines.push(
      `  ${status} [${r.statusCode}] ${r.entry.method} ${r.entry.path} (${r.durationMs}ms)`
    );
  }

  return lines.join('\n');
}

export function printSummary(summary: ReplaySummary): void {
  console.log(formatSummary(summary));
}
