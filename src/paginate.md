# Paginate

The `paginate` module provides page-based navigation over log entries, making it easy to browse large request logs in the CLI.

## Usage

```ts
import { paginateEntries, formatPaginate } from "./paginate";
import { readAll } from "./logger";

const entries = await readAll("./routewatch.log");
const result = paginateEntries(entries, { page: 2, pageSize: 20 });
formatPaginate(result);
```

## CLI Flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--page` | `-p` | `1` | Page number to display |
| `--page-size` | `-n` | `20` | Number of entries per page |

## Output

```
Page 2 of 4 (80 total entries, 20 per page)
  [2024-01-15T10:00:00Z] GET /api/users → 200 (45ms)
  [2024-01-15T10:00:01Z] POST /api/orders → 201 (120ms)
  ...
  → Next: page 3
  ← Prev: page 1
```

## API

### `paginateEntries(entries, options)`

Slices the entries array for the requested page and returns a `PaginatedResult` containing metadata such as `total`, `totalPages`, `hasNext`, and `hasPrev`.

Page numbers are automatically clamped to valid bounds.

### `formatPaginate(result)`

Returns a formatted multi-line string summarising the current page.

### `printPaginate(result)`

Prints the formatted output to stdout.
