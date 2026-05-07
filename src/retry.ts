import { LogEntry } from "./logger";

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoff?: boolean;
}

export interface RetryResult {
  entry: LogEntry;
  attempts: number;
  success: boolean;
  lastStatus?: number;
  error?: string;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delayMs: 500,
  backoff: true,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryEntry(
  entry: LogEntry,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let attempts = 0;
  let lastStatus: number | undefined;
  let lastError: string | undefined;

  while (attempts < opts.maxAttempts) {
    attempts++;
    try {
      const res = await fetch(entry.url, {
        method: entry.method,
        headers: entry.requestHeaders as Record<string, string>,
        body: entry.requestBody || undefined,
      });
      lastStatus = res.status;
      if (res.ok) {
        return { entry, attempts, success: true, lastStatus };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempts < opts.maxAttempts) {
      const delay = opts.backoff ? opts.delayMs * attempts : opts.delayMs;
      await sleep(delay);
    }
  }

  return {
    entry,
    attempts,
    success: false,
    lastStatus,
    error: lastError,
  };
}

export function formatRetryResult(result: RetryResult): string {
  const status = result.success ? "SUCCESS" : "FAILED";
  const code = result.lastStatus ? ` (HTTP ${result.lastStatus})` : "";
  const err = result.error ? ` — ${result.error}` : "";
  return `[${status}] ${result.entry.method} ${result.entry.url} after ${result.attempts} attempt(s)${code}${err}`;
}

export function printRetryResult(result: RetryResult): void {
  console.log(formatRetryResult(result));
}
