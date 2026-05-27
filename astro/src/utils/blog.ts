import type { PaginateFunction } from 'astro';
import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Post } from '~/types';
import { APP_BLOG } from 'astrowind:config';
import { cleanSlug, trimSlash, BLOG_BASE, POST_PERMALINK_PATTERN, CATEGORY_BASE, TAG_BASE } from './permalinks';

type PostLocale = 'en' | 'da';
const SUPPORTED_POST_LOCALES = new Set<PostLocale>(['en', 'da']);

const getPostLocaleAndId = (id: string): { locale: PostLocale; localizedId: string } => {
  const [first, ...rest] = id.split('/');

  if (first && SUPPORTED_POST_LOCALES.has(first as PostLocale) && rest.length) {
    return { locale: first as PostLocale, localizedId: rest.join('/') };
  }

  return { locale: 'en', localizedId: id };
};

const generatePermalink = async ({
  id,
  slug,
  publishDate,
  category,
}: {
  id: string;
  slug: string;
  publishDate: Date;
  category: string | undefined;
}) => {
  const year = String(publishDate.getFullYear()).padStart(4, '0');
  const month = String(publishDate.getMonth() + 1).padStart(2, '0');
  const day = String(publishDate.getDate()).padStart(2, '0');
  const hour = String(publishDate.getHours()).padStart(2, '0');
  const minute = String(publishDate.getMinutes()).padStart(2, '0');
  const second = String(publishDate.getSeconds()).padStart(2, '0');

  const permalink = POST_PERMALINK_PATTERN.replace('%slug%', slug)
    .replace('%id%', id)
    .replace('%category%', category || '')
    .replace('%year%', year)
    .replace('%month%', month)
    .replace('%day%', day)
    .replace('%hour%', hour)
    .replace('%minute%', minute)
    .replace('%second%', second);

  return permalink
    .split('/')
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join('/');
};

const getNormalizedPost = async (post: CollectionEntry<'post'>): Promise<Post> => {
  const { id, data } = post;
  const { locale, localizedId } = getPostLocaleAndId(id);
  const { Content, remarkPluginFrontmatter } = await render(post);

  const {
    publishDate: rawPublishDate = new Date(),
    updateDate: rawUpdateDate,
    title,
    excerpt,
    image,
    tags: rawTags = [],
    category: rawCategory,
    author,
    draft = false,
    metadata = {},
  } = data;

  const slug = cleanSlug(localizedId);
  const publishDate = new Date(rawPublishDate);
  const updateDate = rawUpdateDate ? new Date(rawUpdateDate) : undefined;

  const category = rawCategory
    ? {
        slug: cleanSlug(rawCategory),
        title: rawCategory,
      }
    : undefined;

  const tags = rawTags.map((tag: string) => ({
    slug: cleanSlug(tag),
    title: tag,
  }));

  return {
    id: id,
    locale,
    slug: slug,
    permalink: await generatePermalink({ id: localizedId, slug, publishDate, category: category?.slug }),

    publishDate: publishDate,
    updateDate: updateDate,

    title: title,
    excerpt: excerpt,
    image: image,

    category: category,
    tags: tags,
    author: author,

    draft: draft,

    metadata,

    Content: Content,
    // or 'content' in case you consume from API

    readingTime: remarkPluginFrontmatter?.readingTime,
  };
};

const load = async function (): Promise<Array<Post>> {
  const posts = await getCollection('post');
  const normalizedPosts = posts.map(async (post) => await getNormalizedPost(post));

  const results = (await Promise.all(normalizedPosts))
    .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf())
    .filter((post) => !post.draft);

  return results;
};

let _posts: Array<Post>;

/** */
export const isBlogEnabled = APP_BLOG.isEnabled;
export const isRelatedPostsEnabled = APP_BLOG.isRelatedPostsEnabled;
export const isBlogListRouteEnabled = APP_BLOG.list.isEnabled;
export const isBlogPostRouteEnabled = APP_BLOG.post.isEnabled;
export const isBlogCategoryRouteEnabled = APP_BLOG.category.isEnabled;
export const isBlogTagRouteEnabled = APP_BLOG.tag.isEnabled;

export const blogListRobots = APP_BLOG.list.robots;
export const blogPostRobots = APP_BLOG.post.robots;
export const blogCategoryRobots = APP_BLOG.category.robots;
export const blogTagRobots = APP_BLOG.tag.robots;

export const blogPostsPerPage = APP_BLOG?.postsPerPage;

type BlogPathLocaleOptions = {
  locale?: PostLocale;
  fallbackLocale?: PostLocale;
};

const getLocalizedPosts = (
  posts: Array<Post>,
  { locale = 'en', fallbackLocale }: BlogPathLocaleOptions = {}
): Array<Post> => {
  if (!fallbackLocale || fallbackLocale === locale) {
    return posts.filter((post) => post.locale === locale);
  }

  const localizedSlugs = new Set(posts.filter((post) => post.locale === locale).map((post) => post.slug));

  return posts.filter(
    (post) => post.locale === locale || (post.locale === fallbackLocale && !localizedSlugs.has(post.slug))
  );
};

/** */
export const fetchPosts = async (): Promise<Array<Post>> => {
  if (!_posts) {
    _posts = await load();
  }

  return _posts;
};

/** */
export const findPostsBySlugs = async (slugs: Array<string>): Promise<Array<Post>> => {
  if (!Array.isArray(slugs)) return [];

  const posts = await fetchPosts();

  return slugs.reduce(function (r: Array<Post>, slug: string) {
    posts.some(function (post: Post) {
      return slug === post.slug && r.push(post);
    });
    return r;
  }, []);
};

