import { AnimationDriver } from '../core/types';

export function createGsapAnimationDriver(gsap: {
  to: (target: object, vars: Record<string, unknown>) => { kill: () => void };
}): AnimationDriver {
  return {
    name: 'gsap',
    tween({ from, to, duration, ease = 'power3.out', onUpdate, onComplete }) {
      const proxy = { value: from };
      const tween = gsap.to(proxy, {
        value: to,
        duration,
        ease,
        overwrite: true,
        onUpdate: () => onUpdate(proxy.value),
        onComplete,
      });

      return {
        stop: () => tween.kill(),
      };
    },
  };
}