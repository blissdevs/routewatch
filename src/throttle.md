# throttle

Simulate network throttle conditions when replaying HTTP requests.

## Overview

The `throttle` module introduces artificial latency and bandwidth constraints during replay, helping you test how your application behaves under degraded network conditions.

## Presets

| Name       | Latency | Bandwidth  |
|------------|---------|------------|
| `slow3g`   | 400ms   | 50 KB/s    |
| `fast3g`   | 100ms   | 180 KB/s   |
| `broadband`| 20ms    | 10 MB/s    |
| `none`     | 0ms     | unlimited  |

## CLI Flags

```
--throttle <preset>   Apply a named network preset
--delay <ms>          Apply a fixed delay in milliseconds
```

## Usage

```ts
import { parseThrottleArgs, applyThrottle } from "./throttle";

const opts = parseThrottleArgs(process.argv.slice(2));

// Inside your replay loop:
const bodyBytes = Buffer.byteLength(entry.responseBody ?? "");
await applyThrottle(bodyBytes, opts);
```

## Functions

### `getPreset(name)`
Returns the `ThrottleOptions` for a named preset.

### `parseThrottleArgs(args)`
Parses CLI arguments and returns a `ThrottleOptions` object.

### `computeTransferDelay(bytes, opts)`
Calculates the additional delay (ms) caused by bandwidth limits.

### `applyThrottle(bodyBytes, opts)`
Asynchronously waits for the combined latency + transfer delay.

### `formatThrottle(opts)`
Returns a human-readable summary of the throttle configuration.
