import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CanvasHTMLAttributes, CSSProperties, ReactNode } from 'react';

import { loadFramesFromArchive, releaseArchiveCache } from '../core/archiveLoader';
import { loadFramesFromUrls } from '../core/frameLoader';
import { nativeAnimationDriver } from '../core/nativeDriver';
import { renderStageToCanvas, resolveStagePlacement } from '../core/stage';
import { FrameStageRegistrationContext } from './FrameStageContext';
import type { FrameAssetCache } from '../core/assetCache';
import type { LoadedFrame } from '../core/frameLoader';
import type { StageCustomLayer, StageLayer, StagePlacement } from '../core/stage';
import type {
  AnimationDriver,
  FrameEase,
  FrameFit,
  FrameLoop,
  TweenHandle,
  TweenOptions,
} from '../core/types';

export type FrameStageTweenOptions = Partial<Pick<TweenOptions, 'duration' | 'ease'>>;
export type FrameStageLayerTransform = StagePlacement;

export type FrameStageSequenceLayerConfig = {
  id: string;
  type: 'sequence';
  images?: readonly string[];
  /**
   * URL of a `.zip` archive containing the frame images.
   * Frames are sorted alphabetically by filename inside the archive.
   * Takes precedence over `images` when both are provided.
   */
  archiveUrl?: string;
  placement?: StagePlacement;
  fit?: FrameFit;
  initialFrame?: number;
  initialProgress?: number;
  visible?: boolean;
  preloadConcurrency?: number;
  crossOrigin?: HTMLImageElement['crossOrigin'];
};

export type FrameStageCustomLayerConfig = {
  id: string;
  type: 'custom';
  placement?: StagePlacement;
  visible?: boolean;
  render: StageCustomLayer['render'];
};

export type FrameStageLayerConfig = FrameStageSequenceLayerConfig | FrameStageCustomLayerConfig;

export type FrameStageLoadStart = {
  sequenceLayers: number;
};

export type FrameStageLayerLoadProgress = {
  layerId: string;
  loaded: number;
  total: number;
};

export type FrameStageLoadComplete = {
  layerIds: string[];
};

