# Events Frontmatter Reference

## Purpose

This document defines the event content frontmatter contract for files in:

- `astro/src/data/event/*.mdx`

These files are validated by the `event` content collection schema in:

- `astro/src/content.config.ts`

## Minimal Valid Example

```mdx
---
title: Example Event
dates:
  - date: 2026-10-15
    time: 16:30 UTC
location: Online
---
```

## Full Example

```mdx
---
title: Mind over Machine — Office Hours
sortorder: 2
dates:
  - date: Every Tuesday
    time: 8:15 CEST
    duration: 1:00h
location:
  venue: Online (Slack Huddle)
  address: ""
  mapurl: ""
excerpt: Office Hours is a recurring event where we open up the floor.
signup:
  signupurl: https://app.slack.com/huddle/T09DW7D2W4Q/C0B4SUYJW4R
  caption: Join the huddle on Slack
  icon: ~/assets/images/events/slack-icon.png
  repeat: true
image: ~/assets/images/events/mom-officehours.png
draft: false
metadata:
  title: Office Hours
  description: Weekly open office hour session.
---
```

## Field Reference

### title

- Type: `string`
- Required: yes
- Description: Event title shown in list and detail pages.

### dates

- Type: `array` of occurrence objects
- Required: yes
- Minimum items: `1`

Each occurrence supports:

- `date`
  - Type: `date | string`
  - Required: yes
  - Valid values:
    - Actual date-like value (for example `2026-10-15`)
    - Free text (for example `Every Tuesday`, `Not Scheduled Yet`)
- `time`
  - Type: `string`
  - Required: no
  - Recommended formats:
    - `HH:mm UTC` (recommended for globally consistent events)
    - `HH:mm CEST` or other human-friendly textual time labels
- `duration`
  - Type: `string`
  - Required: no
  - Example: `1:00h`

Behavior rules:

- Occurrences with parseable dates are classified by time as upcoming/past.
- Occurrences with non-parseable text dates are always treated as upcoming.
- Text-date occurrences never appear in the Past Events list.

### sortorder

- Type: `integer`
- Required: no
- Description: Optional fallback order for events that cannot be sorted by a parseable date.

Sorting behavior:

- Events are primarily sorted by the first occurrence date/time.
- If two events cannot be sorted by parseable date/time, `sortorder` is used.
- Lower `sortorder` values are shown first.
- If `sortorder` is also missing/tied, slug order is used as final deterministic fallback.

### location

- Type: `string | object`
- Required: yes

String form:

- Example: `location: Online`

Object form:

- `venue?: string`
- `address?: string`
- `mapurl?: string`

### excerpt

- Type: `string`
- Required: no
- Description: Short summary shown in event listings and metadata.

### image

- Type: `string`
- Required: no
- Description: Cover image path (typically under `~/assets/images/...`).

### signup

- Type: `object`
- Required: no

Fields:

- `signupurl: string` (required when `signup` is present)
- `caption?: string`
- `icon?: string`
- `repeat?: boolean`

### draft

- Type: `boolean`
- Required: no
- Description: Draft events are excluded from rendered event lists.

### metadata

- Type: object
- Required: no
- Description: Optional SEO metadata block shared with other content types.

## Migration Note: DateTime to date + time

Old style (single DateTime in `date`):

```yaml
dates:
  - date: 2026-06-24T15:00:00Z
```

New style:

```yaml
dates:
  - date: 2026-06-24
    time: 15:00 UTC
```

## Authoring Recommendations

- Prefer explicit `UTC` in `time` for globally shared events.
- Use text dates for recurring/unscheduled placeholders:
  - `Every Tuesday`
  - `Not Scheduled Yet`
- Keep `duration` concise and human-readable.

## Validation Checklist

Before committing event content:

1. Ensure at least one `dates` item exists.
2. Ensure each `dates` item has `date`.
3. If using undated/text-dated events, set `sortorder` for explicit ordering.
4. If using `signup`, ensure `signup.signupurl` is set.
5. Run build:

```bash
cd astro && npm run build
```
