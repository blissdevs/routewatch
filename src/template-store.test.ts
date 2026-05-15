import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createTemplateStore,
  saveTemplate,
  loadTemplate,
  deleteTemplate,
  listTemplates,
  findTemplateByName,
} from './template-store';
import { createTemplate } from './template';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-template-'));
}

describe('template-store', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('creates the store directory if missing', () => {
    const newDir = path.join(dir, 'templates');
    createTemplateStore(newDir);
    expect(fs.existsSync(newDir)).toBe(true);
  });

  it('saves and loads a template', () => {
    const store = createTemplateStore(dir);
    const t = createTemplate('test', 'GET', '/api/{{id}}');
    saveTemplate(store, t);
    const loaded = loadTemplate(store, t.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe('test');
    expect(loaded?.urlPattern).toBe('/api/{{id}}');
  });

  it('returns null for missing template', () => {
    const store = createTemplateStore(dir);
    expect(loadTemplate(store, 'nonexistent')).toBeNull();
  });

  it('deletes a template', () => {
    const store = createTemplateStore(dir);
    const t = createTemplate('to-delete', 'DELETE', '/api/items');
    saveTemplate(store, t);
    expect(deleteTemplate(store, t.id)).toBe(true);
    expect(loadTemplate(store, t.id)).toBeNull();
  });

  it('returns false when deleting nonexistent template', () => {
    const store = createTemplateStore(dir);
    expect(deleteTemplate(store, 'ghost')).toBe(false);
  });

  it('lists all templates in creation order', () => {
    const store = createTemplateStore(dir);
    const t1 = createTemplate('alpha', 'GET', '/a');
    const t2 = createTemplate('beta', 'POST', '/b');
    saveTemplate(store, t1);
    saveTemplate(store, t2);
    const list = listTemplates(store);
    expect(list).toHaveLength(2);
    expect(list[0].name).toBe('alpha');
    expect(list[1].name).toBe('beta');
  });

  it('returns empty list for empty store', () => {
    const store = createTemplateStore(dir);
    expect(listTemplates(store)).toEqual([]);
  });

  it('finds a template by name', () => {
    const store = createTemplateStore(dir);
    const t = createTemplate('my-template', 'PUT', '/api/resource');
    saveTemplate(store, t);
    const found = findTemplateByName(store, 'my-template');
    expect(found?.id).toBe(t.id);
  });

  it('returns null when name not found', () => {
    const store = createTemplateStore(dir);
    expect(findTemplateByName(store, 'missing')).toBeNull();
  });
});
