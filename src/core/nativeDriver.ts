import { AnimationDriver, TweenOptions } from './types';

const eases = {
  linear: (progress: number) => progress,
  'power2.out': (progress: number) => 1 - Math.pow(1 - progress, 3),
  'power3.out': (progress: number) => 1 - Math.pow(1 - progress, 4),
};

function resolveEase(ease: TweenOptions['ease']) {
  if (typeof ease === 'function') return ease;
  return eases[ease as keyof typeof eases] ?? eases['power3.out'];
}

export const nativeAnimationDriver: AnimationDriver = {
  name: 'native',
  tween({ from, to, duration, ease, onUpdate, onComplete }) {
    let frame = 0;
    const startedAt = performance.now();
    const easeFn = resolveEase(ease);
    const durationMs = Math.max(0, duration * 1000);

    const tick = (time: number) => {
      const progress = durationMs === 0 ? 1 : Math.min(1, (time - startedAt) / durationMs);
      onUpdate(from + (to - from) * easeFn(progress));
      if (progress >= 1) {
        onComplete?.();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return {
      stop: () => cancelAnimationFrame(frame),
    };
  },
};