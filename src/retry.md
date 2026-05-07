# retry

The `retry` module provides automatic retry logic for replaying individual log entries against a target server.

## API

### `retryEntry(entry, options?): Promise<RetryResult>`

Replays a single `LogEntry` up to `maxAttempts` times, stopping early on success.

**Options:**

| Option        | Type      | Default | Description                              |
|---------------|-----------|---------|------------------------------------------|
| `maxAttempts` | `number`  | `3`     | Maximum number of request attempts       |
| `delayMs`     | `number`  | `500`   | Base delay between attempts (ms)         |
| `backoff`     | `boolean` | `true`  | Multiply delay by attempt number if true |

**Returns:** `RetryResult`

```ts
{
  entry: LogEntry;      // original entry
  attempts: number;     // how many attempts were made
  success: boolean;     // true if any attempt returned 2xx
  lastStatus?: number;  // last HTTP status code received
  error?: string;       // last error message if all attempts threw
}
```

### `formatRetryResult(result): string`

Returns a human-readable summary line for a retry result.

### `printRetryResult(result): void`

Prints the formatted result to stdout.

## Example

```ts
import { retryEntry, printRetryResult } from "./retry";
import { readAll } from "./logger";

const entries = await readAll("./requests.log");
for (const entry of entries) {
  const result = await retryEntry(entry, { maxAttempts: 5, delayMs: 200 });
  printRetryResult(result);
}
```

Backoff example: with `delayMs: 100` and `backoff: true`, delays will be 100 ms, 200 ms, 300 ms, etc.
