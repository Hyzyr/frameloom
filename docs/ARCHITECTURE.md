# Architecture

`frameloom` should be built in layers.

## 1. Core Engine

Framework-agnostic TypeScript modules:

- frame loading from URLs
- frame loading from ZIP archives
- decode/cache/release lifecycle
- canvas sizing and DPR management
- draw algorithms for `cover`, `contain`, and `fill`
- layer placement in normalized canvas coordinates
- deterministic stage rendering for configured layers
- shared stage playback scheduler

Core must not import React, GSAP, Motion, or browser-specific UI framework code.

## 2. Animation Drivers

Animation drivers are tiny adapters with one job: tween a number.

```ts
type AnimationDriver = {
  name: 'native' | 'gsap' | 'motion' | 'custom';
  tween(options: TweenOptions): TweenHandle;
};
```

The active frame is just a number, so every animation library can drive it.

## 3. React Package

React components wrap the core engine:

- `FrameSequence`: single image sequence component
- `FrameStage`: one canvas with multiple configured or child-registered layers
- `SequenceLayer`: child component that registers a general image-sequence layer
- custom draw layers for advanced generated or procedural content
- hooks for pointer, scroll, and imperative control

The current `FrameStage` implementation supports config-array sequence/custom layers and child-registered `SequenceLayer` URL arrays on top of the same core stage renderer. The stage is intentionally general-purpose: users can compose TV screens, mascots, product overlays, transparent PNG sprite exports, or any other image-sequence layer in one canvas.

## 4. Optional Entry Points

Keep optional dependencies out of the base bundle:

- `frameloom/react`: React wrapper with native driver
- `frameloom/react/gsap`: GSAP adapter only
- `frameloom/react/motion`: Motion adapter only

This avoids bundling GSAP into apps that use Motion, and avoids bundling Motion into apps that use GSAP.