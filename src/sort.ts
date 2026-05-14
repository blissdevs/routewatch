import { LogEntry } from "./logger";

export type SortField = "timestamp" | "status" | "duration" | "method" | "path" | "size";
export type SortOrder = "asc" | "desc";

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

function getFieldValue(entry: LogEntry, field: SortField): number | string {
  switch (field) {
    case "timestamp":
      return new Date(entry.timestamp).getTime();
    case "status":
      return entry.response?.status ?? 0;
    case "duration":
      return entry.duration ?? 0;
    case "method":
      return entry.request.method.toUpperCase();
    case "path":
      return entry.request.url;
    case "size":
      return (entry.response?.body ?? "").length;
    default:
      return 0;
  }
}

export function sortEntries(entries: LogEntry[], options: SortOptions): LogEntry[] {
  const { field, order } = options;
  const sorted = [...entries].sort((a, b) => {
    const av = getFieldValue(a, field);
    const bv = getFieldValue(b, field);
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
  });
  return order === "desc" ? sorted.reverse() : sorted;
}

export function parseSortArgs(args: string[]): SortOptions {
  const fieldArg = args.find((a) => a.startsWith("--sort="));
  const orderArg = args.find((a) => a.startsWith("--order="));

  const validFields: SortField[] = ["timestamp", "status", "duration", "method", "path", "size"];
  const field = (fieldArg?.split("=")[1] ?? "timestamp") as SortField;
  const order = (orderArg?.split("=")[1] ?? "asc") as SortOrder;

  if (!validFields.includes(field)) {
    throw new Error(`Invalid sort field: "${field}". Valid fields: ${validFields.join(", ")}`);
  }
  if (order !== "asc" && order !== "desc") {
    throw new Error(`Invalid sort order: "${order}". Use "asc" or "desc".`);
  }

  return { field, order };
}

export function formatSort(entries: LogEntry[], options: SortOptions): string {
  const lines = entries.map((e) => {
    const status = e.response?.status ?? "???";
    const duration = e.duration != null ? `${e.duration}ms` : "-";
    const ts = new Date(e.timestamp).toISOString();
    return `[${ts}] ${e.request.method} ${e.request.url} → ${status} (${duration})`;
  });
  const header = `Sorted by ${options.field} (${options.order}), ${entries.length} entries:`;
  return [header, ...lines].join("\n");
}

export function printSort(entries: LogEntry[], options: SortOptions): void {
  console.log(formatSort(entries, options));
}
