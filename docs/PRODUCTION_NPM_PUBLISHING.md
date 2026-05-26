# Production and npm Publishing Guide

This document records the current production status of `frameloom`, the implementation work required before a stable release, and the exact path for publishing the package to npm.

## Current Status

`frameloom` is not ready for a stable public npm release yet.

The repository currently contains:

- package metadata and ESM export map
- TypeScript core public types
- native animation driver
- optional GSAP animation-driver adapter
- optional Motion animation-driver adapter
- URL-array frame loader
- shared URL asset cache
- cancellable preload/lazy/manual loading modes
- DPR-aware canvas renderer with `cover`, `contain`, and `fill`
- React `FrameSequence` component for image URL arrays
- architecture, roadmap, performance, migration, and multi-layer canvas planning docs

The repository does not currently contain:

- `FrameStage` React component
- `SequenceLayer` React component
- `CloudLayer` React component
- ZIP archive loader
- poster/initial frame preloader support
- `createImageBitmap` resource lifecycle
- tests
- example apps
- CI
- license file
- changelog

## Multi-Layer Canvas Status

The target API is documented but not implemented yet:

```tsx
<FrameStage>
  <SequenceLayer id="city" archiveUrl="/frames/city.zip" />
  <SequenceLayer id="clouds" images={cloudFrames} />
  <CloudLayer id="ambient-clouds" />
</FrameStage>
```

The current source only defines related TypeScript types in `src/core/types.ts`. The React entry point explicitly marks `FrameSequence`, `FrameStage`, `SequenceLayer`, and `CloudLayer` as planned exports.

## Preloader Status

The first production preloader slice is implemented for URL arrays.

The performance docs describe the intended loading behavior:

- URL array loading
- ZIP archive loading
- `createImageBitmap` decoding when available
- bounded decode concurrency through `preloadConcurrency`
- loading-progress callbacks
- resource release for `ImageBitmap.close()`

Current runtime support includes URL-array loading, `preloadConcurrency`, `onLoadStart`, `onLoadProgress`, `onLoadComplete`, `onLoadError`, `AbortController` cancellation, `preload`/`lazy`/`manual` modes, and a shared URL asset cache. ZIP loading, `createImageBitmap`, poster frames, and advanced cache eviction remain planned.

## Production Implementation Plan

### Phase 1: Single Sequence Runtime

Goal: ship a usable `FrameSequence` before the multi-layer stage.

1. Add `src/core/frameLoader.ts`.
2. Support loading ordered image URL arrays.
3. Support loading ZIP archives from `archiveUrl`.
4. Add decode concurrency control.
5. Add progress and error reporting.
6. Add `src/core/canvasRenderer.ts` for DPR sizing and `cover`, `contain`, and `fill` drawing.
7. Add `src/react/FrameSequence.tsx`.
8. Export `FrameSequence` from `frameloom/react`.
9. Add imperative methods: `setFrame`, `setProgress`, `play`, `pause`, and `render`.
10. Use `nativeAnimationDriver` by default and keep GSAP/Motion optional.

Acceptance criteria:

- `<FrameSequence images={frames} />` renders in React.
- `<FrameSequence archiveUrl="/frames/city.zip" />` renders in React.
- Progress callbacks work during preload.
- TypeScript declarations are generated correctly.
- SSR import does not crash in Next.js.

### Phase 2: Preloader and Resource Lifecycle

Goal: make loading predictable enough for production scenes.

1. Add a shared asset cache keyed by URL/archive entry.
2. Add `preload`, `lazy`, and `manual` loading modes.
3. Add `onLoadStart`, `onLoadProgress`, `onLoadComplete`, and `onLoadError` callbacks.
4. Add cancellation through `AbortController`.
5. Release image resources on unmount when cache ownership allows it.
6. Add poster/initial frame support so the canvas can show useful content early.

Acceptance criteria:

- Loading can be cancelled on unmount.
- Partial failures are surfaced clearly.
- Large sequences do not decode all frames at once unless configured.
- Decorative canvases can expose accessible fallback labels or be hidden from assistive tech.

### Phase 3: Multi-Layer Stage

Goal: implement the planned one-canvas, many-layer API.

1. Add `src/core/stage.ts` for layer registry, scheduling, and render ordering.
2. Add normalized placement math for `x`, `y`, `width`, `height`, anchors, rotation, opacity, blend mode, and z-index.
3. Add `FrameStage` React component with a single canvas and shared render loop.
4. Add React context for child layer registration.
5. Add `SequenceLayer` for image sequences inside a stage.
6. Add `CloudLayer` for generated ambient clouds.
7. Support config-array layers through `<FrameStage layers={layers} />`.
8. Add imperative stage controls: `setLayerFrame`, `setLayerProgress`, `playLayer`, `pauseLayer`, and `render`.

Acceptance criteria:

