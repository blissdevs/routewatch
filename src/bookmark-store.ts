import * as fs from 'fs';
import * as path from 'path';
import { Bookmark } from './bookmark';

export interface BookmarkStore {
  load(): Bookmark[];
  save(bookmarks: Bookmark[]): void;
  filePath: string;
}

export function createBookmarkStore(dir: string): BookmarkStore {
  const filePath = path.join(dir, 'bookmarks.json');

  function load(): Bookmark[] {
    if (!fs.existsSync(filePath)) return [];
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as Bookmark[];
    } catch {
      return [];
    }
  }

  function save(bookmarks: Bookmark[]): void {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(bookmarks, null, 2), 'utf-8');
  }

  return { load, save, filePath };
}

export function persistBookmark(
  store: BookmarkStore,
  bookmark: Bookmark
): Bookmark[] {
  const { addBookmark } = require('./bookmark');
  const current = store.load();
  const updated = addBookmark(current, bookmark);
  store.save(updated);
  return updated;
}

export function deleteBookmark(
  store: BookmarkStore,
  id: string
): Bookmark[] {
  const { removeBookmark } = require('./bookmark');
  const current = store.load();
  const updated = removeBookmark(current, id);
  store.save(updated);
  return updated;
}
