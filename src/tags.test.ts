import { describe, it, expect } from 'bun:test';
import {
  addTag,
  removeTag,
  hasTag,
  filterByTag,
  filterByTags,
  collectTags,
  parseTagArgs,
  TaggedEntry,
} from './tags';

function makeEntry(overrides: Partial<TaggedEntry> = {}): TaggedEntry {
  return {
    id: 'abc123',
    timestamp: new Date().toISOString(),
    method: 'GET',
    url: 'http://localhost:3000/api/test',
    requestHeaders: {},
    requestBody: '',
    status: 200,
    responseHeaders: {},
    responseBody: '{"ok":true}',
    durationMs: 42,
    ...overrides,
  };
}

describe('addTag', () => {
  it('adds a tag to an entry with no tags', () => {
    const entry = makeEntry();
    const result = addTag(entry, 'slow');
    expect(result.tags).toEqual(['slow']);
  });

  it('does not duplicate tags', () => {
    const entry = makeEntry({ tags: ['slow'] });
    const result = addTag(entry, 'slow');
    expect(result.tags).toEqual(['slow']);
  });

  it('does not mutate original entry', () => {
    const entry = makeEntry({ tags: ['a'] });
    addTag(entry, 'b');
    expect(entry.tags).toEqual(['a']);
  });
});

describe('removeTag', () => {
  it('removes an existing tag', () => {
    const entry = makeEntry({ tags: ['slow', 'error'] });
    const result = removeTag(entry, 'slow');
    expect(result.tags).toEqual(['error']);
  });

  it('handles missing tag gracefully', () => {
    const entry = makeEntry({ tags: ['a'] });
    const result = removeTag(entry, 'b');
    expect(result.tags).toEqual(['a']);
  });
});

describe('hasTag', () => {
  it('returns true when tag exists', () => {
    expect(hasTag(makeEntry({ tags: ['x'] }), 'x')).toBe(true);
  });

  it('returns false when tag missing', () => {
    expect(hasTag(makeEntry(), 'x')).toBe(false);
  });
});

describe('filterByTag', () => {
  it('filters entries by a single tag', () => {
    const entries = [
      makeEntry({ id: '1', tags: ['error'] }),
      makeEntry({ id: '2', tags: ['slow'] }),
      makeEntry({ id: '3', tags: ['error', 'slow'] }),
    ];
    const result = filterByTag(entries, 'error');
    expect(result.map((e) => e.id)).toEqual(['1', '3']);
  });
});

describe('filterByTags', () => {
  it('mode any returns entries with at least one matching tag', () => {
    const entries = [
      makeEntry({ id: '1', tags: ['a'] }),
      makeEntry({ id: '2', tags: ['b'] }),
      makeEntry({ id: '3', tags: ['c'] }),
    ];
    const result = filterByTags(entries, ['a', 'b'], 'any');
    expect(result.map((e) => e.id)).toEqual(['1', '2']);
  });

  it('mode all returns entries with all tags', () => {
    const entries = [
      makeEntry({ id: '1', tags: ['a', 'b'] }),
      makeEntry({ id: '2', tags: ['a'] }),
    ];
    const result = filterByTags(entries, ['a', 'b'], 'all');
    expect(result.map((e) => e.id)).toEqual(['1']);
  });

  it('returns all entries when tags list is empty', () => {
    const entries = [makeEntry({ id: '1' }), makeEntry({ id: '2' })];
    expect(filterByTags(entries, [])).toHaveLength(2);
  });
});

describe('collectTags', () => {
  it('collects unique sorted tags across entries', () => {
    const entries = [
      makeEntry({ tags: ['slow', 'auth'] }),
      makeEntry({ tags: ['error', 'slow'] }),
    ];
    expect(collectTags(entries)).toEqual(['auth', 'error', 'slow']);
  });
});

describe('parseTagArgs', () => {
  it('parses --tag flag', () => {
    expect(parseTagArgs(['--tag', 'slow', '--tag', 'error'])).toEqual(['slow', 'error']);
  });

  it('parses --tag= form', () => {
    expect(parseTagArgs(['--tag=auth'])).toEqual(['auth']);
  });

  it('parses -t shorthand', () => {
    expect(parseTagArgs(['-t', 'slow'])).toEqual(['slow']);
  });

  it('returns empty array when no tag args', () => {
    expect(parseTagArgs(['--method', 'GET'])).toEqual([]);
  });
});
