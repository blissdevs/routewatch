import * as fs from 'fs'
import * as path from 'path'
import type { AnnotationMap } from './annotate'

export interface AnnotationStore {
  filePath: string
}

export function createAnnotationStore(dir: string): AnnotationStore {
  return { filePath: path.join(dir, 'annotations.json') }
}

export function loadAnnotations(store: AnnotationStore): AnnotationMap {
  if (!fs.existsSync(store.filePath)) return {}
  try {
    const raw = fs.readFileSync(store.filePath, 'utf-8')
    return JSON.parse(raw) as AnnotationMap
  } catch {
    return {}
  }
}

export function saveAnnotations(store: AnnotationStore, map: AnnotationMap): void {
  fs.writeFileSync(store.filePath, JSON.stringify(map, null, 2), 'utf-8')
}

export function persistAnnotation(
  store: AnnotationStore,
  entryId: string,
  note: string
): AnnotationMap {
  const { addAnnotation } = require('./annotate')
  const map = loadAnnotations(store)
  const updated = addAnnotation(map, entryId, note)
  saveAnnotations(store, updated)
  return updated
}

export function deleteAnnotation(store: AnnotationStore, entryId: string): AnnotationMap {
  const { removeAnnotation } = require('./annotate')
  const map = loadAnnotations(store)
  const updated = removeAnnotation(map, entryId)
  saveAnnotations(store, updated)
  return updated
}
