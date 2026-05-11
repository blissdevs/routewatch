# archive

The `archive` module moves old log entries out of the active log file into timestamped archive files, keeping the working log lean without losing history.

## API

### `shouldArchive(entry, opts)`

Returns `true` if the entry qualifies for archiving based on the provided options.

```ts
shouldArchive(entry, { olderThanMs: 60_000 }); // true if entry is >1 min old
```

### `partitionEntries(entries, opts)`

Splits an array of entries into `{ toArchive, toKeep }` buckets.

- `olderThanMs` — archive entries older than this many milliseconds.
- `maxEntries` — keep only the N most recent entries; archive the rest.

```ts
const { toArchive, toKeep } = partitionEntries(entries, { maxEntries: 500 });
```

### `archiveEntries(logPath, archiveDir, opts)`

Reads the active log at `logPath`, partitions entries, writes archived entries to a new file inside `archiveDir`, and rewrites `logPath` with only the kept entries.

Returns an `ArchiveResult`:

```ts
{
  archived: number;     // how many entries were moved
  remaining: number;    // how many entries remain in the active log
  archivePath: string;  // path of the new archive file (empty if nothing archived)
}
```

### `printArchiveResult(result)`

Prints a human-readable summary of the archive operation to stdout.

## CLI usage

```sh
# Archive entries older than 1 hour
routewatch archive --older-than 3600000

# Keep only the last 200 entries, archive the rest
routewatch archive --max-entries 200
```

## Archive file format

Archive files are NDJSON (one JSON entry per line), named with an ISO timestamp:

```
archives/archive-2024-06-01T12-00-00-000Z.ndjson
```
