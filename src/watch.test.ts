import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { watchLog } from "./watch";
import { LogEntry } from "./logger";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "routewatch-watch-"));
}

function makeEntry(id: string): LogEntry {
  return {
    id,
    timestamp: new Date().toISOString(),
    method: "GET",
    url: "/test",
    requestHeaders: {},
    requestBody: "",
    status: 200,
    responseHeaders: {},
    responseBody: "ok",
    durationMs: 10,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("watchLog", () => {
  it("calls callback when new entries are appended", async () => {
    const dir = makeTempDir();
    const logPath = path.join(dir, "log.ndjson");

    const received: LogEntry[] = [];
    const watcher = watchLog(logPath, (entries) => received.push(...entries), 100);

    const entry1 = makeEntry("a");
    fs.writeFileSync(logPath, JSON.stringify(entry1) + "\n");

    await sleep(300);
    watcher.stop();

    expect(received.length).toBe(1);
    expect(received[0].id).toBe("a");
  });

  it("detects multiple appended entries", async () => {
    const dir = makeTempDir();
    const logPath = path.join(dir, "log.ndjson");

    fs.writeFileSync(logPath, "");

    const received: LogEntry[] = [];
    const watcher = watchLog(logPath, (entries) => received.push(...entries), 100);

    await sleep(150);

    const entry1 = makeEntry("x");
    const entry2 = makeEntry("y");
    fs.appendFileSync(logPath, JSON.stringify(entry1) + "\n");
    fs.appendFileSync(logPath, JSON.stringify(entry2) + "\n");

    await sleep(300);
    watcher.stop();

    expect(received.length).toBeGreaterThanOrEqual(2);
    const ids = received.map((e) => e.id);
    expect(ids).toContain("x");
    expect(ids).toContain("y");
  });

  it("does not call callback when file does not change", async () => {
    const dir = makeTempDir();
    const logPath = path.join(dir, "log.ndjson");
    fs.writeFileSync(logPath, "");

    let callCount = 0;
    const watcher = watchLog(logPath, () => callCount++, 100);

    await sleep(350);
    watcher.stop();

    expect(callCount).toBe(0);
  });

  it("stop() prevents further callbacks", async () => {
    const dir = makeTempDir();
    const logPath = path.join(dir, "log.ndjson");

    const received: LogEntry[] = [];
    const watcher = watchLog(logPath, (entries) => received.push(...entries), 100);
    watcher.stop();

    fs.writeFileSync(logPath, JSON.stringify(makeEntry("z")) + "\n");
    await sleep(300);

    expect(received.length).toBe(0);
  });
});
