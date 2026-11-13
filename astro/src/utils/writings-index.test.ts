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

const publishedPosts = () =>
  postFiles(postDir)
    .map((path) => {
      const id = relative(postDir, path)
        .replace(/\\/g, '/')
        .replace(/\.mdx?$/, '');
      const source = readFileSync(path, 'utf8');
      const frontmatter = yaml.load(source.match(/^---\s*\n([\s\S]*?)\n---/)![1]) as {
        draft?: boolean;
        publishDate: Date;
        title: string;
      };
      const locale = id.startsWith('da/') ? 'da' : 'en';
      const slug = id
        .replace(/^(en|da)\//, '')
        .split('/')
        .map((part) => slugify(part))
        .join('/');
      return { locale, slug, ...frontmatter };
    })
    .filter(({ draft }) => !draft);

const expectedPosts = (locale: 'en' | 'da') => {
  const posts = publishedPosts();
  const preferred = new Set(posts.filter((post) => post.locale === locale).map((post) => post.slug));
  return posts
    .filter((post) => post.locale === locale || !preferred.has(post.slug))
    .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf());
};

const titleFromCard = (card: string) =>
  card
    .match(/<h2\b[^>]*><a\b[^>]*>([\s\S]*?)<\/a>/)?.[1]
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

test('built writings gallery includes both locales, preferring English, newest first', () => {
  const expected = expectedPosts('en');
  const html = readFileSync(join(outputDir, 'index.html'), 'utf8');
  const cards = [...html.matchAll(/<li\b[^>]*\bdata-filter-item\b[^>]*>([\s\S]*?)<\/article>\s*<\/li>/g)].map(
    (match) => match[1]
  );
  const links = cards.map((card) => card.match(/<h2\b[^>]*><a href="([^"]+)"/)?.[1]);
  const dates = cards.map((card) => Date.parse(card.match(/<time datetime="([^"]+)"/)?.[1] ?? ''));

  assert.deepEqual(
    links.map((link) => link?.replace(/^.*\/writings\//, '').replace(/\/$/, '')).sort(),
    expected.map((post) => post.slug).sort()
  );
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
  cards.forEach((card, index) => {
    const slug = links[index]?.replace(/^.*\/writings\//, '').replace(/\/$/, '');
    const post = expected.find((post) => post.slug === slug);
    assert.equal(dates[index], post?.publishDate.valueOf());
    assert.equal(titleFromCard(card), post?.title);
    assert.match(card, new RegExp(`<article\\b[^>]*\\blang="${post?.locale}"`));
  });
});

test('Danish listing includes both locales, preferring Danish', () => {
  const expected = expectedPosts('da');
  const danishDir = join(astroDir, 'dist/da/writings');
  const pages = [join(danishDir, 'index.html')];
  for (let page = 2; existsSync(join(danishDir, String(page), 'index.html')); page++) {
    pages.push(join(danishDir, String(page), 'index.html'));
  }
  const cards = pages.flatMap((page) =>
    [...readFileSync(page, 'utf8').matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)].map((match) => match[1])
  );
  const links = cards.map((card) => card.match(/<h2\b[^>]*><a href="([^"]+)"/)?.[1]);
  const dates = cards.map((card) => Date.parse(card.match(/<time\b[^>]*datetime="([^"]+)"/)?.[1] ?? ''));
  assert.deepEqual(
    links.map((link) => link?.replace(/^.*\/writings\//, '').replace(/\/$/, '')).sort(),
    expected.map((post) => post.slug).sort()
  );
  assert.deepEqual(
    dates,
    expected.map((post) => post.publishDate.valueOf())
  );
  cards.forEach((card, index) => {
    const slug = links[index]?.replace(/^.*\/writings\//, '').replace(/\/$/, '');
    assert.equal(titleFromCard(card), expected.find((post) => post.slug === slug)?.title);
  });
  assert.ok(links.every((link) => link && existsSync(join(astroDir, 'dist', link, 'index.html'))));
});

test('the Danish paginated index links back to the continuous English index', () => {
  const danishPage = readFileSync(join(astroDir, 'dist/da/writings/2/index.html'), 'utf8');
  assert.doesNotMatch(danishPage, /href="\/writings\/2\/?"/);
  assert.match(danishPage, /href="\/writings\/?"/);
});
