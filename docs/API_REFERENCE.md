# frameloom API reference

Complete field reference for the public React API.

Recommended imports:

```ts
import {
  FrameloomScene,
  Frameloom,
  FrameSequence,
  useFrameloomSceneControls,
  useFrameloomControls,
} from 'frameloom/react';
```

Original names are still supported:

```ts
import {
  FrameStage,
  SequenceLayer,
  useFrameStageControls,
  useFrameSequenceControls,
} from 'frameloom/react';
```

## Placement fields

`placement` controls where a layer is drawn inside its parent `FrameloomScene`. Values are normalized to the canvas size.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `x` | `number` | `0` | X coordinate relative to the canvas width. `0` = left edge, `1` = right edge. |
| `y` | `number` | `0` | Y coordinate relative to the canvas height. `0` = top edge, `1` = bottom edge. |
| `width` | `number` | `1` | Layer width relative to canvas width. `0.5` = 50% of canvas width. |
| `height` | `number` | `1` | Layer height relative to canvas height. `0.5` = 50% of canvas height. |
| `anchorX` | `number` | `0` | Transform origin on the layer X axis. `0` = left, `0.5` = center, `1` = right. |
| `anchorY` | `number` | `0` | Transform origin on the layer Y axis. `0` = top, `0.5` = center, `1` = bottom. |
| `rotation` | `number` | `0` | Rotation in radians. Positive values rotate clockwise. |
| `skewX` | `number` | `0` | Horizontal skew in radians. |
| `skewY` | `number` | `0` | Vertical skew in radians. |
| `opacity` | `number` | `1` | Layer opacity. Clamped from `0` to `1`. |
| `zIndex` | `number` | `0` | Draw order. Higher values render on top. Equal values keep declaration order. |
| `blendMode` | `GlobalCompositeOperation` | `undefined` | Optional canvas blend mode, for example `'source-over'`, `'multiply'`, `'screen'`, `'lighter'`. |

Example:

```tsx
<Frameloom
  id="mascot"
  archiveUrl="/mascot.zip"
  placement={{
    x: 0.7,
    y: 0.55,
    width: 0.25,
    height: 0.35,
    anchorX: 0.5,
    anchorY: 0.5,
    rotation: -0.08,
    skewX: 0.03,
    opacity: 0.95,
    zIndex: 2,
  }}
/>
```

## `<FrameloomScene />`

`FrameloomScene` is the parent canvas. It renders all `Frameloom` children on one canvas and one shared render loop.

```tsx
<FrameloomScene ref={scene.ref} background="#000">
  <Frameloom id="hero" archiveUrl="/hero.zip" />
</FrameloomScene>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `layers` | `readonly FrameStageLayerConfig[]` | `undefined` | Optional programmatic layer config. Use this instead of children when layers are data-driven. |
| `children` | `ReactNode` | `undefined` | Declarative `Frameloom` children. |
| `background` | `string` | `undefined` | Canvas clear background color. If omitted, the canvas clears transparent. |
| `maxDpr` | `number` | `2` | Maximum device pixel ratio used for canvas backing resolution. Increase for sharper output, lower for memory/performance. |
| `animationDriver` | `AnimationDriver` | native driver | Driver for tweened control methods. Optional GSAP/Motion adapters can be supplied. |
| `duration` | `number` | `0.35` | Default tween duration in seconds for control methods that animate. |
| `ease` | `FrameEase` | `undefined` | Default ease for tweens. Can be a driver-specific string or `(progress) => number`. |
| `fps` | `number` | `24` | Default playback fps used by `playLayer(layerId)` unless an fps is passed there. |
| `loop` | `'loop' \| 'once' \| 'ping-pong' \| boolean` | `'loop'` | Playback behavior. `true` maps to `'loop'`, `false` maps to `'once'`. |
| `assetCache` | `FrameAssetCache` | internal cache | Optional image cache instance. Use when multiple components should share decoded URL-array assets. |
| `useCache` | `boolean` | `true` | Enables frame/archive cache usage. Set `false` to force fresh loading and immediate archive blob cleanup. |
| `decorative` | `boolean` | `false` | When `true`, renders canvas as decorative for accessibility. |
| `fallback` | `ReactNode` | `undefined` | Accessible fallback content inside the canvas element. |
| `onLoadStart` | `(event) => void` | `undefined` | Called before sequence layers start loading. Event: `{ sequenceLayers }`. |
| `onLayerLoadProgress` | `(event) => void` | `undefined` | Called per layer while image frames decode. Event: `{ layerId, loaded, total }`. |
| `onLoadComplete` | `(event) => void` | `undefined` | Called after all sequence layers load. Event: `{ layerIds }`. |
| `onLoadError` | `(error, layerId?) => void` | `undefined` | Called when a layer fails to load. `layerId` is included when known. |
| native canvas props | `CanvasHTMLAttributes<HTMLCanvasElement>` | `undefined` | Standard canvas props such as `className`, `style`, `aria-label`, `width`, and `height`. |

## `<Frameloom />`

`Frameloom` is one image-sequence layer inside a `FrameloomScene`.

```tsx
<Frameloom
  id="tv"
  images={tvFrames}
  placement={{ x: 0.2, y: 0.15, width: 0.55, height: 0.6 }}
  fit="contain"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | required | Unique layer id used by scene control methods. |
