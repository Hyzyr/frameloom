# frameloom

Composable canvas image-sequence animations for React.

Render one or multiple frame-by-frame animations — product turntables, hero scenes, transparent mascots, TV effects, scroll stories — on a single performant canvas. Full TypeScript. No mandatory dependencies beyond React.

---

## Install

```bash
npm install frameloom
# pnpm add frameloom
# yarn add frameloom
```

Peer dependency (required):

```bash
npm install react react-dom
```

---

## Quick start — single animation

The simplest possible usage: one animation, one canvas.

```tsx
import { FrameloomScene, Frameloom } from 'frameloom/react';

export function Hero() {
  return (
    <div style={{ width: 800, height: 600 }}>
      <FrameloomScene>
        <Frameloom
          id="hero"
          images={[
            '/frames/hero-0001.webp',
            '/frames/hero-0002.webp',
            '/frames/hero-0003.webp',
          ]}
          placement={{ x: 0, y: 0, width: 1, height: 1 }}
          fit="cover"
        />
      </FrameloomScene>
    </div>
  );
}
```

Or load frames from a ZIP archive:

```tsx
<FrameloomScene>
  <Frameloom
    id="hero"
    archiveUrl="/animations/hero.zip"
    placement={{ x: 0, y: 0, width: 1, height: 1 }}
    fit="cover"
  />
</FrameloomScene>
```

---

## Core concepts

| Term | Description |
| --- | --- |
| `FrameloomScene` | The `<canvas>` container. All layers share one canvas and one render loop. |
| `Frameloom` | One image-sequence layer placed inside `FrameloomScene`. |
| `placement` | Normalized `0–1` position and size relative to the parent canvas. |
| `archiveUrl` | URL to a `.zip` file — frameloom downloads and extracts frames automatically. |

---

## Placement guide

All `placement` values are **normalized** — `0` is the left/top edge, `1` is the right/bottom edge of the canvas.

```tsx
placement={{
  x: 0.1,        // left edge of this layer = 10% from the canvas left
  y: 0.2,        // top edge of this layer = 20% from the canvas top
  width: 0.4,    // layer width = 40% of the canvas width
  height: 0.5,   // layer height = 50% of the canvas height
  anchorX: 0.5,  // transform origin X — 0 = left, 0.5 = center, 1 = right
  anchorY: 0.5,  // transform origin Y — 0 = top, 0.5 = center, 1 = bottom
  rotation: 0.1, // rotation in radians (positive = clockwise)
  skewX: 0.05,   // horizontal skew in radians
  skewY: 0,      // vertical skew in radians
  opacity: 1,    // 0 = invisible, 1 = fully opaque
  zIndex: 0,     // draw order — higher numbers draw on top
}}
```

### Full-canvas layer (background)

```tsx
placement={{ x: 0, y: 0, width: 1, height: 1, zIndex: 0 }}
```

### Centered layer at 50% size

```tsx
placement={{ x: 0.25, y: 0.25, width: 0.5, height: 0.5, anchorX: 0.5, anchorY: 0.5 }}
```

### Bottom-right corner, 30% wide

```tsx
placement={{ x: 0.7, y: 0.6, width: 0.3, height: 0.4, zIndex: 2 }}
```

### Rotated layer

```tsx
placement={{
  x: 0.4, y: 0.3, width: 0.2, height: 0.4,
  anchorX: 0.5, anchorY: 0.5,
  rotation: Math.PI / 8, // 22.5 degrees
}}
```

---

## Multiple layers on one canvas

`FrameloomScene` renders all child `Frameloom` layers onto a single `<canvas>`.
Layers with higher `zIndex` draw on top. Transparent PNG/WebP frames composite naturally.

```tsx
import { FrameloomScene, Frameloom, useFrameloomSceneControls } from 'frameloom/react';

export function ProductScene() {
  const scene = useFrameloomSceneControls();

  return (
    <>
      <div style={{ width: 1200, height: 800, position: 'relative' }}>
        <FrameloomScene ref={scene.ref} fallback="Product animation">

          {/* Background — fills the entire canvas */}
          <Frameloom
            id="background"
            images={['/scene/bg-0001.webp', '/scene/bg-0002.webp']}
            placement={{ x: 0, y: 0, width: 1, height: 1, zIndex: 0 }}
            fit="cover"
          />

          {/* TV screen — positioned at 20% from left, 15% from top */}
          <Frameloom
            id="tv"
            images={['/scene/tv-0001.png', '/scene/tv-0002.png']}
            placement={{ x: 0.2, y: 0.15, width: 0.55, height: 0.6, zIndex: 1 }}
            fit="contain"
          />

          {/* Mascot — transparent PNG, overlaid on the right */}
          <Frameloom
            id="mascot"
            archiveUrl="/scene/mascot.zip"
            placement={{
              x: 0.68,
              y: 0.42,
              width: 0.22,
              height: 0.38,
              anchorX: 0.5,
              anchorY: 0.5,
              rotation: -0.08,
              skewX: 0.03,
              zIndex: 2,
            }}
            fit="contain"
          />

        </FrameloomScene>
      </div>

      <button onClick={() => scene.playLayer('mascot', 24)}>Animate mascot</button>
      <button onClick={() => scene.pauseLayer('mascot')}>Pause mascot</button>
    </>
  );
}
```