/** */
export const findPostsByIds = async (ids: Array<string>): Promise<Array<Post>> => {
  if (!Array.isArray(ids)) return [];

  const posts = await fetchPosts();

  return ids.reduce(function (r: Array<Post>, id: string) {
    posts.some(function (post: Post) {
      return id === post.id && r.push(post);
    });
    return r;
  }, []);
};

/** */
export const findLatestPosts = async ({ count }: { count?: number }): Promise<Array<Post>> => {
  const _count = count || 4;
  const posts = (await fetchPosts()).filter((post) => post.locale === 'en');

  return posts ? posts.slice(0, _count) : [];
};

/** */
export const getStaticPathsBlogList = async ({
  paginate,
  locale = 'en',
  fallbackLocale,
}: { paginate: PaginateFunction } & BlogPathLocaleOptions) => {
  if (!isBlogEnabled || !isBlogListRouteEnabled) return [];

  const posts = getLocalizedPosts(await fetchPosts(), { locale, fallbackLocale });

  return paginate(posts, {
    params: { blog: BLOG_BASE || undefined },
    pageSize: blogPostsPerPage,
  });
};

/** */
export const getStaticPathsBlogPost = async ({ locale = 'en', fallbackLocale }: BlogPathLocaleOptions = {}) => {
  if (!isBlogEnabled || !isBlogPostRouteEnabled) return [];

  return getLocalizedPosts(await fetchPosts(), { locale, fallbackLocale }).flatMap((post) => ({
    params: {
      blog: post.permalink,
    },
    props: { post },
  }));
};

/** */
export const getStaticPathsBlogCategory = async ({
  paginate,
  locale = 'en',
  fallbackLocale,
}: { paginate: PaginateFunction } & BlogPathLocaleOptions) => {
  if (!isBlogEnabled || !isBlogCategoryRouteEnabled) return [];

  const posts = getLocalizedPosts(await fetchPosts(), { locale, fallbackLocale });
  const categories: Record<string, { slug: string; title: string }> = {};
  posts.map((post) => {
    if (post.category?.slug) {
      categories[post.category?.slug] = post.category;
    }
  });

  return Array.from(Object.keys(categories)).flatMap((categorySlug) =>
    paginate(
      posts.filter((post) => post.category?.slug && categorySlug === post.category?.slug),
      {
        params: { category: categorySlug, blog: CATEGORY_BASE || undefined },
        pageSize: blogPostsPerPage,
        props: { category: categories[categorySlug] },
      }
    )
  );
};

/** */
export const getStaticPathsBlogTag = async ({
  paginate,
  locale = 'en',
  fallbackLocale,
}: { paginate: PaginateFunction } & BlogPathLocaleOptions) => {
  if (!isBlogEnabled || !isBlogTagRouteEnabled) return [];

  const posts = getLocalizedPosts(await fetchPosts(), { locale, fallbackLocale });
  const tags: Record<string, { slug: string; title: string }> = {};
  posts.map((post) => {
    if (Array.isArray(post.tags)) {
      post.tags.map((tag) => {
        tags[tag?.slug] = tag;
      });
    }
  });

  return Array.from(Object.keys(tags)).flatMap((tagSlug) =>
    paginate(
      posts.filter((post) => Array.isArray(post.tags) && post.tags.find((elem) => elem.slug === tagSlug)),
      {
        params: { tag: tagSlug, blog: TAG_BASE || undefined },
        pageSize: blogPostsPerPage,
        props: { tag: tags[tagSlug] },
      }
    )
  );
};

/** */
export async function getRelatedPosts(originalPost: Post, maxResults: number = 4): Promise<Post[]> {
  const allPosts = await fetchPosts();
  const originalTagsSet = new Set(originalPost.tags ? originalPost.tags.map((tag) => tag.slug) : []);

  const postsWithScores = allPosts.reduce((acc: { post: Post; score: number }[], iteratedPost: Post) => {
    if (iteratedPost.slug === originalPost.slug) return acc;
    if (iteratedPost.locale !== originalPost.locale) return acc;

    let score = 0;
    if (iteratedPost.category && originalPost.category && iteratedPost.category.slug === originalPost.category.slug) {
      score += 5;
    }

    if (iteratedPost.tags) {
      iteratedPost.tags.forEach((tag) => {
        if (originalTagsSet.has(tag.slug)) {
          score += 1;
        }
      });
    }

    acc.push({ post: iteratedPost, score });
    return acc;
  }, []);

  postsWithScores.sort((a, b) => b.score - a.score);

  const selectedPosts: Post[] = [];
  let i = 0;
  while (selectedPosts.length < maxResults && i < postsWithScores.length) {
    selectedPosts.push(postsWithScores[i].post);
    i++;
  }

  return selectedPosts;
}

export async function findPostBySlugAndLocale(slug: string, locale: PostLocale): Promise<Post | undefined> {
  const normalizedSlug = cleanSlug(slug);
  return (await fetchPosts()).find((post) => post.locale === locale && post.slug === normalizedSlug);
}

export async function findLocalizedPostWithFallback({
  slug,
  locale,
  fallbackLocale = 'en',
}: {
  slug: string;
  locale: PostLocale;
  fallbackLocale?: PostLocale;
}): Promise<{ post: Post | undefined; usedLocale: PostLocale | undefined }> {
  const localizedPost = await findPostBySlugAndLocale(slug, locale);
  if (localizedPost) {
    return { post: localizedPost, usedLocale: locale };
  }

  const fallbackPost = await findPostBySlugAndLocale(slug, fallbackLocale);
  if (fallbackPost) {
    return { post: fallbackPost, usedLocale: fallbackLocale };
  }

  return { post: undefined, usedLocale: undefined };
}
