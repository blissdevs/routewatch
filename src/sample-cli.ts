import { readAll } from "./logger";
import { sampleEntries, printSample, SampleOptions } from "./sample";

export interface SampleArgs {
  logFile: string;
  count: number;
  method?: string;
  seed?: number;
}

export function parseSampleArgs(argv: string[]): SampleArgs {
  const args: SampleArgs = { logFile: "requests.log", count: 10 };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === "--file" || arg === "-f") && argv[i + 1]) {
      args.logFile = argv[++i];
    } else if ((arg === "--count" || arg === "-n") && argv[i + 1]) {
      args.count = parseInt(argv[++i], 10);
    } else if (arg === "--method" && argv[i + 1]) {
      args.method = argv[++i];
    } else if (arg === "--seed" && argv[i + 1]) {
      args.seed = parseInt(argv[++i], 10);
    }
  }

  return args;
}

export function printSampleUsage(): void {
  console.log(`
Usage: routewatch sample [options]

Options:
  -f, --file <path>    Log file to read (default: requests.log)
  -n, --count <n>      Number of entries to sample (default: 10)
  --method <method>    Filter by HTTP method before sampling
  --seed <number>      Random seed for reproducible sampling
`.trim());
}

export async function runSampleCli(argv: string[]): Promise<void> {
  if (argv.includes("--help") || argv.includes("-h")) {
    printSampleUsage();
    return;
  }

  const args = parseSampleArgs(argv);
  const entries = await readAll(args.logFile);

  const options: SampleOptions = {
    count: args.count,
    method: args.method,
    seed: args.seed,
  };

  const sampled = sampleEntries(entries, options);
  console.log(`Sampled ${sampled.length} of ${entries.length} entries:\n`);
  printSample(sampled);
}
