# stats

The `stats` module computes aggregate statistics over a collection of `LogEntry` records captured by the proxy.

## Usage

```ts
import { computeStats, formatStats, printStats } from "./stats";
import { readAll } from "./logger";

const entries = await readAll("./routewatch.log");
const stats = computeStats(entries);
printStats(stats);
```

## API

### `computeStats(entries: LogEntry[]): EntryStats`

Returns an `EntryStats` object with the following fields:

| Field | Type | Description |
|---|---|---|
| `totalRequests` | `number` | Total number of log entries |
| `uniquePaths` | `number` | Number of distinct request paths |
| `methodCounts` | `Record<string, number>` | Count per HTTP method |
| `statusCounts` | `Record<string, number>` | Count per HTTP status code |
| `avgResponseTime` | `number \| null` | Average duration in ms, or `null` if no durations recorded |
| `slowestEntry` | `LogEntry \| null` | Entry with the highest duration |
| `fastestEntry` | `LogEntry \| null` | Entry with the lowest duration |
| `errorRate` | `number` | Fraction of requests with status >= 400 (0–1) |

### `formatStats(stats: EntryStats): string`

Formats an `EntryStats` object into a human-readable multi-line string.

### `printStats(stats: EntryStats): void`

Prints the formatted stats to stdout via `console.log`.

## Notes

- Entries without a `duration` field are excluded from timing calculations.
- Error rate counts both 4xx and 5xx responses.
- Method names are normalised to uppercase.
