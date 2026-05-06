# Snapshot

The `snapshot` module lets you capture and persist a named set of log entries at a point in time. Snapshots are useful for comparing request/response behaviour across sessions or code changes.

## API

### `createSnapshot(label, entries): Snapshot`

Builds a new `Snapshot` object in memory. Assigns a unique `id` and the current ISO timestamp.

```ts
const snap = createSnapshot("before-refactor", entries);
```

### `saveSnapshot(dir, snapshot): string`

Persists a snapshot as a JSON file inside `dir`. The directory is created if it does not exist. Returns the full file path.

```ts
const filepath = saveSnapshot(".routewatch/snapshots", snap);
```

### `loadSnapshot(filepath): Snapshot`

Reads and parses a snapshot from disk.

```ts
const snap = loadSnapshot(".routewatch/snapshots/snap_123.json");
```

### `listSnapshots(dir): Snapshot[]`

Returns all snapshots found in `dir`, sorted by `createdAt` ascending. Returns an empty array if the directory does not exist.

```ts
const all = listSnapshots(".routewatch/snapshots");
```

### `deleteSnapshot(dir, id): boolean`

Removes the snapshot file for the given `id`. Returns `true` on success, `false` if the file was not found.

```ts
const removed = deleteSnapshot(".routewatch/snapshots", snap.id);
```

## File format

Each snapshot is stored as a pretty-printed JSON file named `<id>.json`:

```json
{
  "id": "snap_1718000000000_a3f9z2",
  "label": "before-refactor",
  "createdAt": "2024-06-10T12:00:00.000Z",
  "entries": [ ... ]
}
```
