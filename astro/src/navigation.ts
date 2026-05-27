import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Essays',
      href: getBlogPermalink(),
    },
    {
      text: 'Events',
      href: getPermalink('/events'),
    },
    {
      text: 'Services',
      href: getPermalink('/services'),
    },
    {
      text: 'About',
      href: getPermalink('/about'),
    },
    {
      text: 'Contact',
      translations: { da: 'Kontakt' },
      href: getPermalink('/contact'),
    },
  ],
  actions: [{ text: 'Get in touch', href: getPermalink('/contact') }],
};

export const footerData = {
  links: [
    {
      title: 'Mind over Machine',
      links: [
        { text: 'Home', href: getPermalink('/') },
        { text: 'Essays', href: getBlogPermalink() },
        { text: 'Events', href: getPermalink('/events') },
        { text: 'Services', href: getPermalink('/services') },
      ],
    },
    {
      title: 'Organization',
      links: [
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact'), translations: { da: 'Kontakt' } },
        { text: 'Terms', href: getPermalink('/terms') },
        { text: 'Privacy', href: getPermalink('/privacy') },
      ],
    },
    {
      title: 'Community',
      links: [
        { text: 'LinkedIn', href: 'https://www.linkedin.com/company/mindovermachine/' },
        { text: 'GitHub', href: 'https://github.com/mindovermachine-dev' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    {
      ariaLabel: 'LinkedIn',
      icon: 'tabler:brand-linkedin',
      href: 'https://www.linkedin.com/company/mindovermachine/',
    },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/mindovermachine-dev' },
  ],
  footNote: `
    Mind over Machine · Foundation for Regenerative Software Development.
  `,
};
