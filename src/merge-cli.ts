import { MergeOptions } from "./merge";

export interface MergeCliArgs {
  files: string[];
  dedupe: boolean;
  sortBy: "timestamp" | "method" | "url";
  output?: string;
}

const VALID_SORT = ["timestamp", "method", "url"] as const;

export function parseMergeArgs(argv: string[]): MergeCliArgs {
  const args: MergeCliArgs = {
    files: [],
    dedupe: false,
    sortBy: "timestamp",
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--dedupe" || arg === "-d") {
      args.dedupe = true;
    } else if ((arg === "--sort" || arg === "-s") && argv[i + 1]) {
      const val = argv[++i];
      if (VALID_SORT.includes(val as typeof VALID_SORT[number])) {
        args.sortBy = val as typeof VALID_SORT[number];
      } else {
        throw new Error(`Invalid sort field: ${val}. Must be one of: ${VALID_SORT.join(", ")}`);
      }
    } else if ((arg === "--output" || arg === "-o") && argv[i + 1]) {
      args.output = argv[++i];
    } else if (!arg.startsWith("-")) {
      args.files.push(arg);
    }
    i++;
  }

  if (args.files.length < 2) {
    throw new Error("At least two log files are required for merging");
  }

  return args;
}

export function toMergeOptions(args: MergeCliArgs): MergeOptions {
  return {
    dedupe: args.dedupe,
    sortBy: args.sortBy,
  };
}

export function printMergeUsage(): void {
  console.log(`Usage: routewatch merge <file1> <file2> [file3...] [options]

Options:
  --dedupe, -d          Remove duplicate entries (same method+url+status)
  --sort, -s <field>    Sort by: timestamp (default), method, url
  --output, -o <file>   Write merged output to file instead of stdout
`);
}