| `images` | `readonly string[]` | `undefined` | Ordered frame URLs. Optional when `archiveUrl` is provided. |
| `archiveUrl` | `string` | `undefined` | URL of a `.zip` archive containing image frames. Takes precedence over `images`. |
| `placement` | `StagePlacement` | full canvas | Position, size, transform, opacity, z-index, and blend mode. See Placement fields. |
| `fit` | `'cover' \| 'contain' \| 'fill'` | `'cover'` | How each frame is drawn inside the placement rectangle. |
| `initialFrame` | `number` | `0` | Initial frame index after load. Clamped to available frames. |
| `initialProgress` | `number` | `0` | Initial progress from `0` to `1`. Ignored when `initialFrame` is provided. |
| `visible` | `boolean` | `true` | Whether the layer should render. Hidden layers stay loaded. |
| `preloadConcurrency` | `number` | `6` | Number of image requests/decodes to run at once for URL arrays or extracted archive frames. |
| `crossOrigin` | `HTMLImageElement['crossOrigin']` | `undefined` | Sets `img.crossOrigin` for frame loading, for example `'anonymous'`. |

## Programmatic layers

Instead of child components, pass `layers` directly:

```tsx
<FrameloomScene
  layers={[
    {
      id: 'background',
      type: 'sequence',
      archiveUrl: '/background.zip',
      placement: { x: 0, y: 0, width: 1, height: 1 },
      fit: 'cover',
    },
    {
      id: 'custom-overlay',
      type: 'custom',
      render: (context, info) => {
        context.fillStyle = 'rgba(255,255,255,0.1)';
        context.fillRect(info.rect.x, info.rect.y, info.rect.width, info.rect.height);
      },
    },
  ]}
/>
```

### Sequence layer config

Same fields as `<Frameloom />`, plus `type: 'sequence'`.

### Custom layer config

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | required | Unique layer id. |
| `type` | `'custom'` | required | Marks this as a custom render layer. |
| `placement` | `StagePlacement` | full canvas | Placement info available to your render callback. |
| `visible` | `boolean` | `true` | Whether the custom layer should render. |
| `render` | `(context, info) => void` | required | Draw callback. Receives canvas context and resolved placement metadata. |

Custom render `info` fields:

| Field | Type | Description |
| --- | --- | --- |
| `layer` | `StageCustomLayer` | The custom layer config currently being rendered. |
| `placement` | `ResolvedStagePlacement` | Placement with defaults applied and opacity clamped. |
| `rect` | `StageLayerRect` | Pixel-space draw rectangle and anchor point. |
| `width` | `number` | Canvas drawing width in CSS pixels. |
| `height` | `number` | Canvas drawing height in CSS pixels. |
| `time` | `number` | Render timestamp passed through the stage renderer. |

## `<FrameSequence />`

`FrameSequence` is the standalone single-sequence component. Use it when you do not need multiple composited layers.

