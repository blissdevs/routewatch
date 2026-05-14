export interface MirrorArgs {
  logFile: string;
  targetUrl: string;
  extraHeaders: Record<string, string>;
  filter?: string;
}

export function parseMirrorArgs(argv: string[]): MirrorArgs {
  const args = argv.slice(2);
  let logFile = "";
  let targetUrl = "";
  const extraHeaders: Record<string, string> = {};
  let filter: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--log" || arg === "-l") {
      logFile = args[++i] ?? "";
    } else if (arg === "--target" || arg === "-t") {
      targetUrl = args[++i] ?? "";
    } else if (arg === "--header" || arg === "-H") {
      const raw = args[++i] ?? "";
      const colon = raw.indexOf(":");
      if (colon !== -1) {
        const key = raw.slice(0, colon).trim();
        const val = raw.slice(colon + 1).trim();
        extraHeaders[key] = val;
      }
    } else if (arg === "--filter" || arg === "-f") {
      filter = args[++i];
    }
  }

  if (!logFile || !targetUrl) {
    printMirrorUsage();
    process.exit(1);
  }

  return { logFile, targetUrl, extraHeaders, filter };
}

export function printMirrorUsage(): void {
  console.log(`
Usage: routewatch mirror --log <file> --target <url> [options]

Options:
  --log,    -l <file>     Path to the log file
  --target, -t <url>      Base URL to mirror requests to
  --header, -H <k:v>      Extra header to include (repeatable)
  --filter, -f <method>   Only mirror entries matching HTTP method

Example:
  routewatch mirror -l requests.log -t http://staging.example.com -H "x-env:staging"
`);
}
