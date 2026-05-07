# group

Groups log entries by a shared field for quick analysis.

## Fields

| Field    | Description                          |
|----------|--------------------------------------|
| `method` | HTTP method (GET, POST, etc.)        |
| `status` | HTTP response status code            |
| `host`   | Hostname extracted from request URL  |
| `path`   | Pathname extracted from request URL  |

## API

### `groupEntries(entries, field)`

Groups an array of `LogEntry` objects by the given field. Returns an array of
`GroupResult` objects sorted by count (descending).

```ts
import { groupEntries } from "./group";

const groups = groupEntries(entries, "status");
for (const g of groups) {
  console.log(`${g.key}: ${g.count} requests`);
}
```

### `getGroupKey(entry, field)`

Returns the grouping key for a single entry.

### `formatGroup(result)`

Formats a `GroupResult` as a human-readable string.

```
[GET] 12 requests
[POST] 4 requests
```

### `printGroups(results)`

Prints all group results to stdout.

## GroupResult

```ts
interface GroupResult {
  key: string;       // the grouped value
  entries: LogEntry[];
  count: number;
}
```
