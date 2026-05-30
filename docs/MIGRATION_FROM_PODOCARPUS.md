# Migration From Podocarpus

## Current Source

The current implementation lives in Podocarpus under:

```text
src/UI/components/animations/ImageSequence
```

## Move Order

1. Copy `types.ts` into `src/core/types.ts` and split React-only props into `src/react/types.ts` if needed.
2. Copy `frameLoader.ts` into `src/core/frameLoader.ts`.
3. Copy `canvasRenderer.ts` into `src/core/canvasRenderer.ts`.
4. Copy `ImageSequence.tsx` into `src/react/FrameSequence.tsx`.
5. Replace direct `gsap` import with `animationDriver` prop.
6. Default to `nativeAnimationDriver`.
7. Move GSAP-specific support into `src/react/gsap.ts`.
8. Add examples and tests.

## API Rename Proposal

Current name in app: `ImageSequence`.

Package names:

- `FrameSequence`: single sequence component
- `FrameStage`: multi-layer canvas component
- `SequenceLayer`: layer inside a stage
- custom/generated effects should use general sequence or custom layers instead of a specialized cloud API

Keep `ImageSequence` as a compatibility alias for one major version if useful.