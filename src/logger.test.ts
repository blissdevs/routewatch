import fs from 'fs';
import os from 'os';
import path from 'path';
import { createLogger, RequestLog } from './logger';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-test-'));
}

function sampleEntry(overrides: Partial<RequestLog> = {}): RequestLog {
  return {
    id: 'abc-123',
    timestamp: new Date().toISOString(),
    method: 'GET',
    url: 'http://localhost:3000/api/users',
    requestHeaders: { 'content-type': 'application/json' },
    responseStatus: 200,
    responseHeaders: { 'content-type': 'application/json' },
    responseBody: JSON.stringify({ users: [] }),
    durationMs: 42,
    ...overrides,
  };
}

describe('createLogger', () => {
  let logDir: string;

  beforeEach(() => {
    logDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(logDir, { recursive: true, force: true });
  });

  it('creates the log directory if it does not exist', () => {
    const nestedDir = path.join(logDir, 'deep', 'nested');
    createLogger({ logDir: nestedDir });
    expect(fs.existsSync(nestedDir)).toBe(true);
  });

  it('writes a log entry and reads it back', () => {
    const logger = createLogger({ logDir });
    const entry = sampleEntry();
    logger.log(entry);
    const entries = logger.readAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('abc-123');
    expect(entries[0].responseStatus).toBe(200);
  });

  it('appends multiple entries', () => {
    const logger = createLogger({ logDir });
    logger.log(sampleEntry({ id: 'one' }));
    logger.log(sampleEntry({ id: 'two' }));
    logger.log(sampleEntry({ id: 'three' }));
    const entries = logger.readAll();
    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.id)).toEqual(['one', 'two', 'three']);
  });

  it('returns empty array when log file does not exist', () => {
    const logger = createLogger({ logDir });
    // readAll before any log() call — file won't exist yet
    const freshLogger = createLogger({ logDir: makeTempDir() });
    expect(freshLogger.readAll()).toEqual([]);
  });

  it('exposes the logFile path', () => {
    const logger = createLogger({ logDir });
    expect(logger.logFile).toMatch(/session-\d+\.jsonl$/);
  });

  it('persists entries to disk in JSONL format', () => {
    const logger = createLogger({ logDir });
    logger.log(sampleEntry({ id: 'disk-check' }));
    const raw = fs.readFileSync(logger.logFile, 'utf-8').trim();
    const lines = raw.split('\n');
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.id).toBe('disk-check');
  });
});
