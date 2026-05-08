import { describe, it, expect, beforeEach } from 'bun:test'
import {
  createAnnotation,
  addAnnotation,
  removeAnnotation,
  getAnnotation,
  annotateEntry,
  listAnnotations,
  type AnnotationMap,
} from './annotate'
import type { LogEntry } from './logger'

function makeEntry(id = 'entry-1'): LogEntry {
  return {
    id,
    timestamp: new Date().toISOString(),
    method: 'GET',
    url: 'http://localhost/api/test',
    requestHeaders: {},
    requestBody: '',
    status: 200,
    responseHeaders: {},
    responseBody: 'ok',
    duration: 42,
  }
}

describe('createAnnotation', () => {
  it('creates annotation with timestamps', () => {
    const ann = createAnnotation('e1', 'hello')
    expect(ann.entryId).toBe('e1')
    expect(ann.note).toBe('hello')
    expect(ann.createdAt).toBeTruthy()
    expect(ann.updatedAt).toBe(ann.createdAt)
  })
})

describe('addAnnotation', () => {
  it('adds a new annotation', () => {
    const map = addAnnotation({}, 'e1', 'first note')
    expect(map['e1'].note).toBe('first note')
  })

  it('updates existing annotation and changes updatedAt', async () => {
    let map: AnnotationMap = addAnnotation({}, 'e1', 'original')
    await new Promise(r => setTimeout(r, 5))
    map = addAnnotation(map, 'e1', 'updated')
    expect(map['e1'].note).toBe('updated')
    expect(map['e1'].updatedAt >= map['e1'].createdAt).toBe(true)
  })
})

describe('removeAnnotation', () => {
  it('removes an existing annotation', () => {
    let map = addAnnotation({}, 'e1', 'note')
    map = removeAnnotation(map, 'e1')
    expect(map['e1']).toBeUndefined()
  })

  it('is a no-op for missing entry', () => {
    const map = removeAnnotation({}, 'missing')
    expect(Object.keys(map).length).toBe(0)
  })
})

describe('getAnnotation', () => {
  it('returns annotation if present', () => {
    const map = addAnnotation({}, 'e1', 'note')
    expect(getAnnotation(map, 'e1')?.note).toBe('note')
  })

  it('returns undefined if absent', () => {
    expect(getAnnotation({}, 'e99')).toBeUndefined()
  })
})

describe('annotateEntry', () => {
  it('attaches annotation note to entry', () => {
    const entry = makeEntry('e1')
    const map = addAnnotation({}, 'e1', 'important')
    const result = annotateEntry(entry, map)
    expect((result as any).annotation).toBe('important')
  })

  it('leaves entry unchanged when no annotation', () => {
    const entry = makeEntry('e2')
    const result = annotateEntry(entry, {})
    expect((result as any).annotation).toBeUndefined()
  })
})

describe('listAnnotations', () => {
  it('returns all annotations sorted by createdAt', () => {
    let map: AnnotationMap = {}
    map = addAnnotation(map, 'e1', 'a')
    map = addAnnotation(map, 'e2', 'b')
    const list = listAnnotations(map)
    expect(list.length).toBe(2)
    expect(list[0].entryId).toBe('e1')
  })
})
