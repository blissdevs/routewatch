import { readAll } from "./logger";
import { filterEntries, parseFilterArgs } from "./filter";
import { computeStats, printStats } from "./stats";

interface StatsCliArgs {
  logFile: string;
  filterArgs: string[];
  json: boolean;
}

export function parseStatsArgs(argv: string[]): StatsCliArgs {
  const args = argv.slice(2);
  const logFile = args.find((a) => !a.startsWith("--")) ?? "routewatch.log";
  const json = args.includes("--json");
  const filterArgs = args.filter(
    (a) => a.startsWith("--method=") || a.startsWith("--status=") || a.startsWith("--path=")
  );
  return { logFile, filterArgs, json };
}

export async function runStats(args: StatsCliArgs): Promise<void> {
  let entries = await readAll(args.logFile);

  if (args.filterArgs.length > 0) {
    const filter = parseFilterArgs(args.filterArgs);
    entries = filterEntries(entries, filter);
  }

  const stats = computeStats(entries);

  if (args.json) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    printStats(stats);
  }
}

if (import.meta.main) {
  const args = parseStatsArgs(process.argv);
  runStats(args).catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
