# Product Checklist

## Before First npm Publish

- Confirm npm package name ownership.
- Add license file.
- Add changelog.
- Add CI.
- Add examples.
- Add tests.
- Add bundle-size check.
- Add SSR/Next compatibility notes.
- Add browser support notes.
- Expand accessibility docs with examples for decorative and meaningful canvases.

## API Quality

- Stable public types.
- No required animation dependency beyond the native driver.
- Optional GSAP and Motion adapters.
- Clear imperative API.
- Ergonomic hooks for imperative refs and controls.
- Runtime transform controls for staged sequence layers.
- Controlled and uncontrolled modes.
- Good loading/progress states.
- Explicit cleanup.
- Basic decorative canvas and fallback-content support.

## Documentation Quality

- Quick start.
- Next.js example.
- Vite example.
- Pointer scrub example.
- Scroll-driven example.
- Multi-layer hero example.
- Troubleshooting section.

## Performance Quality

- No React state per frame.
- DPR cap.
- Decode concurrency.
- Resource release.
- Render only when dirty.
- Single render loop for stage.