import { unzip } from 'fflate';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ArchiveDownloadProgress = {
  phase: 'download';
  loaded: number;
  /** 0 when Content-Length header is absent */
  total: number;
};

export type ArchiveExtractProgress = {
  phase: 'extract';
  /** Number of image files extracted so far */
  extracted: number;
  total: number;
};

export type ArchiveLoadProgress = ArchiveDownloadProgress | ArchiveExtractProgress;

export type LoadFramesFromArchiveOptions = {
  /**
   * AbortSignal to cancel both the network request and extraction.
   */
  signal?: AbortSignal;
  /**
   * Cache resolved blob-URL arrays keyed by archive URL.
   * Defaults to `true`. Set to `false` to always re-download.
   */
  useCache?: boolean;
  /**
   * Called during download and extraction phases with progress info.
   * When `onProgress` is provided, results are NOT written to the cache
   * (each call with progress must download fresh).
   */
  onProgress?: (progress: ArchiveLoadProgress) => void;
};

// ─── Image helpers ────────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

function isImageFile(name: string): boolean {
  // Skip macOS metadata entries
  if (name.startsWith('__MACOSX/') || name.endsWith('/')) return false;
  return IMAGE_EXTENSIONS.has(getExtension(name));
}

function getMimeType(filename: string): string {
  const ext = getExtension(filename);
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.avif') return 'image/avif';
  return 'image/jpeg';
}

// ─── Abort helpers ────────────────────────────────────────────────────────────

function createAbortError(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('Archive loading was aborted.', 'AbortError');
  }
  const err = new Error('Archive loading was aborted.');
  err.name = 'AbortError';
  return err;
}

function assertNotAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw createAbortError();
}

// ─── Fetch with streaming progress ───────────────────────────────────────────

async function fetchArchiveBytes(
  url: string,
  signal: AbortSignal | undefined,
  onProgress: ((p: ArchiveDownloadProgress) => void) | undefined,
): Promise<Uint8Array> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(
      `frameloom: failed to download archive "${url}" — ${response.status} ${response.statusText}`,
    );
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  // Fast path — no streaming needed
  if (!onProgress || !response.body) {
    const buffer = await response.arrayBuffer();
    onProgress?.({ phase: 'download', loaded: buffer.byteLength, total: buffer.byteLength });
    return new Uint8Array(buffer);
  }

  // Streaming path with progress
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  try {
    while (true) {
      assertNotAborted(signal);
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.byteLength;
      onProgress({ phase: 'download', loaded, total });
    }
  } finally {
    reader.releaseLock();
  }

  assertNotAborted(signal);

  // Concatenate chunks into one contiguous buffer
  const data = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return data;
}

// ─── fflate async wrapper ─────────────────────────────────────────────────────

function unzipAsync(
  data: Uint8Array,
  signal: AbortSignal | undefined,
): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const onAbort = () => reject(createAbortError());
    signal?.addEventListener('abort', onAbort, { once: true });

    unzip(data, (err, result) => {
      signal?.removeEventListener('abort', onAbort);

      if (signal?.aborted) {
        reject(createAbortError());
        return;
      }

      if (err) {
        reject(new Error(`frameloom: ZIP extraction failed — ${err.message}`));
        return;
      }

      resolve(result);
    });
  });
}

// ─── Archive-level blob URL cache ────────────────────────────────────────────

const archiveBlobCache = new Map<string, Promise<string[]>>();

/**
 * Revoke blob URLs cached from a specific archive URL, or all cached entries.
 * Call this when you no longer need the frames from that archive.
 */
export function releaseArchiveCache(url?: string): void {
  const evict = (key: string) => {
    const entry = archiveBlobCache.get(key);
    if (entry) {
      archiveBlobCache.delete(key);
      // Revoke the blob URLs after the promise resolves (if it ever did)
      entry.then((urls) => urls.forEach((u) => URL.revokeObjectURL(u))).catch(() => undefined);
    }
  };

  if (url) {
    evict(url);
  } else {
    for (const key of archiveBlobCache.keys()) {
      evict(key);
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Downloads a ZIP archive, extracts all image frames (sorted by filename),
 * and returns an array of `blob:` URLs ready to pass to `loadFramesFromUrls`.
 *
 * Supported image formats inside the ZIP: JPEG, PNG, WebP, GIF, AVIF.
 * Frames are sorted alphabetically by filename so numbered sequences
 * (e.g. `frame-0001.webp`, `frame-0002.webp`, …) load in order.
 *
 * Blob URLs remain valid for the lifetime of the page unless you call
 * `releaseArchiveCache()` or `URL.revokeObjectURL()` manually.
 *
 * @param url - Absolute or relative URL of the `.zip` archive.
 * @param options - Optional abort signal, cache flag, and progress callback.
 * @returns Sorted array of `blob:` image URLs.
 *
 * @example
 * ```ts
 * const frames = await loadFramesFromArchive('/animations/hero.zip');
 * // → ['blob:...', 'blob:...', ...]
 * ```
 */
export async function loadFramesFromArchive(
  url: string,
  options: LoadFramesFromArchiveOptions = {},
): Promise<string[]> {
  const { signal, useCache = true, onProgress } = options;

  assertNotAborted(signal);

  // Serve from cache when no progress callback is requested
  if (useCache && !onProgress) {
    const cached = archiveBlobCache.get(url);
    if (cached) return cached;
  }

  const promise = (async (): Promise<string[]> => {
    // Phase 1 — download
    const data = await fetchArchiveBytes(
      url,
      signal,
      onProgress
        ? (p) => onProgress(p)
        : undefined,
    );

    assertNotAborted(signal);

    // Phase 2 — extract
    const files = await unzipAsync(data, signal);

    assertNotAborted(signal);

    // Phase 3 — filter, sort, build blob URLs
    const imageNames = Object.keys(files)
      .filter(isImageFile)
      .sort();

    if (imageNames.length === 0) {
      throw new Error(
        `frameloom: archive "${url}" contains no supported image files (jpg/jpeg/png/webp/gif/avif).`,
      );
    }

    const total = imageNames.length;
    const blobUrls: string[] = [];

    for (let i = 0; i < total; i++) {
      assertNotAborted(signal);
      const name = imageNames[i];
      const blob = new Blob([files[name].buffer as ArrayBuffer], { type: getMimeType(name) });
      blobUrls.push(URL.createObjectURL(blob));
      onProgress?.({ phase: 'extract', extracted: i + 1, total });
    }

    return blobUrls;
  })();

  if (useCache && !onProgress) {
    archiveBlobCache.set(url, promise);
    promise.catch(() => archiveBlobCache.delete(url));
  }

  return promise;
}
