import * as fs from 'fs';
import * as path from 'path';
import type { Template } from './template';

export interface TemplateStore {
  dir: string;
}

export function createTemplateStore(dir: string): TemplateStore {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return { dir };
}

function templatePath(store: TemplateStore, id: string): string {
  return path.join(store.dir, `${id}.json`);
}

export function saveTemplate(store: TemplateStore, template: Template): void {
  fs.writeFileSync(templatePath(store, template.id), JSON.stringify(template, null, 2));
}

export function loadTemplate(store: TemplateStore, id: string): Template | null {
  const p = templatePath(store, id);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as Template;
}

export function deleteTemplate(store: TemplateStore, id: string): boolean {
  const p = templatePath(store, id);
  if (!fs.existsSync(p)) return false;
  fs.unlinkSync(p);
  return true;
}

export function listTemplates(store: TemplateStore): Template[] {
  if (!fs.existsSync(store.dir)) return [];
  return fs
    .readdirSync(store.dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(store.dir, f), 'utf-8')) as Template)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function findTemplateByName(store: TemplateStore, name: string): Template | null {
  return listTemplates(store).find((t) => t.name === name) ?? null;
}
