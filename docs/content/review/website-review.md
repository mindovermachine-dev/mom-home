---
title: Website Review Guide
description: Scope and checks for reviewing changes to the Mind over Machine website.
---

## Purpose

Use this guide to prepare and review a website change. A review should identify actionable problems and verification gaps without turning into an unrelated site-wide cleanup.

## Choose The Scope

By default, review the current change set against the locally available `origin/main`, including committed branch changes and staged, unstaged and non-ignored untracked files. Do not fetch or change branches as part of establishing scope unless requested. If `origin/main` is unavailable or stale, report that limitation rather than silently choosing a different baseline.

From the repository root, use the union of these lists to identify candidate files:

```bash
git diff --name-status origin/main HEAD
git diff --name-status HEAD
git diff --cached --name-status
git diff --name-status
git ls-files --others --exclude-standard
```

The separate working-tree and index comparisons make staged and unstaged changes visible even when they cancel each other out. `--exclude-standard` respects Git's ignore rules for untracked files; tracked files remain in scope even if an ignore rule matches them. Inspect the corresponding diffs and untracked file contents, including additions, deletions and renames. Read related files when necessary to understand or validate a changed behavior, but do not treat unrelated files as part of the review.

An **extended review** is explicitly requested and may cover a broader feature, locale, site or repository. Agree on its boundaries and baseline before starting; do not infer an extended review from an ordinary request. The checks below apply within the chosen scope, and coverage should expand with its risks.

## Prepare And Verify

Run the repository quality gates from the root:

```bash
gh insitu run fix-all
gh insitu run trunk-worthy link-checker
```

Run `fix-all` first, then inspect spelling findings and correct genuine spelling mistakes manually within the review scope. CSpell does not provide a `--fix` option. Preserve legitimate names and domain terms; do not add dictionary entries merely to hide errors. Run the pre-commit waves after corrections and rerun relevant checks after any further edits.

These commands may examine or modify files outside the review scope. Inspect their results, preserve existing user changes and do not silently revert or broaden the review to unrelated files. Report unrelated failures or automatic changes separately. If a command cannot run or fails, report the reason and any checks left unverified; do not claim a passing gate.

## Review The Change

Apply the relevant checks to changed behavior and content:

- **Intent and correctness:** Compare the change with the request and surrounding behavior. Check claims, prices, eligibility, dates and terminology against the available source material; flag unsupported assumptions.
- **Calls to action and navigation:** Check more than link validity. Does each label set the right expectation, and does its destination fulfil it in the correct language? Check anchors, return paths, contact actions and relevant menu or footer links.
- **Danish and English:** Where both locales exist, use Danish as the reference for substantive meaning, benefits, conditions and numbers. English should read naturally, not necessarily word for word. Check locale-specific routes, language switches and metadata. If only one locale exists, report a material gap where appropriate but do not create the missing counterpart during review.
- **Documentation consistency:** Check whether documentation under `docs/` relevant to the change remains accurate and consistent with the implementation and other related docs, even when those docs are outside the change set. The docs are English-only; do not apply the website's dual-language policy to them. They are built with the `remote-astro-theme` CLI using an Astro Starlight theme; every page entry requires at least `title` and `description` in its frontmatter. Check changed or affected entries and run `npm run docs:build` when documentation rendering or configuration is affected. Report inconsistencies and offer to fix or update the docs, rather than silently expanding the review.
- **User experience and accessibility:** Check relevant desktop and mobile layouts, readability, navigation, keyboard access, focus states, semantic headings, image alternatives and contrast. Exercise the affected interactions rather than relying only on source inspection.
- **Discovery and sharing:** Check meaningful titles, descriptions, canonical URLs, language and Open Graph images for changed pages. Verify images and links in generated output where relevant; avoid duplicate or misleading metadata.
- **Static-site behavior:** Check that changed pages and links work in the generated site, including configured site/base paths and any no-JavaScript fallback. Do not introduce server-side behavior for a static feature.
- **Tests and regression risk:** Run focused tests, Astro checks or a build as appropriate to the change. Check that shared components, generated routes and existing links retain their intended behavior, and identify missing coverage.

Review findings and repairs should stay within the agreed scope. Correct spelling and mechanical issues as requested; do not silently fix unrelated problems. For substantive findings, distinguish a review from a request to implement fixes and obtain authorization before expanding the work.

## Report

Lead with actionable findings, ordered by severity and grounded in file and line references. Explain the consequence and the conditions needed to reproduce it. Then note assumptions, checks run, failed or unavailable checks, and any remaining risk. If there are no findings, say so explicitly and mention relevant verification gaps. Separate unrelated observations from the scoped findings.
