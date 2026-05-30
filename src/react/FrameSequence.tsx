import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import type { CanvasHTMLAttributes, CSSProperties, ReactNode } from 'react';

import { drawFrameToCanvas } from '../core/canvasRenderer';
import { loadFramesFromArchive } from '../core/archiveLoader';
import { loadFramesFromUrls } from '../core/frameLoader';
import { nativeAnimationDriver } from '../core/nativeDriver';
import type { FrameAssetCache } from '../core/assetCache';
import type {
  AnimationDriver,
  FrameEase,
  FrameFit,
  FrameLoop,
  TweenHandle,
  TweenOptions,
} from '../core/types';
import type { FrameLoadProgress, FrameLoadStart, LoadedFrame } from '../core/frameLoader';

export type FrameSequenceTweenOptions = Partial<Pick<TweenOptions, 'duration' | 'ease'>>;
export type FrameSequenceLoading = 'preload' | 'lazy' | 'manual';

export type FrameSequenceHandle = {
  load: () => Promise<LoadedFrame[]>;
  setFrame: (frame: number, options?: FrameSequenceTweenOptions) => void;
  setProgress: (progress: number, options?: FrameSequenceTweenOptions) => void;
  play: (fps?: number) => void;
  pause: () => void;
  render: () => void;
};

export type FrameSequenceProps = Omit<CanvasHTMLAttributes<HTMLCanvasElement>, 'children'> & {
  images?: readonly string[];
  /**
   * URL of a `.zip` archive containing the frame images.
   * Frames are sorted alphabetically by filename inside the archive.
   * Takes precedence over `images` when both are provided.
   */
  archiveUrl?: string;
  poster?: string;
  posterFrame?: number;
  initialFrame?: number;
  initialProgress?: number;
  objectFit?: FrameFit;
  fit?: FrameFit;
  maxDpr?: number;
  background?: string;
  animationDriver?: AnimationDriver;
  duration?: number;
  ease?: FrameEase;
  fps?: number;
  loop?: FrameLoop | boolean;
  autoPlay?: boolean;
  loading?: FrameSequenceLoading;
  preloadConcurrency?: number;
  assetCache?: FrameAssetCache;
  useCache?: boolean;
  crossOrigin?: HTMLImageElement['crossOrigin'];
  decorative?: boolean;
  fallback?: ReactNode;
  onFrameChange?: (frame: number, preciseFrame: number) => void;
  onPosterLoad?: (frame: LoadedFrame) => void;
  onPosterLoadError?: (error: Error) => void;
  onLoadStart?: (start: FrameLoadStart) => void;
  onLoadProgress?: (progress: FrameLoadProgress) => void;
  onLoadComplete?: (frames: LoadedFrame[]) => void;
  onLoadError?: (error: Error) => void;
};

