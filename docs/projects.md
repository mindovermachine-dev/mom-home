# Projects frontmatter reference

Project content lives in `astro/src/data/project/*.md` and `*.mdx` and is validated by the `project` collection in `astro/src/content.config.ts`.

## Minimal valid example

```mdx
---
publishDate: 2026-09-03T00:00:00Z
title: Project title
project:
  status: mature
---
```

## Full frontmatter contract

```yaml
publishDate: 2026-09-03T00:00:00Z
updateDate: 2026-09-05T00:00:00Z # optional
title: "Project title"
excerpt: "A short summary used in cards and metadata."
image: ~/assets/images/projects/project-name.png # optional
tags: # optional shared SEO/content taxonomy
  - AI
  - Community
draft: false # optional
metadata: # optional
  description: "Optional page description."
project:
  status: mature # required: mature | beta | lab | explore | not-started
  order: 1 # optional explicit directory sort order
  tags: # optional project filtering taxonomy
    - DevX
    - Python
  slack: # optional
    channel: "#takt"
    url: https://mindovermachine-dk.slack.com/archives/C0B9CTYQ8TA
  github: # optional
    repositories:
      - mindovermachine-dev/gh-tt
      - mindovermachine/takt-actions
  references: # optional, ordered
    - name: "Takt"
      url: /writings/takt/
    - name: "Reference manual"
      url: https://mindovermachine.dev/takt/
  participants: # optional
    leads:
      - lakruzz
    contributors:
      - blikest
```

## Validation rules

- `title` and `publishDate` are required.
- `project.status` is required and restricted to `mature`, `beta`, `lab`, `explore`, `not-started`.
- `project.github.repositories` must use `owner/name` format.
- `project.references[*].url` must be either site-relative (`/path`) or absolute `http`/`https`.
- `project.participants.leads` and `project.participants.contributors` must reference existing `profile` entries.
- The same profile ID cannot appear in both `leads` and `contributors`.

## Sorting and visibility

- Draft projects are excluded from `/projects/`, `/projects/<slug>/`, and profile reverse relations.
- Non-draft projects are ordered by:
  1. `project.order` ascending
  2. `publishDate` descending
  3. slug ascending

## Query filter contract

- Canonical query keys: `status` and `tags`.
- `status` accepts one value from the status enum.
- `tags` accepts comma-separated values and uses case-insensitive OR matching.
- Unknown/invalid values are ignored.
- Empty filters are removed from the URL, preserving unrelated query parameters.

## Issue form mapping

The issue form at `.github/ISSUE_TEMPLATE/project.yml` is the input interface for generating or updating project content files. The committed content file remains the source of truth.
