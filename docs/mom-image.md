# MomImage Reference Manual

## Purpose

`MomImage` is a project-level content image component that wraps the lower-level `Image` component in this codebase and provides:

- Position presets: `left`, `center`, `right`
- Size presets: `tiny`, `small`, `medium`, `large`, `full`
- Layout behavior mode: `static` or `flow`
- Optional caption rendering with centralized style control in SCSS

This component is intended for editorial/content usage (for example in MDX posts), where authors need consistent image treatment with minimal inline styling.

## Source Files

- Component: `astro/src/components/common/MomImage.astro`
- Styling: `astro/src/assets/styles/components/mom-image.scss`
- Global style import: `astro/src/layouts/Layout.astro`
- Underlying base image wrapper: `astro/src/components/common/Image.astro`

## Dependency Graph

`MomImage.astro` depends on:

1. `astro/src/components/common/Image.astro`
2. SCSS classes from `astro/src/assets/styles/components/mom-image.scss`

`mom-image.scss` is effective only when imported globally (currently done in `Layout.astro`):

```astro
import '~/assets/styles/components/mom-image.scss';
```

`Image.astro` (the base wrapper) depends on:

- `astro:assets` (`Image as AstroImage`)
- `unpic` (`transformUrl`, `parseUrl`)
- `~/utils/images` (`findImage`)

## Installation and Build Requirements

The project uses SCSS. Ensure the following dev dependency exists in the Astro app package:

- `sass-embedded`

Current project already includes it in `astro/package.json`.

## Component API

Defined in `MomImage.astro`:

```ts
type Position = "left" | "center" | "right";
type Size = "tiny" | "small" | "medium" | "large" | "full";
type Mode = "static" | "flow";

interface Props {
  src: string | ImageMetadata;
  alt: string;
  caption?: string;
  position?: Position;
  size?: Size;
  mode?: Mode;
  class?: string;
  imageClass?: string;
  captionClass?: string;
}
```

### Required Props

- `src`: `string | ImageMetadata`
- `alt`: `string`

### Optional Props

- `caption`: `string`
- `position`: `'left' | 'center' | 'right'` (default: `'center'`)
- `size`: `'tiny' | 'small' | 'medium' | 'large' | 'full'` (default: `'large'`)
- `mode`: `'static' | 'flow'` (default: `'static'`)
- `class`: additional classes on outer `<figure>`
- `imageClass`: additional classes on rendered `<img>`
- `captionClass`: additional classes on `<figcaption>`

## Rendering Contract

`MomImage` renders:

1. `<figure>` with base and modifier classes
2. Nested project `Image` component (`~/components/common/Image.astro`)
3. Optional `<figcaption>` only when `caption` is provided

Example class output:

```html
<figure
  class="mom-image mom-image--flow mom-image--position-right mom-image--size-tiny ..."
>
  <img class="mom-image__img ..." ... />
  <figcaption class="mom-image-caption ...">...</figcaption>
</figure>
```

## Behavior Matrix

### Size Mapping

From component logic:

- `tiny`
  - width: `320`
  - widths: `[240, 320, 480]`
  - sizes: `"(max-width: 320px) 100vw, 320px"`
- `small`
  - width: `480`
  - widths: `[320, 480, 768]`
  - sizes: `"(max-width: 480px) 100vw, 480px"`
- `medium`
  - width: `640`
  - widths: `[480, 640, 768]`
  - sizes: `"(max-width: 640px) 100vw, 640px"`
- `large`
  - width: `768`
  - widths: `[480, 768, 1000]`
  - sizes: `"(max-width: 768px) 100vw, 768px"`
- `full`
  - width: `1600`
  - widths: `[768, 1200, 1600, 2000]`
  - sizes: `"100vw"`

### Mode and Position

Defined in SCSS:

- `mode="static"`
  - left: aligned left (`margin-right: auto`)
  - center: centered (`margin-left/right: auto`)
  - right: aligned right (`margin-left: auto`)
- `mode="flow"`
  - left: `float: left`, `clear: left`, text wraps
  - right: `float: right`, `clear: right`, text wraps
  - center: `clear: both`, centered block

## Caption Styling

Caption is controlled by `.mom-image-caption` in SCSS, not inline in component:

- centered text
- width constrained to image container (`width: 100%`, `max-width: 100%`)
- muted color token
- dark mode override via `.dark .mom-image-caption`

To change caption typography/spacing globally, edit only:

- `astro/src/assets/styles/components/mom-image.scss`

## Usage Examples

### Centered, default sizing

```astro
---
import MomImage from '~/components/common/MomImage.astro';
---

<MomImage
  src="~/assets/images/posts/example.png"
  alt="Example"
  caption="Default center image"
/>
```

### Floating right with wrapped text

```astro
<MomImage
  src="~/assets/images/posts/example.png"
  alt="Example"
  caption="Right floating image"
  mode="flow"
  position="right"
  size="tiny"
/>
```

### Full width hero style

```astro
<MomImage
  src="~/assets/images/posts/example.png"
  alt="Example"
  size="full"
  position="center"
/>
```

## Copying MomImage to Another Astro Project

If you want to transplant this component as a reusable unit, copy these files together:

1. `src/components/common/MomImage.astro`
2. `src/assets/styles/components/mom-image.scss`
3. `src/components/common/Image.astro` (or adapt `MomImage` to use your destination image abstraction)

Also ensure:

1. Global SCSS import exists in your layout:

```astro
import '~/assets/styles/components/mom-image.scss';
```

1. SCSS compiler is installed:

```bash
npm install -D sass-embedded
```

1. If you copy `Image.astro` unchanged, also bring its dependencies:

- package: `unpic`
- local utility: equivalent of `~/utils/images` with `findImage`

1. Confirm your image pipeline supports `astro:assets` and Sharp-compatible setup.

## Portability Notes

- `MomImage` itself is portable.
- The current `Image.astro` is opinionated for this repository (CDN URL transform behavior and utility dependencies).
- If destination project already has a base image component, it is often better to keep only `MomImage` + SCSS and swap the imported base image component in `MomImage.astro`.

## Troubleshooting

### Styles not applied

- Verify `mom-image.scss` is imported in the active layout.
- Verify class names remain `mom-image*` in markup.

### SCSS build error

- Ensure `sass-embedded` exists in the app where Astro build runs.

### Images render but no optimization

- Check whether `src` is local/imported vs remote.
- Review behavior of your `common/Image.astro` wrapper and remote source configuration.

## Change Safety Checklist

When editing `MomImage`:

1. Keep prop union literals in sync with SCSS modifier classes.
2. Keep `sizeConfig` and documented size table synchronized.
3. Run build after changes:

```bash
cd astro && npm run build
```
