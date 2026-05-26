# Performance Plan

## Loading

- URL-array loading is implemented.
- ZIP archive loading is planned.
- `createImageBitmap` decoding is planned; current loading uses `HTMLImageElement`.
- Bounded image loading through `preloadConcurrency` is implemented.
- `preload`, `lazy`, and `manual` loading modes are implemented for `FrameSequence`.
- `onLoadStart`, `onLoadProgress`, `onLoadComplete`, and `onLoadError` callbacks are implemented for `FrameSequence`.
- Shared URL asset caching with reference-based release is implemented.
- `ImageBitmap.close()` lifecycle is planned once `ImageBitmap` decoding is added.

## Rendering

- Cap DPR with `maxDpr`, default `2`.
- Render only when a frame changes unless autoplay is active.
- Use one RAF loop per stage.
- Sort layers by `zIndex` once unless layer order changes.
- Avoid React state for per-frame updates.

## Multi-Layer Stage

- Dirty-render layers when only a subset changes.
- Share decoded frame caches when layers reuse assets.
- Use normalized placement to avoid layout reads every frame.
- Keep canvas layout size stable.

## Future Advanced Options

- OffscreenCanvas worker renderer for heavy scenes.
- WebGL renderer for very high layer counts.
- LRU frame cache for huge sequences.
- Progressive loading: load poster/middle frames first, then fill gaps.
- Sprite-sheet support for small sequences.
- AVIF/WebP feature detection and source selection.

## Practical Production Advice

- Keep frame count as low as possible while preserving perceived smoothness.
- Prefer WebP at consistent dimensions.
- For pointer scrub, smooth pointer values and call `setFrame(..., { duration: 0 })`.
- For programmatic jumps, use the selected animation driver.