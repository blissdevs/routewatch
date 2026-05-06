# Tags

The `tags` module lets you annotate log entries with arbitrary string labels, making it easy to organize and filter captured HTTP traffic.

## API

### `addTag(entry, tag)`
Returns a new entry with the given tag added. Duplicate tags are ignored.

### `removeTag(entry, tag)`
Returns a new entry with the given tag removed.

### `hasTag(entry, tag)`
Returns `true` if the entry has the given tag.

### `filterByTag(entries, tag)`
Returns entries that have the specified tag.

### `filterByTags(entries, tags, mode?)`
Filters entries by multiple tags.
- `mode: 'any'` (default) — entry must have **at least one** of the tags.
- `mode: 'all'` — entry must have **all** of the tags.

### `collectTags(entries)`
Returns a sorted list of all unique tags present across the given entries.

### `parseTagArgs(args)`
Parses tag values from a CLI args array. Supports:
- `--tag <value>`
- `--tag=<value>`
- `-t <value>`

## CLI Usage

```sh
# Filter replayed requests to only those tagged "slow"
routewatch replay --tag slow

# Filter by multiple tags (any match)
routewatch replay --tag slow --tag error
```

## Example

```ts
import { addTag, filterByTag } from './tags';

const tagged = addTag(entry, 'slow');
const slowEntries = filterByTag(allEntries, 'slow');
```
