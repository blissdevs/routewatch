import { describe, it, expect, beforeEach } from 'bun:test';
import {
  createBookmark,
  addBookmark,
  removeBookmark,
  findBookmarksByLabel,
  findBookmarksByEntry,
  updateBookmarkNote,
  formatBookmark,
  Bookmark,
} from './bookmark';

function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: 'bm_test_abc',
    label: 'important',
    entryId: 'entry_001',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('createBookmark', () => {
  it('creates a bookmark with required fields', () => {
    const bm = createBookmark('entry_001', 'important');
    expect(bm.entryId).toBe('entry_001');
    expect(bm.label).toBe('important');
    expect(bm.id).toMatch(/^bm_/);
    expect(bm.note).toBeUndefined();
  });

  it('includes optional note', () => {
    const bm = createBookmark('entry_002', 'bug', 'Reproduces the 500 error');
    expect(bm.note).toBe('Reproduces the 500 error');
  });
});

describe('addBookmark', () => {
  it('adds a bookmark to the list', () => {
    const bm = makeBookmark();
    const result = addBookmark([], bm);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(bm.id);
  });

  it('throws if duplicate label+entry combination', () => {
    const bm = makeBookmark();
    expect(() => addBookmark([bm], makeBookmark())).toThrow();
  });
});

describe('removeBookmark', () => {
  it('removes bookmark by id', () => {
    const bm = makeBookmark();
    const result = removeBookmark([bm], bm.id);
    expect(result).toHaveLength(0);
  });

  it('returns unchanged list if id not found', () => {
    const bm = makeBookmark();
    const result = removeBookmark([bm], 'nonexistent');
    expect(result).toHaveLength(1);
  });
});

describe('findBookmarksByLabel', () => {
  it('returns bookmarks matching label', () => {
    const bms = [makeBookmark({ label: 'bug' }), makeBookmark({ id: 'bm_2', label: 'important' })];
    expect(findBookmarksByLabel(bms, 'bug')).toHaveLength(1);
  });
});

describe('findBookmarksByEntry', () => {
  it('returns bookmarks for a given entry', () => {
    const bms = [
      makeBookmark({ entryId: 'entry_001' }),
      makeBookmark({ id: 'bm_2', label: 'other', entryId: 'entry_002' }),
    ];
    expect(findBookmarksByEntry(bms, 'entry_001')).toHaveLength(1);
  });
});

describe('updateBookmarkNote', () => {
  it('updates the note of a bookmark', () => {
    const bm = makeBookmark();
    const result = updateBookmarkNote([bm], bm.id, 'new note');
    expect(result[0].note).toBe('new note');
  });
});

describe('formatBookmark', () => {
  it('formats without note', () => {
    const bm = makeBookmark();
    expect(formatBookmark(bm)).toContain('[important]');
    expect(formatBookmark(bm)).toContain('entry_001');
  });

  it('formats with note', () => {
    const bm = makeBookmark({ note: 'check this' });
    expect(formatBookmark(bm)).toContain('— check this');
  });
});
