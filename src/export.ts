import { LogEntry } from './logger';

export type ExportFormat = 'json' | 'curl' | 'har';

export function entryToCurl(entry: LogEntry): string {
  const method = entry.request.method.toUpperCase();
  const url = entry.request.url;
  const parts: string[] = [`curl -X ${method}`];

  for (const [key, value] of Object.entries(entry.request.headers || {})) {
    parts.push(`  -H '${key}: ${value}'`);
  }

  if (entry.request.body) {
    const body = typeof entry.request.body === 'string'
      ? entry.request.body
      : JSON.stringify(entry.request.body);
    parts.push(`  -d '${body.replace(/'/g, "'\''")}'`);
  }

  parts.push(`  '${url}'`);
  return parts.join(' \\
');
}

export function entriesToHar(entries: LogEntry[]): object {
  return {
    log: {
      version: '1.2',
      creator: { name: 'routewatch', version: '1.0.0' },
      entries: entries.map((entry) => ({
        startedDateTime: new Date(entry.timestamp).toISOString(),
        time: entry.duration ?? 0,
        request: {
          method: entry.request.method.toUpperCase(),
          url: entry.request.url,
          httpVersion: 'HTTP/1.1',
          headers: Object.entries(entry.request.headers || {}).map(([name, value]) => ({ name, value })),
          queryString: [],
          cookies: [],
          headersSize: -1,
          bodySize: entry.request.body ? JSON.stringify(entry.request.body).length : 0,
        },
        response: {
          status: entry.response.status,
          statusText: String(entry.response.status),
          httpVersion: 'HTTP/1.1',
          headers: Object.entries(entry.response.headers || {}).map(([name, value]) => ({ name, value })),
          cookies: [],
          content: {
            size: entry.response.body ? JSON.stringify(entry.response.body).length : 0,
            mimeType: entry.response.headers?.['content-type'] ?? 'application/octet-stream',
            text: entry.response.body ? JSON.stringify(entry.response.body) : '',
          },
          redirectURL: '',
          headersSize: -1,
          bodySize: -1,
        },
        cache: {},
        timings: { send: 0, wait: entry.duration ?? 0, receive: 0 },
      })),
    },
  };
}

export function exportEntries(entries: LogEntry[], format: ExportFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(entries, null, 2);
    case 'curl':
      return entries.map(entryToCurl).join('\n\n');
    case 'har':
      return JSON.stringify(entriesToHar(entries), null, 2);
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
}
