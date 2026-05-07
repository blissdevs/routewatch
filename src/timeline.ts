import { LogEntry } from "./logger";

export interface TimelineBucket {
  start: number;
  end: number;
  count: number;
  entries: LogEntry[];
}

export interface Timeline {
  buckets: TimelineBucket[];
  bucketMs: number;
  totalDuration: number;
  startTime: number;
  endTime: number;
}

export function buildTimeline(entries: LogEntry[], bucketMs = 1000): Timeline {
  if (entries.length === 0) {
    return { buckets: [], bucketMs, totalDuration: 0, startTime: 0, endTime: 0 };
  }

  const times = entries.map((e) => new Date(e.timestamp).getTime());
  const startTime = Math.min(...times);
  const endTime = Math.max(...times);
  const totalDuration = endTime - startTime;
  const bucketCount = Math.max(1, Math.ceil((totalDuration + 1) / bucketMs));

  const buckets: TimelineBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    start: startTime + i * bucketMs,
    end: startTime + (i + 1) * bucketMs,
    count: 0,
    entries: [],
  }));

  for (let i = 0; i < entries.length; i++) {
    const t = times[i];
    const idx = Math.min(Math.floor((t - startTime) / bucketMs), bucketCount - 1);
    buckets[idx].count++;
    buckets[idx].entries.push(entries[i]);
  }

  return { buckets, bucketMs, totalDuration, startTime, endTime };
}

export function formatTimeline(timeline: Timeline, width = 40): string {
  if (timeline.buckets.length === 0) return "(no entries)";

  const maxCount = Math.max(...timeline.buckets.map((b) => b.count), 1);
  const lines: string[] = [];

  lines.push(`Timeline (bucket: ${timeline.bucketMs}ms, total: ${timeline.totalDuration}ms)`);
  lines.push("");

  for (const bucket of timeline.buckets) {
    const barLen = Math.round((bucket.count / maxCount) * width);
    const bar = "█".repeat(barLen).padEnd(width);
    const ts = new Date(bucket.start).toISOString().slice(11, 23);
    lines.push(`${ts} | ${bar} ${bucket.count}`);
  }

  return lines.join("\n");
}

export function printTimeline(timeline: Timeline, width = 40): void {
  console.log(formatTimeline(timeline, width));
}
