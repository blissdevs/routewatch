import { readAll, LogEntry } from './logger';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export interface ReplayResult {
  entry: LogEntry;
  statusCode: number;
  body: string;
  durationMs: number;
}

export interface ReplayOptions {
  targetBase?: string;
  delayMs?: number;
  filterPath?: string;
}

export async function replayRequest(entry: LogEntry, targetBase: string): Promise<ReplayResult> {
  const start = Date.now();
  const urlStr = targetBase + entry.path;
  const parsed = new URL(urlStr);
  const isHttps = parsed.protocol === 'https:';
  const lib = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const options: http.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method: entry.method,
      headers: entry.requestHeaders ?? {},
    };

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          entry,
          statusCode: res.statusCode ?? 0,
          body,
          durationMs: Date.now() - start,
        });
      });
    });

    req.on('error', reject);

    if (entry.requestBody) {
      req.write(entry.requestBody);
    }
    req.end();
  });
}

export async function replayAll(
  logFile: string,
  targetBase: string,
  options: ReplayOptions = {}
): Promise<ReplayResult[]> {
  let entries = await readAll(logFile);

  if (options.filterPath) {
    entries = entries.filter((e) => e.path.startsWith(options.filterPath!));
  }

  const results: ReplayResult[] = [];

  for (const entry of entries) {
    if (options.delayMs && options.delayMs > 0) {
      await new Promise((r) => setTimeout(r, options.delayMs));
    }
    const result = await replayRequest(entry, targetBase);
    results.push(result);
  }

  return results;
}
