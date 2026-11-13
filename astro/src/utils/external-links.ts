export const isExternalUrl = (href?: string | null): boolean => !!href && /^https?:\/\//i.test(href);

export const getExternalLinkAttrs = (
  href?: string | null
): { target: '_blank'; rel: string } | Record<string, never> =>
  isExternalUrl(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
