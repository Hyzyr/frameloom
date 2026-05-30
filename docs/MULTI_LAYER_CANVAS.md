# Multi-Layer Canvas Plan

The major product upgrade is rendering several independently controlled image-sequence elements inside one canvas. Layers are general-purpose: TV screens, mascots, product overlays, foreground PNG sprites, exported 3D passes, UI flourishes, and other transparent image sequences should all use the same layer model.

## Why One Canvas

Multiple canvas elements are easy to compose, but each canvas has its own memory, sizing, and render loop. One stage canvas is better for advanced scenes:

- shared DPR sizing
- one RAF loop
- consistent z-order
- cheaper layer transforms
- better screenshot/export potential
- less layout overhead

## Current Child API

The current child API supports URL-array sequence layers:

```tsx
import { FrameStage, SequenceLayer, useFrameStageControls } from 'frameloom/react';

export function LayeredHero() {
  const stage = useFrameStageControls();

  return (
    <FrameStage ref={stage.ref}>
      <SequenceLayer
        id="tv"
        images={['/frames/tv-0001.png', '/frames/tv-0002.png']}
        placement={{ x: 0, y: 0, width: 1, height: 1 }}
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
  );
}
```

## Current Config API

The stage also supports config-array sequence and custom layers:

```tsx
import { FrameStage } from 'frameloom/react';

<FrameStage
  layers={[
    {
      id: 'city',
      type: 'sequence',
      images: ['/frames/city-0001.webp', '/frames/city-0002.webp'],
      placement: { x: 0, y: 0, width: 1, height: 1 },
      fit: 'cover',
    },
    {
      id: 'mascot',
      type: 'sequence',
      images: ['/frames/mascot-0001.png', '/frames/mascot-0002.png'],
      placement: { x: 0.68, y: 0.42, width: 0.22, height: 0.38, anchorX: 0.5, anchorY: 0.5, rotation: -0.08, skewX: 0.04, zIndex: 1 },
      fit: 'contain',
    },
  ]}
/>
```

Implemented today:

- one canvas for all configured layers
- deterministic z-order through `placement.zIndex`
- normalized placement
- anchors, rotation, skew, opacity, and blend modes
- URL-array sequence layers
- child-based `SequenceLayer`
- React context registration
- ergonomic imperative hooks for stage controls
- custom draw callback layers
- imperative `load`, `setLayerFrame`, `setLayerProgress`, `setLayerPlacement`, `setLayerOpacity`, `setLayerTransform`, `playLayer`, `pauseLayer`, and `render`

Still planned:

- ZIP archive layers
- advanced examples and tests

## Planned ZIP Child API

```tsx
<FrameStage ref={stageRef} width="100%" height="100%">
  <SequenceLayer
    id="city"
    archiveUrl="/frames/city.zip"
    placement={{ x: 0, y: 0, width: 1, height: 1 }}
    fit="cover"
  />

</FrameStage>
```

## Placement Model

Layer placement should use normalized coordinates relative to the parent canvas:

```ts
type NormalizedPlacement = {
  x: number;        // 0..1 from left
  y: number;        // 0..1 from top
  width: number;    // 0..1 of canvas width
  height: number;   // 0..1 of canvas height
  anchorX?: number; // default 0
  anchorY?: number; // default 0
  rotation?: number; // radians
  skewX?: number;    // radians
  skewY?: number;    // radians
  opacity?: number;
  zIndex?: number;
  blendMode?: GlobalCompositeOperation;
};
```

`x`, `y`, `width`, and `height` are normalized against the parent canvas. For example, `width: 0.25` occupies 25% of the canvas width and `x: 0.5` positions the layer anchor at the canvas midpoint.

## Children vs Config

Support both.

Children are ergonomic in React and are implemented for sequence URL arrays:

```tsx
<FrameStage>
  <SequenceLayer id="city" />
  <SequenceLayer id="mascot" />
</FrameStage>
```

Config arrays are easier for generated scenes:

```tsx
<FrameStage layers={layers} />
```

Internally, both should register into the same typed layer registry.

## Layer Types To Add

- `sequence`: frame image sequence
- `image`: static image layer
- `video`: optional video texture later
- `custom`: user-supplied draw callback
- `mask`: alpha/mask layer later

## Imperative Stage API

```ts
stageRef.current?.setLayerFrame('mascot', 20, { duration: 0.8 });
stageRef.current?.setLayerProgress('city', 0.5);
stageRef.current?.setLayerTransform('mascot', { x: 0.58, y: 0.48, rotation: 0.04 }, { duration: 0.5 });
stageRef.current?.setLayerOpacity('mascot', 0.6, { duration: 0.3 });
stageRef.current?.playLayer('city', 24);
stageRef.current?.pauseLayer('mascot');
```