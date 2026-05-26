Work in this repo as an implementation agent. Read the current docs and source first, then start executing the plan in small validated slices.

Context:
- This repo is currently a package skeleton/blueprint, not a finished runtime package.
- The current public status and release plan are documented in:
  - [README.md](README.md)
  - [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
  - [docs/MIGRATION_FROM_PODOCARPUS.md](docs/MIGRATION_FROM_PODOCARPUS.md)
  - [docs/MULTI_LAYER_CANVAS.md](docs/MULTI_LAYER_CANVAS.md)
  - [docs/PERFORMANCE.md](docs/PERFORMANCE.md)
  - [docs/PRODUCT_CHECKLIST.md](docs/PRODUCT_CHECKLIST.md)
  - [docs/ROADMAP.md](docs/ROADMAP.md)
  - [docs/PRODUCTION_NPM_PUBLISHING.md](docs/PRODUCTION_NPM_PUBLISHING.md)

Goals:
1. Install the required dependencies for local development.
2. Index the planned docs into an implementation checklist with clear statuses: implemented, partial, planned.
3. Start implementing Phase 1 from the production guide: a usable single-sequence runtime.
4. Keep the package architecture aligned with the docs: framework-agnostic core, React wrapper, optional GSAP/Motion adapters.
5. Validate after each meaningful edit with narrow checks, preferring `npm run typecheck` over full builds unless needed.

Execution requirements:
- First, inspect the repo and summarize what is already implemented vs planned.
- Then create a concrete todo plan and keep it updated while working.
- Install missing dependencies needed to typecheck, lint, test, and implement the first runtime slice.
- Do not try to implement the whole roadmap in one pass.
- Start with the smallest useful vertical slice:
  - core frame loader for URL arrays
  - basic canvas renderer with cover/contain/fill
  - React `FrameSequence`
  - imperative controls for frame/progress/play/pause
  - native animation driver as default
- Treat ZIP archive support, shared asset cache, and multi-layer stage as follow-up phases unless they are cheap extensions of the first slice.
- Keep exports minimal and correct.
- Preserve optional adapters in `frameloom/react/gsap` and `frameloom/react/motion`.
- Update docs when behavior changes.
- If a doc describes a planned API that is not implemented yet, mark it clearly instead of pretending it exists.

Deliverables for this run:
1. Installed dependencies and working local scripts.
2. A docs status index file under `docs/` that maps each doc and API surface to its implementation status.
3. Initial Phase 1 implementation files in `src/core` and `src/react`.
4. Updated exports so consumers can import the implemented APIs.
5. Any minimal README/doc updates needed to reflect reality.
6. Validation results, including what passed and what still remains.

Implementation order:
1. Install dependencies.
2. Run and fix `npm run typecheck`.
3. Add docs status index.
4. Implement `src/core/frameLoader.ts`.
5. Implement `src/core/canvasRenderer.ts`.
6. Implement `src/react/FrameSequence.tsx`.
7. Export `FrameSequence` from `frameloom/react`.
8. Add types as needed without widening scope unnecessarily.
9. Validate with `npm run typecheck`.
10. If stable, add a tiny example usage snippet in docs.

Important constraints:
- Do not add broad unrelated features.
- Do not claim `FrameStage`, `SequenceLayer`, `CloudLayer`, or preloader progress are complete unless the runtime code truly exists.
- Prefer iterative edits and validation over large speculative rewrites.
- If you hit an ambiguity, use the docs as the contract and update them if implementation reality needs to diverge.

At the end, report:
- what was implemented
- what is still planned
- what commands were run
- what remains for Phase 2 and Phase 3