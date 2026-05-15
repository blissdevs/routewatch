import { describe, it, expect } from 'vitest';
import {
  createTemplate,
  entryToTemplate,
  applyTemplate,
  formatTemplate,
  printTemplates,
} from './template';
import type { LogEntry } from './logger';

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: 'e1',
    timestamp: new Date().toISOString(),
    method: 'POST',
    url: 'http://localhost:3000/api/users',
    status: 200,
    requestHeaders: { 'content-type': 'application/json' },
    responseHeaders: {},
    requestBody: '{"name":"alice"}',
    responseBody: '{"id":1}',
    duration: 42,
    ...overrides,
  };
}

describe('createTemplate', () => {
  it('creates a template with required fields', () => {
    const t = createTemplate('my-template', 'GET', 'http://api.example.com/{{resource}}');
    expect(t.name).toBe('my-template');
    expect(t.method).toBe('GET');
    expect(t.urlPattern).toBe('http://api.example.com/{{resource}}');
    expect(t.id).toBeTruthy();
    expect(t.createdAt).toBeTruthy();
  });

  it('uppercases the method', () => {
    const t = createTemplate('x', 'post', 'http://example.com');
    expect(t.method).toBe('POST');
  });

  it('stores optional headers and body', () => {
    const t = createTemplate('x', 'POST', '/api', {
      headers: { authorization: 'Bearer token' },
      body: '{"key":"value"}',
    });
    expect(t.headers?.authorization).toBe('Bearer token');
    expect(t.body).toBe('{"key":"value"}');
  });
});

describe('entryToTemplate', () => {
  it('converts a log entry into a template', () => {
    const entry = makeEntry();
    const t = entryToTemplate(entry, 'user-create');
    expect(t.name).toBe('user-create');
    expect(t.method).toBe('POST');
    expect(t.urlPattern).toBe('http://localhost:3000/api/users');
    expect(t.body).toBe('{"name":"alice"}');
  });
});

describe('applyTemplate', () => {
  it('substitutes variables in url', () => {
    const t = createTemplate('t', 'GET', 'http://api.example.com/{{resource}}/{{id}}');
    const result = applyTemplate(t, { resource: 'users', id: '42' });
    expect(result.url).toBe('http://api.example.com/users/42');
  });

  it('substitutes variables in body', () => {
    const t = createTemplate('t', 'POST', '/api', { body: '{"name":"{{name}}"}' });
    const result = applyTemplate(t, { name: 'bob' });
    expect(result.body).toBe('{"name":"bob"}');
  });

  it('substitutes variables in headers', () => {
    const t = createTemplate('t', 'GET', '/api', {
      headers: { authorization: 'Bearer {{token}}' },
    });
    const result = applyTemplate(t, { token: 'abc123' });
    expect(result.headers.authorization).toBe('Bearer abc123');
  });

  it('leaves unmatched placeholders intact', () => {
    const t = createTemplate('t', 'GET', '/api/{{resource}}');
    const result = applyTemplate(t, {});
    expect(result.url).toBe('/api/{{resource}}');
  });
});

describe('formatTemplate', () => {
  it('returns a string representation', () => {
    const t = createTemplate('my-req', 'DELETE', '/api/items/{{id}}', { tags: ['admin'] });
    const out = formatTemplate(t);
    expect(out).toContain('my-req');
    expect(out).toContain('DELETE');
    expect(out).toContain('/api/items/{{id}}');
    expect(out).toContain('admin');
  });

  it('truncates long body', () => {
    const t = createTemplate('t', 'POST', '/api', { body: 'x'.repeat(100) });
    const out = formatTemplate(t);
    expect(out).toContain('...');
  });
});

describe('printTemplates', () => {
  it('prints a message when no templates', () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => logs.push(msg);
    printTemplates([]);
    console.log = orig;
    expect(logs.some((l) => l.includes('No templates found'))).toBe(true);
  });
});
