# compare

Compare two routewatch log files to identify matching, missing, and extra routes between them.

## Usage

```bash
bun run src/compare-cli.ts <log-a> <log-b>
```

## Output

For each pair of matching routes (same method + URL), the comparison shows:

- **status match** — whether the HTTP status codes are identical
- **body match** — whether the response bodies are deeply equal

Routes that exist only in one log are listed separately.

## Example

```
Matched: 3
  [status:✓ body:✓] GET /api/users → 200 vs 200
  [status:✗ body:✗] POST /api/orders → 201 vs 400
  [status:✓ body:✗] GET /api/profile → 200 vs 200
Only in A (1):
  DELETE /api/session
Only in B (1):
  GET /api/settings
```

## API

### `compareByPath(a, b): CompareResult`

Compares two arrays of `LogEntry` objects by `method + url`.

### `formatCompare(result): string`

Returns a human-readable summary string.

### `printCompare(result): void`

Prints the formatted comparison to stdout.
