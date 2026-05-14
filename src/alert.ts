import { LogEntry } from './logger';

export type AlertSeverity = 'info' | 'warn' | 'error';

export interface AlertRule {
  name: string;
  severity: AlertSeverity;
  test: (entry: LogEntry) => boolean;
  message: (entry: LogEntry) => string;
}

export interface AlertResult {
  entry: LogEntry;
  rule: string;
  severity: AlertSeverity;
  message: string;
}

const defaultRules: AlertRule[] = [
  {
    name: 'server-error',
    severity: 'error',
    test: (e) => (e.response?.status ?? 0) >= 500,
    message: (e) => `Server error ${e.response?.status} on ${e.method} ${e.url}`,
  },
  {
    name: 'slow-response',
    severity: 'warn',
    test: (e) => (e.duration ?? 0) > 2000,
    message: (e) => `Slow response ${e.duration}ms on ${e.method} ${e.url}`,
  },
  {
    name: 'client-error',
    severity: 'warn',
    test: (e) => {
      const s = e.response?.status ?? 0;
      return s >= 400 && s < 500;
    },
    message: (e) => `Client error ${e.response?.status} on ${e.method} ${e.url}`,
  },
  {
    name: 'large-response',
    severity: 'info',
    test: (e) => {
      const body = e.response?.body ?? '';
      return body.length > 100_000;
    },
    message: (e) =>
      `Large response (${e.response?.body?.length ?? 0} bytes) on ${e.method} ${e.url}`,
  },
];

export function checkAlerts(
  entries: LogEntry[],
  rules: AlertRule[] = defaultRules
): AlertResult[] {
  const results: AlertResult[] = [];
  for (const entry of entries) {
    for (const rule of rules) {
      if (rule.test(entry)) {
        results.push({
          entry,
          rule: rule.name,
          severity: rule.severity,
          message: rule.message(entry),
        });
      }
    }
  }
  return results;
}

export function formatAlerts(results: AlertResult[]): string {
  if (results.length === 0) return 'No alerts.';
  return results
    .map((r) => {
      const icon = r.severity === 'error' ? '✖' : r.severity === 'warn' ? '⚠' : 'ℹ';
      return `${icon} [${r.severity.toUpperCase()}] (${r.rule}) ${r.message}`;
    })
    .join('\n');
}

export function printAlerts(results: AlertResult[]): void {
  console.log(formatAlerts(results));
}
