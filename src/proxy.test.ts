import http from "http";
import { createProxy } from "./proxy";
import { createLogger, readAll } from "./logger";
import fs from "fs";
import os from "os";
import path from "path";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "routewatch-proxy-"));
}

function startEchoServer(port: number): http.Server {
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          method: req.method,
          path: req.url,
          body: Buffer.concat(chunks).toString(),
        })
      );
    });
  });
  server.listen(port);
  return server;
}

describe("createProxy", () => {
  const ECHO_PORT = 54321;
  const PROXY_PORT = 54322;
  let echoServer: http.Server;
  let proxy: ReturnType<typeof createProxy>;
  let logDir: string;

  beforeAll((done) => {
    logDir = makeTempDir();
    echoServer = startEchoServer(ECHO_PORT);
    proxy = createProxy({
      target: `http://localhost:${ECHO_PORT}`,
      port: PROXY_PORT,
      logDir,
    });
    proxy.start();
    setTimeout(done, 100);
  });

  afterAll((done) => {
    proxy.stop();
    echoServer.close(done);
  });

  it("forwards GET requests to the target", (done) => {
    http.get(`http://localhost:${PROXY_PORT}/hello`, (res) => {
      expect(res.statusCode).toBe(200);
      done();
    });
  });

  it("logs the proxied request", (done) => {
    http.get(`http://localhost:${PROXY_PORT}/logged`, () => {
      setTimeout(() => {
        const logger = createLogger(logDir);
        const entries = readAll(logger);
        const found = entries.some(
          (e: { path?: string }) => e.path === "/logged"
        );
        expect(found).toBe(true);
        done();
      }, 50);
    });
  });

  it("forwards POST body to the target", (done) => {
    const body = JSON.stringify({ hello: "world" });
    const req = http.request(
      { hostname: "localhost", port: PROXY_PORT, path: "/post", method: "POST" },
      (res) => {
        let data = "";
        res.on("data", (c: string) => (data += c));
        res.on("end", () => {
          const parsed = JSON.parse(data);
          expect(parsed.body).toBe(body);
          done();
        });
      }
    );
    req.write(body);
    req.end();
  });
});
