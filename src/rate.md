# Rate Analysis

The `rate` module computes request throughput and latency statistics over a sliding time window.

## Functions

### `computeRate(entries, windowMs?)`

Analyses a list of `LogEntry` objects and returns a `RateResult`.

- `windowMs` — size of the sliding window in milliseconds (default: `60000` / 1 minute)
- Only entries whose `timestamp` falls within `[now - windowMs, now]` are included

**Returns:**

| Field | Description |
|---|---|
| `totalRequests` | Number of requests in the window |
| `requestsPerSecond` | Average RPS across the window |
| `requestsPerMinute` | Alias for `totalRequests` when window = 60s |
| `peakRps` | Highest requests observed in any single second |
| `fastestMs` | Minimum `durationMs` among windowed entries |
| `slowestMs` | Maximum `durationMs` among windowed entries |
| `avgMs` | Mean `durationMs` among windowed entries |

### `formatRate(result)`

Returns a human-readable multi-line string summarising the `RateResult`.

### `printRate(result)`

Prints the formatted rate summary to stdout.

## Example

```ts
import { readAll } from "./logger";
import { computeRate, printRate } from "./rate";

const entries = await readAll("./routewatch.log");
const result = computeRate(entries, 60_000);
printRate(result);
```

## Notes

- Entries with `durationMs` of `0` or `undefined` are excluded from latency calculations.
- Peak RPS uses 1-second epoch buckets derived from each entry's `timestamp`.