```tsx
<FrameSequence
  archiveUrl="/hero.zip"
  loading="lazy"
  fit="cover"
  poster="/hero-poster.webp"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `images` | `readonly string[]` | `undefined` | Ordered frame URLs. Optional when `archiveUrl` is provided. |
| `archiveUrl` | `string` | `undefined` | URL of a `.zip` archive containing image frames. Takes precedence over `images`. |
| `poster` | `string` | `undefined` | Poster image URL displayed before the full sequence is loaded. |
| `posterFrame` | `number` | derived | Frame index from `images` to use as poster when `poster` is omitted. |
| `initialFrame` | `number` | `0` | Initial frame index after load. |
| `initialProgress` | `number` | `0` | Initial progress from `0` to `1`. Ignored when `initialFrame` is provided. |
| `objectFit` | `'cover' \| 'contain' \| 'fill'` | `'cover'` | Backward-compatible name for `fit`. |
| `fit` | `'cover' \| 'contain' \| 'fill'` | `objectFit ?? 'cover'` | How the frame is drawn inside the canvas. |
| `maxDpr` | `number` | `2` | Maximum device pixel ratio for canvas backing resolution. |
| `background` | `string` | `undefined` | Canvas clear background color. If omitted, the canvas clears transparent. |
| `animationDriver` | `AnimationDriver` | native driver | Driver used by tweened `setFrame` / `setProgress`. |
| `duration` | `number` | `0.35` | Default tween duration in seconds. |
| `ease` | `FrameEase` | `undefined` | Default tween ease. |
| `fps` | `number` | `24` | Playback fps used by `play()` unless an fps is passed there. |
| `loop` | `'loop' \| 'once' \| 'ping-pong' \| boolean` | `'loop'` | Playback behavior. |
| `autoPlay` | `boolean` | `false` | Starts playback after loading completes. |
| `loading` | `'preload' \| 'lazy' \| 'manual'` | `'preload'` | Controls when loading starts. |
| `preloadConcurrency` | `number` | `6` | Number of frame requests/decodes to run at once. |
| `assetCache` | `FrameAssetCache` | internal cache | Optional decoded image cache for URL-array loading. |
| `useCache` | `boolean` | `true` | Enables frame/archive cache usage. |
| `crossOrigin` | `HTMLImageElement['crossOrigin']` | `undefined` | Sets `img.crossOrigin`, for example `'anonymous'`. |
| `decorative` | `boolean` | `false` | When `true`, renders canvas as decorative for accessibility. |
| `fallback` | `ReactNode` | `undefined` | Accessible fallback content inside the canvas element. |
| `onFrameChange` | `(frame, preciseFrame) => void` | `undefined` | Called when the active frame changes. `preciseFrame` can be fractional during tweens. |
| `onPosterLoad` | `(frame) => void` | `undefined` | Called when poster frame loads. |
| `onPosterLoadError` | `(error) => void` | `undefined` | Called if poster load fails. |
| `onLoadStart` | `(start) => void` | `undefined` | Called when sequence frame loading starts. Event: `{ urls, total }`. |
| `onLoadProgress` | `(progress) => void` | `undefined` | Called as frame images load. Event: `{ index, url, loaded, total, frame }`. |
| `onLoadComplete` | `(frames) => void` | `undefined` | Called when all frames are decoded and ready. |
| `onLoadError` | `(error) => void` | `undefined` | Called when loading fails. |
| native canvas props | `CanvasHTMLAttributes<HTMLCanvasElement>` | `undefined` | Standard canvas props such as `className`, `style`, `aria-label`, `width`, and `height`. |

## Fit modes

| Value | Description |
| --- | --- |
| `'cover'` | Fill the target rectangle and crop overflow. Aspect ratio preserved. |
| `'contain'` | Fit completely inside the target rectangle. Aspect ratio preserved. |
| `'fill'` | Stretch exactly to the target rectangle. Aspect ratio is not preserved. |

## Loading modes

| Value | Description |
| --- | --- |
| `'preload'` | Start loading immediately after mount. |
| `'lazy'` | Start loading when the canvas enters the viewport. Falls back to preload if `IntersectionObserver` is unavailable. |
| `'manual'` | Do not load automatically. Call `load()` from the control hook/ref. |

## Loop modes

| Value | Description |
| --- | --- |
| `'loop'` or `true` | Continue from the first frame after the last frame. |
| `'once'` or `false` | Stop on the last frame. |
| `'ping-pong'` | Play forward, then backward, repeating. |

## `useFrameloomSceneControls()`

Returns a stable object with a `ref` and imperative scene methods.

```tsx
const scene = useFrameloomSceneControls();

<FrameloomScene ref={scene.ref}>...</FrameloomScene>
```

| Method | Description |
| --- | --- |
| `load()` | Loads all sequence layers. Returns `Promise<void>`. |
| `setLayerFrame(layerId, frame, options?)` | Sets a layer frame by index. Optional tween options: `{ duration, ease }`. |
| `setLayerProgress(layerId, progress, options?)` | Sets layer progress from `0` to `1`. |
| `setLayerPlacement(layerId, placement, options?)` | Updates placement fields such as `x`, `y`, `width`, `height`, `rotation`, `skewX`, `opacity`, `zIndex`. |
| `setLayerOpacity(layerId, opacity, options?)` | Updates only opacity. |
| `setLayerTransform(layerId, transform, options?)` | Updates multiple placement/transform fields in one call. |
| `playLayer(layerId, fps?)` | Starts playback for one layer. Uses scene `fps` when omitted. |
| `pauseLayer(layerId)` | Pauses one layer and stops its active tweens. |
| `render()` | Forces a canvas repaint. |

## `useFrameloomControls()`

Standalone sequence controls for `FrameSequence`.

```tsx
const sequence = useFrameloomControls();

<FrameSequence ref={sequence.ref} images={frames} />
```

| Method | Description |
| --- | --- |
| `load()` | Loads the sequence. Returns `Promise<LoadedFrame[]>`. |
| `setFrame(frame, options?)` | Sets a frame by index. Optional tween options: `{ duration, ease }`. |
| `setProgress(progress, options?)` | Sets sequence progress from `0` to `1`. |
| `play(fps?)` | Starts playback. Uses component `fps` when omitted. |
| `pause()` | Pauses playback and stops active tweens. |
| `render()` | Forces a canvas repaint. |

## Low-level core exports

```ts
import {
  loadFramesFromArchive,
  releaseArchiveCache,
  loadFramesFromUrls,
  createFrameAssetCache,
  nativeAnimationDriver,
} from 'frameloom';
```

See [Archive, memory, performance, and security](./ARCHIVES_AND_MEMORY.md) for cache lifecycle details.
