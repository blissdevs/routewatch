export interface TemplateCliArgs {
  subcommand: 'list' | 'create' | 'delete' | 'apply' | 'from-entry';
  name?: string;
  method?: string;
  urlPattern?: string;
  id?: string;
  vars?: Record<string, string>;
  entryIndex?: number;
  logFile?: string;
  storeDir?: string;
}

export function parseTemplateArgs(argv: string[]): TemplateCliArgs {
  const args = argv.slice();
  const storeDir = '.routewatch/templates';
  const subcommand = args.shift() as TemplateCliArgs['subcommand'];

  if (!subcommand || !['list', 'create', 'delete', 'apply', 'from-entry'].includes(subcommand)) {
    printTemplateUsage();
    process.exit(1);
  }

  const result: TemplateCliArgs = { subcommand, storeDir };
  const vars: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--name' || arg === '-n') result.name = args[++i];
    else if (arg === '--method' || arg === '-m') result.method = args[++i];
    else if (arg === '--url' || arg === '-u') result.urlPattern = args[++i];
    else if (arg === '--id') result.id = args[++i];
    else if (arg === '--log') result.logFile = args[++i];
    else if (arg === '--entry') result.entryIndex = parseInt(args[++i], 10);
    else if (arg === '--store') result.storeDir = args[++i];
    else if (arg.startsWith('--var=')) {
      const [k, v] = arg.slice(6).split('=');
      vars[k] = v;
    } else if (arg === '--var') {
      const [k, v] = args[++i].split('=');
      vars[k] = v;
    }
  }

  if (Object.keys(vars).length > 0) result.vars = vars;
  return result;
}

export function printTemplateUsage(): void {
  console.log(`
Usage: routewatch template <subcommand> [options]

Subcommands:
  list                        List all saved templates
  create                      Create a new template
  delete --id <id>            Delete a template by ID
  apply --id <id>             Apply a template (optionally with --var key=value)
  from-entry --log <file> --entry <n> --name <name>
                              Create template from a logged entry

Options:
  --name, -n <name>           Template name
  --method, -m <method>       HTTP method (for create)
  --url, -u <pattern>         URL pattern, supports {{var}} placeholders
  --id <id>                   Template ID
  --log <file>                Log file path
  --entry <n>                 Entry index (0-based)
  --store <dir>               Template store directory
  --var <key=value>           Variable substitution for apply
`.trim());
}
