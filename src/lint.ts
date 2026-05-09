import { LogEntry } from "./logger";

export interface LintIssue {
  entryId: string;
  severity: "warn" | "error";
  rule: string;
  message: string;
}

export interface LintResult {
  issues: LintIssue[];
  errorCount: number;
  warnCount: number;
}

function checkMissingContentType(entry: LogEntry): LintIssue | null {
  const hasBody =
    entry.requestBody && entry.requestBody.trim().length > 0;
  const method = entry.method.toUpperCase();
  const bodyMethods = ["POST", "PUT", "PATCH"];
  if (hasBody && bodyMethods.includes(method)) {
    const headers = entry.requestHeaders || {};
    const hasContentType = Object.keys(headers).some(
      (k) => k.toLowerCase() === "content-type"
    );
    if (!hasContentType) {
      return {
        entryId: entry.id,
        severity: "warn",
        rule: "missing-content-type",
        message: `${method} request with body is missing Content-Type header`,
      };
    }
  }
  return null;
}

function checkLargePayload(
  entry: LogEntry,
  maxBytes = 512 * 1024
): LintIssue | null {
  const body = entry.responseBody || "";
  if (body.length > maxBytes) {
    return {
      entryId: entry.id,
      severity: "warn",
      rule: "large-payload",
      message: `Response body exceeds ${maxBytes} bytes (${body.length} bytes)`,
    };
  }
  return null;
}

function checkServerError(entry: LogEntry): LintIssue | null {
  if (entry.status >= 500) {
    return {
      entryId: entry.id,
      severity: "error",
      rule: "server-error",
      message: `Request returned server error status ${entry.status}`,
    };
  }
  return null;
}

function checkSlowResponse(
  entry: LogEntry,
  thresholdMs = 2000
): LintIssue | null {
  if (entry.durationMs !== undefined && entry.durationMs > thresholdMs) {
    return {
      entryId: entry.id,
      severity: "warn",
      rule: "slow-response",
      message: `Response took ${entry.durationMs}ms (threshold: ${thresholdMs}ms)`,
    };
  }
  return null;
}

export function lintEntry(entry: LogEntry): LintIssue[] {
  const checks = [
    checkMissingContentType(entry),
    checkLargePayload(entry),
    checkServerError(entry),
    checkSlowResponse(entry),
  ];
  return checks.filter((issue): issue is LintIssue => issue !== null);
}

export function lintEntries(entries: LogEntry[]): LintResult {
  const issues = entries.flatMap((e) => lintEntry(e));
  return {
    issues,
    errorCount: issues.filter((i) => i.severity === "error").length,
    warnCount: issues.filter((i) => i.severity === "warn").length,
  };
}

export function formatLintResult(result: LintResult): string {
  if (result.issues.length === 0) {
    return "✔ No lint issues found.";
  }
  const lines = result.issues.map((issue) => {
    const icon = issue.severity === "error" ? "✖" : "⚠";
    return `${icon} [${issue.rule}] ${issue.entryId}: ${issue.message}`;
  });
  lines.push(
    `\n${result.errorCount} error(s), ${result.warnCount} warning(s).`
  );
  return lines.join("\n");
}

export function printLintResult(result: LintResult): void {
  console.log(formatLintResult(result));
}
