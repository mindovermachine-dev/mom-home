---
name: profile-entry
description: "Use when implementing a GitHub Profile directory issue assigned to Copilot, or when converting the profile issue form into an Astro profile content entry and pull request."
---

# Profile Entry Workflow

Use this skill when a GitHub issue was created from `.github/ISSUE_TEMPLATE/profile.yml` and assigned to Copilot, or when the user explicitly asks to create or update a profile directory entry.

## Outcome

Produce a reviewable pull request that adds or updates one profile content entry under `astro/src/data/profile`, plus its 1:1 profile image under `astro/src/assets/images/profiles`. Do not publish directly to `main`, edit generated output, or change unrelated site behavior.

The committed profile Markdown/MDX file is the website's source of truth. The issue is input; it is not a second profile database.

## First Read

Before editing, inspect only the local surfaces needed for the request:

- The complete source issue, including all form-generated field headings, answers, and any attached image.
- `.github/ISSUE_TEMPLATE/profile.yml`.
- `.github/copilot-instructions.md`.
- `astro/src/content.config.ts` (`profileCollection` schema).
- Existing profile entries under `astro/src/data/profile` and images under `astro/src/assets/images/profiles`.
- `astro/src/utils/profiles.ts` for the normalized `Profile` shape and relation logic.

Check the current branch and worktree before editing. Preserve unrelated user changes.

## Map Form Input

Map the issue form to frontmatter as follows:

- `github_handle` -> `github`. Mandatory. This value is also:
  - the entry file name: `astro/src/data/profile/<github_handle>.mdx`
  - the image file name (extension preserved from the upload): `astro/src/assets/images/profiles/<github_handle>.<ext>`
  - Lowercase is not enforced by GitHub handles, but reuse the handle exactly as submitted for both the file name and the `github` field so they stay in sync.
- `name` -> `name`
- `bio` -> `bio`. Mandatory.
- `body_markdown` -> the Markdown/MDX body after frontmatter. The form suggests a longer description, but the submitter may omit or extend it; preserve all submitted content. When `ai_rewrite_intent` is `Keep as is`, preserve wording and structure, making only formatting or validity fixes. When it is `Allow rewrite`, improve spelling, grammar, and structure without changing factual meaning.
- `linkedin` -> `linkedin`; must be an absolute `https://` URL
- `website` -> `website`; must be an absolute `https://` URL
- `image_upload` -> download the attached image from the issue body (GitHub renders uploaded issue attachments as a `user-attachments` URL) and save it as `astro/src/assets/images/profiles/<github_handle>.<ext>`, then set frontmatter `image: ~/assets/images/profiles/<github_handle>.<ext>`
- `ai_rewrite_intent` controls whether wording and structure may be edited. Do not infer permission to rewrite from the issue's assignment alone.

## Validation Rules

Validate before considering the work complete:

- `name`, `bio`, and `github` are present.
- `github` does not collide with an existing profile entry unless this is an intentional update to that same profile.
- `linkedin` and `website`, when present, are absolute `https://` URLs. Reject unsafe schemes.
- An image was attached and downloaded; the profile schema requires `image` to resolve to a real file under `astro/src/assets/images/profiles`.
- The image is roughly square (1:1). If the submitted image is clearly not 1:1, flag it in the pull request description instead of silently cropping or distorting it.
- The generated filename (`<github_handle>.mdx` and the image name) is stable, URL-safe, and does not overwrite another profile's file unintentionally.
- Do not invent a missing name, GitHub handle, or image. Stop and request clarification when a required value is missing or ambiguous.

Use the collection schema in `astro/src/content.config.ts` for shape validation rather than duplicating rules.

## Static Astro Constraints

This repository is a static Astro site deployed to GitHub Pages:

- Preserve `output: 'static'`.
- Do not add SSR, an Astro adapter, server endpoints, or a database for a profile entry.
- Use Astro content collections and existing profile utilities/layouts; do not build a parallel profile system.
- Respect GitHub Pages `site` and `base` build values. Do not hard-code a repository subpath.
- Follow the existing AstroWind visual language instead of introducing a parallel component or styling system.

## Profile Relationships

Profiles are the target of bidirectional relations from posts and projects (author/coauthor/reviewer, lead/contributor). Creating a new profile entry does not require touching posts or projects; existing content can reference the new `github` handle-derived ID once the entry exists.

## Pull Request Workflow

1. Create or update only the profile content file, its profile image, and the smallest supporting changes required by the issue.
2. Run the repository quality gates after making the change:
   - `gh insitu run fix-all`
   - `gh insitu run trunk-worthy link-checker`
     Fix any remaining Markdownlint or cspell findings manually. Add only verified terminology to `.dict/repo.dictionary` when appropriate.
3. Review the diff for accidental metadata, generated-output, or unrelated changes.
4. Open or update a pull request; do not commit directly to `main`.
5. In the pull request description, link the source issue and summarize any normalization, clarification request, validation result, or AI rewrite decision.

If validation fails because the issue input is incomplete, report the exact field and reason in the issue or pull request instead of guessing.