---

## Multiple independent scenes

Each `FrameloomScene` is fully independent — they have separate canvases and render loops. Use multiple scenes when you need separate full-screen animations on the same page.

```tsx
export function Page() {
  return (
    <>
      {/* Hero section */}
      <section style={{ height: '100vh' }}>
        <FrameloomScene>
          <Frameloom id="hero" archiveUrl="/animations/hero.zip"
            placement={{ x: 0, y: 0, width: 1, height: 1 }} fit="cover" />
        </FrameloomScene>
      </section>

      {/* Product section */}
      <section style={{ height: '100vh' }}>
        <FrameloomScene>
          <Frameloom id="product" archiveUrl="/animations/product.zip"
            placement={{ x: 0, y: 0, width: 1, height: 1 }} fit="contain" />
        </FrameloomScene>
      </section>

      {/* Story section with overlay */}
      <section style={{ height: '100vh' }}>
        <FrameloomScene>
          <Frameloom id="bg" images={bgFrames}
            placement={{ x: 0, y: 0, width: 1, height: 1, zIndex: 0 }} fit="cover" />
          <Frameloom id="overlay" images={overlayFrames}
            placement={{ x: 0.1, y: 0.1, width: 0.8, height: 0.8, zIndex: 1 }} fit="contain" />
        </FrameloomScene>
      </section>
    </>
  );
}
```

---

## Imperative controls

Both hooks expose imperative methods for programmatic control — scroll-driven, pointer-driven, GSAP timelines, etc.

### Scene controls

```tsx
const scene = useFrameloomSceneControls();

// Load all layers
await scene.load();

// Set frame index for a layer
scene.setLayerFrame('mascot', 12);

// Set progress (0–1) with optional tween
scene.setLayerProgress('mascot', 0.75, { duration: 0.4 });

// Move a layer (with optional tween)
scene.setLayerPlacement('mascot', { x: 0.5, y: 0.5 });
scene.setLayerPlacement('mascot', { x: 0.3, y: 0.6 }, { duration: 0.6 });

// Set opacity
scene.setLayerOpacity('mascot', 0.5, { duration: 0.3 });

// Set transform (position + rotation + skew in one call)
scene.setLayerTransform('mascot', {
  x: 0.4, y: 0.5, rotation: 0.1, skewX: -0.02,
}, { duration: 0.5 });

// Play / pause
scene.playLayer('mascot', 24);   // 24 fps
scene.pauseLayer('mascot');

// Force repaint
scene.render();
```

### Standalone sequence controls

For a single `FrameSequence`:

```tsx
import { FrameSequence, useFrameloomControls } from 'frameloom/react';

export function StandaloneHero() {
  const seq = useFrameloomControls();

  return (
    <>
      <FrameSequence
        ref={seq.ref}
        images={frames}
        loading="lazy"
        objectFit="cover"
      />
      <button onClick={() => seq.setProgress(0.5, { duration: 0.4 })}>
        Jump to middle
      </button>
    </>
  );
}
```

Full standalone API:

```tsx
seq.load();
seq.setFrame(12);
seq.setProgress(0.5, { duration: 0.4 });
seq.play(24);
seq.pause();
seq.render();
```

---

## Loading frames from a ZIP archive

Pass `archiveUrl` to any `Frameloom` or `FrameSequence`. Frameloom downloads the archive, extracts all supported images, sorts them by filename, and plays them in order.

```tsx
<Frameloom
  id="hero"
  archiveUrl="/animations/hero.zip"
  placement={{ x: 0, y: 0, width: 1, height: 1 }}
/>
```

Archive requirements:

- Supported formats inside the ZIP: **JPEG, PNG, WebP, GIF, AVIF**
- Frames are sorted **alphabetically by filename** — name them with zero-padded numbers: `frame-0001.webp`, `frame-0002.webp`, …
- macOS `__MACOSX/` metadata directories are ignored automatically

