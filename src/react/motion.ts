import { AnimationDriver } from '../core/types';

export function createMotionAnimationDriver(animate: (
  from: number,
  to: number,
  options: Record<string, unknown>
) => { stop: () => void }): AnimationDriver {
  return {
    name: 'motion',
    tween({ from, to, duration, ease = 'easeOut', onUpdate, onComplete }) {
      const controls = animate(from, to, {
        duration,
        ease,
        onUpdate,
        onComplete,
      });

      return {
        stop: () => controls.stop(),
      };
    },
  };
}