import * as http from 'http';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { replayRequest, replayAll } from './replay';
import { write } from './logger';
import type { LogEntry } from './logger';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'replay-test-'));
}

function startEchoServer(port: number): http.Server {
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ method: req.method, path: req.url, body }));
    });
  });
  server.listen(port);
  return server;
}

const sampleEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  id: 'test-1',
  timestamp: new Date().toISOString(),
  method: 'GET',
  path: '/hello',
  statusCode: 200,
  requestHeaders: {},
  requestBody: '',
  responseBody: 'ok',
  durationMs: 10,
  ...overrides,
});

describe('replayRequest', () => {
  let server: http.Server;
  const PORT = 19876;

  beforeAll((done) => {
    server = startEchoServer(PORT);
    server.on('listening', done);
  });

  afterAll((done) => server.close(done));

  test('replays a GET request and returns status 200', async () => {
    const entry = sampleEntry({ method: 'GET', path: '/ping' });
    const result = await replayRequest(entry, `http://localhost:${PORT}`);
    expect(result.statusCode).toBe(200);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    const parsed = JSON.parse(result.body);
    expect(parsed.path).toBe('/ping');
  });

  test('replays a POST request with body', async () => {
    const entry = sampleEntry({ method: 'POST', path: '/data', requestBody: '{"x":1}' });
    const result = await replayRequest(entry, `http://localhost:${PORT}`);
    expect(result.statusCode).toBe(200);
    const parsed = JSON.parse(result.body);
    expect(parsed.method).toBe('POST');
  });
});

describe('replayAll', () => {
  let server: http.Server;
  const PORT = 19877;

  beforeAll((done) => {
    server = startEchoServer(PORT);
    server.on('listening', done);
  });

  afterAll((done) => server.close(done));

  test('replays all entries from log file', async () => {
    const dir = makeTempDir();
    const logFile = path.join(dir, 'requests.log');
    await write(logFile, sampleEntry({ path: '/a' }));
    await write(logFile, sampleEntry({ path: '/b' }));
    const results = await replayAll(logFile, `http://localhost:${PORT}`);
    expect(results).toHaveLength(2);
    expect(results.map((r) => JSON.parse(r.body).path)).toEqual(['/a', '/b']);
  });

  test('filters entries by path prefix', async () => {
    const dir = makeTempDir();
    const logFile = path.join(dir, 'requests.log');
    await write(logFile, sampleEntry({ path: '/api/users' }));
    await write(logFile, sampleEntry({ path: '/health' }));
    const results = await replayAll(logFile, `http://localhost:${PORT}`, { filterPath: '/api' });
    expect(results).toHaveLength(1);
    expect(JSON.parse(results[0].body).path).toBe('/api/users');
  });
});
