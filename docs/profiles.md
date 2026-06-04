# Profiles in `mom-home`

This document explains how the profile system works in this repository, how it is connected to blog posts, and how to add and use new profiles (including portrait images).

## Quick overview

Profiles are content entries used to:

- show author/coauthor/reviewer attribution on blog posts
- provide dedicated profile pages (`/profile/:handle` and `/da/profile/:handle`)
- build a per-profile list of related blog posts

At build time, profile and post content are loaded from Astro content collections, normalized into typed objects, and rendered by the relevant page/components.

## Where profile-related code lives

### Content and schema

- Profile data files: `astro/src/data/profile/*.mdx`
- Profile collection schema: `astro/src/content.config.ts` (`profileCollection`)
- Post collection schema (author fields): `astro/src/content.config.ts` (`postCollection`)

### Runtime types and utilities

- Shared types: `astro/src/types.d.ts`
  - `Profile`
  - `ResolvedProfileReference`
  - `ProfileRelation` + `ProfileRelationRole`
- Profile loading and relation builder: `astro/src/utils/profiles.ts`
- Post loading and normalization (includes `author`, `coauthor`, `reviewers`): `astro/src/utils/blog.ts`

### Rendering

- Post attribution UI:
  - `astro/src/components/blog/SinglePost.astro`
  - `astro/src/components/profiles/ProfileAttribution.astro`
- Profile pages:
  - `astro/src/pages/profile/[handle]/index.astro`
  - `astro/src/pages/da/profile/[handle]/index.astro`

## Data model

## Profile entry frontmatter

Defined by `profileCollection` schema:

- `name` (required)
- `bio` (optional)
- `image` (optional, string path to image)
- `github` (optional)
- `linkedin` (optional)
- `website` (optional)

The profile ID is the file stem (for example `lakruzz.mdx` => profile id `lakruzz`).

## Post fields that connect to profiles

Defined by `postCollection` schema:

- `author?: string`
- `coauthor?: string`
- `reviewers?: string[]`

These values should match existing profile IDs in `astro/src/data/profile`.

## Profile flow and relationships

### 1) Collection loading and normalization

- `fetchProfiles()` (`astro/src/utils/profiles.ts`) loads the `profile` collection and normalizes each entry to:
  - `id`
  - `name`, `bio`, `image`, `github`, `linkedin`, `website`
- Results are cached in-memory in `_profiles`.

### 2) Post attribution resolution

- `SinglePost.astro` loads all profiles via `fetchProfiles()`.
- It maps profile IDs from post frontmatter (`author`, `coauthor`, `reviewers`) to `ResolvedProfileReference`.
- `ProfileAttribution.astro` renders each role:
  - If a profile exists, name is linked to `/profile/<id>`.
  - If not found, raw ID is shown as plain text (fallback behavior).

### 3) Profile pages and reverse relations

- Profile routes are generated from all profile entries in both EN and DA pages.
- `buildProfileRelationsFromPosts()` builds a reverse index:
  - profile ID -> list of posts where role is `author`, `coauthor`, or `reviewer`.
- Profile pages show:
  - profile identity block (name/bio/socials/portrait image when provided)
  - profile body content (`<ProfileContent />`)
  - list of related blog posts with role labels

## Portrait images

Profile images are set in profile frontmatter using a path in `~/assets/images/...`, for example:

```yaml
image: ~/assets/images/profiles/lakruzz.png
```

Portrait image files live in:

- `astro/src/assets/images/profiles/`

Rendering details:

- Profile pages use `Image` from `astro/src/components/common/Image.astro`.
- Current portrait render uses:
  - width: `160`
  - height: `160`
  - `layout="fixed"`
  - rounded corners via `class="rounded-xl"`

## Add a new profile (step-by-step)

## 1) Choose profile ID

Pick a stable, URL-safe ID. This is the filename and the reference key used from posts.

Example ID: `jane-doe`

## 2) Add profile file

Create `astro/src/data/profile/jane-doe.mdx`:

```mdx
---
name: Jane Doe
bio: Platform engineer and contributor.
image: ~/assets/images/profiles/jane-doe.png
github: janedoe
linkedin: https://linkedin.com/in/jane-doe
website: https://example.com
---

Optional body content for the profile page.
```

Notes:

- `name` is required.
- Other fields are optional.
- Body content under frontmatter is rendered on profile pages.

## 3) Add portrait image (optional but recommended)

Add image file:

- `astro/src/assets/images/profiles/jane-doe.png`

Then point `image` in profile frontmatter to that path.

## 4) Reference profile in posts

Use the profile ID in post frontmatter:

```yaml
author: jane-doe
coauthor: another-id
reviewers:
  - lindanz
  - mom-polu
```

## 5) Verify output

- Post header shows Author / Coauthor / Reviewers attribution.
- Names link to profile pages when profile IDs resolve.
- Profile page appears at:
  - `/profile/jane-doe`
  - `/da/profile/jane-doe`
- Profile page blog list includes posts where the profile is author/coauthor/reviewer.

## Author, coauthor, and reviewers behavior

- `author`: single profile ID
- `coauthor`: single profile ID
- `reviewers`: list of profile IDs

All three contribute to:

- post attribution rendering in `SinglePost.astro`
- profile reverse relations built in `buildProfileRelationsFromPosts()`

Role labels on profile pages:

- `author` -> `Author`
- `coauthor` -> `Coauthor`
- `reviewer` -> `Reviewer`

## Current real examples in this repository

### Profile entries

- `astro/src/data/profile/lakruzz.mdx`
- `astro/src/data/profile/buep.mdx`
- `astro/src/data/profile/lindanz.mdx`
- `astro/src/data/profile/mom-polu.mdx`

### Post using all role types

`astro/src/data/post/say-ai-again-i-dare-you.mdx`:

- `author: lakruzz`
- `coauthor: buep`
- `reviewers: [lindanz, mom-polu]`

### Post using only author

`astro/src/data/post/devops-evolution.md`:

- `author: lakruzz`

## Common pitfalls

- Using a post `author/coauthor/reviewers` value that does not match a profile ID.
  - Effect: fallback to plain text ID in attribution; no linked profile identity.
- Placing portrait files outside `~/assets/images/...` when using asset-style paths.
- Renaming a profile file without updating all post references.

## Contributor checklist

- Add/update profile in `astro/src/data/profile`.
- Add/update portrait in `astro/src/assets/images/profiles` and set `image` path.
- Use exact profile IDs in post frontmatter.
- Validate with project checks before merging.