- The documented `<FrameStage>` example works.
- Layers render in deterministic z-order.
- A stage uses one RAF loop.
- Layer frame changes mark the stage dirty without React state per frame.
- Each layer can be controlled independently.

### Phase 4: Tests, Examples, and CI

Goal: make the package safe to publish and maintain.

1. Add unit tests for clamp helpers, fit math, placement math, sorting, loader ordering, cache behavior, and animation drivers.
2. Add Playwright visual smoke tests with a tiny sample frame set.
3. Add a Vite example app.
4. Add a Next.js example app.
5. Add pointer-scrub and scroll-driven examples.
6. Add CI for typecheck, lint, build, and tests.
7. Add a bundle-size check.

Acceptance criteria:

- CI passes on a clean checkout.
- Examples run from documented commands.
- Package exports work from a temporary consumer app.

### Phase 5: Release Hardening

Goal: prepare for a stable npm release.

1. Add `LICENSE`.
2. Add `CHANGELOG.md`.
3. Decide whether the first release is `0.1.0` or `1.0.0`.
4. Confirm npm package name ownership for `frameloom`.
5. Add browser support notes.
6. Add SSR/Next compatibility notes.
7. Add troubleshooting docs.
8. Verify `npm pack --dry-run` contains only intended files.
9. Verify install from the packed tarball in a temporary app.

Acceptance criteria:

- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm pack --dry-run` shows `dist`, `README.md`, and `docs`.
- A clean consumer project can install and import the package.

## npm Publishing Guide

Use this section after the production implementation plan is complete, or for an early prerelease if the package is intentionally marked experimental.

### 1. Prepare Package Metadata

Update `package.json` before publishing:

```json
{
  "name": "frameloom",
  "version": "0.1.0",
  "description": "Composable canvas image-sequence animations for React, with optional GSAP and Motion adapters.",
  "license": "MIT"
}
```

Recommended additions:

- `repository`
- `bugs`
- `homepage`
- `author` or `contributors`
- `publishConfig.access` if publishing under a scope

For an unscoped public package named `frameloom`, no `publishConfig.access` is required. For a scoped public package such as `@your-scope/frameloom`, add:

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

### 2. Install and Verify Locally

Run the local checks:

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

The current `prepublishOnly` script already runs:

```bash
npm run typecheck && npm run build
```

Keep lint and tests in the manual or CI release checklist too.

### 3. Inspect the Package Contents

Preview the npm tarball:

```bash
npm pack --dry-run
```

Confirm the package includes:

- `dist/index.js`
- `dist/index.d.ts`
- `dist/react/index.js`
- `dist/react/index.d.ts`
- `dist/react/gsap.js`
- `dist/react/gsap.d.ts`
- `dist/react/motion.js`
- `dist/react/motion.d.ts`
- `README.md`
- `docs/`

Confirm it excludes:

- source-only development files that consumers do not need
- local test output
- editor files
- temporary archives
- unpublished example build output

### 4. Test the Packed Tarball

Create the tarball:

```bash
npm pack
```

Install it in a separate temporary app:

```bash
npm install ../frameloom/frameloom-0.1.0.tgz
```

Verify these imports from the consumer app:

```ts
import { nativeAnimationDriver } from 'frameloom';
import { FrameSequence } from 'frameloom/react';
import { createGsapAnimationDriver } from 'frameloom/react/gsap';
import { createMotionAnimationDriver } from 'frameloom/react/motion';
```

For the current repository state, the animation-driver imports and `FrameSequence` with image URL arrays are expected to work. ZIP archive loading and multi-layer imports should be tested only after those implementation phases are complete.

### 5. Authenticate With npm

Log in:

```bash
npm login
```

Confirm the active account:

```bash
npm whoami
```

Confirm the package name is available or owned by the publishing account:

```bash
npm view frameloom
```

If the package does not exist, npm will return a 404-like message. If it exists, verify ownership before publishing.

### 6. Publish

For an experimental prerelease:

```bash
npm version prerelease --preid beta
npm publish --tag beta
```

Users can install the beta with:

```bash
npm install frameloom@beta
```

For a normal public release:

```bash
npm version minor
npm publish
```

Users can install the stable package with:

```bash
npm install frameloom
```

### 7. Post-Publish Verification

After publishing, verify npm metadata:

```bash
npm view frameloom version
npm view frameloom exports
```

Then test installation from npm in a clean app:

```bash
npm create vite@latest frameloom-smoke -- --template react-ts
cd frameloom-smoke
npm install
npm install frameloom
npm run build
```

### 8. Release Notes

For each release, update `CHANGELOG.md` with:

- package version
- release date
- added APIs
- changed behavior
- fixed bugs
- migration notes
- known limitations

For the first public release, clearly state whether multi-layer canvas and ZIP preloading are stable, experimental, or not included.