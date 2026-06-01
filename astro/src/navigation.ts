import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Essays',
      translations: { da: 'Essays' },
      href: getBlogPermalink(),
    },
    {
      text: 'Events',
      translations: { da: 'Begivenheder' },
      href: getPermalink('/events'),
    },
    {
      text: 'Services',
      translations: { da: 'Tjenester' },
      href: getPermalink('/services'),
    },
    {
      text: 'About',
      translations: { da: 'Om os' },
      href: getPermalink('/about'),
    },
    {
      text: 'Contact',
      translations: { da: 'Kontakt' },
      href: getPermalink('/contact'),
    },
  ],
  actions: [{ text: 'Get in touch', translations: { da: 'Tal med os' }, href: getPermalink('/contact') }],
};

export const footerData = {
  links: [
    {
      title: 'Mind over Machine',
      links: [
        { text: 'Home', translations: { da: 'Hjem' }, href: getPermalink('/') },
        { text: 'Essays', translations: { da: 'Essays' }, href: getBlogPermalink() },
        { text: 'Events', translations: { da: 'Begivenheder' }, href: getPermalink('/events') },
        { text: 'Services', translations: { da: 'Tjenester' }, href: getPermalink('/services') },
      ],
    },
    {
      title: 'Organization',
      translations: { da: 'Organisation' },
      links: [
        { text: 'About', translations: { da: 'Om os' }, href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact'), translations: { da: 'Kontakt' } },
        { text: 'Terms', href: getPermalink('/terms'), translations: { da: 'Betingelser' } },
        { text: 'Privacy', href: getPermalink('/privacy'), translations: { da: 'Privatliv' } },
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
