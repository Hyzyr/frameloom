import { sharedFrameAssetCache } from './assetCache';
import type { FrameAssetCache } from './assetCache';

export type LoadedFrame = {
  index: number;
  url: string;
  image: HTMLImageElement;
  width: number;
  height: number;
  release: () => void;
};

export type FrameLoadStart = {
  urls: readonly string[];
  total: number;
};

export type FrameLoadProgress = {
  index: number;
  url: string;
  loaded: number;
  total: number;
  frame: LoadedFrame;
};

export type FrameLoadComplete = {
  frames: LoadedFrame[];
  total: number;
};

export type FrameLoadError = {
  error: Error;
  loaded: number;
  total: number;
};

export type LoadFramesFromUrlsOptions = {
  cache?: FrameAssetCache | false;
  concurrency?: number;
  crossOrigin?: HTMLImageElement['crossOrigin'];
  decode?: boolean;
  signal?: AbortSignal;
  onStart?: (start: FrameLoadStart) => void;
  onProgress?: (progress: FrameLoadProgress) => void;
  onComplete?: (complete: FrameLoadComplete) => void;
  onError?: (error: FrameLoadError) => void;
};

function createAbortError() {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('Frame loading was aborted.', 'AbortError');
  }

  const error = new Error('Frame loading was aborted.');
  error.name = 'AbortError';
  return error;
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

function normalizeConcurrency(concurrency: number | undefined, total: number) {
  if (total <= 0) return 0;
  if (concurrency === undefined) return Math.min(4, total);
  return Math.min(total, Math.max(1, Math.floor(concurrency)));
}

async function loadImageFrame(
  url: string,
  index: number,
  options: Pick<LoadFramesFromUrlsOptions, 'cache' | 'crossOrigin' | 'decode' | 'signal'>,
): Promise<LoadedFrame> {
  assertNotAborted(options.signal);

  const cache = options.cache === undefined ? sharedFrameAssetCache : options.cache;

  if (cache) {
    const asset = await cache.acquire(url, options);

    return {
      index,
      url,
      image: asset.image,
      width: asset.width,
      height: asset.height,
      release: asset.release,
    };
  }

  const image = new Image();
  image.decoding = 'async';

  if (options.crossOrigin !== undefined) {
    image.crossOrigin = options.crossOrigin;
  }

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      options.signal?.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    image.onload = () => {
      cleanup();
      resolve();
    };

    image.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load frame image: ${url}`));
    };

    options.signal?.addEventListener('abort', onAbort, { once: true });
    image.src = url;
  });

  assertNotAborted(options.signal);

  if (options.decode !== false) {
    try {
      await image.decode();
    } catch (error) {
      image.removeAttribute('src');
      throw error;
    }
  }

  assertNotAborted(options.signal);

  return {
    index,
    url,
    image,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
    release: () => {
      image.removeAttribute('src');
    },
  };
}

export async function loadFramesFromUrls(
  urls: readonly string[],
  options: LoadFramesFromUrlsOptions = {},
) {
  if (urls.length === 0) {
    throw new Error('loadFramesFromUrls requires at least one image URL.');
  }

  const total = urls.length;
  const frames = new Array<LoadedFrame>(total);
  const workerCount = normalizeConcurrency(options.concurrency, total);
  let nextIndex = 0;
  let loaded = 0;

  options.onStart?.({
    urls,
    total,
  });

  async function worker() {
    while (nextIndex < total) {
      assertNotAborted(options.signal);

      const index = nextIndex;
      nextIndex += 1;

      const frame = await loadImageFrame(urls[index], index, options);
      frames[index] = frame;
      loaded += 1;
      options.onProgress?.({
        index,
        url: urls[index],
        loaded,
        total,
        frame,
      });
    }
  }

  try {
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    frames.forEach((frame) => frame.release());
    options.onError?.({
      error: normalizedError,
      loaded,
      total,
    });
    throw error;
  }

  options.onComplete?.({
    frames,
    total,
  });

  return frames;
}
