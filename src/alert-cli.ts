import { readAll } from './logger';
import { checkAlerts, printAlerts, AlertRule } from './alert';

export interface AlertCliArgs {
  logFile: string;
  severity?: string;
  rules?: string[];
}

export function parseAlertArgs(argv: string[]): AlertCliArgs {
  const args: AlertCliArgs = { logFile: '' };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--severity' && argv[i + 1]) {
      args.severity = argv[++i];
    } else if (arg === '--rule' && argv[i + 1]) {
      args.rules = args.rules ?? [];
      args.rules.push(argv[++i]);
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }

  args.logFile = positional[0] ?? '';
  return args;
}

export function printAlertUsage(): void {
  console.log(`
Usage: routewatch alert <logfile> [options]

Options:
  --severity <level>   Filter alerts by severity: info | warn | error
  --rule <name>        Only apply named rule (repeatable)

Examples:
  routewatch alert requests.log
  routewatch alert requests.log --severity error
  routewatch alert requests.log --rule slow-response --rule server-error
`.trim());
}

export async function runAlertCli(argv: string[]): Promise<void> {
  const args = parseAlertArgs(argv);

  if (!args.logFile) {
    printAlertUsage();
    process.exit(1);
  }

  const entries = await readAll(args.logFile);
  let results = checkAlerts(entries);

  if (args.severity) {
    results = results.filter((r) => r.severity === args.severity);
  }

  if (args.rules && args.rules.length > 0) {
    results = results.filter((r) => args.rules!.includes(r.rule));
  }

  printAlerts(results);
  console.log(`\n${results.length} alert(s) found in ${entries.length} entries.`);
}
