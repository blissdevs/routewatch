import { LogEntry } from "./logger";

export type PipelineStep = (entries: LogEntry[]) => LogEntry[];

export interface Pipeline {
  steps: PipelineStep[];
}

export function createPipeline(): Pipeline {
  return { steps: [] };
}

export function addStep(pipeline: Pipeline, step: PipelineStep): Pipeline {
  return { steps: [...pipeline.steps, step] };
}

export function runPipeline(pipeline: Pipeline, entries: LogEntry[]): LogEntry[] {
  return pipeline.steps.reduce((acc, step) => step(acc), entries);
}

export function parsePipelineArgs(args: string[]): PipelineStep[] {
  const steps: PipelineStep[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--limit" && args[i + 1]) {
      const n = parseInt(args[++i], 10);
      if (!isNaN(n)) steps.push((entries) => entries.slice(0, n));
    } else if (arg === "--skip" && args[i + 1]) {
      const n = parseInt(args[++i], 10);
      if (!isNaN(n)) steps.push((entries) => entries.slice(n));
    } else if (arg === "--status" && args[i + 1]) {
      const code = parseInt(args[++i], 10);
      steps.push((entries) => entries.filter((e) => e.status === code));
    } else if (arg === "--method" && args[i + 1]) {
      const method = args[++i].toUpperCase();
      steps.push((entries) => entries.filter((e) => e.method === method));
    } else if (arg === "--sort-by" && args[i + 1]) {
      const field = args[++i] as keyof LogEntry;
      steps.push((entries) =>
        [...entries].sort((a, b) => {
          const av = a[field] as string | number;
          const bv = b[field] as string | number;
          return av < bv ? -1 : av > bv ? 1 : 0;
        })
      );
    }
  }

  return steps;
}

export function formatPipelineResult(entries: LogEntry[]): string {
  return entries
    .map((e) => `[${e.method}] ${e.url} -> ${e.status}`)
    .join("\n");
}

export function printPipelineResult(entries: LogEntry[]): void {
  console.log(formatPipelineResult(entries));
}