type FrameSequenceConfig = {
  animationDriver: AnimationDriver;
  background: string | undefined;
  duration: number;
  ease: FrameEase | undefined;
  fit: FrameFit;
  fps: number;
  loop: FrameLoop | boolean;
  maxDpr: number;
  onFrameChange: FrameSequenceProps['onFrameChange'];
  onPosterLoad: FrameSequenceProps['onPosterLoad'];
  onPosterLoadError: FrameSequenceProps['onPosterLoadError'];
  onLoadStart: FrameSequenceProps['onLoadStart'];
  onLoadComplete: FrameSequenceProps['onLoadComplete'];
  onLoadError: FrameSequenceProps['onLoadError'];
  onLoadProgress: FrameSequenceProps['onLoadProgress'];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeFrame(value: number, frameCount: number) {
  if (frameCount <= 0) return Math.max(0, value);
  return clamp(value, 0, frameCount - 1);
}

function normalizeProgress(value: number, frameCount: number) {
  if (frameCount <= 1) return 0;
  return clamp(value, 0, 1) * (frameCount - 1);
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function createAbortError(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('Frame loading was aborted.', 'AbortError');
  }
  const err = new Error('Frame loading was aborted.');
  err.name = 'AbortError';
  return err;
}

function resolveLoop(loop: FrameLoop | boolean) {
  if (loop === true) return 'loop';
  if (loop === false) return 'once';
  return loop;
}

function resolvePosterUrl(
  imageUrls: readonly string[],
  poster: string | undefined,
  posterFrame: number | undefined,
  initialFrame: number | undefined,
  initialProgress: number | undefined,
) {
  if (poster) return poster;
  if (imageUrls.length === 0) return undefined;

  const frame =
    posterFrame ??
    initialFrame ??
    (initialProgress === undefined ? 0 : normalizeProgress(initialProgress, imageUrls.length));

  return imageUrls[Math.round(normalizeFrame(frame, imageUrls.length))];
}

export const FrameSequence = forwardRef<FrameSequenceHandle, FrameSequenceProps>(
  function FrameSequence(
    {
      images,
      archiveUrl,
      poster,
      posterFrame,
      initialFrame,
      initialProgress,
      objectFit,
      fit,
      maxDpr = 2,
      background,
      animationDriver = nativeAnimationDriver,
      duration = 0,
      ease,
      fps = 24,
      loop = 'loop',
      autoPlay = false,
      loading = 'preload',
      preloadConcurrency = 4,
      assetCache,
      useCache = true,
      crossOrigin,
      decorative = false,
      fallback,
      onFrameChange,
      onPosterLoad,
      onPosterLoadError,
      onLoadStart,
      onLoadProgress,
      onLoadComplete,
      onLoadError,
      style,
      ...canvasProps
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const framesRef = useRef<LoadedFrame[]>([]);
    const currentFrameRef = useRef(0);
    const tweenRef = useRef<TweenHandle | null>(null);
    const playbackRef = useRef(0);
    const playbackDirectionRef = useRef(1);
    const loadIdRef = useRef(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const posterAbortControllerRef = useRef<AbortController | null>(null);
    const loadingPromiseRef = useRef<Promise<LoadedFrame[]> | null>(null);
    const posterFrameRef = useRef<LoadedFrame | null>(null);
    const resolvedFit = fit ?? objectFit ?? 'cover';
    const imageKey = images?.join('\n') ?? '';
    const imageUrls = useMemo(() => (imageKey ? imageKey.split('\n') : []), [imageKey]);
    const posterUrl = useMemo(
      () => resolvePosterUrl(imageUrls, poster, posterFrame, initialFrame, initialProgress),
      [imageUrls, initialFrame, initialProgress, poster, posterFrame],
    );
    const mergedStyle: CSSProperties = {
      display: 'block',
      width: '100%',
      height: '100%',
      ...style,
    };
    const configRef = useRef<FrameSequenceConfig>({
      animationDriver,
      background,
      duration,
      ease,
      fit: resolvedFit,
      fps,
      loop,
      maxDpr,
      onFrameChange,
      onPosterLoad,
      onPosterLoadError,
      onLoadStart,
      onLoadComplete,
      onLoadError,
      onLoadProgress,
    });

    configRef.current = {
      animationDriver,
      background,
      duration,
      ease,
      fit: resolvedFit,
      fps,
      loop,
      maxDpr,
      onFrameChange,
      onPosterLoad,
      onPosterLoadError,
      onLoadStart,
      onLoadComplete,
      onLoadError,
      onLoadProgress,
    };

    const stopTween = useCallback(() => {
      tweenRef.current?.stop();
      tweenRef.current = null;
    }, []);

    const stopPlayback = useCallback(() => {
      if (playbackRef.current !== 0) {
        cancelAnimationFrame(playbackRef.current);
        playbackRef.current = 0;
      }
    }, []);

    const releaseFrames = useCallback(() => {
      framesRef.current.forEach((frame) => frame.release());
      framesRef.current = [];
    }, []);

    const releasePoster = useCallback(() => {
      posterFrameRef.current?.release();
      posterFrameRef.current = null;
    }, []);

    const renderCurrentFrame = useCallback(() => {
      const canvas = canvasRef.current;
      const frames = framesRef.current;
      const frame =
        frames[Math.round(normalizeFrame(currentFrameRef.current, frames.length))] ??
        posterFrameRef.current;

      if (!canvas || !frame) {
        return;
      }

      drawFrameToCanvas(canvas, frame.image, {
        background: configRef.current.background,
        fit: configRef.current.fit,
        maxDpr: configRef.current.maxDpr,
      });
    }, []);

    const setFrameValue = useCallback(
      (frame: number) => {
        const frames = framesRef.current;
        const nextFrame = normalizeFrame(frame, frames.length);
        currentFrameRef.current = nextFrame;
        renderCurrentFrame();
        configRef.current.onFrameChange?.(Math.round(nextFrame), nextFrame);
      },
      [renderCurrentFrame],
    );

    const animateToFrame = useCallback(
      (frame: number, options?: FrameSequenceTweenOptions) => {
        stopPlayback();
        stopTween();

        const frames = framesRef.current;
        const targetFrame = normalizeFrame(frame, frames.length);
        const tweenDuration = options?.duration ?? configRef.current.duration;

        if (tweenDuration > 0 && frames.length > 0) {
          tweenRef.current = configRef.current.animationDriver.tween({
            from: currentFrameRef.current,
            to: targetFrame,
            duration: tweenDuration,
            ease: options?.ease ?? configRef.current.ease,
            onUpdate: setFrameValue,
            onComplete: () => {
              tweenRef.current = null;
            },
          });
          return;
        }

        setFrameValue(targetFrame);
      },
      [setFrameValue, stopPlayback, stopTween],
    );

    const play = useCallback(
      (requestedFps?: number) => {
        stopPlayback();
        stopTween();

        const frames = framesRef.current;

        if (frames.length <= 1) {
          renderCurrentFrame();
          return;
        }

        const playbackFps = Math.max(1, requestedFps ?? configRef.current.fps);
        const interval = 1000 / playbackFps;
        let lastTime = 0;

        const tick = (time: number) => {
          if (lastTime === 0) {
            lastTime = time;
          }

          if (time - lastTime >= interval) {
            lastTime = time;

            const loopMode = resolveLoop(configRef.current.loop);
            const lastFrame = framesRef.current.length - 1;
            let nextFrame = Math.round(currentFrameRef.current) + playbackDirectionRef.current;

            if (nextFrame > lastFrame) {
              if (loopMode === 'ping-pong') {
                playbackDirectionRef.current = -1;
                nextFrame = Math.max(0, lastFrame - 1);
              } else if (loopMode === 'once') {
                setFrameValue(lastFrame);
                playbackRef.current = 0;
                return;
              } else {
                nextFrame = 0;
              }
            } else if (nextFrame < 0) {
              playbackDirectionRef.current = 1;
              nextFrame = loopMode === 'ping-pong' ? Math.min(lastFrame, 1) : lastFrame;
            }

            setFrameValue(nextFrame);
          }

          playbackRef.current = requestAnimationFrame(tick);
        };

        playbackRef.current = requestAnimationFrame(tick);
      },
      [renderCurrentFrame, setFrameValue, stopPlayback, stopTween],
    );

    const pause = useCallback(() => {
      stopPlayback();
      stopTween();
    }, [stopPlayback, stopTween]);

    const load = useCallback(async () => {
      const loadId = loadIdRef.current + 1;
      loadIdRef.current = loadId;
      const abortController = new AbortController();

      abortControllerRef.current?.abort();
      abortControllerRef.current = abortController;
      pause();
      releaseFrames();

      if (archiveUrl) {
        let archiveImageUrls: string[];

        try {
          archiveImageUrls = await loadFramesFromArchive(archiveUrl, {
            signal: abortController.signal,
            useCache: useCache,
          });
        } catch (error: unknown) {
          if (!isAbortError(error)) {
            configRef.current.onLoadError?.(toError(error));
          }
          throw error;
        }

        if (abortController.signal.aborted) {
          throw createAbortError();
        }

        const promise2 = loadFramesFromUrls(archiveImageUrls, {
          cache: false,
          concurrency: preloadConcurrency,
          crossOrigin,
          signal: abortController.signal,
          onStart: (start) => configRef.current.onLoadStart?.(start),
          onProgress: (progress) => configRef.current.onLoadProgress?.(progress),
        });

        loadingPromiseRef.current = promise2;
        return promise2
          .then((frames) => {
            if (loadIdRef.current !== loadId || abortController.signal.aborted) {
              frames.forEach((frame) => frame.release());
              return [];
            }

            framesRef.current = frames;
            const startingFrame =
              initialFrame ?? normalizeProgress(initialProgress ?? 0, frames.length);

            setFrameValue(startingFrame);
            releasePoster();
            configRef.current.onLoadComplete?.(frames);

            if (autoPlay) play(fps);
            return frames;
          })
          .catch((error: unknown) => {
            if (!isAbortError(error)) configRef.current.onLoadError?.(toError(error));
            throw error;
          })
          .finally(() => {
            if (loadingPromiseRef.current === promise2) loadingPromiseRef.current = null;
            if (abortControllerRef.current === abortController) abortControllerRef.current = null;
          });
      }

      if (imageUrls.length === 0) {
        const error = new Error('FrameSequence requires at least one image URL in the images prop.');
        configRef.current.onLoadError?.(error);
        return Promise.reject(error);
      }

      const promise = loadFramesFromUrls(imageUrls, {
        cache: useCache ? assetCache : false,
        concurrency: preloadConcurrency,
        crossOrigin,
        signal: abortController.signal,
        onStart: (start) => {
          configRef.current.onLoadStart?.(start);
        },
        onProgress: (progress) => {
          configRef.current.onLoadProgress?.(progress);
        },
      })
        .then((frames) => {
          if (loadIdRef.current !== loadId || abortController.signal.aborted) {
            frames.forEach((frame) => frame.release());
            return [];
          }

          framesRef.current = frames;
          const startingFrame =
            initialFrame ?? normalizeProgress(initialProgress ?? 0, frames.length);

          setFrameValue(startingFrame);
          releasePoster();
          configRef.current.onLoadComplete?.(frames);

          if (autoPlay) {
            play(fps);
          }

          return frames;
        })
        .catch((error: unknown) => {
          if (!isAbortError(error)) {
            configRef.current.onLoadError?.(toError(error));
          }

          throw error;
        })
        .finally(() => {
          if (loadingPromiseRef.current === promise) {
            loadingPromiseRef.current = null;
          }

          if (abortControllerRef.current === abortController) {
            abortControllerRef.current = null;
          }
        });

      loadingPromiseRef.current = promise;
      return promise;
    }, [
      archiveUrl,
      assetCache,
      autoPlay,
      crossOrigin,
      fps,
      imageUrls,
      initialFrame,
      initialProgress,
      pause,
      play,
      preloadConcurrency,
      releaseFrames,
      releasePoster,
      setFrameValue,
      useCache,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        load,
        setFrame: animateToFrame,
        setProgress: (progress, options) => {
          animateToFrame(normalizeProgress(progress, framesRef.current.length), options);
        },
        play,
        pause,
        render: renderCurrentFrame,
      }),
      [animateToFrame, load, pause, play, renderCurrentFrame],
    );

    useEffect(() => {
      posterAbortControllerRef.current?.abort();
      releasePoster();

      if (!posterUrl) {
        return undefined;
      }

      const abortController = new AbortController();
      posterAbortControllerRef.current = abortController;

      loadFramesFromUrls([posterUrl], {
        cache: useCache ? assetCache : false,
        concurrency: 1,
        crossOrigin,
        signal: abortController.signal,
      })
        .then(([frame]) => {
          if (abortController.signal.aborted) {
            frame.release();
            return;
          }

          if (framesRef.current.length > 0) {
            frame.release();
            return;
          }

          posterFrameRef.current = frame;
          renderCurrentFrame();
          configRef.current.onPosterLoad?.(frame);
        })
        .catch((error: unknown) => {
          if (!isAbortError(error)) {
            configRef.current.onPosterLoadError?.(toError(error));
          }
        });

      return () => {
        abortController.abort();
      };
    }, [assetCache, crossOrigin, posterUrl, releasePoster, renderCurrentFrame, useCache]);

    useEffect(() => {
      if (loading === 'manual') {
        abortControllerRef.current?.abort();
        pause();
        releaseFrames();
        return undefined;
      }

      if (loading === 'lazy') {
        const canvas = canvasRef.current;

        if (!canvas || typeof IntersectionObserver === 'undefined') {
          void load().catch(() => undefined);
          return undefined;
        }

        const observer = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            void load().catch(() => undefined);
          }
        });

        observer.observe(canvas);

        return () => {
          observer.disconnect();
          abortControllerRef.current?.abort();
        };
      }

      void load().catch(() => undefined);

      return () => {
        abortControllerRef.current?.abort();
      };
    }, [load, loading, pause, releaseFrames]);

    useEffect(() => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return undefined;
      }

      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => renderCurrentFrame());
        observer.observe(canvas);
        return () => observer.disconnect();
      }

      window.addEventListener('resize', renderCurrentFrame);
      return () => window.removeEventListener('resize', renderCurrentFrame);
    }, [renderCurrentFrame]);

    useEffect(() => {
      return () => {
        posterAbortControllerRef.current?.abort();
        abortControllerRef.current?.abort();
        pause();
        releaseFrames();
        releasePoster();
      };
    }, [pause, releaseFrames, releasePoster]);

    const accessibilityProps: CanvasHTMLAttributes<HTMLCanvasElement> = decorative
      ? {
          'aria-hidden': true,
          role: 'presentation',
        }
      : {};

    return (
      <canvas {...canvasProps} {...accessibilityProps} ref={canvasRef} style={mergedStyle}>
        {fallback}
      </canvas>
    );
  },
);
