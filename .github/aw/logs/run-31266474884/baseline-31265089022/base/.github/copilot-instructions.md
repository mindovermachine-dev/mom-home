# Copilot Instructions

## Project Overview

This repository now powers the main website for Mind over Machine:

- Live site: https://www.mindovermachine.dk
- Stack: Astro 6 + AstroWind + Tailwind CSS 4
- Output: static site generated to astro/dist

The repository was originally a docs/Starlight setup. It has been repurposed to a marketing/editorial site (blog/essays/events/services/about/contact).

## How To Think About AstroWind

AstroWind can feel verbose at first because it uses many composable widgets and indirection layers.

The key idea is:

1. Global behavior comes from config files.
2. Site structure comes from pages and navigation.
3. Page composition comes from widgets.
4. Blog content comes from post files in a content collection.

### Core Control Points

- Main Astro config: astro/astro.config.ts
- Site-level config values: astro/src/config.yaml
- Header/footer navigation: astro/src/navigation.ts
- Routes/pages: astro/src/pages
- Reusable visual blocks (widgets): astro/src/components/widgets
- Blog content model: astro/src/content.config.ts
- Blog posts: astro/src/data/post
- Utility helpers: astro/src/utils
- AstroWind integration shim: astro/vendor/integration

## Why The Template Feels Verbose

AstroWind favors composition over inline page markup.

Example:

- A single page usually imports several widget components.
- Each widget has many optional props for layout, CTA, media, and styling.
- Blog routing uses dynamic route files under astro/src/pages/[...blog]/\*.
- Most SEO and metadata behavior is centralized and merged from config.

This gives flexibility and consistency, but it can feel heavy for small pages.

## Practical Editing Strategy

When making changes, prefer this order:

1. Decide whether this is global or page-specific.
2. If global, update astro/src/config.yaml or astro/src/navigation.ts.
3. If page-specific, edit the page in astro/src/pages and reuse existing widgets.
4. If widgets become awkward, simplify by writing straightforward Astro markup in the page.
5. Keep changes small and avoid broad refactors unless explicitly requested.

## Current Localisation Policy

Current target behavior:

- English is the default root site at /
- Danish is optional at /da/
- trailingSlash is enabled in astro/src/config.yaml

Do not reintroduce automatic root redirect to /da/.

## Custom Integrations Carried Forward

This repository has future-ready integration scaffolding:

- Frontmatter redirect collector:
  - astro/src/lib/integrations/frontmatter-redirects.ts
  - wired in astro/astro.config.ts
- PDF support scaffold (disabled by default):
  - astro/src/lib/integrations/pdf-support.ts
- Giscus support scaffold (disabled by default):
  - astro/src/lib/integrations/giscus-support.ts

Only enable PDF/Giscus when explicitly requested.

## Development Commands

Run from repo root:

- npm run install:repo
- npm run install:astro
- npm run dev
- npm run build
- npm run preview
- npm run check-links
- npm run check-links:files

Direct Astro CLI via root script:

- npm run astro -- <args>

## Quality Gates

- Git hooks are configured via .githooks
- pre-commit runs trunk-worthy and link checking waves via gh insitu
- After file edits, run:
  - gh insitu run fix-all

This is required because AI edits bypass editor format-on-save.

## CI And Pipeline Notes

- Keep runner compatibility with ubuntu-latest
- Prefer repo scripts and gh insitu waves over one-off workflow logic
- Reuse existing workflows in .github/workflows unless there is a clear reason to change them

## Content Direction For This Repo

Primary page types for MVP and next iterations:

1. Home
2. Essays (blog list + post pages)
3. Events
4. Services
5. About
6. Contact

When adding content, prioritize clarity and editorial quality over adding more template components.

## Guardrails For Future Changes

1. Keep root scripts authoritative for local and CI parity.
2. Keep Astro config modular; avoid large single-file logic blocks.
3. Add redirects using frontmatter where practical.
4. Keep visual language intentional and not generic template-like.
5. Avoid reintroducing stale docs/Starlight assumptions into this repo.
