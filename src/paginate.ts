import { LogEntry } from "./logger";

export interface PaginateOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function paginateEntries(
  entries: LogEntry[],
  options: PaginateOptions
): PaginatedResult<LogEntry> {
  const { page, pageSize } = options;
  const total = entries.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const items = entries.slice(start, start + pageSize);

  return {
    items,
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

export function formatPaginate(result: PaginatedResult<LogEntry>): string {
  const lines: string[] = [];
  lines.push(
    `Page ${result.page} of ${result.totalPages} (${result.total} total entries, ${result.pageSize} per page)`
  );
  for (const entry of result.items) {
    const status = entry.response?.status ?? "?";
    const duration = entry.response?.duration ?? 0;
    lines.push(`  [${entry.timestamp}] ${entry.method} ${entry.url} → ${status} (${duration}ms)`);
  }
  if (result.hasNext) {
    lines.push(`  → Next: page ${result.page + 1}`);
  }
  if (result.hasPrev) {
    lines.push(`  ← Prev: page ${result.page - 1}`);
  }
  return lines.join("\n");
}

export function printPaginate(result: PaginatedResult<LogEntry>): void {
  console.log(formatPaginate(result));
}
