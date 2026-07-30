import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export interface RedirectConflictContext {
  source: string;
  existing: string;
  incoming: string;
  filePath: string;
}

export interface CollectFrontmatterRedirectsOptions {
  roots: string[];
  localePrefixes?: string[];
  redirectFields?: string[];
  targetPrefix?: string;
  onConflict?: (context: RedirectConflictContext) => void;
}

function normalizePathname(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return null;

  const withoutHash = trimmed.split('#')[0] ?? '';
  const withoutQuery = withoutHash.split('?')[0] ?? '';
  if (!withoutQuery) return null;

  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  const collapsed = withLeadingSlash.replace(/\/+/g, '/');

  if (collapsed !== '/' && collapsed.endsWith('/')) {
    return collapsed.slice(0, -1);
  }

  return collapsed;
}

function withRoutePrefix(pathname: string, routePrefix: string | undefined, localePrefix: string): string {
  const normalizedPrefix = normalizePathname(routePrefix);
  if (!normalizedPrefix || normalizedPrefix === '/') {
    return pathname;
  }

  if (localePrefix) {
    const localeRoot = `/${localePrefix}`;
    const localeScopedPrefix = `${localeRoot}${normalizedPrefix}`;

    if (
      pathname === localeRoot ||
      pathname === `${localeScopedPrefix}` ||
      pathname.startsWith(`${localeScopedPrefix}/`)
    ) {
      return pathname;
    }

    if (pathname.startsWith(`${localeRoot}/`)) {
      return normalizePathname(`${localeScopedPrefix}/${pathname.slice(localeRoot.length + 1)}`) ?? pathname;
    }

    return normalizePathname(`${localeScopedPrefix}${pathname}`) ?? pathname;
  }

  if (pathname === normalizedPrefix || pathname.startsWith(`${normalizedPrefix}/`)) {
    return pathname;
  }

  return normalizePathname(`${normalizedPrefix}${pathname}`) ?? pathname;
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function getFrontmatter(content: string): string {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return '';

  const startOffset = content.startsWith('---\r\n') ? 5 : 4;
  const endMarker = content.indexOf('\n---', startOffset);
  if (endMarker === -1) return '';

  return content.slice(startOffset, endMarker);
}

function getScalarField(frontmatter: string, fieldName: string): string | null {
  const pattern = new RegExp(`^${fieldName}:[\\t ]*(.+)$`, 'm');
  const match = frontmatter.match(pattern);
  if (!match) return null;

  return stripQuotes(match[1] ?? '');
}

function getListField(frontmatter: string, fieldName: string): string[] {
  const lines = frontmatter.split(/\r?\n/);
  const values: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (!new RegExp(`^${fieldName}:[\\t ]*$`).test(lines[i] ?? '')) continue;

    for (let j = i + 1; j < lines.length; j += 1) {
      const line = lines[j] ?? '';
      const itemMatch = line.match(/^\s*-\s+(.+)$/);

      if (itemMatch) {
        values.push(stripQuotes(itemMatch[1] ?? ''));
        continue;
      }

      if (line.trim() === '' || line.trim().startsWith('#')) {
        continue;
      }

      break;
    }
  }

  return values;
}

function getFieldValues(frontmatter: string, fieldName: string): string[] {
  const values: string[] = [];
  const scalar = getScalarField(frontmatter, fieldName);

  if (scalar) {
    if (scalar.startsWith('[') && scalar.endsWith(']')) {
      for (const value of scalar.slice(1, -1).split(',')) {
        const parsed = stripQuotes(value);
        if (parsed) values.push(parsed);
      }
    } else {
      values.push(scalar);
    }
  }

  values.push(...getListField(frontmatter, fieldName));
  return [...new Set(values)].filter(Boolean);
}

function walkMarkdownFiles(dir: string): string[] {
  let entries: Array<{ name: string; isDirectory(): boolean }>;

  try {
    entries = readdirSync(dir, { withFileTypes: true, encoding: 'utf8' });
  } catch {
    return [];
  }

  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue;

    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(absolutePath));
      continue;
    }

    if (/\.(md|mdx|mdoc)$/i.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
}

function routeFromFile(
  filePath: string,
  root: string,
  localePrefixes: Set<string>,
  slugValue: string | null,
  targetPrefix?: string
): string | null {
  const relative = path.relative(root, filePath).split(path.sep).join('/');
  const withoutExtension = relative.replace(/\.(md|mdx|mdoc)$/i, '');
  const segments = withoutExtension.split('/');

  let localePrefix = '';
  if (segments[0] && localePrefixes.has(segments[0])) {
    localePrefix = segments.shift() ?? '';
  }

  if (segments.some((segment) => segment.startsWith('_'))) {
    return null;
  }

  const normalizedSlug = normalizePathname(slugValue);
  if (normalizedSlug) {
    const localizedSlug =
      localePrefix && normalizedSlug !== `/${localePrefix}` && !normalizedSlug.startsWith(`/${localePrefix}/`)
        ? normalizePathname(`/${localePrefix}${normalizedSlug}`)
        : normalizedSlug;

    if (!localizedSlug) {
      return null;
    }

    return withRoutePrefix(localizedSlug, targetPrefix, localePrefix);
  }

  if (segments[segments.length - 1] === 'index') {
    segments.pop();
  }

  const joined = segments.join('/');
  const localePart = localePrefix ? `/${localePrefix}` : '';
  const derivedPath = normalizePathname(`${localePart}/${joined}`);
  if (!derivedPath) {
    return null;
  }

  return withRoutePrefix(derivedPath, targetPrefix, localePrefix);
}

export function collectFrontmatterRedirects({
  roots,
  localePrefixes = ['da', 'en'],
  redirectFields = ['redirect-from', 'redirectFrom'],
  targetPrefix,
  onConflict,
}: CollectFrontmatterRedirectsOptions): Record<string, string> {
  const localePrefixSet = new Set(localePrefixes);
  const redirects: Record<string, string> = {};

  for (const root of roots) {
    const resolvedRoot = path.resolve(root);

    for (const filePath of walkMarkdownFiles(resolvedRoot)) {
      const content = readFileSync(filePath, 'utf8');
      const frontmatter = getFrontmatter(content);
      if (!frontmatter) continue;

      const slugValue = getScalarField(frontmatter, 'slug');
      const target = routeFromFile(filePath, resolvedRoot, localePrefixSet, slugValue, targetPrefix);
      if (!target) continue;

      const redirectFromValues = redirectFields.flatMap((field) => getFieldValues(frontmatter, field));

      for (const sourceValue of redirectFromValues) {
        const source = normalizePathname(sourceValue);
        if (!source || source === target) continue;

        const existing: string | undefined = redirects[source];
        if (existing && existing !== target) {
          onConflict?.({ source, existing, incoming: target, filePath });
          continue;
        }

        redirects[source] = target;
      }
    }
  }

  return redirects;
}
