import type { LogEntry } from './logger'

export interface Annotation {
  entryId: string
  note: string
  createdAt: string
  updatedAt: string
}

export type AnnotationMap = Record<string, Annotation>

export function createAnnotation(entryId: string, note: string): Annotation {
  const now = new Date().toISOString()
  return { entryId, note, createdAt: now, updatedAt: now }
}

export function addAnnotation(
  map: AnnotationMap,
  entryId: string,
  note: string
): AnnotationMap {
  const existing = map[entryId]
  const now = new Date().toISOString()
  return {
    ...map,
    [entryId]: existing
      ? { ...existing, note, updatedAt: now }
      : createAnnotation(entryId, note),
  }
}

export function removeAnnotation(map: AnnotationMap, entryId: string): AnnotationMap {
  const next = { ...map }
  delete next[entryId]
  return next
}

export function getAnnotation(map: AnnotationMap, entryId: string): Annotation | undefined {
  return map[entryId]
}

export function annotateEntry(
  entry: LogEntry,
  map: AnnotationMap
): LogEntry & { annotation?: string } {
  const ann = map[entry.id]
  return ann ? { ...entry, annotation: ann.note } : { ...entry }
}

export function listAnnotations(map: AnnotationMap): Annotation[] {
  return Object.values(map).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  )
}
