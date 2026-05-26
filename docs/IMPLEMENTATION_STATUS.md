# Implementation Status

This index maps the current documentation and public API surfaces to implementation status.

Status key:

- **Implemented**: runtime code exists and is exported.
- **Partial**: some documented behavior exists, but the full documented contract is not complete.
- **Planned**: documented for the roadmap, but not implemented yet.

## Documentation status

| Document | Status | Notes |
| --- | --- | --- |
| `README.md` | Partial | Quick-start now reflects `FrameSequence` with URL arrays and loading modes. ZIP archives and multi-layer examples remain planned. |
| `docs/ARCHITECTURE.md` | Partial | Core, React wrapper, optional adapter boundaries, and a shared URL cache are in place. ZIP loading and stage renderer remain planned. |
| `docs/ANIMATION_DRIVERS.md` | Implemented | Native, GSAP, and Motion driver entry points exist. |
| `docs/MIGRATION_FROM_PODOCARPUS.md` | Partial | Phase 1 extraction has a new `FrameSequence`, URL loader, and canvas renderer; Podocarpus compatibility alias is not implemented. |
| `docs/MULTI_LAYER_CANVAS.md` | Planned | `FrameStage`, `SequenceLayer`, and `CloudLayer` are still roadmap items. |
| `docs/PERFORMANCE.md` | Partial | DPR capping, dirty frame rendering, URL-array loading, shared URL caching, cancellation, and bounded image loading exist. ZIP, `createImageBitmap`, LRU, and progressive loading remain planned. |
| `docs/PRODUCT_CHECKLIST.md` | Partial | Public types and optional adapters exist. Tests, examples, CI, accessibility notes, license file, and changelog remain planned. |
| `docs/PRODUCTION_NPM_PUBLISHING.md` | Partial | Phase 1 URL-array runtime exists and Phase 2 preloader lifecycle has started. ZIP archive loading remains planned. |
| `docs/ROADMAP.md` | Partial | Phase 1 is usable and Phase 2 has started. Later roadmap phases remain planned. |

## API surface status

| API surface | Status | Notes |
| --- | --- | --- |
| `frameloom` core types | Implemented | Public animation, fit, loop, and stage-planning types are exported. |
| `nativeAnimationDriver` | Implemented | Default RAF-based numeric tween driver. |
| `createGsapAnimationDriver` | Implemented | Optional adapter exported from `frameloom/react/gsap`. |
| `createMotionAnimationDriver` | Implemented | Optional adapter exported from `frameloom/react/motion`. |
| `loadFramesFromUrls` | Implemented | Loads ordered URL arrays with bounded concurrency and progress callbacks. |
| `createFrameAssetCache` | Implemented | Creates a URL-keyed image cache with reference-based release. |
| `sharedFrameAssetCache` | Implemented | Default shared URL image cache used by `loadFramesFromUrls`. |
| `drawFrameToCanvas` | Implemented | Renders a frame to a 2D canvas with DPR sizing and `cover`, `contain`, or `fill`. |
| `FrameSequence` | Partial | Supports `images`, canvas rendering, preload/lazy/manual loading, load lifecycle callbacks, and imperative `load`, `setFrame`, `setProgress`, `play`, `pause`, and `render`. `archiveUrl` is accepted as a planned prop but reports an error until ZIP support is added. |
| `FrameStage` | Planned | Multi-layer stage is not implemented. |
| `SequenceLayer` | Planned | Multi-layer sequence child API is not implemented. |
| `CloudLayer` | Planned | Cloud layer API is not implemented. |
| ZIP archive loader | Planned | Follow-up implementation phase. |
| Shared asset cache | Partial | URL image cache exists. ZIP-entry caching and advanced eviction remain planned. |
| Preloader lifecycle API | Partial | `onLoadStart`, `onLoadProgress`, `onLoadComplete`, `onLoadError`, lazy/manual/preload modes, and abort-on-unmount exist. Poster frames and deeper ownership semantics remain planned. |

## Tiny Phase 1 usage

```tsx
import { useRef } from 'react';
import { FrameSequence, type FrameSequenceHandle } from 'frameloom/react';

const frames = [
  '/frames/hero-0001.webp',
  '/frames/hero-0002.webp',
  '/frames/hero-0003.webp',
];

export function HeroSequence() {
  const sequenceRef = useRef<FrameSequenceHandle>(null);

  return (
    <FrameSequence
      ref={sequenceRef}
      images={frames}
      loading="lazy"
      objectFit="cover"
      onLoadProgress={({ loaded, total }) => {
        console.log(`${loaded}/${total}`);
      }}
    />
  );
}
```
