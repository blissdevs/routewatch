import { summarize, formatSummary } from './reporter';
import type { ReplayResult } from './replay';
import type { LogEntry } from './logger';

const makeEntry = (method: string, path: string): LogEntry => ({
  id: 'x',
  timestamp: new Date().toISOString(),
  method,
  path,
  statusCode: 200,
  requestHeaders: {},
  requestBody: '',
  responseBody: '',
  durationMs: 0,
});

const makeResult = (
  method: string,
  path: string,
  statusCode: number,
  durationMs: number
): ReplayResult => ({
  entry: makeEntry(method, path),
  statusCode,
  body: '',
  durationMs,
});

describe('summarize', () => {
  test('counts succeeded and failed correctly', () => {
    const results = [
      makeResult('GET', '/a', 200, 10),
      makeResult('POST', '/b', 500, 20),
      makeResult('GET', '/c', 404, 15),
      makeResult('DELETE', '/d', 204, 5),
    ];
    const summary = summarize(results);
    expect(summary.total).toBe(4);
    expect(summary.succeeded).toBe(2);
    expect(summary.failed).toBe(2);
    expect(summary.avgDurationMs).toBe(Math.round((10 + 20 + 15 + 5) / 4));
  });

  test('handles empty results', () => {
    const summary = summarize([]);
    expect(summary.total).toBe(0);
    expect(summary.succeeded).toBe(0);
    expect(summary.failed).toBe(0);
    expect(summary.avgDurationMs).toBe(0);
  });
});

describe('formatSummary', () => {
  test('includes totals and per-request lines', () => {
    const results = [
      makeResult('GET', '/ok', 200, 8),
      makeResult('GET', '/err', 503, 12),
    ];
    const output = formatSummary(summarize(results));
    expect(output).toContain('2 request(s)');
    expect(output).toContain('✓ Succeeded : 1');
    expect(output).toContain('✗ Failed    : 1');
    expect(output).toContain('[200] GET /ok');
    expect(output).toContain('[503] GET /err');
  });

  test('marks 2xx as success and others as failure', () => {
    const results = [makeResult('POST', '/data', 201, 5)];
    const output = formatSummary(summarize(results));
    expect(output).toContain('✓ [201]');
  });
});
