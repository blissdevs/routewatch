import { LogEntry } from './logger';

export interface Bookmark {
  id: string;
  label: string;
  entryId: string;
  createdAt: string;
  note?: string;
}

export function createBookmark(
  entryId: string,
  label: string,
  note?: string
): Bookmark {
  return {
    id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label,
    entryId,
    createdAt: new Date().toISOString(),
    note,
  };
}

export function addBookmark(bookmarks: Bookmark[], bookmark: Bookmark): Bookmark[] {
  if (bookmarks.some((b) => b.entryId === bookmark.entryId && b.label === bookmark.label)) {
    throw new Error(`Bookmark with label "${bookmark.label}" already exists for this entry`);
  }
  return [...bookmarks, bookmark];
}

export function removeBookmark(bookmarks: Bookmark[], id: string): Bookmark[] {
  return bookmarks.filter((b) => b.id !== id);
}

export function findBookmarksByLabel(bookmarks: Bookmark[], label: string): Bookmark[] {
  return bookmarks.filter((b) => b.label === label);
}

export function findBookmarksByEntry(bookmarks: Bookmark[], entryId: string): Bookmark[] {
  return bookmarks.filter((b) => b.entryId === entryId);
}

export function updateBookmarkNote(
  bookmarks: Bookmark[],
  id: string,
  note: string
): Bookmark[] {
  return bookmarks.map((b) => (b.id === id ? { ...b, note } : b));
}

export function formatBookmark(bookmark: Bookmark): string {
  const note = bookmark.note ? ` — ${bookmark.note}` : '';
  return `[${bookmark.label}] ${bookmark.entryId} (${bookmark.createdAt})${note}`;
}
