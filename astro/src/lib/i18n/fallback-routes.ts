import path from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

import { fetchPosts } from '~/utils/blog';

const EXCLUDED_TOP_LEVEL_ROUTES = new Set(['index', '404', 'rss.xml']);

function normalizeSlug(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function discoverTopLevelPageSlugs(pagesRoot: string): string[] {
  const slugs = new Set<string>();
  const entries = readdirSync(pagesRoot, { withFileTypes: true, encoding: 'utf8' }) as Array<{
    name: string;
    isFile(): boolean;
  }>;

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const match = entry.name.match(/^(.*)\.(astro|md|mdx)$/i);
    if (!match) continue;

    const slug = match[1] ?? '';
    if (!slug || EXCLUDED_TOP_LEVEL_ROUTES.has(slug)) continue;

    slugs.add(slug);
  }

  return [...slugs];
}

function hasLocalizedTopLevelPage(pagesRoot: string, slug: string): boolean {
  const localizedRoot = path.join(pagesRoot, 'da');
  const fileVariants = ['astro', 'md', 'mdx'].map((ext) => path.join(localizedRoot, `${slug}.${ext}`));
  const directoryIndexVariants = ['astro', 'md', 'mdx'].map((ext) => path.join(localizedRoot, slug, `index.${ext}`));

  return [...fileVariants, ...directoryIndexVariants].some((candidate) => existsSync(candidate));
}

export async function getLocalizedFallbackSlugs(): Promise<string[]> {
  const pagesRoot = path.resolve(process.cwd(), 'src/pages');
  const slugs = new Set<string>(
    discoverTopLevelPageSlugs(pagesRoot).filter((slug) => !hasLocalizedTopLevelPage(pagesRoot, slug))
  );

  const posts = await fetchPosts();
  for (const post of posts) {
    if (post.permalink) {
      slugs.add(normalizeSlug(post.permalink));
    }
  }

  return [...slugs].sort();
}

export function getEnglishPathFromLocalizedSlug(slug: string): string {
  const normalized = normalizeSlug(slug);
  return normalized ? `/${normalized}` : '/';
}
