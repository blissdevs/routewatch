import { describe, it, expect, beforeEach } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createBookmarkStore, persistBookmark, deleteBookmark } from './bookmark-store';
import { createBookmark } from './bookmark';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-bm-'));
}

describe('createBookmarkStore', () => {
  it('returns empty array when file does not exist', () => {
    const dir = makeTempDir();
    const store = createBookmarkStore(dir);
    expect(store.load()).toEqual([]);
  });

  it('saves and loads bookmarks', () => {
    const dir = makeTempDir();
    const store = createBookmarkStore(dir);
    const bm = createBookmark('entry_001', 'test');
    store.save([bm]);
    const loaded = store.load();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].label).toBe('test');
  });

  it('returns empty array on malformed JSON', () => {
    const dir = makeTempDir();
    const store = createBookmarkStore(dir);
    fs.writeFileSync(store.filePath, 'not-json', 'utf-8');
    expect(store.load()).toEqual([]);
  });
});

describe('persistBookmark', () => {
  it('adds a bookmark and persists it', () => {
    const dir = makeTempDir();
    const store = createBookmarkStore(dir);
    const bm = createBookmark('entry_002', 'saved');
    const result = persistBookmark(store, bm);
    expect(result).toHaveLength(1);
    expect(store.load()[0].entryId).toBe('entry_002');
  });

  it('throws on duplicate label+entry', () => {
    const dir = makeTempDir();
    const store = createBookmarkStore(dir);
    const bm = createBookmark('entry_003', 'dup');
    persistBookmark(store, bm);
    const bm2 = createBookmark('entry_003', 'dup');
    expect(() => persistBookmark(store, bm2)).toThrow();
  });
});

describe('deleteBookmark', () => {
  it('removes a bookmark by id', () => {
    const dir = makeTempDir();
    const store = createBookmarkStore(dir);
    const bm = createBookmark('entry_004', 'remove-me');
    persistBookmark(store, bm);
    const result = deleteBookmark(store, bm.id);
    expect(result).toHaveLength(0);
    expect(store.load()).toHaveLength(0);
  });
});
