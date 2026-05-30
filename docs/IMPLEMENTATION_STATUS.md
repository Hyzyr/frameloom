# Implementation Status

This index maps the current documentation and public API surfaces to implementation status.

Status key:

- **Implemented**: runtime code exists and is exported.
- **Partial**: some documented behavior exists, but the full documented contract is not complete.
- **Planned**: documented for the roadmap, but not implemented yet.

## Documentation status

| Document | Status | Notes |
| --- | --- | --- |
| `README.md` | Partial | Quick-start now reflects `FrameSequence`, `FrameStage`, and general `SequenceLayer` image-sequence layers with URL arrays. ZIP archives remain planned. |
| `docs/ARCHITECTURE.md` | Partial | Core, React wrapper, optional adapter boundaries, shared URL cache, stage renderer, and child layer registration are in place. ZIP loading and tests remain planned. |
| `docs/ANIMATION_DRIVERS.md` | Implemented | Native, GSAP, and Motion driver entry points exist. |
| `docs/MIGRATION_FROM_PODOCARPUS.md` | Partial | Phase 1 extraction has a new `FrameSequence`, URL loader, and canvas renderer; Podocarpus compatibility alias is not implemented. |
| `docs/MULTI_LAYER_CANVAS.md` | Partial | Config-driven `FrameStage`, child `SequenceLayer`, and React context registration exist for general image-sequence layers. ZIP layers and advanced examples remain planned. |
| `docs/PERFORMANCE.md` | Partial | DPR capping, dirty frame rendering, URL-array loading, shared URL caching, cancellation, poster rendering, bounded image loading, normalized transforms, stage z-ordering, and one playback loop per stage exist. ZIP, `createImageBitmap`, LRU, and progressive loading remain planned. |
| `docs/PRODUCT_CHECKLIST.md` | Partial | Public types, optional adapters, imperative API, loading modes, cleanup, and basic canvas accessibility controls exist. Tests, examples, CI, license file, and changelog remain planned. |
| `docs/PRODUCTION_NPM_PUBLISHING.md` | Partial | Phase 1 and most Phase 2 URL-array runtime work exists. Phase 3 has `FrameStage` and `SequenceLayer` foundations. ZIP archive loading remains planned. |
| `docs/ROADMAP.md` | Partial | Phase 1 is usable, Phase 2 is mostly implemented for URL arrays, and Phase 3 has `FrameStage` plus general `SequenceLayer` foundations. Later roadmap phases remain planned. |

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
| `renderStageToCanvas` | Implemented | Renders ordered sequence/custom layers to one canvas with normalized placement, anchors, rotation, skew, opacity, blend mode, and z-index. |
| `FrameSequence` | Partial | Supports `images`, poster/initial-frame rendering, canvas rendering, preload/lazy/manual loading, load lifecycle callbacks, accessibility fallback content, decorative hiding, and imperative `load`, `setFrame`, `setProgress`, `play`, `pause`, and `render`. `archiveUrl` is accepted as a planned prop but reports an error until ZIP support is added. |
| `FrameStage` | Partial | Supports config-array and child sequence layers, custom config layers, one canvas, deterministic z-order, shared URL loading/cache, and imperative `load`, `setLayerFrame`, `setLayerProgress`, `setLayerPlacement`, `setLayerOpacity`, `setLayerTransform`, `playLayer`, `pauseLayer`, and `render`. |
| `SequenceLayer` | Partial | Child image-sequence layer API is implemented for URL-array images, including transparent PNG/WebP compositing and normalized transforms. ZIP archive layers remain planned. |
| `useFrameSequenceControls` | Implemented | Hook returns a typed ref plus `load`, `setFrame`, `setProgress`, `play`, `pause`, and `render` controls. |
| `useFrameStageControls` | Implemented | Hook returns a typed ref plus `load`, `setLayerFrame`, `setLayerProgress`, `setLayerPlacement`, `setLayerOpacity`, `setLayerTransform`, `playLayer`, `pauseLayer`, and `render` controls. |
| ZIP archive loader | Planned | Follow-up implementation phase. |
| Shared asset cache | Partial | URL image cache exists. ZIP-entry caching and advanced eviction remain planned. |
| Preloader lifecycle API | Partial | `onLoadStart`, `onLoadProgress`, `onLoadComplete`, `onLoadError`, `onPosterLoad`, `onPosterLoadError`, lazy/manual/preload modes, poster rendering, and abort-on-unmount exist. Deeper cache ownership semantics remain planned. |

## Tiny Phase 1 usage

```tsx
import { FrameSequence, useFrameSequenceControls } from 'frameloom/react';

const frames = [
  '/frames/hero-0001.webp',
  '/frames/hero-0002.webp',
  '/frames/hero-0003.webp',
];

export function HeroSequence() {
  const sequence = useFrameSequenceControls();

  return (
    <FrameSequence
      ref={sequence.ref}
      images={frames}
      loading="lazy"
      objectFit="cover"
      poster="/frames/hero-poster.webp"
      fallback="Product hero animation"
      onLoadProgress={({ loaded, total }) => {
        console.log(`${loaded}/${total}`);
      }}
    />
  );
}
```

## Tiny Phase 3 usage

```tsx
import { FrameStage, SequenceLayer, useFrameStageControls } from 'frameloom/react';

export function LayeredHero() {
  const stage = useFrameStageControls();

  return (
    <FrameStage ref={stage.ref} fallback="Layered hero animation">
      <SequenceLayer
        id="tv"
        images={['/frames/tv-0001.png', '/frames/tv-0002.png']}
        placement={{ x: 0, y: 0, width: 1, height: 1 }}
        fit="cover"
      />
      <SequenceLayer
        id="mascot"
        images={['/frames/mascot-0001.png', '/frames/mascot-0002.png']}
        placement={{ x: 0.68, y: 0.42, width: 0.22, height: 0.38, anchorX: 0.5, anchorY: 0.5, rotation: -0.08, skewX: 0.04, zIndex: 1 }}
        fit="contain"
      />
    </FrameStage>
  );
}
```
