import { SITE } from 'astrowind:config';

const siteOrigin = (() => {
  try {
    return new URL(SITE.site ?? '').origin;
  } catch {
    return undefined;
  }
})();

export const isExternalUrl = (href?: string | null): boolean => {
  if (!href || !/^https?:\/\//i.test(href)) return false;
  try {
    return new URL(href).origin !== siteOrigin;
  } catch {
    return false;
  }
};

// Links leaving our own origin open in a new tab; links within it stay in the same window.
export const getExternalLinkAttrs = (
  href?: string | null
): { target: '_blank'; rel: string } | Record<string, never> =>
  isExternalUrl(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
