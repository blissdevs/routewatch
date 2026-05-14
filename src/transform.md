# transform

Apply request transformations to log entries before replaying or exporting.

## Overview

The `transform` module lets you modify `LogEntry` objects using composable rules. Rules are pure functions and can be chained together via `applyTransforms`.

## Built-in Rules

### `setHeader(name, value)`
Adds or overwrites a request header.

```ts
import { setHeader, applyTransform } from "./transform";
const rule = setHeader("x-env", "staging");
const updated = applyTransform(entry, rule);
```

### `renameHeader(from, to)`
Renames a request header, preserving its value.

```ts
const rule = renameHeader("authorization", "x-auth-token");
```

### `rewriteUrl(pattern, replacement)`
Replaces a regex pattern in the request URL.

```ts
const rule = rewriteUrl(/\/api/, "/v2");
```

## CLI Flags

When using the CLI, pass transform options alongside replay or export commands:

```
--set-header NAME:VALUE
--rename-header FROM->TO
--rewrite-url PATTERN->REPLACEMENT
```

Example:
```
routewatch replay log.jsonl --set-header x-env:prod --rewrite-url /api->/v2
```

## Custom Transforms

Implement the `TransformFn` interface to build your own rule:

```ts
const myRule: TransformRule = {
  name: "strip-query",
  transform: (entry) => ({
    ...entry,
    request: { ...entry.request, url: entry.request.url.split("?")[0] },
  }),
};
```
