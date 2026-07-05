# Build Drafts Reference

## Goal

Provide a community-standard way to include frontmatter drafts (`draft: true`) when needed, without changing content files.

## Approach

This project uses Astro mode switching, which is a common pattern in Astro and Vite projects.

- Default mode (`development` for dev, `production` for build): drafts are excluded.
- Draft mode (`drafts`): drafts are included.

No separate Astro config file is needed.

## Implementation

Draft inclusion is controlled in content-loading utilities:

- `astro/src/utils/utils.ts`
- `astro/src/utils/blog.ts`
- `astro/src/utils/events.ts`

Logic summary:

1. Drafts are included when `import.meta.env.MODE === 'drafts'`.
2. Optional fallback: drafts are also included if env var `INCLUDE_DRAFTS` is truthy (`1`, `true`, `yes`, `on`).

## Scripts

From repository root:

- `npm run dev` -> normal dev, drafts excluded.
- `npm run dev-draft` -> dev with drafts included.
- `npm run build` -> production build, drafts excluded.
- `npm run build-draft` -> production build with drafts included.

## Optional One-Off Commands

If you need one-off control without npm scripts:

- Dev with drafts:
  - `cd astro && npm run astro -- dev --mode drafts --host 0.0.0.0`
- Build with drafts:
  - `cd astro && npm run astro -- build --mode drafts`

Or via env var:

- `cd astro && INCLUDE_DRAFTS=true npm run build`

## Notes

- This affects both post and event collections in the current implementation.
- Existing frontmatter remains the source of truth (`draft: true` stays in content).
