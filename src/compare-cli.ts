import { readAll } from "./logger";
import { compareByPath, printCompare } from "./compare";

export interface CompareArgs {
  fileA: string;
  fileB: string;
}

export function parseCompareArgs(argv: string[]): CompareArgs | null {
  const args = argv.slice(2);
  if (args.length < 2) return null;
  return { fileA: args[0], fileB: args[1] };
}

export function printCompareUsage(): void {
  console.log("Usage: routewatch compare <log-a> <log-b>");
  console.log("");
  console.log("Compare two log files and show matched, missing, and extra routes.");
}

export async function runCompare(args: CompareArgs): Promise<void> {
  const [a, b] = await Promise.all([
    readAll(args.fileA),
    readAll(args.fileB),
  ]);

  if (a.length === 0 && b.length === 0) {
    console.log("Both log files are empty.");
    return;
  }

  const result = compareByPath(a, b);
  printCompare(result);
}

if (import.meta.main) {
  const args = parseCompareArgs(process.argv);
  if (!args) {
    printCompareUsage();
    process.exit(1);
  }
  runCompare(args).catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
