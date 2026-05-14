import { describe, it, expect } from 'bun:test';
import { checkAlerts, formatAlerts, AlertRule, AlertResult } from './alert';
import { LogEntry } from './logger';

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: 'test-id',
    timestamp: new Date().toISOString(),
    method: 'GET',
    url: 'http://localhost/api/test',
    requestHeaders: {},
    requestBody: '',
    response: {
      status: 200,
      headers: {},
      body: '',
    },
    duration: 100,
    ...overrides,
  };
}

describe('checkAlerts', () => {
  it('returns no alerts for a healthy entry', () => {
    const entry = makeEntry();
    const results = checkAlerts([entry]);
    expect(results).toHaveLength(0);
  });

  it('triggers server-error alert on 500', () => {
    const entry = makeEntry({ response: { status: 500, headers: {}, body: '' } });
    const results = checkAlerts([entry]);
    const names = results.map((r) => r.rule);
    expect(names).toContain('server-error');
  });

  it('triggers slow-response alert when duration > 2000ms', () => {
    const entry = makeEntry({ duration: 3000 });
    const results = checkAlerts([entry]);
    const names = results.map((r) => r.rule);
    expect(names).toContain('slow-response');
  });

  it('triggers client-error alert on 404', () => {
    const entry = makeEntry({ response: { status: 404, headers: {}, body: '' } });
    const results = checkAlerts([entry]);
    const names = results.map((r) => r.rule);
    expect(names).toContain('client-error');
  });

  it('triggers large-response alert for big body', () => {
    const bigBody = 'x'.repeat(200_000);
    const entry = makeEntry({ response: { status: 200, headers: {}, body: bigBody } });
    const results = checkAlerts([entry]);
    const names = results.map((r) => r.rule);
    expect(names).toContain('large-response');
  });

  it('supports custom rules', () => {
    const rule: AlertRule = {
      name: 'custom',
      severity: 'info',
      test: (e) => e.method === 'DELETE',
      message: (e) => `DELETE called on ${e.url}`,
    };
    const entry = makeEntry({ method: 'DELETE' });
    const results = checkAlerts([entry], [rule]);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('custom');
    expect(results[0].severity).toBe('info');
  });

  it('checks multiple entries', () => {
    const entries = [
      makeEntry({ response: { status: 500, headers: {}, body: '' } }),
      makeEntry({ response: { status: 200, headers: {}, body: '' } }),
      makeEntry({ duration: 5000 }),
    ];
    const results = checkAlerts(entries);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });
});

describe('formatAlerts', () => {
  it('returns "No alerts." when empty', () => {
    expect(formatAlerts([])).toBe('No alerts.');
  });

  it('includes severity icon and rule name', () => {
    const result: AlertResult = {
      entry: makeEntry(),
      rule: 'server-error',
      severity: 'error',
      message: 'Server error 500 on GET /api',
    };
    const output = formatAlerts([result]);
    expect(output).toContain('✖');
    expect(output).toContain('ERROR');
    expect(output).toContain('server-error');
  });

  it('uses ⚠ for warn severity', () => {
    const result: AlertResult = {
      entry: makeEntry(),
      rule: 'slow-response',
      severity: 'warn',
      message: 'Slow response',
    };
    expect(formatAlerts([result])).toContain('⚠');
  });
});
