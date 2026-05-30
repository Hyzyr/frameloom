# frameloom

Composable canvas image-sequence animations for React.

`frameloom` is planned as a lightweight, production-oriented npm package for frame-by-frame hero scenes, product turntables, scroll stories, camera-scrubbed 3D exports, and layered canvas compositions.

## Name

Recommended package name: `frameloom`.

Why it works:

- short and memorable
- explains the core idea: weaving frames into motion
- broad enough for future multi-layer scenes, not only image sequences
- currently available on npm at the time this repo was created

## Design Principles

- Core rendering should not require GSAP, Motion, or Framer Motion.
- Animation libraries should be optional adapters.
- React should be a wrapper over a framework-agnostic canvas engine.
- Multiple animated layers should share one canvas and one render loop.
- High-frequency pointer scrubbing should use instant frame updates plus external smoothing.
- Smooth programmatic transitions should use the selected animation driver.

## Current Usage

```tsx
import { FrameSequence, useFrameSequenceControls } from 'frameloom/react';

export function Hero() {
  const sequence = useFrameSequenceControls();

  return (
    <>
      <FrameSequence
        ref={sequence.ref}
        images={[
          '/frames/city-0001.webp',
          '/frames/city-0002.webp',
          '/frames/city-0003.webp',
        ]}
        initialProgress={0.5}
        loading="lazy"
        objectFit="cover"
        poster="/frames/city-poster.webp"
        fallback="Animated city hero sequence"
        onLoadStart={({ total }) => {
          console.log(`Loading ${total} frames`);
        }}
      />
      <button onClick={() => sequence.setProgress(0.75, { duration: 0.6 })}>
        Jump to 75%
      </button>
    </>
  );
}
```

With GSAP:

```tsx
import gsap from 'gsap';
import { createGsapAnimationDriver } from 'frameloom/react/gsap';
import { FrameSequence } from 'frameloom/react';

const animationDriver = createGsapAnimationDriver(gsap);

<FrameSequence animationDriver={animationDriver} duration={0.6} ease="power3.out" />;
```

With Motion:

```tsx
import { animate } from 'framer-motion';
import { createMotionAnimationDriver } from 'frameloom/react/motion';

const animationDriver = createMotionAnimationDriver(animate);
```

Child-based multi-layer stage:

```tsx
import { FrameStage, SequenceLayer, useFrameStageControls } from 'frameloom/react';

export function HeroStage() {
  const stage = useFrameStageControls();

  return (
    <>
      <FrameStage ref={stage.ref} fallback="Layered animated hero">
        <SequenceLayer
          id="tv"
          images={['/frames/tv-0001.png', '/frames/tv-0002.png']}
          placement={{ x: 0, y: 0, width: 1, height: 1, zIndex: 0 }}
          fit="cover"
        />
        <SequenceLayer
          id="mascot"
          images={['/frames/mascot-0001.png', '/frames/mascot-0002.png']}
          placement={{
            x: 0.68,
            y: 0.42,
            width: 0.22,
            height: 0.38,
            anchorX: 0.5,
            anchorY: 0.5,
            rotation: -0.08,
            skewX: 0.04,
            zIndex: 1,
          }}
          fit="contain"
        />
      </FrameStage>
      <button onClick={() => stage.playLayer('mascot', 24)}>Play mascot</button>
      <button
        onClick={() =>
          stage.setLayerTransform(
            'mascot',
            { x: 0.58, y: 0.48, rotation: 0.04, skewX: -0.03 },
            { duration: 0.5 },
          )
        }
      >
        Move mascot
      </button>
    </>
  );
}
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Animation Drivers](docs/ANIMATION_DRIVERS.md)
- [Implementation Status](docs/IMPLEMENTATION_STATUS.md)
- [Multi-Layer Canvas](docs/MULTI_LAYER_CANVAS.md)
- [Performance Plan](docs/PERFORMANCE.md)
- [Roadmap](docs/ROADMAP.md)
- [Migration From Podocarpus](docs/MIGRATION_FROM_PODOCARPUS.md)
- [Product Checklist](docs/PRODUCT_CHECKLIST.md)
- [Production and npm Publishing Guide](docs/PRODUCTION_NPM_PUBLISHING.md)

## Current Status

This repo now contains the first runtime slices: URL-array frame loading, a shared URL asset cache, cancellable preload/lazy/manual loading modes, poster/initial-frame rendering, a DPR-aware canvas renderer with `cover`, `contain`, and `fill`, a React `FrameSequence`, ergonomic imperative control hooks, and a React `FrameStage` for config or child-based URL-array image-sequence layers on one canvas. Transparent PNG/WebP layers are supported through normal canvas compositing.

Still planned: ZIP archive loading through `archiveUrl`, `createImageBitmap` resource lifecycle, tests, examples, CI, and advanced packaging/release hardening.