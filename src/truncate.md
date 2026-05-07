# Truncate Module

The `truncate` module provides utilities for limiting the size of request and response bodies when logging or displaying HTTP entries.

## Why Truncation?

When proxying or replaying HTTP traffic, response and request bodies can be arbitrarily large. Printing multi-megabyte JSON payloads to the terminal is rarely useful and can make logs difficult to read.

## API

### `truncateString(value, options)`

Truncates a plain string to `maxLength` characters. Appends an indicator (default: `... [truncated]`) when the string is cut.

```ts
truncateString("hello world", { maxLength: 5 });
// => "hello... [truncated]"
```

### `truncateBody(body, options)`

Accepts any value (string, object, null). Objects are JSON-serialized before truncation. Null/undefined return an empty string.

```ts
truncateBody({ key: "value" }, { maxLength: 10 });
// => '{"key":"va... [truncated]'
```

### `isTruncated(value, maxLength?)`

Returns `true` if the string exceeds the given max length. Useful for conditionally showing a "body truncated" warning in output.

### `truncateEntry(entry, options)`

Returns a **shallow copy** of a log entry with `requestBody` and `responseBody` fields truncated. The original entry is not mutated.

```ts
const display = truncateEntry(entry, { maxLength: 256 });
```

### `truncateEntries(entries, options)`

Convenience wrapper that applies `truncateEntry` to an array of log entries. Returns a new array; the original entries are not mutated.

```ts
const displayEntries = truncateEntries(entries, { maxLength: 256 });
```

## Default Options

| Option      | Default              |
|-------------|----------------------|
| `maxLength` | `512`                |
| `indicator` | `... [truncated]`    |

## Integration

The `truncateEntry` and `truncateEntries` helpers are designed to wrap entries before passing them to `printSummary` or any terminal output function, keeping the stored log entries intact.
