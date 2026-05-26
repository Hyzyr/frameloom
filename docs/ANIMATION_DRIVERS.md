# Animation Drivers

## Recommendation

Do not auto-detect GSAP or Motion at runtime.

Auto-detection sounds convenient, but it usually creates bundler problems:

- optional packages can still be pulled into the bundle
- SSR can fail when probing packages dynamically
- tree-shaking becomes less predictable
- package managers warn about missing optional dependencies

Instead, `frameloom` should provide explicit adapters.

## Default Driver

The default should be a tiny native `requestAnimationFrame` driver. It handles simple easing and keeps the base package lightweight.

Good for:

- small projects
- no external animation dependency
- basic programmatic `setFrame` / `setProgress`

## GSAP Driver

Use when the host app already uses GSAP.

Benefits:

- powerful ease strings like `power3.out`
- familiar timeline integration
- good imperative control
- excellent for scroll-triggered scenes if users add their own ScrollTrigger wiring

Example:

```ts
import gsap from 'gsap';
import { createGsapAnimationDriver } from 'frameloom/react/gsap';

const driver = createGsapAnimationDriver(gsap);
```

## Motion Driver

Use when the host app already uses Framer Motion or Motion.

Benefits:

- lighter mental model for React users
- spring/keyframe animation patterns
- aligns with apps already built around Motion

Example:

```ts
import { animate } from 'framer-motion';
import { createMotionAnimationDriver } from 'frameloom/react/motion';

const driver = createMotionAnimationDriver(animate);
```

## Custom Driver

Allow advanced teams to pass a custom driver. This keeps `frameloom` flexible for game loops, timeline engines, and app-specific animation schedulers.