Track download and extraction progress:

```tsx
<FrameSequence
  archiveUrl="/animations/hero.zip"
  onLoadStart={({ total }) => console.log(`Loading ${total} frames`)}
  onLoadProgress={({ loaded, total }) => setProgress(loaded / total)}
  onLoadComplete={(frames) => console.log('Ready:', frames.length)}
/>
```

---

## Loading modes

Controls when image loading starts.

```tsx
<Frameloom id="hero" images={frames} loading="preload" ... />  // default: start immediately
<Frameloom id="hero" images={frames} loading="lazy"    ... />  // start when visible in viewport
<Frameloom id="hero" images={frames} loading="manual"  ... />  // start only when load() is called
```

With `"manual"`:

```tsx
const scene = useFrameloomSceneControls();
// Later, after user interaction:
await scene.load();
```

---

## `fit` modes

Controls how frames are drawn inside the layer's bounding box.

| Value | Description |
| --- | --- |
| `"cover"` | Fill the box, cropping if needed. Aspect ratio preserved. |
| `"contain"` | Fit inside the box, letterboxing if needed. Aspect ratio preserved. |
| `"fill"` | Stretch to fill exactly. Aspect ratio NOT preserved. |

```tsx
<Frameloom id="hero" images={frames} fit="cover" placement={{ x: 0, y: 0, width: 1, height: 1 }} />
```

---

## Optional animation adapters

Core frameloom renders without any animation library. Install adapters only when needed.

### GSAP

```bash
npm install gsap
```

```tsx
import gsap from 'gsap';
import { FrameSequence } from 'frameloom/react';
import { createGsapAnimationDriver } from 'frameloom/react/gsap';

const driver = createGsapAnimationDriver(gsap);

<FrameSequence
  images={frames}
  animationDriver={driver}
  duration={0.6}
  ease="power3.out"
/>
```

### Motion / Framer Motion

```bash
npm install framer-motion
```

```tsx
import { animate } from 'framer-motion';
import { createMotionAnimationDriver } from 'frameloom/react/motion';

const driver = createMotionAnimationDriver(animate);
```

---

## Scroll-driven scrubbing

Connect to any scroll library by updating frame progress in a scroll handler.

```tsx
import { useEffect, useRef } from 'react';
import { FrameloomScene, Frameloom, useFrameloomSceneControls } from 'frameloom/react';

export function ScrollScene() {
  const scene = useFrameloomSceneControls();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const onScroll = () => {
      const { top, height } = section.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -top / (height - window.innerHeight)));
      scene.setLayerProgress('hero', progress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scene]);

  return (
    <div ref={sectionRef} style={{ height: '300vh' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <FrameloomScene ref={scene.ref}>
          <Frameloom id="hero" archiveUrl="/hero.zip"
            placement={{ x: 0, y: 0, width: 1, height: 1 }} fit="cover" />
        </FrameloomScene>
      </div>
    </div>
  );
}
```

---

## Best practices for frames

- Use **WebP** for continuous-tone sequences (photos, renders). ~30–50% smaller than JPEG.
- Use **transparent PNG or WebP** for overlay layers (mascots, UI elements, product details).
- Use **ZIP archives** (`archiveUrl`) when you have many frames — one request instead of hundreds.
- Name frames with zero-padded numbers so they sort correctly: `frame-0001.webp` not `frame-1.webp`.
- Keep all frames in a sequence the **same dimensions**.
- Host on a **CDN** with long `Cache-Control` headers.
- Use `loading="lazy"` for off-screen scenes; `loading="preload"` for above-the-fold.
- Use one `FrameloomScene` per section rather than separate canvases.

---

## Exports

```ts
// Branded API (recommended)
import {
  FrameloomScene,           // multi-layer canvas container
  Frameloom,                // image-sequence layer
  useFrameloomSceneControls, // imperative scene controls hook
  useFrameloomControls,      // imperative standalone sequence controls hook
} from 'frameloom/react';

// Original names (still exported, fully supported)
import {
  FrameStage,
  SequenceLayer,
  FrameSequence,
  useFrameStageControls,
  useFrameSequenceControls,
} from 'frameloom/react';

// Optional adapters
import { createGsapAnimationDriver } from 'frameloom/react/gsap';
import { createMotionAnimationDriver } from 'frameloom/react/motion';

// Low-level core (framework-agnostic)
import { loadFramesFromArchive, loadFramesFromUrls } from 'frameloom';
```

