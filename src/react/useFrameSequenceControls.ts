import { useCallback, useMemo, useRef } from 'react';
import type { RefObject } from 'react';

import type { FrameSequenceHandle, FrameSequenceTweenOptions } from './FrameSequence';
import type { LoadedFrame } from '../core/frameLoader';

export type FrameSequenceControls = {
  ref: RefObject<FrameSequenceHandle | null>;
  load: () => Promise<LoadedFrame[]>;
  setFrame: (frame: number, options?: FrameSequenceTweenOptions) => void;
  setProgress: (progress: number, options?: FrameSequenceTweenOptions) => void;
  play: (fps?: number) => void;
  pause: () => void;
  render: () => void;
};

function getFrameSequenceHandle(ref: RefObject<FrameSequenceHandle | null>) {
  if (!ref.current) {
    throw new Error('FrameSequence controls are not mounted. Pass controls.ref to <FrameSequence ref={controls.ref} /> before calling control methods.');
  }

  return ref.current;
}

export function useFrameSequenceControls(): FrameSequenceControls {
  const ref = useRef<FrameSequenceHandle | null>(null);

  const load = useCallback(() => getFrameSequenceHandle(ref).load(), []);
  const setFrame = useCallback(
    (frame: number, options?: FrameSequenceTweenOptions) =>
      getFrameSequenceHandle(ref).setFrame(frame, options),
    [],
  );
  const setProgress = useCallback(
    (progress: number, options?: FrameSequenceTweenOptions) =>
      getFrameSequenceHandle(ref).setProgress(progress, options),
    [],
  );
  const play = useCallback((fps?: number) => getFrameSequenceHandle(ref).play(fps), []);
  const pause = useCallback(() => getFrameSequenceHandle(ref).pause(), []);
  const render = useCallback(() => getFrameSequenceHandle(ref).render(), []);

  return useMemo(
    () => ({
      ref,
      load,
      setFrame,
      setProgress,
      play,
      pause,
      render,
    }),
    [load, pause, play, render, setFrame, setProgress],
  );
}
