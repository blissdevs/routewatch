import type { HighlightRule } from "./highlight";

export type HighlightCliArgs = {
  rules: HighlightRule[];
  logFile?: string;
};

const VALID_FIELDS = ["method", "status", "path", "tag"] as const;
const VALID_COLORS = ["red", "green", "yellow", "blue", "magenta", "cyan"];

export function parseHighlightArgs(argv: string[]): HighlightCliArgs {
  const rules: HighlightRule[] = [];
  let logFile: string | undefined;
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--rule" && argv[i + 1]) {
      const raw = argv[i + 1];
      const rule = parseRuleString(raw);
      if (rule) rules.push(rule);
      i += 2;
    } else if (arg === "--log" && argv[i + 1]) {
      logFile = argv[i + 1];
      i += 2;
    } else {
      i++;
    }
  }

  return { rules, logFile };
}

function parseRuleString(raw: string): HighlightRule | null {
  // Format: field:value:color[:label]
  const parts = raw.split(":");
  if (parts.length < 3) return null;

  const [field, value, color, ...labelParts] = parts;

  if (!VALID_FIELDS.includes(field as any)) return null;
  if (!VALID_COLORS.includes(color)) return null;

  return {
    field: field as HighlightRule["field"],
    value,
    color,
    label: labelParts.length > 0 ? labelParts.join(":") : undefined,
  };
}

export function printHighlightUsage(): void {
  console.log(`Usage: routewatch highlight [options]`);
  console.log(``);
  console.log(`Options:`);
  console.log(`  --rule <field:value:color[:label]>  Add a highlight rule (repeatable)`);
  console.log(`  --log <file>                        Log file to read (default: routewatch.log)`);
  console.log(``);
  console.log(`Fields:    method, status, path, tag`);
  console.log(`Colors:    red, green, yellow, blue, magenta, cyan`);
  console.log(``);
  console.log(`Examples:`);
  console.log(`  routewatch highlight --rule status:500:red:errors`);
  console.log(`  routewatch highlight --rule method:POST:blue --rule path:/admin:yellow`);
}
