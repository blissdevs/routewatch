import { LogEntry } from './logger';

export interface TaggedEntry extends LogEntry {
  tags?: string[];
}

export function addTag(entry: TaggedEntry, tag: string): TaggedEntry {
  const tags = entry.tags ? [...entry.tags] : [];
  if (!tags.includes(tag)) {
    tags.push(tag);
  }
  return { ...entry, tags };
}

export function removeTag(entry: TaggedEntry, tag: string): TaggedEntry {
  const tags = (entry.tags ?? []).filter((t) => t !== tag);
  return { ...entry, tags };
}

export function hasTag(entry: TaggedEntry, tag: string): boolean {
  return (entry.tags ?? []).includes(tag);
}

export function filterByTag(entries: TaggedEntry[], tag: string): TaggedEntry[] {
  return entries.filter((e) => hasTag(e, tag));
}

export function filterByTags(
  entries: TaggedEntry[],
  tags: string[],
  mode: 'any' | 'all' = 'any'
): TaggedEntry[] {
  if (tags.length === 0) return entries;
  return entries.filter((e) => {
    if (mode === 'all') return tags.every((t) => hasTag(e, t));
    return tags.some((t) => hasTag(e, t));
  });
}

export function collectTags(entries: TaggedEntry[]): string[] {
  const set = new Set<string>();
  for (const entry of entries) {
    for (const tag of entry.tags ?? []) {
      set.add(tag);
    }
  }
  return Array.from(set).sort();
}

export function parseTagArgs(args: string[]): string[] {
  const tags: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--tag' || args[i] === '-t') && args[i + 1]) {
      tags.push(args[++i]);
    } else if (args[i].startsWith('--tag=')) {
      tags.push(args[i].slice('--tag='.length));
    }
  }
  return tags;
}