export type FrameStageHandle = {
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

export type FrameStageProps = Omit<CanvasHTMLAttributes<HTMLCanvasElement>, 'children'> & {
  layers?: readonly FrameStageLayerConfig[];
  children?: ReactNode;
  background?: string;
  maxDpr?: number;
  animationDriver?: AnimationDriver;
  duration?: number;
  ease?: FrameEase;
  fps?: number;
  loop?: FrameLoop | boolean;
  assetCache?: FrameAssetCache;
  useCache?: boolean;
  decorative?: boolean;
  fallback?: ReactNode;
  onLoadStart?: (event: FrameStageLoadStart) => void;
  onLayerLoadProgress?: (event: FrameStageLayerLoadProgress) => void;
  onLoadComplete?: (event: FrameStageLoadComplete) => void;
  onLoadError?: (error: Error, layerId?: string) => void;
};

type LayerRuntimeState = {
  frame: number;
  direction: 1 | -1;
  playing: boolean;
  fps: number;
  lastTime: number;
  placement: StagePlacement;
  tween?: TweenHandle;
  transformTweens: TweenHandle[];
};

type FrameStageConfig = {
  animationDriver: AnimationDriver;
  background: string | undefined;
  duration: number;
  ease: FrameEase | undefined;
  fps: number;
  loop: FrameLoop | boolean;
  maxDpr: number;
  onLoadStart: FrameStageProps['onLoadStart'];
  onLayerLoadProgress: FrameStageProps['onLayerLoadProgress'];
  onLoadComplete: FrameStageProps['onLoadComplete'];
  onLoadError: FrameStageProps['onLoadError'];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function resolveLoop(loop: FrameLoop | boolean) {
  if (loop === true) return 'loop';
  if (loop === false) return 'once';
  return loop;
}

function getInitialFrame(layer: FrameStageSequenceLayerConfig, frameCount: number) {
  if (layer.initialFrame !== undefined) {
    return clamp(layer.initialFrame, 0, Math.max(0, frameCount - 1));
  }

  if (layer.initialProgress !== undefined && frameCount > 1) {
    return clamp(layer.initialProgress, 0, 1) * (frameCount - 1);
  }

  return 0;
}

function mergeLayerConfigs(
  configLayers: readonly FrameStageLayerConfig[],
  childLayers: readonly FrameStageLayerConfig[],
) {
  const seenIds = new Set<string>();

  return [...configLayers, ...childLayers].map((layer) => {
    if (seenIds.has(layer.id)) {
      throw new Error(`FrameStage layer IDs must be unique. Duplicate layer ID: ${layer.id}`);
    }

    seenIds.add(layer.id);
    return layer;
  });
}

const placementKeys = [
  'x',
  'y',
  'width',
  'height',
  'anchorX',
  'anchorY',
  'rotation',
  'skewX',
  'skewY',
  'opacity',
  'zIndex',
  'blendMode',
] as const satisfies readonly (keyof StagePlacement)[];

const numericPlacementKeys = placementKeys.filter(
  (key) => key !== 'blendMode',
) as Exclude<(typeof placementKeys)[number], 'blendMode'>[];

function mergeStagePlacement(base: StagePlacement | undefined, override: StagePlacement | undefined) {
  const placement: StagePlacement = { ...base };

  placementKeys.forEach((key) => {
    const value = override?.[key];

    if (value !== undefined) {
      placement[key] = value as never;
    }
  });

  return placement;
}

function patchStagePlacement(current: StagePlacement, patch: StagePlacement) {
  return mergeStagePlacement(current, patch);
}

export const FrameStage = forwardRef<FrameStageHandle, FrameStageProps>(function FrameStage(
  {
    layers = [],
    children,
    background,
    maxDpr = 2,
    animationDriver = nativeAnimationDriver,
    duration = 0,
    ease,
    fps = 24,
    loop = 'loop',
    assetCache,
    useCache = true,
    decorative = false,
    fallback,
    onLoadStart,
    onLayerLoadProgress,
    onLoadComplete,
    onLoadError,
    style,
    ...canvasProps
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadedFramesRef = useRef(new Map<string, LoadedFrame[]>());
  const statesRef = useRef(new Map<string, LayerRuntimeState>());
  const stageLayersRef = useRef<StageLayer[]>([]);
  const playbackFrameRef = useRef(0);
  const loadIdRef = useRef(0);
  /** Archive URLs loaded with useCache=true — released on next load() or unmount. */
  const cachedArchiveUrlsRef = useRef(new Set<string>());
  const [childLayers, setChildLayers] = useState<FrameStageLayerConfig[]>([]);
  const layerConfigs = useMemo(() => mergeLayerConfigs(layers, childLayers), [childLayers, layers]);
  const mergedStyle: CSSProperties = {
    display: 'block',
    width: '100%',
    height: '100%',
    ...style,
  };
  const configRef = useRef<FrameStageConfig>({
    animationDriver,
    background,
    duration,
    ease,
    fps,
    loop,
    maxDpr,
    onLoadStart,
    onLayerLoadProgress,
    onLoadComplete,
    onLoadError,
  });

  configRef.current = {
    animationDriver,
    background,
    duration,
    ease,
    fps,
    loop,
    maxDpr,
    onLoadStart,
    onLayerLoadProgress,
    onLoadComplete,
    onLoadError,
  };

  const registrationValue = useMemo(
    () => ({
      registerLayer: (layer: FrameStageLayerConfig) => {
        setChildLayers((currentLayers) => {
          const existingIndex = currentLayers.findIndex((currentLayer) => currentLayer.id === layer.id);

          if (existingIndex === -1) {
            return [...currentLayers, layer];
          }

          const nextLayers = [...currentLayers];
          nextLayers[existingIndex] = layer;
          return nextLayers;
        });

        return () => {
          setChildLayers((currentLayers) =>
            currentLayers.filter((currentLayer) => currentLayer.id !== layer.id),
          );
        };
      },
    }),
    [],
  );

  const releaseFrames = useCallback(() => {
    loadedFramesRef.current.forEach((frames) => {
      frames.forEach((frame) => frame.release());
    });
    loadedFramesRef.current.clear();

    // Decrement ref count for every archive we cached — revokes blob URLs at 0
    cachedArchiveUrlsRef.current.forEach((url) => releaseArchiveCache(url));
    cachedArchiveUrlsRef.current.clear();
  }, []);

  const stopLayerTween = useCallback((layerId: string) => {
    const state = statesRef.current.get(layerId);
    state?.tween?.stop();

    if (state) {
      state.tween = undefined;
    }
  }, []);

  const stopLayerTransformTweens = useCallback((layerId: string) => {
    const state = statesRef.current.get(layerId);

    if (!state) {
      return;
    }

    state.transformTweens.forEach((tween) => tween.stop());
    state.transformTweens = [];
  }, []);

  const buildStageLayers = useCallback(() => {
    const nextLayers: StageLayer[] = [];

    layerConfigs.forEach((layer) => {
      if (layer.type === 'custom') {
        const state = statesRef.current.get(layer.id);
        nextLayers.push({
          ...layer,
          placement: mergeStagePlacement(layer.placement, state?.placement),
        });
        return;
      }

      const frames = loadedFramesRef.current.get(layer.id);

      if (!frames || frames.length === 0) {
        return;
      }

      const state = statesRef.current.get(layer.id);
      nextLayers.push({
        id: layer.id,
        type: 'sequence',
        frames: frames.map((frame) => frame.image),
        frame: state?.frame ?? getInitialFrame(layer, frames.length),
        placement: mergeStagePlacement(layer.placement, state?.placement),
        fit: layer.fit,
        visible: layer.visible,
      });
    });

    stageLayersRef.current = nextLayers;
    return nextLayers;
  }, [layerConfigs]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    renderStageToCanvas(canvas, buildStageLayers(), {
      background: configRef.current.background,
      maxDpr: configRef.current.maxDpr,
    });
  }, [buildStageLayers]);

  const ensureLayerState = useCallback(
    (layerId: string) => {
      let state = statesRef.current.get(layerId);

      if (!state) {
        const layer = layerConfigs.find(
          (candidate): candidate is FrameStageSequenceLayerConfig =>
            candidate.type === 'sequence' && candidate.id === layerId,
        );
        const frameCount = loadedFramesRef.current.get(layerId)?.length ?? 0;
        state = {
          frame: layer ? getInitialFrame(layer, frameCount) : 0,
          direction: 1,
          playing: false,
          fps: configRef.current.fps,
          lastTime: 0,
          placement: {},
          transformTweens: [],
        };
        statesRef.current.set(layerId, state);
      }

      return state;
    },
    [layerConfigs],
  );

  const setLayerFrameValue = useCallback(
    (layerId: string, frame: number) => {
      const frames = loadedFramesRef.current.get(layerId);

      if (!frames || frames.length === 0) {
        return;
      }

      const state = ensureLayerState(layerId);
      state.frame = clamp(frame, 0, frames.length - 1);
      render();
    },
    [ensureLayerState, render],
  );

  const setLayerFrame = useCallback(
    (layerId: string, frame: number, options?: FrameStageTweenOptions) => {
      const frames = loadedFramesRef.current.get(layerId);

      if (!frames || frames.length === 0) {
        return;
      }

      const state = ensureLayerState(layerId);
      state.playing = false;
      stopLayerTween(layerId);

      const targetFrame = clamp(frame, 0, frames.length - 1);
      const tweenDuration = options?.duration ?? configRef.current.duration;

      if (tweenDuration > 0) {
        state.tween = configRef.current.animationDriver.tween({
          from: state.frame,
          to: targetFrame,
          duration: tweenDuration,
          ease: options?.ease ?? configRef.current.ease,
          onUpdate: (value) => setLayerFrameValue(layerId, value),
          onComplete: () => {
            state.tween = undefined;
          },
        });
        return;
      }

      setLayerFrameValue(layerId, targetFrame);
    },
    [ensureLayerState, setLayerFrameValue, stopLayerTween],
  );

  const setLayerProgress = useCallback(
    (layerId: string, progress: number, options?: FrameStageTweenOptions) => {
      const frames = loadedFramesRef.current.get(layerId);

      if (!frames || frames.length === 0) {
        return;
      }

      setLayerFrame(layerId, clamp(progress, 0, 1) * (frames.length - 1), options);
    },
    [setLayerFrame],
  );

  const getLayerConfig = useCallback(
    (layerId: string) => {
      const layer = layerConfigs.find((candidate) => candidate.id === layerId);

      if (!layer) {
        throw new Error(`FrameStage layer not found: ${layerId}`);
      }

      return layer;
    },
    [layerConfigs],
  );

  const setLayerPlacementValue = useCallback(
    (layerId: string, placement: StagePlacement) => {
      getLayerConfig(layerId);
      const state = ensureLayerState(layerId);
      state.placement = patchStagePlacement(state.placement, placement);
      render();
    },
    [ensureLayerState, getLayerConfig, render],
  );

  const setLayerPlacement = useCallback(
    (layerId: string, placement: StagePlacement, options?: FrameStageTweenOptions) => {
      const layer = getLayerConfig(layerId);
      const state = ensureLayerState(layerId);
      stopLayerTransformTweens(layerId);

      const tweenDuration = options?.duration ?? configRef.current.duration;

      if (placement.blendMode !== undefined) {
        state.placement = patchStagePlacement(state.placement, { blendMode: placement.blendMode });
      }

      if (tweenDuration <= 0) {
        setLayerPlacementValue(layerId, placement);
        return;
      }

      const currentPlacement = resolveStagePlacement(
        mergeStagePlacement(layer.placement, state.placement),
      );
      const animatedKeys = numericPlacementKeys.filter((key) => placement[key] !== undefined);

      if (animatedKeys.length === 0) {
        render();
        return;
      }

      const totalTweens = animatedKeys.length;
      let completedTweens = 0;

      state.transformTweens = animatedKeys.map((key) => {
        const targetValue = placement[key] ?? currentPlacement[key];

        return configRef.current.animationDriver.tween({
          from: currentPlacement[key],
          to: targetValue,
          duration: tweenDuration,
          ease: options?.ease ?? configRef.current.ease,
          onUpdate: (value) => {
            state.placement = patchStagePlacement(state.placement, { [key]: value });
            render();
          },
          onComplete: () => {
            completedTweens += 1;

            if (completedTweens === totalTweens) {
              state.transformTweens = [];
            }
          },
        });
      });
    },
    [ensureLayerState, getLayerConfig, render, setLayerPlacementValue, stopLayerTransformTweens],
  );

  const setLayerOpacity = useCallback(
    (layerId: string, opacity: number, options?: FrameStageTweenOptions) => {
      setLayerPlacement(layerId, { opacity: clamp(opacity, 0, 1) }, options);
    },
    [setLayerPlacement],
  );

  const setLayerTransform = useCallback(
    (layerId: string, transform: FrameStageLayerTransform, options?: FrameStageTweenOptions) => {
      setLayerPlacement(layerId, transform, options);
    },
    [setLayerPlacement],
  );

  const hasPlayingLayers = useCallback(() => {
    return Array.from(statesRef.current.values()).some((state) => state.playing);
  }, []);

  const stopPlaybackLoopIfIdle = useCallback(() => {
    if (playbackFrameRef.current !== 0 && !hasPlayingLayers()) {
      cancelAnimationFrame(playbackFrameRef.current);
      playbackFrameRef.current = 0;
    }
  }, [hasPlayingLayers]);

  const tickPlayback = useCallback(
    (time: number) => {
      let didChange = false;

      statesRef.current.forEach((state, layerId) => {
        if (!state.playing) {
          return;
        }

        const frames = loadedFramesRef.current.get(layerId);

        if (!frames || frames.length <= 1) {
          state.playing = false;
          return;
        }

        const interval = 1000 / Math.max(1, state.fps);

        if (state.lastTime === 0) {
          state.lastTime = time;
        }

        if (time - state.lastTime < interval) {
          return;
        }

        state.lastTime = time;
        const loopMode = resolveLoop(configRef.current.loop);
        const lastFrame = frames.length - 1;
        let nextFrame = Math.round(state.frame) + state.direction;

        if (nextFrame > lastFrame) {
          if (loopMode === 'ping-pong') {
            state.direction = -1;
            nextFrame = Math.max(0, lastFrame - 1);
          } else if (loopMode === 'once') {
            nextFrame = lastFrame;
            state.playing = false;
          } else {
            nextFrame = 0;
          }
        } else if (nextFrame < 0) {
          state.direction = 1;
          nextFrame = loopMode === 'ping-pong' ? Math.min(lastFrame, 1) : lastFrame;
        }

        state.frame = nextFrame;
        didChange = true;
      });

      // Only repaint when at least one layer advanced its frame
      if (didChange) {
        render();
      }

      if (hasPlayingLayers()) {
        playbackFrameRef.current = requestAnimationFrame(tickPlayback);
        return;
      }

      playbackFrameRef.current = 0;
    },
    [hasPlayingLayers, render],
  );

  const playLayer = useCallback(
    (layerId: string, requestedFps?: number) => {
      const frames = loadedFramesRef.current.get(layerId);

      if (!frames || frames.length <= 1) {
        render();
        return;
      }

      const state = ensureLayerState(layerId);
      stopLayerTween(layerId);
      state.playing = true;
      state.fps = Math.max(1, requestedFps ?? configRef.current.fps);
      state.lastTime = 0;

      if (playbackFrameRef.current === 0) {
        playbackFrameRef.current = requestAnimationFrame(tickPlayback);
      }
    },
    [ensureLayerState, render, stopLayerTween, tickPlayback],
  );

  const pauseLayer = useCallback(
    (layerId: string) => {
      const state = statesRef.current.get(layerId);

      if (state) {
        state.playing = false;
        state.lastTime = 0;
      }

      stopLayerTween(layerId);
      stopPlaybackLoopIfIdle();
    },
    [stopLayerTween, stopPlaybackLoopIfIdle],
  );

  const load = useCallback(async () => {
    const loadId = loadIdRef.current + 1;
    loadIdRef.current = loadId;
    const abortController = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = abortController;
    releaseFrames();
    statesRef.current.clear();

    const sequenceLayers = layerConfigs.filter(
      (layer): layer is FrameStageSequenceLayerConfig => layer.type === 'sequence',
    );

    configRef.current.onLoadStart?.({
      sequenceLayers: sequenceLayers.length,
    });

    const loadedLayerIds = await Promise.all(
      sequenceLayers.map(async (layer) => {
        let imageUrls: readonly string[];

        // Resolve image URLs: archiveUrl takes precedence over images array
        if (layer.archiveUrl) {
          try {
            imageUrls = await loadFramesFromArchive(layer.archiveUrl, {
              signal: abortController.signal,
              useCache,
            });
          } catch (error: unknown) {
            if (!isAbortError(error)) {
              configRef.current.onLoadError?.(toError(error), layer.id);
            }
            throw error;
          }

          // Track cached archive URL so releaseFrames() can decrement the ref on cleanup
          if (useCache) {
            cachedArchiveUrlsRef.current.add(layer.archiveUrl);
          }
        } else {
          imageUrls = layer.images ?? [];
        }

        if (imageUrls.length === 0) {
          const error = new Error(
            `frameloom: layer "${layer.id}" requires either archiveUrl or images with at least one URL.`,
          );
          configRef.current.onLoadError?.(error, layer.id);
          throw error;
        }

        let frames: LoadedFrame[];

        try {
          frames = await loadFramesFromUrls(imageUrls, {
            cache: layer.archiveUrl ? false : (useCache ? assetCache : false),
            concurrency: layer.preloadConcurrency,
            crossOrigin: layer.crossOrigin,
            signal: abortController.signal,
            onProgress: ({ loaded, total }) => {
              configRef.current.onLayerLoadProgress?.({
                layerId: layer.id,
                loaded,
                total,
              });
            },
          });
        } catch (error: unknown) {
          // Uncached archive blob URLs are one-shot — revoke them on error to prevent leaks
          if (layer.archiveUrl && !useCache) {
            (imageUrls as string[]).forEach((u) => URL.revokeObjectURL(u));
          }

          if (!isAbortError(error)) {
            configRef.current.onLoadError?.(toError(error), layer.id);
          }

          throw error;
        }

        // Uncached archive blob URLs: images are decoded and in memory — revoke immediately
        if (layer.archiveUrl && !useCache) {
          (imageUrls as string[]).forEach((u) => URL.revokeObjectURL(u));
        }

        if (loadIdRef.current !== loadId || abortController.signal.aborted) {
          frames.forEach((frame) => frame.release());
          return layer.id;
        }

        loadedFramesRef.current.set(layer.id, frames);
        statesRef.current.set(layer.id, {
          frame: getInitialFrame(layer, frames.length),
          direction: 1,
          playing: false,
          fps: configRef.current.fps,
          lastTime: 0,
          placement: statesRef.current.get(layer.id)?.placement ?? {},
          transformTweens: [],
        });

        return layer.id;
      }),
    );

    if (loadIdRef.current !== loadId || abortController.signal.aborted) {
      return;
    }

    render();
    configRef.current.onLoadComplete?.({
      layerIds: loadedLayerIds,
    });
  }, [assetCache, layerConfigs, releaseFrames, render, useCache]);

  useImperativeHandle(
    ref,
    () => ({
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

  useEffect(() => {
    void load().catch(() => undefined);

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [load]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => render());
      observer.observe(canvas);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, [render]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      releaseFrames();
      statesRef.current.forEach((state) => state.tween?.stop());
      statesRef.current.forEach((state) =>
        state.transformTweens.forEach((tween) => tween.stop()),
      );

      if (playbackFrameRef.current !== 0) {
        cancelAnimationFrame(playbackFrameRef.current);
        playbackFrameRef.current = 0;
      }
    };
  }, [releaseFrames]);

  const accessibilityProps: CanvasHTMLAttributes<HTMLCanvasElement> = decorative
    ? {
        'aria-hidden': true,
        role: 'presentation',
      }
    : {};

  return (
    <FrameStageRegistrationContext.Provider value={registrationValue}>
      <canvas {...canvasProps} {...accessibilityProps} ref={canvasRef} style={mergedStyle}>
        {fallback}
        {children}
      </canvas>
    </FrameStageRegistrationContext.Provider>
  );
});
