import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import slugify from 'limax';

const astroDir = fileURLToPath(new URL('../../', import.meta.url));
const postDir = join(astroDir, 'src/data/post');
const cleanSlug = (value: string) =>
  value
    .split('/')
    .map((part) => slugify(part))
    .join('/');

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
        tags?: string[];
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

const galleryCards = (html: string) =>
  [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map((match) => match[0]);

for (const locale of ['en', 'da'] as const) {
  test(`${locale} writings gallery includes both locales, newest first`, () => {
    const expected = expectedPosts(locale);
    const prefix = locale === 'da' ? '/da' : '';
    const outputDir = join(astroDir, 'dist', prefix, 'writings');
    const html = readFileSync(join(outputDir, 'index.html'), 'utf8');
    const cards = galleryCards(html);
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
    assert.ok(html.includes(`href="${prefix}/category/briefs`));
    assert.ok(html.includes(`href="${prefix}/category/essays`));
    assert.doesNotMatch(html, /data-status-tag-filter|data-filter-tag/);
    cards.forEach((card, index) => {
      const slug = links[index]?.replace(/^.*\/writings\//, '').replace(/\/$/, '');
      const post = expected.find((post) => post.slug === slug);
      assert.equal(dates[index], post?.publishDate.valueOf());
      assert.equal(titleFromCard(card), post?.title);
      assert.match(card, new RegExp(`<article\\b[^>]*\\blang="${post?.locale}"`));
      assert.ok(links[index]?.startsWith(`${prefix}/writings/`));
      for (const tag of post?.tags ?? []) {
        const tagLink = `${prefix}/tag/${cleanSlug(tag)}`;
        assert.ok(
          card.includes(`href="${tagLink}"`) || card.includes(`href="${tagLink}/"`),
          `${post?.slug}: missing ${tagLink}`
        );
        assert.ok(existsSync(join(astroDir, 'dist', tagLink, 'index.html')));
      }
    });
  });

  test(`${locale} tag pages use the gallery and include matching posts from both locales`, () => {
    const prefix = locale === 'da' ? '/da' : '';
    const posts = expectedPosts(locale);
    const tags = new Set(posts.flatMap((post) => (post.tags ?? []).map(cleanSlug)));
    for (const tag of tags) {
      const directory = join(astroDir, 'dist', prefix, 'tag', tag);
      const pages = [join(directory, 'index.html')];
      for (let page = 2; existsSync(join(directory, String(page), 'index.html')); page++) {
        pages.push(join(directory, String(page), 'index.html'));
      }
      const cards = pages.flatMap((page) => galleryCards(readFileSync(page, 'utf8')));
      const titles = cards.map(titleFromCard);
      const expected = posts.filter((post) => (post.tags ?? []).some((value) => cleanSlug(value) === tag));
      assert.deepEqual(
        titles,
        expected.map((post) => post.title)
      );
      for (const card of cards) {
        const link = card.match(/<h2\b[^>]*><a href="([^"]+)"/)?.[1];
        assert.ok(link?.startsWith(`${prefix}/writings/`));
        assert.ok(link && existsSync(join(astroDir, 'dist', link, 'index.html')));
      }
    }
  });
}
