# Multi-Layer Canvas Plan

The major product upgrade is rendering several animated elements inside one canvas.

## Why One Canvas

Multiple canvas elements are easy to compose, but each canvas has its own memory, sizing, and render loop. One stage canvas is better for advanced scenes:

- shared DPR sizing
- one RAF loop
- consistent z-order
- cheaper layer transforms
- better screenshot/export potential
- less layout overhead

## Stage API Draft

```tsx
<FrameStage ref={stageRef} width="100%" height="100%">
  <SequenceLayer
    id="city"
    archiveUrl="/frames/city.zip"
    placement={{ x: 0, y: 0, width: 1, height: 1 }}
    fit="cover"
  />

  <SequenceLayer
    id="clouds"
    images={cloudFrames}
    placement={{ x: 0.05, y: 0.08, width: 0.9, height: 0.32, opacity: 0.35 }}
    fit="contain"
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
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  blendMode?: GlobalCompositeOperation;
};
```

## Children vs Config

Support both.

Children are ergonomic in React:

```tsx
<FrameStage>
  <SequenceLayer id="city" />
  <CloudLayer id="clouds" />
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
- `clouds`: generated gradient cloud layer
- `video`: optional video texture later
- `custom`: user-supplied draw callback
- `mask`: alpha/mask layer later

## Imperative Stage API

```ts
stageRef.current?.setLayerFrame('clouds', 20, { duration: 0.8 });
stageRef.current?.setLayerProgress('city', 0.5);
stageRef.current?.playLayer('city', 24);
stageRef.current?.pauseLayer('clouds');
```