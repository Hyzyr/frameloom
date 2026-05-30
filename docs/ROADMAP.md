# Roadmap

## Phase 1: Extract Current Working Component

- Move Podocarpus `ImageSequence` into `frameloom/react`.
- Move loader and canvas renderer into `frameloom/core`.
- Replace direct GSAP calls with the animation driver interface.
- Keep API compatible with current `setFrame`, `setProgress`, `play`, and `pause` methods.

## Phase 2: Package Hardening

- Add unit tests for clamp, fit math, loader sorting, and animation driver behavior.
- Add Playwright visual smoke tests with a tiny sample frame set.
- Add example app with Next and Vite.
- Add CI for typecheck, lint, build, and tests.

## Phase 3: Multi-Layer Stage

- Implement `FrameStage` config-array API. **Partial: core stage renderer and config-driven React `FrameStage` exist.**
- Implement child registration via React context. **Implemented for sequence layers.**
- Implement typed general `SequenceLayer`. **Implemented for URL arrays.**
- Add normalized placement, rotation, skew, opacity, zIndex, and blend modes. **Implemented for config and child sequence layers.**
- Add layer-specific imperative controls. **Implemented for frame/progress/playback and transform controls.**

## Phase 4: Advanced Loading

- Progressive priority loading.
- Shared asset cache.
- LRU cache for very large sequences.
- Optional sprite-sheet source.

## Phase 5: Renderer Expansion

- Evaluate OffscreenCanvas.
- Add WebGL backend if 2D canvas becomes the bottleneck.
- Add export/snapshot utilities.