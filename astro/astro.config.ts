import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import compress from 'astro-compress';
import type { AstroIntegration } from 'astro';
import remarkDirective from 'remark-directive';
import rehypeExternalLinks from 'rehype-external-links';
import yaml from 'js-yaml';

import astrowind from './vendor/integration';

import { readingTimeRemarkPlugin, remarkAttrClassPlugin, responsiveTablesRehypePlugin } from './src/utils/frontmatter';
import { calloutDirectiveRemarkPlugin } from './src/utils/callouts';
import { collectFrontmatterRedirects } from './src/lib/integrations/frontmatter-redirects';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const siteConfig = yaml.load(readFileSync(path.resolve(__dirname, './src/config.yaml'), 'utf8')) as {
  site?: { site?: string };
};
const siteOrigin = (() => {
  try {
    return new URL(siteConfig.site?.site ?? '').origin;
  } catch {
    return undefined;
  }
})();

// Only links that leave our own origin should open in a new tab.
const externalLinksRehypePlugin: [typeof rehypeExternalLinks, Record<string, unknown>] = [
  rehypeExternalLinks,
  {
    target: '_blank',
    rel: ['noopener', 'noreferrer'],
    test: (node: { properties?: { href?: string } }) => {
      const href = node.properties?.href;
      if (!href || !/^https?:\/\//i.test(href)) return false;
      try {
        return new URL(href).origin !== siteOrigin;
      } catch {
        return false;
      }
    },
  },
];

const hasExternalScripts = process.env.ENABLE_EXTERNAL_SCRIPTS === 'true';
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

const onFrontmatterRedirectConflict = ({
  source,
  existing,
  incoming,
  filePath,
}: {
  source: string;
  existing: string;
  incoming: string;
  filePath: string;
}) => {
  console.warn(
    `[redirect-from] Skipping conflicting source '${source}' from '${filePath}'. Already mapped to '${existing}' and ignored '${incoming}'.`
  );
};

const frontmatterRedirects = {
  '/project': '/projects',
  ...collectFrontmatterRedirects({
    roots: [path.resolve(__dirname, './src/pages')],
    localePrefixes: ['da', 'en'],
    onConflict: onFrontmatterRedirectConflict,
  }),
  ...collectFrontmatterRedirects({
    roots: [path.resolve(__dirname, './src/data/post')],
    localePrefixes: ['da', 'en'],
    targetPrefix: '/writings',
    onConflict: onFrontmatterRedirectConflict,
  }),
};

export default defineConfig({
  output: 'static',
  redirects: frontmatterRedirects,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'da'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    sitemap(),
    mdx({
      remarkPlugins: [remarkDirective, calloutDirectiveRemarkPlugin, remarkAttrClassPlugin, readingTimeRemarkPlugin],
      rehypePlugins: [responsiveTablesRehypePlugin, externalLinksRehypePlugin],
    }),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),

    ...whenExternalScripts(() =>
      partytown({
        config: { forward: ['dataLayer.push'] },
      })
    ),

    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
        },
      },
      Image: false,
      JavaScript: true,
      SVG: false,
      Logger: 1,
    }),

    astrowind({
      config: path.resolve(__dirname, './src/config.yaml'),
    }),
  ],

  image: {
    // Astro's default Sharp service handles local images.
    //
    // Most remote CDN images (Unsplash, Cloudinary, Imgix…) are routed by
    // src/components/common/Image.astro through `unpic`, which rewrites the
    // URL with CDN-side query parameters and serves it straight from the
    // provider — Astro never downloads it, so they don't need to be listed.
    //
    // `domains` only matters for remote URLs that fall through to Astro's
    // native <Image /> (i.e. providers Unpic can't detect, like Pixabay).
    // Listed entries are authorized to be processed by Sharp.
    domains: ['cdn.pixabay.com'],
  },

  markdown: {
    remarkPlugins: [remarkDirective, calloutDirectiveRemarkPlugin, remarkAttrClassPlugin, readingTimeRemarkPlugin],
    rehypePlugins: [responsiveTablesRehypePlugin, externalLinksRehypePlugin],
  },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
  },
});
