# Copilot Instructions

## Project Overview

This is the source repository for **docs.mindovermachine** — the documentation website for **Mind over Machine, the Regenerative Software Foundation** (Danish: _Mind over Machine, Fonden for Regenerativ Softwareudvikling_), a non-profit commercial foundation combining a think-tank and laboratory focused on long-term system thinking and regenerative software development.

- **Live site**: https://docs.mindovermachine.dk (custom domain via `CNAME`)
- **Built with**: [Astro](https://astro.build/) 6.x + [Starlight](https://starlight.astro.build/) 0.39.x
- **Deployed to**: GitHub Pages via `devx-cafe/takt-actions/deploy-artifact@v1`

Deployment nuance:

- The `ready` pipeline **does build in CI** and uploads `github-pages-${sha}` as an artifact.
- The `stage` pipeline deploys that prebuilt artifact from `main` (it does not run a build step itself).

## Repository Structure

```txt
.
├── package.json            # Repo-level scripts (dev/build/preview/link-check) and tooling
├── .insitu.yml             # gh-insitu inventory + waves (post-create, prep-runner, trunk-worthy, etc.)
├── .gitconfig              # Repo git defaults/aliases; enables hooksPath=.githooks when included locally
├── .githooks/
│   └── pre-commit          # Runs `gh insitu run trunk-worthy link-checker`
├── CNAME                   # Custom domain: docs.mindovermachine.dk
├── linkinator.config.json  # Config for link checking
├── scripts/
│   ├── check-links-with-sources.mjs  # Link checker with source attribution
│   └── translate-en-from-da.py       # Helper to translate DA→EN content
├── docs/                   # Internal docs (not part of the site)
├── astro/                  # Astro app root
├── .devcontainer/
│   └── devcontainer.json
└── .github/
    ├── actions/
    │   └── prep-runner/              # Shared runner setup used by workflow jobs
    ├── copilot-instructions.md
    └── workflows/
        ├── copilot-setup-steps.yml   # Copilot coding agent setup (uses .github/actions/prep-runner)
        ├── wrapup.yml                # Runs trunk-worthiness checks for issue/copilot branches
        ├── pr-to-ready.yml           # Converts approved PR branch into ready/* (synthetic commit)
        ├── ready.yml                 # CI build + artifact upload + merge ready/* to main
        └── stage.yml                 # Deploy pre-built artifact from main to GitHub Pages
```

## Development

Use repo-root scripts for all development:

| Command                     | Action                                                           |
| :-------------------------- | :--------------------------------------------------------------- |
| `npm run install:astro`     | Install Astro app dependencies into `astro/node_modules`         |
| `npm run install:repo`      | Install repo-level dev dependencies                              |
| `npm run dev`               | Start local dev server (`0.0.0.0:4321`)                          |
| `npm run start`             | Alias for `dev`                                                  |
| `npm run build`             | Build production site to `astro/dist/`                           |
| `npm run preview`           | Preview built site with host binding for devcontainer forwarding |
| `npm run check-links`       | Run linkinator against `/da/` on `astro/dist`                    |
| `npm run check-links:files` | Run link checker with source file attribution                    |

Direct Astro CLI: `npm run astro -- <args>` (runs from `astro/` directory).

## Automation and TakT Flow

This repo uses the GitHub CLI extension `devx-cafe/gh-insitu` to orchestrate repeatable command execution as _waves_ (parallel groups of checks/tasks).

### Dev Container Bootstrap

- `.devcontainer/devcontainer.json` runs:
  - `gh ext install devx-cafe/gh-insitu`
  - `gh insitu run post-create`
- The `post-create` wave (from `.insitu.yml`) installs/sets up:
  - `gh-tt` extension (`devx-cafe/gh-tt`) for TakT branch/PR workflow commands
  - GH aliases (`workon`, `wrapup`, `deliver`, `semver`)
  - local git include to repo `.gitconfig`
  - Astro + repo npm dependencies

### Git Hook and Definition of Done

- Repo `.gitconfig` sets `hooksPath = .githooks`.
- `.githooks/pre-commit` runs: `gh insitu run trunk-worthy link-checker`.
- The `trunk-worthy` wave is the baseline Definition of Done gate:
  - `cspell`
  - `markdownlint-cli2`
  - `npm run build`
  - `prettier --check .`
- The `link-checker` wave runs `npm run check-links`.
- The `fix-all` wave runs auto-fixers (`markdownlint --fix`, `prettier --write .`).

### CI Workflows and Responsibilities

- `copilot-setup-steps.yml`
  - Trigger: workflow_dispatch or changes to itself
  - Purpose: runner setup verification with `gh insitu run prep-runner`

- `wrapup.yml`
  - Trigger: issue branches (`[0-9]*`) and `copilot/*`
  - Purpose: run trunk-worthiness checks in CI

- `pr-to-ready.yml`
  - Trigger: PR review submission (and manual dispatch)
  - Purpose: for approved PRs, collapse branch commits and push synthetic commit to `ready/*` using `devx-cafe/takt-actions/pr-to-ready@experimental`

- `ready.yml`
  - Trigger: pushes to `ready/*`
  - Purpose: run checks, build Astro site, upload artifact (`github-pages-${sha}`), then merge to trunk using `devx-cafe/takt-actions/ready-to-trunk@v1`
  - Note: uses `READY_PUSHER` PAT to allow push events to trigger downstream workflows

- `stage.yml`
  - Trigger: pushes to `main`
  - Purpose: deploy previously built artifact to GitHub Pages via `devx-cafe/takt-actions/deploy-artifact@v1`

Net effect: build happens in `ready.yml`; deployment happens in `stage.yml`; this keeps trunk-based flow non-blocking while still enforcing quality gates.

### Environment Compatibility and Maintenance Trade-offs

Three distinct execution environments must coexist, and they do not naturally support each other:

| Environment          | Technology                                 | Constraint                                                                    |
| :------------------- | :----------------------------------------- | :---------------------------------------------------------------------------- |
| Dev container        | devcontainer features + VS Code extensions | Not available on GitHub-hosted runners                                        |
| GitHub CI runners    | GitHub Actions steps/actions               | Not reproducible locally in the IDE                                           |
| Copilot coding agent | `copilot-setup-steps.yml`                  | **Only supports `ubuntu-latest`** — always must have a working Ubuntu variant |

Because of these tensions, the following principles govern how new tooling and automation is added:

1. **Stick to Ubuntu in all CI runners** — even if another OS might be more efficient, `ubuntu-latest` is the only safe common denominator across CI and Copilot setup steps.
2. **Prefer repo-defined scripts over GitHub Actions** — use `npm run ...` and `gh insitu run ...` wherever possible. This maximises shift-left: the same commands run locally (pre-commit hook), in CI (`wrapup.yml`, `ready.yml`), and in Copilot sessions (`copilot-setup-steps.yml`). Actions should only be used when they offer a clear advantage that scripts cannot replicate (e.g. uploading Pages artifacts, managing PATs).
3. **`gh insitu` waves are the reuse layer** — `.insitu.yml` is the single source of truth for what "trunk-worthy" means, what "post-create" sets up, and what "fix-all" auto-fixes. Adding a new check means adding it to the inventory and the relevant wave — it then automatically applies everywhere.

## Localisation

- **Primary locale**: `da` (Danish) — this is the default; `/` redirects to `/da/`
- **Secondary locale**: `en` (English)
- Both locales have identical page structure under `astro/src/content/docs/da/` and `astro/src/content/docs/en/`
- Sidebar labels are bilingual: each item has a `translations: { da: "..." }` entry in `astro.config.mjs`
- `scripts/translate-en-from-da.py` helps generate English translations from Danish source

## Sidebar Navigation

Sidebar structure is fully manually configured in `astro/astro.config.mjs` — read that file for the current navigation design, section labels (including bilingual `translations`), and slug list. Do not rely on auto-discovery; every new page must be explicitly added there.

## Content Guidelines

- All documentation pages live under `astro/src/content/docs/{da,en}/`
- Pages use MDX (`.mdx`) with YAML frontmatter
- Required frontmatter fields: `title`, `description`
- The home page (`da/index.mdx` and `en/index.mdx`) uses `template: splash` with hero layout

### Custom Frontmatter Fields

| Field           | Type                 | Purpose                                                             |
| :-------------- | :------------------- | :------------------------------------------------------------------ |
| `redirect-from` | `string \| string[]` | Old URLs that should redirect to this page                          |
| `redirectFrom`  | `string \| string[]` | Same as above (camelCase alias)                                     |
| `giscus`        | `boolean`            | Set `false` to disable Giscus comments on a page (default: enabled) |

### Redirect System

`astro/src/config/frontmatter-redirects.mjs` scans all MDX files at build time, extracts `redirect-from` / `redirectFrom` values, and injects them into Astro's `redirects` config. This allows managing redirects alongside content without touching `astro.config.mjs`.

## Custom Components

### `Giscus.astro`

Comment widget powered by [giscus.app](https://giscus.app), backed by repo `mindovermachine-dev/giscus-public`. Accepts `lang` prop (`'da'` or `'en'`).

### `Footer.astro` (override)

Overrides Starlight's default footer. Automatically appends the Giscus widget above the footer on every page, unless `giscus: false` is set in frontmatter. Derives locale from the page's entry ID (`da/...` → `'da'`).

## Key Technical Details

- **External links**: All `https://` links open in `_blank` with `noopener noreferrer` (via `rehype-external-links`)
- **Root redirect**: `/` → `/da/` (configured in `astro.config.mjs`)
- **Astro version**: 6.x; **Starlight version**: 0.39.x
- **Styling**: SCSS via `astro/src/styles/custom.scss`; sass is a dev dependency in `astro/package.json`
- **Image handling**: `sharp` is a dependency for Astro image processing
- **GitHub org**: https://github.com/mindovermachine-dev

## Coding Conventions

- **After making any file changes, always run `gh insitu run fix-all`** — this auto-fixes prettier and markdownlint violations across all modified files. AI agent file writes bypass VS Code's format-on-save pipeline, so this is the only reliable way to keep formatting clean before committing.
- TypeScript strict mode is enabled
- Use Astro components (`.astro`) for custom UI elements
- Follow the [Starlight component overrides](https://starlight.astro.build/guides/overriding-components/) pattern when customising the theme
- Keep content in Markdown/MDX; reserve `.astro` files for structural/UI concerns
- When adding a new page, also add it to **both** locales and register it in the sidebar in `astro.config.mjs`
