export type FrameAsset = {
  image: HTMLImageElement;
  width: number;
  height: number;
};

export type FrameAssetCacheAcquireOptions = {
  crossOrigin?: HTMLImageElement['crossOrigin'];
  decode?: boolean;
  signal?: AbortSignal;
};

export type FrameAssetCache = {
  acquire: (url: string, options?: FrameAssetCacheAcquireOptions) => Promise<FrameAsset & { release: () => void }>;
  clear: () => void;
  size: () => number;
};

type CacheEntry = {
  refs: number;
  image?: HTMLImageElement;
  promise: Promise<HTMLImageElement>;
};

function createAbortError() {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('Frame asset loading was aborted.', 'AbortError');
  }

  const error = new Error('Frame asset loading was aborted.');
  error.name = 'AbortError';
  return error;
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

function createCacheKey(url: string, crossOrigin: HTMLImageElement['crossOrigin'] | undefined) {
  return `${crossOrigin ?? ''}\n${url}`;
}

function loadImageElement(
  url: string,
  crossOrigin: HTMLImageElement['crossOrigin'] | undefined,
) {
  const image = new Image();
  image.decoding = 'async';

  if (crossOrigin !== undefined) {
    image.crossOrigin = crossOrigin;
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => {
      image.onload = null;
      image.onerror = null;
      resolve(image);
    };

    image.onerror = () => {
      image.onload = null;
      image.onerror = null;
      reject(new Error(`Failed to load frame image: ${url}`));
    };

    image.src = url;
  });
}

function waitForAbort<T>(promise: Promise<T>, signal: AbortSignal | undefined) {
  if (!signal) return promise;
  assertNotAborted(signal);

  return new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      signal.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
  });
}

export function createFrameAssetCache(): FrameAssetCache {
  const entries = new Map<string, CacheEntry>();

  function disposeEntry(key: string, entry: CacheEntry) {
    entry.image?.removeAttribute('src');
    entries.delete(key);
  }

  function releaseEntry(key: string, entry: CacheEntry) {
    entry.refs = Math.max(0, entry.refs - 1);

    if (entry.refs === 0 && entry.image) {
      disposeEntry(key, entry);
    }
  }

  return {
    async acquire(url, options = {}) {
      const key = createCacheKey(url, options.crossOrigin);
      let entry = entries.get(key);

      if (!entry) {
        const newEntry: CacheEntry = {
          refs: 0,
          promise: loadImageElement(url, options.crossOrigin),
        };
        entries.set(key, newEntry);
        newEntry.promise
          .then((image) => {
            newEntry.image = image;

            if (newEntry.refs === 0) {
              disposeEntry(key, newEntry);
            }
          })
          .catch(() => {
            entries.delete(key);
          });
        entry = newEntry;
      }

      entry.refs += 1;

      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        releaseEntry(key, entry);
      };

      try {
        const image = await waitForAbort(entry.promise, options.signal);
        assertNotAborted(options.signal);

        if (options.decode !== false) {
          await image.decode();
        }

        assertNotAborted(options.signal);

        return {
          image,
          width: image.naturalWidth || image.width,
          height: image.naturalHeight || image.height,
          release,
        };
      } catch (error) {
        release();
        throw error;
      }
    },
    clear() {
      entries.forEach((entry, key) => disposeEntry(key, entry));
    },
    size() {
      return entries.size;
    },
  };
}

export const sharedFrameAssetCache = createFrameAssetCache();
