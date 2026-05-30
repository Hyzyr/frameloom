# Changelog

All notable changes to `frameloom` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [2.0.0] — 2026-05-31

### Added

- **Branded API** — `FrameloomScene` (alias for `FrameStage`), `Frameloom` (alias for `SequenceLayer`), `useFrameloomSceneControls` (alias for `useFrameStageControls`), `useFrameloomControls` (alias for `useFrameSequenceControls`) exported from `frameloom/react`.
- **Branded type aliases** — `FrameloomSceneHandle`, `FrameloomSceneProps`, `FrameloomProps`, `FrameloomSceneControls`, `FrameloomControls`.
- **ZIP archive loading** via `archiveUrl` prop on both `Frameloom` (`SequenceLayer`) and `FrameSequence`. Pass a URL to a `.zip` file; frameloom downloads, extracts, sorts, and plays the frames automatically.
- New core utility `loadFramesFromArchive(url, options)` — streaming fetch, fflate async unzip, blob URL generation, in-memory cache, AbortSignal, sorted frame extraction. Exported from `frameloom`.
- New utility `releaseArchiveCache(url?)` — revokes blob URLs and clears cache entries. Exported from `frameloom`.
- `fflate` production dependency (~5KB gzipped, ESM, tree-shakeable) for ZIP extraction.

### Changed

- `images` on `FrameStageSequenceLayerConfig` / `SequenceLayerProps` is now **optional** (previously required). Provide either `images` or `archiveUrl`.
- Branded names (`FrameloomScene`, `Frameloom`) are now the **recommended** API in all docs and examples. Original names still fully exported and supported.

### Backward compatible

- `FrameStage`, `SequenceLayer`, `useFrameStageControls`, `useFrameSequenceControls` — all still exported with identical behavior.

---

## [1.3.0] — 2026-05-30

### Added

- `useFrameStageControls()` hook — returns a typed ref and all stage imperative methods without needing a direct ref.
- `useFrameSequenceControls()` hook — returns a typed ref and sequence controls.
- `setLayerPlacement(id, placement, options?)` on `FrameStageControls` — move or resize a layer at runtime with optional tween.
- `setLayerOpacity(id, opacity, options?)` on `FrameStageControls` — set layer alpha at runtime.
- `setLayerTransform(id, transform, options?)` on `FrameStageControls` — update `x`, `y`, `rotation`, `skewX`, `skewY` in one call.
- `skewX` and `skewY` transform fields on `NormalizedPlacement` (radians).
- `anchorX` and `anchorY` transform origin fields on `NormalizedPlacement`.

### Changed

- Layer placement values (`x`, `y`, `width`, `height`) are normalized `0–1` relative to the parent canvas.
- `FrameStage` and `FrameSequence` now use `forwardRef` + `useImperativeHandle` internally; the hook APIs are the recommended user-facing pattern.

---

## [1.2.0] — 2026-05-30

### Added

- `FrameStage` — single-canvas multi-layer stage component.
- `SequenceLayer` — child image-sequence layer for `FrameStage`. Supports any transparent PNG/WebP sequence.
- Config-array layers via `FrameStage` `layers` prop as an alternative to child composition.
- Per-layer playback controls: `playLayer(id, fps)`, `pauseLayer(id)`.
- Per-layer frame/progress controls: `setLayerFrame(id, frame)`, `setLayerProgress(id, progress, options?)`.
- Z-order rendering via `placement.zIndex`.
- Blend mode support per layer via `placement.blendMode`.

---

## [1.1.0] — 2026-05-30

### Added

- Shared URL image cache (`assetCache`) — images are not re-fetched across multiple `FrameSequence` instances using the same URL.
- `loading` prop on `FrameSequence`: `"preload"` | `"lazy"` | `"manual"`.
  - `preload` — starts loading immediately on mount.
  - `lazy` — loads when the canvas enters the viewport via `IntersectionObserver`.
  - `manual` — waits until `load()` is called imperatively.
- `poster` prop — shows a static image before frames are loaded.
- `initialProgress` prop — renders the frame at the given normalized progress on first paint.
- `onLoadStart`, `onLoadProgress`, `onLoadComplete`, `onLoadError` lifecycle callbacks.
- `fallback` prop — accessible `aria-label` for the canvas.
- `load()` imperative method on `FrameSequenceHandle`.
- `render()` imperative method — forces a canvas repaint.

---

## [1.0.0] — 2026-05-30

### Added

- `FrameSequence` — single image-sequence canvas component for React 18 and 19.
- `images` prop — accepts an array of image URLs rendered as sequential frames on a `<canvas>`.
- `objectFit` prop: `"cover"` | `"contain"` | `"fill"`.
- DPR-aware canvas sizing — canvas pixel density matches device pixel ratio.
- `setFrame(index)` and `setProgress(normalized, options?)` imperative controls.
- Native `requestAnimationFrame` animation driver built in.
- Optional GSAP adapter via `frameloom/react/gsap` — `createGsapAnimationDriver(gsap)`.
- Optional Motion/Framer Motion adapter via `frameloom/react/motion` — `createMotionAnimationDriver(animate)`.
- Full TypeScript types for all public APIs.

---

[Unreleased]: https://github.com/Hyzyr/frameloom/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/Hyzyr/frameloom/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Hyzyr/frameloom/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Hyzyr/frameloom/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Hyzyr/frameloom/releases/tag/v1.0.0
