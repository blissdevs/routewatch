import type { LogEntry } from './logger';

export interface Template {
  id: string;
  name: string;
  method: string;
  urlPattern: string;
  headers?: Record<string, string>;
  body?: string;
  tags?: string[];
  createdAt: string;
}

export function createTemplate(
  name: string,
  method: string,
  urlPattern: string,
  options: Partial<Pick<Template, 'headers' | 'body' | 'tags'>> = {}
): Template {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    method: method.toUpperCase(),
    urlPattern,
    headers: options.headers ?? {},
    body: options.body,
    tags: options.tags ?? [],
    createdAt: new Date().toISOString(),
  };
}

export function entryToTemplate(entry: LogEntry, name: string): Template {
  return createTemplate(name, entry.method, entry.url, {
    headers: entry.requestHeaders as Record<string, string>,
    body: entry.requestBody,
  });
}

export function applyTemplate(
  template: Template,
  vars: Record<string, string> = {}
): { method: string; url: string; headers: Record<string, string>; body?: string } {
  let url = template.urlPattern;
  let body = template.body;

  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    url = url.split(placeholder).join(value);
    if (body) body = body.split(placeholder).join(value);
  }

  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(template.headers ?? {})) {
    headers[k] = v;
    for (const [key, value] of Object.entries(vars)) {
      headers[k] = headers[k].split(`{{${key}}}`).join(value);
    }
  }

  return { method: template.method, url, headers, body };
}

export function formatTemplate(template: Template): string {
  const lines: string[] = [
    `[${template.id}] ${template.name}`,
    `  Method:  ${template.method}`,
    `  Pattern: ${template.urlPattern}`,
  ];
  if (template.tags && template.tags.length > 0) {
    lines.push(`  Tags:    ${template.tags.join(', ')}`);
  }
  if (template.body) {
    lines.push(`  Body:    ${template.body.slice(0, 60)}${template.body.length > 60 ? '...' : ''}`);
  }
  return lines.join('\n');
}

export function printTemplates(templates: Template[]): void {
  if (templates.length === 0) {
    console.log('No templates found.');
    return;
  }
  for (const t of templates) {
    console.log(formatTemplate(t));
    console.log();
  }
}
