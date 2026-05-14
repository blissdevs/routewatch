# normalize

The `normalize` module provides utilities to canonicalize log entries for consistent comparison, deduplication, and diffing.

## Functions

### `normalizeHeaders(headers, opts?)`

Normalizes a headers object:
- **lowercaseHeaders** (default: `true`) — converts all header keys to lowercase
- **sortHeaders** (default: `true`) — sorts header keys alphabetically

```ts
const headers = normalizeHeaders({ "Content-Type": "application/json", "X-ID": "1" });
// { "content-type": "application/json", "x-id": "1" }
```

### `normalizeUrl(url)`

Sorts query string parameters alphabetically for stable comparison.

```ts
normalizeUrl("http://localhost/api?z=3&a=1");
// "http://localhost/api?a=1&z=3"
```

### `normalizeBody(body, trim)`

Trims whitespace and re-serializes JSON bodies for canonical form. Non-JSON bodies are returned trimmed.

### `normalizeEntry(entry, opts?)`

Applies all normalization steps to a single `LogEntry`.

```ts
const clean = normalizeEntry(entry);
```

### `normalizeEntries(entries, opts?)`

Applies normalization to an array of entries.

## Options

| Option             | Default | Description                            |
|--------------------|---------|----------------------------------------|
| `lowercaseHeaders` | `true`  | Lowercase all header keys              |
| `sortHeaders`      | `true`  | Sort headers alphabetically            |
| `trimBody`         | `true`  | Trim and compact JSON bodies           |
| `normalizeUrl`     | `true`  | Sort URL query parameters              |

## Use Cases

- Pre-processing entries before `diff` or `dedupe`
- Ensuring stable fingerprints across equivalent requests
- Cleaning up captured entries before export
