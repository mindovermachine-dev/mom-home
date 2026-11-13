import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import slugify from 'limax';

const astroDir = fileURLToPath(new URL('../../', import.meta.url));
const postDir = join(astroDir, 'src/data/post');
const outputDir = join(astroDir, 'dist/writings');

const postFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? postFiles(path) : /\.mdx?$/.test(entry.name) ? [path] : [];
  });

test('built writings gallery contains every published English post, newest first', () => {
  const expected = postFiles(postDir)
    .map((path) => {
      const id = relative(postDir, path)
        .replace(/\\/g, '/')
        .replace(/\.mdx?$/, '');
      const source = readFileSync(path, 'utf8');
      const frontmatter = yaml.load(source.match(/^---\s*\n([\s\S]*?)\n---/)![1]) as { draft?: boolean };
      return { id, draft: frontmatter.draft };
    })
    .filter(({ id, draft }) => !id.startsWith('da/') && !draft)
    .map(({ id }) =>
      id
        .replace(/^en\//, '')
        .split('/')
        .map((part) => slugify(part))
        .join('/')
    )
    .sort();

  const html = readFileSync(join(outputDir, 'index.html'), 'utf8');
  const cards = [...html.matchAll(/<li\b[^>]*\bdata-filter-item\b[^>]*>([\s\S]*?)<\/article>\s*<\/li>/g)].map(
    (match) => match[1]
  );
  const links = cards.map((card) => card.match(/<h2\b[^>]*><a href="([^"]+)"/)?.[1]);
  const dates = cards.map((card) => Date.parse(card.match(/<time datetime="([^"]+)"/)?.[1] ?? ''));

  assert.deepEqual(links.map((link) => link?.replace(/^.*\/writings\//, '').replace(/\/$/, '')).sort(), expected);
  assert.ok(dates.every((date) => Number.isFinite(date)));
  assert.deepEqual(
    dates,
    [...dates].sort((a, b) => b - a)
  );
  assert.ok(links.every((link) => link && existsSync(join(astroDir, 'dist', link, 'index.html'))));
  assert.doesNotMatch(html, /Older posts|Newer posts/);
  assert.ok(!existsSync(join(outputDir, '2', 'index.html')));
  assert.match(html, /href="\/category\/briefs/);
  assert.match(html, /href="\/category\/essays/);
  assert.match(html, /data-filter-tag/);
});

test('the Danish paginated index links back to the continuous English index', () => {
  const danishPage = readFileSync(join(astroDir, 'dist/da/writings/2/index.html'), 'utf8');
  assert.doesNotMatch(danishPage, /href="\/writings\/2\/?"/);
  assert.match(danishPage, /href="\/writings\/?"/);
});
