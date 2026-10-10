// Steering config for remote-astro-theme: builds docs/content with the theme below.
export default {
  //theme: "mindovermachine-dev/mom-doc-theme@main",
  theme: "file:../../localhome/GitHub/mindovermachine-dev/mom-doc-theme",
  // Raw Astro config, merged over the theme's astro.config.mjs.
  astro: { server: { host: true } },
  title: "mom-home developer docs",
  // null (not undefined) so the theme's default "/da/" redirect is overridden.
  rootRedirect: null,
  defaultLocale: "root",
  locales: {
    root: { label: "English", lang: "en" },
  },
  social: [
    {
      icon: "github",
      label: "GitHub",
      href: "https://github.com/mindovermachine-dev",
    },
  ],
  // One group per folder under docs/content; order pages with `sidebar.order` frontmatter.
  sidebar: [
    {
      label: "Content model",
      items: [{ autogenerate: { directory: "model" } }],
    },
    {
      label: "Components",
      items: [{ autogenerate: { directory: "components" } }],
    },
    { label: "Build", items: [{ autogenerate: { directory: "build" } }] },
  ],
};
