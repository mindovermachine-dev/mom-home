---
name: project-entry
description: "Use when implementing a GitHub Project directory issue assigned to Copilot, or when converting the project issue form into an Astro project content entry and pull request."
---

# Project Entry Workflow

Use this skill when a GitHub issue was created from `.github/ISSUE_TEMPLATE/project.yml` and assigned to Copilot, or when the user explicitly asks to create or update a project directory entry.

## Outcome

Produce a reviewable pull request that adds or updates one project content entry under `astro/src/data/project`. Do not publish directly to `main`, edit generated output, or change unrelated site behavior.

The committed project Markdown/MDX file is the website's source of truth. The issue is input; it is not a second project database.

## First Read

Before editing, inspect only the local surfaces needed for the request:

- The complete source issue, including all form-generated field headings and answers.
- `.github/ISSUE_TEMPLATE/project.yml`.
- `.github/copilot-instructions.md`.
- `astro/src/content.config.ts`.
- `astro/src/utils/project-validation.ts`.
- Existing project entries under `astro/src/data/project`.
- `astro/src/pages/projects/index.astro` and `astro/src/pages/projects/[slug]/index.astro` when route behavior is relevant.
- Existing profile files when participant IDs need validation.

Check the current branch and worktree before editing. Preserve unrelated user changes.

## Map Form Input

Map the issue form to frontmatter as follows:

- `project_title` -> `title`
- `publish_date` -> `publishDate`; use an explicit ISO date. Convert a supplied `YYYY-MM-DD` value to the repository's expected date format. If the field is absent or ambiguous, stop and request clarification; never invent a date.
- `status` -> `project.status`; allowed values are `mature`, `beta`, `lab`, `explore`, and `not-started`.
- `excerpt` -> `excerpt`
- `body_markdown` -> the Markdown/MDX body after frontmatter. The form suggests headings, but the submitter may omit, reorder, or add headings; preserve all submitted content. When `ai_rewrite_intent` is `Keep as is`, preserve wording and heading structure, making only formatting or validity fixes. When it is `Allow rewrite`, improve spelling, grammar, and structure without changing factual meaning.
- `project_tags` -> `project.tags`
- `publication_intent` -> `draft`; publish now means `false`, keep as draft means `true`
- `image_path` -> `image`; treat `REQUEST:` text as a request requiring a separate decision, not as a literal image path
- `slack_channel` and `slack_url` -> `project.slack`
- `github_repositories` -> `project.github.repositories`, one `owner/name` per line
- `references` -> ordered `project.references` entries in `name | url` format
- `leads` and `contributors` -> `project.participants` profile IDs
- `ai_rewrite_intent` controls whether wording and structure may be edited. Do not infer permission to rewrite from the issue's assignment alone.

Only include optional nested objects when they have meaningful values. Preserve reference order and participant role separation.

## Validation Rules

Validate before considering the work complete:

- `title` and `publishDate` are present and valid.
- `project.status` is one of the allowed enum values.
- Repository values use `owner/name` format.
- Reference URLs are site-relative paths beginning with `/` or absolute `http`/`https` URLs. Reject unsafe schemes.
- Every lead and contributor ID exists in `astro/src/data/profile`.
- No profile ID appears in both leads and contributors.
- Draft projects do not appear in public directory or profile reverse relations.
- The generated filename is stable, URL-safe, and does not overwrite another project unintentionally.
- Do not invent missing URLs, profile IDs, repositories, images, statuses, or tags. Stop and request clarification when a required value is missing or ambiguous.

Use the collection schema for shape and enum validation, and the existing project validation utilities rather than duplicating rules.

## Static Astro Constraints

This repository is a static Astro site deployed to GitHub Pages:

- Preserve `output: 'static'`.
- Do not add SSR, an Astro adapter, server endpoints, a database, or a client framework for a project entry.
- Use Astro content collections, `getStaticPaths`, existing layouts, metadata, image, permalink, localization, and profile utilities.
- Query-string filtering must remain progressive enhancement over a complete usable static listing.
- Respect GitHub Pages `site` and `base` build values. Do not hard-code a repository subpath.
- Follow the existing AstroWind visual language instead of introducing a parallel component or styling system.

## Profile Relationships

Project participants are bidirectional relations:

- Project pages link leads and contributors to their profile pages.
- English and Danish profile pages list non-draft projects with `Lead` or `Contributor` labels.
- Preserve existing post-to-profile relations and use the established relation types/utilities.
- Do not duplicate project relationships into profile frontmatter.

## Pull Request Workflow

1. Create or update only the project content file and the smallest supporting changes required by the issue.
2. If the issue requests new behavior not already implemented, add focused tests and documentation alongside the implementation.
3. Run the repository quality gates after making the change:
   - `gh insitu run fix-all`
   - `gh insitu run trunk-worthy link-checker`
     Fix any remaining Markdownlint or cspell findings manually. Add only verified project terminology to `.dict/repo.dictionary` when appropriate.
4. Review the diff for accidental metadata, generated-output, or unrelated changes.
5. Open or update a pull request; do not commit directly to `main`.
6. In the pull request description, link the source issue and summarize any normalization, clarification request, validation result, or AI rewrite decision.

If validation fails because the issue input is incomplete, report the exact field and reason in the issue or pull request instead of guessing.
