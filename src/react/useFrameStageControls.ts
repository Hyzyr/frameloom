import { useCallback, useMemo, useRef } from 'react';
import type { RefObject } from 'react';

import type { FrameStageHandle, FrameStageLayerTransform, FrameStageTweenOptions } from './FrameStage';
import type { StagePlacement } from '../core/stage';

export type FrameStageControls = {
  ref: RefObject<FrameStageHandle | null>;
  load: () => Promise<void>;
  setLayerFrame: (layerId: string, frame: number, options?: FrameStageTweenOptions) => void;
  setLayerProgress: (layerId: string, progress: number, options?: FrameStageTweenOptions) => void;
  setLayerPlacement: (
    layerId: string,
    placement: StagePlacement,
    options?: FrameStageTweenOptions,
  ) => void;
  setLayerOpacity: (layerId: string, opacity: number, options?: FrameStageTweenOptions) => void;
  setLayerTransform: (
    layerId: string,
    transform: FrameStageLayerTransform,
    options?: FrameStageTweenOptions,
  ) => void;
  playLayer: (layerId: string, fps?: number) => void;
  pauseLayer: (layerId: string) => void;
  render: () => void;
};

function getFrameStageHandle(ref: RefObject<FrameStageHandle | null>) {
  if (!ref.current) {
    throw new Error('FrameStage controls are not mounted. Pass controls.ref to <FrameStage ref={controls.ref} /> before calling control methods.');
  }

  return ref.current;
}

export function useFrameStageControls(): FrameStageControls {
  const ref = useRef<FrameStageHandle | null>(null);

  const load = useCallback(() => getFrameStageHandle(ref).load(), []);
  const setLayerFrame = useCallback(
    (layerId: string, frame: number, options?: FrameStageTweenOptions) =>
      getFrameStageHandle(ref).setLayerFrame(layerId, frame, options),
    [],
  );
  const setLayerProgress = useCallback(
    (layerId: string, progress: number, options?: FrameStageTweenOptions) =>
      getFrameStageHandle(ref).setLayerProgress(layerId, progress, options),
    [],
  );
  const setLayerPlacement = useCallback(
    (layerId: string, placement: StagePlacement, options?: FrameStageTweenOptions) =>
      getFrameStageHandle(ref).setLayerPlacement(layerId, placement, options),
    [],
  );
  const setLayerOpacity = useCallback(
    (layerId: string, opacity: number, options?: FrameStageTweenOptions) =>
      getFrameStageHandle(ref).setLayerOpacity(layerId, opacity, options),
    [],
  );
  const setLayerTransform = useCallback(
    (layerId: string, transform: FrameStageLayerTransform, options?: FrameStageTweenOptions) =>
      getFrameStageHandle(ref).setLayerTransform(layerId, transform, options),
    [],
  );
  const playLayer = useCallback(
    (layerId: string, fps?: number) => getFrameStageHandle(ref).playLayer(layerId, fps),
    [],
  );
  const pauseLayer = useCallback(
    (layerId: string) => getFrameStageHandle(ref).pauseLayer(layerId),
    [],
  );
  const render = useCallback(() => getFrameStageHandle(ref).render(), []);

  return useMemo(
    () => ({
      ref,
      load,
      setLayerFrame,
      setLayerProgress,
      setLayerPlacement,
      setLayerOpacity,
      setLayerTransform,
      playLayer,
      pauseLayer,
      render,
    }),
    [
      load,
      pauseLayer,
      playLayer,
      render,
      setLayerFrame,
      setLayerOpacity,
      setLayerPlacement,
      setLayerProgress,
      setLayerTransform,
    ],
  );
}
