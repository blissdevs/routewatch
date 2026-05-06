# Bookmarks

The **bookmark** feature lets you tag specific log entries with a label and optional note for quick reference during debugging sessions.

## Data Model

```ts
interface Bookmark {
  id: string;        // unique identifier
  label: string;     // short name, e.g. "bug", "important"
  entryId: string;   // ID of the associated log entry
  createdAt: string; // ISO timestamp
  note?: string;     // optional free-text annotation
}
```

## Usage

### Create a bookmark

```ts
import { createBookmark } from './bookmark';
const bm = createBookmark('entry_abc123', 'bug', 'Triggers the 500 on /api/users');
```

### Persist bookmarks to disk

```ts
import { createBookmarkStore, persistBookmark } from './bookmark-store';
const store = createBookmarkStore('.routewatch');
persistBookmark(store, bm);
```

### Query bookmarks

```ts
import { findBookmarksByLabel, findBookmarksByEntry } from './bookmark';
const bugs = findBookmarksByLabel(store.load(), 'bug');
const forEntry = findBookmarksByEntry(store.load(), 'entry_abc123');
```

### Remove a bookmark

```ts
import { deleteBookmark } from './bookmark-store';
deleteBookmark(store, bm.id);
```

## Storage

Bookmarks are stored as a JSON array in `<logDir>/bookmarks.json` alongside the request log. The store is loaded fresh on each operation to avoid stale state.

## CLI Integration

Bookmarks can be managed via the CLI (planned):

```
routewatch bookmark add <entryId> --label bug --note "500 on /api"
routewatch bookmark list --label bug
routewatch bookmark remove <bookmarkId>
```
