# cluster

Groups log entries into clusters based on a shared attribute, useful for identifying patterns and hotspots in captured traffic.

## Usage

```ts
import { clusterEntries, printClusters } from "./cluster";
import { readAll } from "./logger";

const entries = await readAll("./routewatch.log");
const clusters = clusterEntries(entries, "path");
printClusters(clusters);
```

## Cluster Dimensions

| `by`     | Description                          |
|----------|--------------------------------------|
| `path`   | Groups by URL pathname               |
| `status` | Groups by HTTP response status code  |
| `method` | Groups by HTTP method (GET, POST…)   |
| `host`   | Groups by request hostname           |

## Output Example

```
[/api/users]
  count:        42
  avg duration: 134ms
  error rate:   5%

[/api/items]
  count:        17
  avg duration: 89ms
  error rate:   0%
```

## API

### `clusterEntries(entries, by)`

Returns an array of `Cluster` objects sorted by entry count (descending).

### `getClusterKey(entry, by)`

Extracts the grouping key from a single entry.

### `formatCluster(cluster)`

Returns a formatted multi-line string for a single cluster.

### `printClusters(clusters)`

Prints all clusters to stdout.
