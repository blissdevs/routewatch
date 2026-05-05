import fs from 'fs';
import path from 'path';

export interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody?: string;
  durationMs: number;
}

export interface LoggerOptions {
  logDir?: string;
  pretty?: boolean;
}

const DEFAULT_LOG_DIR = './logs';

export function createLogger(options: LoggerOptions = {}) {
  const logDir = options.logDir ?? DEFAULT_LOG_DIR;
  const pretty = options.pretty ?? false;

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, `session-${Date.now()}.jsonl`);

  function write(entry: RequestLog): void {
    const line = pretty
      ? JSON.stringify(entry, null, 2)
      : JSON.stringify(entry);
    fs.appendFileSync(logFile, line + '\n', 'utf-8');
  }

  function log(entry: RequestLog): void {
    const label = `[${entry.timestamp}] ${entry.method} ${entry.url} → ${entry.responseStatus} (${entry.durationMs}ms)`;
    console.log(label);
    write(entry);
  }

  function readAll(): RequestLog[] {
    if (!fs.existsSync(logFile)) return [];
    return fs
      .readFileSync(logFile, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as RequestLog);
  }

  return { log, readAll, logFile };
}
