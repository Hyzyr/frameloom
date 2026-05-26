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
import { FrameSequence } from 'frameloom/react';

export function Hero() {
  return (
    <FrameSequence
      images={[
        '/frames/city-0001.webp',
        '/frames/city-0002.webp',
        '/frames/city-0003.webp',
      ]}
      initialProgress={0.5}
      loading="lazy"
      objectFit="cover"
      onLoadStart={({ total }) => {
        console.log(`Loading ${total} frames`);
      }}
    />
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

This repo now contains the first runtime slices: URL-array frame loading, a shared URL asset cache, cancellable preload/lazy/manual loading modes, a DPR-aware canvas renderer with `cover`, `contain`, and `fill`, and a React `FrameSequence` component with imperative `load`, `setFrame`, `setProgress`, `play`, `pause`, and `render` controls.

Still planned: ZIP archive loading through `archiveUrl`, poster frame support, `createImageBitmap` resource lifecycle, tests, examples, CI, and the multi-layer `FrameStage`, `SequenceLayer`, and `CloudLayer` APIs.