# Pipeline

The `pipeline` module provides a composable, ordered processing chain for log entries. Steps are pure functions that transform an array of `LogEntry` objects, making it easy to combine filtering, sorting, and slicing operations.

## API

### `createPipeline(): Pipeline`
Creates a new empty pipeline with no steps.

### `addStep(pipeline, step): Pipeline`
Returns a new pipeline with the given step appended. The original pipeline is not mutated.

### `runPipeline(pipeline, entries): LogEntry[]`
Executes all steps in order, passing the output of each step as input to the next.

### `parsePipelineArgs(args): PipelineStep[]`
Parses CLI-style arguments into a list of pipeline steps.

| Flag | Description |
|------|-------------|
| `--limit <n>` | Keep only the first `n` entries |
| `--skip <n>` | Skip the first `n` entries |
| `--status <code>` | Keep only entries with the given HTTP status |
| `--method <verb>` | Keep only entries with the given HTTP method |
| `--sort-by <field>` | Sort entries by a LogEntry field |

### `formatPipelineResult(entries): string`
Formats the processed entries as `[METHOD] url -> status` lines.

### `printPipelineResult(entries): void`
Prints the formatted result to stdout.

## Example

```ts
import { createPipeline, addStep, runPipeline } from "./pipeline";

let pipeline = createPipeline();
pipeline = addStep(pipeline, (entries) => entries.filter((e) => e.status >= 400));
pipeline = addStep(pipeline, (entries) => entries.slice(0, 10));

const results = runPipeline(pipeline, allEntries);
```
