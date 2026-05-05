import http from "http";
import https from "https";
import { URL } from "url";
import { createLogger, write } from "./logger";

export interface ProxyOptions {
  target: string;
  port: number;
  logDir?: string;
}

export interface ProxyRequest {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body: string;
  timestamp: string;
}

export function createProxy(options: ProxyOptions) {
  const logger = createLogger(options.logDir ?? "./logs");
  const targetUrl = new URL(options.target);
  const isHttps = targetUrl.protocol === "https:";
  const transport = isHttps ? https : http;

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => chunks.push(chunk));

    req.on("end", () => {
      const body = Buffer.concat(chunks).toString();
      const timestamp = new Date().toISOString();

      const entry: ProxyRequest = {
        method: req.method ?? "GET",
        path: req.url ?? "/",
        headers: req.headers as Record<string, string | string[] | undefined>,
        body,
        timestamp,
      };

      write(logger, entry);

      const proxyReq = transport.request(
        {
          hostname: targetUrl.hostname,
          port: targetUrl.port || (isHttps ? 443 : 80),
          path: req.url,
          method: req.method,
          headers: req.headers,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
          proxyRes.pipe(res);
        }
      );

      proxyReq.on("error", (err) => {
        console.error("[routewatch] proxy error:", err.message);
        res.writeHead(502);
        res.end("Bad Gateway");
      });

      if (body) proxyReq.write(body);
      proxyReq.end();
    });
  });

  return {
    start() {
      server.listen(options.port, () => {
        console.log(
          `[routewatch] Proxying ${options.target} on http://localhost:${options.port}`
        );
      });
    },
    stop() {
      server.close();
    },
    server,
  };
}
