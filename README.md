# frameloom

Composable canvas image-sequence animations for React.

`frameloom` renders one or more image sequences on a performant canvas. Use it for product animations, hero scenes, transparent PNG/WebP overlays, mascots, TV/video-frame effects, scroll-driven scenes, and layered compositions.

## Install

```bash
npm install frameloom
```

```bash
pnpm add frameloom
```

```bash
yarn add frameloom
```

React is a peer dependency:

```bash
npm install react react-dom
```

## Single image sequence

```tsx
import { FrameSequence, useFrameSequenceControls } from 'frameloom/react';

export function HeroSequence() {
  const sequence = useFrameSequenceControls();

  return (
    <>
      <FrameSequence
        ref={sequence.ref}
        images={[
          '/frames/hero-0001.webp',
          '/frames/hero-0002.webp',
          '/frames/hero-0003.webp',
        ]}
        loading="lazy"
        objectFit="cover"
        poster="/frames/hero-poster.webp"
        fallback="Animated hero sequence"
      />

      <button onClick={() => sequence.setProgress(0)}>
        First frame
      </button>
      <button onClick={() => sequence.setProgress(1, { duration: 0.8 })}>
        Last frame
      </button>
    </>
  );
}
```

## Layered canvas stage

Use `FrameStage` when multiple transparent image sequences should share one canvas and one render loop.

```tsx
import { FrameStage, SequenceLayer, useFrameStageControls } from 'frameloom/react';

export function LayeredScene() {
  const stage = useFrameStageControls();

  return (
    <>
      <FrameStage ref={stage.ref} fallback="Layered animated scene">
        <SequenceLayer
          id="background"
          images={['/scene/bg-0001.webp', '/scene/bg-0002.webp']}
          placement={{ x: 0, y: 0, width: 1, height: 1, zIndex: 0 }}
          fit="cover"
        />

        <SequenceLayer
          id="mascot"
          images={['/scene/mascot-0001.png', '/scene/mascot-0002.png']}
          placement={{
            x: 0.62,
            y: 0.48,
            width: 0.24,
            height: 0.38,
            anchorX: 0.5,
            anchorY: 0.5,
            rotation: -0.08,
            skewX: 0.03,
            zIndex: 1,
          }}
          fit="contain"
        />
      </FrameStage>

      <button onClick={() => stage.playLayer('mascot', 24)}>
        Play mascot
      </button>

      <button
        onClick={() =>
          stage.setLayerTransform(
            'mascot',
            { x: 0.5, y: 0.52, rotation: 0.05, skewX: -0.02 },
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

`placement` values are normalized to the parent canvas:

| Field | Description |
| --- | --- |
| `x`, `y` | Layer position from `0` to `1` |
| `width`, `height` | Layer size from `0` to `1` |
| `anchorX`, `anchorY` | Transform origin, defaults to top-left |
| `rotation` | Rotation in radians |
| `skewX`, `skewY` | Skew in radians |
| `zIndex` | Layer draw order |

## Imperative controls

The hook APIs return a React ref plus safe control methods.

```tsx
const sequence = useFrameSequenceControls();

sequence.load();
sequence.setFrame(12);
sequence.setProgress(0.5, { duration: 0.4 });
sequence.render();
```

```tsx
const stage = useFrameStageControls();

stage.load();
stage.setLayerFrame('mascot', 10);
stage.setLayerProgress('mascot', 0.75, { duration: 0.4 });
stage.setLayerPlacement('mascot', { x: 0.5, y: 0.5 });
stage.setLayerOpacity('mascot', 0.8);
stage.playLayer('mascot', 24);
stage.pauseLayer('mascot');
stage.render();
```

## Loading modes

```tsx
<FrameSequence images={frames} loading="preload" />
<FrameSequence images={frames} loading="lazy" />
<FrameSequence images={frames} loading="manual" />
```

- `preload`: starts loading immediately.
- `lazy`: loads when the canvas enters the viewport.
- `manual`: waits until you call `load()`.

## Optional animation adapters

The core package does not require GSAP, Motion, or Framer Motion. Install only the adapter you need.

### GSAP

```bash
npm install gsap
```

```tsx
import gsap from 'gsap';
import { FrameSequence } from 'frameloom/react';
import { createGsapAnimationDriver } from 'frameloom/react/gsap';

const animationDriver = createGsapAnimationDriver(gsap);

<FrameSequence
  images={frames}
  animationDriver={animationDriver}
  duration={0.6}
  ease="power3.out"
/>;
```

### Motion / Framer Motion

```bash
npm install framer-motion
```

```tsx
import { animate } from 'framer-motion';
import { createMotionAnimationDriver } from 'frameloom/react/motion';

const animationDriver = createMotionAnimationDriver(animate);
```

## Frame recommendations

- Use WebP or optimized PNG sequences.
- Use transparent PNG/WebP for overlay layers.
- Keep all frames in a sequence the same dimensions.
- Prefer CDN-hosted assets with long cache headers.
- Start with `loading="lazy"` for below-the-fold scenes.
- Use one `FrameStage` instead of many canvases for layered scenes.

## Exports

```ts
import { FrameSequence, FrameStage, SequenceLayer } from 'frameloom/react';
import { createGsapAnimationDriver } from 'frameloom/react/gsap';
import { createMotionAnimationDriver } from 'frameloom/react/motion';
```
