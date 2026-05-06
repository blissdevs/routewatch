import { describe, it, expect } from 'bun:test';
import { entryToCurl, entriesToHar, exportEntries } from './export';
import { LogEntry } from './logger';

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: 'abc123',
    timestamp: 1700000000000,
    duration: 42,
    request: {
      method: 'POST',
      url: 'http://localhost:3000/api/data',
      headers: { 'content-type': 'application/json', 'x-api-key': 'secret' },
      body: { hello: 'world' },
    },
    response: {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: { ok: true },
    },
    ...overrides,
  };
}

describe('entryToCurl', () => {
  it('includes method and URL', () => {
    const result = entryToCurl(makeEntry());
    expect(result).toContain('curl -X POST');
    expect(result).toContain('http://localhost:3000/api/data');
  });

  it('includes request headers', () => {
    const result = entryToCurl(makeEntry());
    expect(result).toContain("-H 'content-type: application/json'");
    expect(result).toContain("-H 'x-api-key: secret'");
  });

  it('includes request body', () => {
    const result = entryToCurl(makeEntry());
    expect(result).toContain('-d');
    expect(result).toContain('hello');
  });

  it('omits -d when no body', () => {
    const entry = makeEntry();
    entry.request.body = undefined;
    const result = entryToCurl(entry);
    expect(result).not.toContain('-d');
  });
});

describe('entriesToHar', () => {
  it('produces valid HAR log structure', () => {
    const har = entriesToHar([makeEntry()]) as any;
    expect(har.log.version).toBe('1.2');
    expect(har.log.creator.name).toBe('routewatch');
    expect(har.log.entries).toHaveLength(1);
  });

  it('maps request fields correctly', () => {
    const har = entriesToHar([makeEntry()]) as any;
    const req = har.log.entries[0].request;
    expect(req.method).toBe('POST');
    expect(req.url).toBe('http://localhost:3000/api/data');
    expect(req.headers).toContainEqual({ name: 'x-api-key', value: 'secret' });
  });

  it('maps response status', () => {
    const har = entriesToHar([makeEntry()]) as any;
    expect(har.log.entries[0].response.status).toBe(200);
  });
});

describe('exportEntries', () => {
  it('exports as JSON array', () => {
    const result = exportEntries([makeEntry()], 'json');
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe('abc123');
  });

  it('exports as curl commands', () => {
    const result = exportEntries([makeEntry()], 'curl');
    expect(result).toContain('curl -X POST');
  });

  it('exports as HAR', () => {
    const result = exportEntries([makeEntry()], 'har');
    const parsed = JSON.parse(result);
    expect(parsed.log).toBeDefined();
  });

  it('throws on unknown format', () => {
    expect(() => exportEntries([makeEntry()], 'xml' as any)).toThrow('Unknown export format');
  });
});
