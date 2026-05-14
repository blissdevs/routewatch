import { LogEntry } from "./logger";

export interface SampleOptions {
  count: number;
  method?: string;
  seed?: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function sampleEntries(
  entries: LogEntry[],
  options: SampleOptions
): LogEntry[] {
  const { count, method, seed } = options;

  let pool = method
    ? entries.filter((e) => e.method.toUpperCase() === method.toUpperCase())
    : [...entries];

  if (pool.length === 0) return [];
  if (count >= pool.length) return pool;

  const rand = seed !== undefined ? seededRandom(seed) : Math.random;
  const result: LogEntry[] = [];
  const used = new Set<number>();

  while (result.length < count) {
    const idx = Math.floor(rand() * pool.length);
    if (!used.has(idx)) {
      used.add(idx);
      result.push(pool[idx]);
    }
  }

  return result;
}

export function formatSample(entries: LogEntry[]): string {
  if (entries.length === 0) return "No entries sampled.";
  return entries
    .map(
      (e, i) =>
        `[${i + 1}] ${e.method} ${e.url} → ${e.status} (${e.duration}ms)`
    )
    .join("\n");
}

export function printSample(entries: LogEntry[]): void {
  console.log(formatSample(entries));
}
