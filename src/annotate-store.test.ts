import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
  createAnnotationStore,
  loadAnnotations,
  saveAnnotations,
  persistAnnotation,
  deleteAnnotation,
} from './annotate-store'

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'annotate-store-test-'))
}

describe('annotate-store', () => {
  let dir: string

  beforeEach(() => {
    dir = makeTempDir()
  })

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('returns empty map when file does not exist', () => {
    const store = createAnnotationStore(dir)
    expect(loadAnnotations(store)).toEqual({})
  })

  it('saves and loads annotations', () => {
    const store = createAnnotationStore(dir)
    const map = { 'e1': { entryId: 'e1', note: 'hi', createdAt: 'now', updatedAt: 'now' } }
    saveAnnotations(store, map)
    const loaded = loadAnnotations(store)
    expect(loaded['e1'].note).toBe('hi')
  })

  it('persistAnnotation adds and saves', () => {
    const store = createAnnotationStore(dir)
    persistAnnotation(store, 'e2', 'test note')
    const loaded = loadAnnotations(store)
    expect(loaded['e2'].note).toBe('test note')
  })

  it('persistAnnotation updates existing note', () => {
    const store = createAnnotationStore(dir)
    persistAnnotation(store, 'e3', 'first')
    persistAnnotation(store, 'e3', 'second')
    const loaded = loadAnnotations(store)
    expect(loaded['e3'].note).toBe('second')
  })

  it('deleteAnnotation removes entry and persists', () => {
    const store = createAnnotationStore(dir)
    persistAnnotation(store, 'e4', 'to delete')
    deleteAnnotation(store, 'e4')
    const loaded = loadAnnotations(store)
    expect(loaded['e4']).toBeUndefined()
  })

  it('handles corrupt file gracefully', () => {
    const store = createAnnotationStore(dir)
    fs.writeFileSync(store.filePath, 'not json', 'utf-8')
    expect(loadAnnotations(store)).toEqual({})
  })
})
