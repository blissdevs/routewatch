import { renameHeader, setHeader, rewriteUrl, TransformRule } from "./transform";

export interface TransformArgs {
  rules: TransformRule[];
  errors: string[];
}

export function parseTransformArgs(argv: string[]): TransformArgs {
  const rules: TransformRule[] = [];
  const errors: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--set-header") {
      const val = argv[++i];
      if (!val || !val.includes(":")) {
        errors.push(`--set-header requires NAME:VALUE, got: ${val}`);
        continue;
      }
      const colon = val.indexOf(":");
      rules.push(setHeader(val.slice(0, colon), val.slice(colon + 1)));
    } else if (arg === "--rename-header") {
      const val = argv[++i];
      if (!val || !val.includes("->")) {
        errors.push(`--rename-header requires FROM->TO, got: ${val}`);
        continue;
      }
      const [from, to] = val.split("->");
      rules.push(renameHeader(from, to));
    } else if (arg === "--rewrite-url") {
      const val = argv[++i];
      if (!val || !val.includes("->")) {
        errors.push(`--rewrite-url requires PATTERN->REPLACEMENT, got: ${val}`);
        continue;
      }
      const arrow = val.indexOf("->");
      const pattern = new RegExp(val.slice(0, arrow));
      const replacement = val.slice(arrow + 2);
      rules.push(rewriteUrl(pattern, replacement));
    }
  }

  return { rules, errors };
}

export function printTransformUsage(): void {
  console.log(`
transform options:
  --set-header NAME:VALUE      Set a request header
  --rename-header FROM->TO     Rename a request header
  --rewrite-url PATTERN->REPL  Rewrite the request URL (regex)
`.trim());
}
