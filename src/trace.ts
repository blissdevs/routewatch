import { LogEntry } from "./logger";

export interface TraceStep {
  index: number;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  timestamp: string;
}

export interface Trace {
  id: string;
  steps: TraceStep[];
  totalDurationMs: number;
  startTime: string;
  endTime: string;
}

export function buildTrace(entries: LogEntry[]): Trace {
  if (entries.length === 0) {
    throw new Error("Cannot build trace from empty entries");
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const steps: TraceStep[] = sorted.map((entry, index) => ({
    index,
    method: entry.request.method,
    url: entry.request.url,
    status: entry.response.status,
    durationMs: entry.durationMs ?? 0,
    timestamp: entry.timestamp,
  }));

  const startTime = sorted[0].timestamp;
  const endTime = sorted[sorted.length - 1].timestamp;
  const totalDurationMs =
    new Date(endTime).getTime() - new Date(startTime).getTime();

  const id = `trace-${new Date(startTime).getTime()}`;

  return { id, steps, totalDurationMs, startTime, endTime };
}

export function formatTrace(trace: Trace): string {
  const lines: string[] = [];
  lines.push(`Trace: ${trace.id}`);
  lines.push(
    `Duration: ${trace.totalDurationMs}ms  (${trace.startTime} → ${trace.endTime})`
  );
  lines.push("");

  for (const step of trace.steps) {
    const statusLabel =
      step.status >= 500
        ? "ERR"
        : step.status >= 400
        ? "WARN"
        : "OK";
    lines.push(
      `  [${step.index}] ${step.method.padEnd(6)} ${step.url.padEnd(40)} ${step.status} ${statusLabel.padEnd(4)} ${step.durationMs}ms`
    );
  }

  return lines.join("\n");
}

export function printTrace(trace: Trace): void {
  console.log(formatTrace(trace));
}
