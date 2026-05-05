#!/usr/bin/env node
import { createProxy } from "./proxy";

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      args[key] = value ?? argv[++i] ?? "";
    }
  }
  return args;
}

function printUsage() {
  console.log(`
routewatch — lightweight dev proxy

Usage:
  routewatch --target <url> [--port <number>] [--log-dir <path>]

Options:
  --target    Target URL to proxy (required)
  --port      Local port to listen on (default: 8080)
  --log-dir   Directory to store request logs (default: ./logs)

Example:
  routewatch --target http://api.example.com --port 3001
`);
}

/**
 * Validates that the provided target string is a well-formed HTTP or HTTPS URL.
 * Exits the process with an error message if validation fails.
 */
function validateTarget(target: string): void {
  try {
    const url = new URL(target);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    console.error(`[routewatch] Error: invalid target URL "${target}" (must be http or https)`);
    process.exit(1);
  }
}

function main() {
  const args = parseArgs(process.argv);

  if (!args["target"]) {
    console.error("[routewatch] Error: --target is required\n");
    printUsage();
    process.exit(1);
  }

  const port = parseInt(args["port"] ?? "8080", 10);
  const logDir = args["log-dir"] ?? "./logs";
  const target = args["target"];

  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`[routewatch] Error: invalid port "${args["port"]}"`); 
    process.exit(1);
  }

  validateTarget(target);

  const proxy = createProxy({ target, port, logDir });

  process.on("SIGINT", () => {
    console.log("\n[routewatch] Shutting down.");
    proxy.stop();
    process.exit(0);
  });

  proxy.start();
}

main();
