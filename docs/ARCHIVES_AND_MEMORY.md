# Archive, memory, performance, and security

This guide explains how `archiveUrl`, ZIP extraction, cache cleanup, and memory behavior work in frameloom.

## Archive loading

Use `archiveUrl` on `Frameloom` or `FrameSequence`:

```tsx
<Frameloom id="hero" archiveUrl="/animations/hero.zip" />
```

The package will:

1. Download the ZIP with `fetch`.
2. Extract it in the browser using `fflate`.
3. Filter supported image files.
4. Sort frames alphabetically by filename.
5. Create temporary `blob:` URLs.
6. Decode images through the same frame loader used for normal `images` arrays.

Supported image formats inside the archive:

| Format | Extensions |
| --- | --- |
| JPEG | `.jpg`, `.jpeg` |
| PNG | `.png` |
| WebP | `.webp` |
| GIF | `.gif` |
| AVIF | `.avif` |

Ignored files:

- Directories
- macOS metadata under `__MACOSX/`
- Unsupported file extensions

## Frame naming

Frames are sorted alphabetically. Use zero-padded numeric names:

```text
frame-0001.webp
frame-0002.webp
frame-0003.webp
```

Avoid:

```text
frame-1.webp
frame-2.webp
frame-10.webp
```

Alphabetical sorting would place `frame-10.webp` before `frame-2.webp`.

## Automatic cleanup in React components

When you use `archiveUrl` through `FrameloomScene`, `Frameloom`, or `FrameSequence`, frameloom automatically cleans up:

| Resource | Cleanup behavior |
| --- | --- |
| Decoded image frames | Released on unmount and before a replacement load. |
| Playback `requestAnimationFrame` loop | Cancelled on unmount and when no layers are playing. |
| Tween handles | Stopped when replaced, paused, or unmounted. |
| `ResizeObserver` / `IntersectionObserver` | Disconnected on unmount. |
| Network requests | Aborted when a load is replaced or component unmounts. |
| Uncached archive `blob:` URLs | Revoked immediately after image decode, and on error/abort. |
| Cached archive `blob:` URLs | Ref-counted and released when the last component using that archive unmounts or reloads. |

## `useCache`

`useCache` defaults to `true`.

```tsx
<Frameloom id="hero" archiveUrl="/hero.zip" useCache />
```

With cache enabled:

- Reusing the same `archiveUrl` avoids downloading/extracting the same ZIP again.
- Cached archive blob URLs are ref-counted.
- If two components use the same archive URL, one unmounting will not break the other.
- Blob URLs are revoked when the final holder releases them.

Set `useCache={false}` when you always want a fresh download and fastest memory release:

```tsx
<Frameloom id="hero" archiveUrl="/hero.zip" useCache={false} />
```

With cache disabled:

- The ZIP is downloaded every time.
- Blob URLs are revoked immediately after image decode.
- This is useful for one-off scenes or very large archives where memory matters more than reuse.

## Low-level archive API

If you call `loadFramesFromArchive()` directly, you own the lifecycle:

```ts
import { loadFramesFromArchive, releaseArchiveCache } from 'frameloom';

const urls = await loadFramesFromArchive('/hero.zip');

// Use urls with your own image loader or renderer...

releaseArchiveCache('/hero.zip');
```

### `loadFramesFromArchive(url, options)`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `signal` | `AbortSignal` | `undefined` | Cancels download/extraction. |
| `useCache` | `boolean` | `true` | Reuses cached blob URL arrays by archive URL. |
| `onProgress` | `(progress) => void` | `undefined` | Reports download/extract progress. Providing this disables archive caching for that call so progress reflects a fresh load. |

Progress event shapes:

```ts
type ArchiveLoadProgress =
  | { phase: 'download'; loaded: number; total: number }
  | { phase: 'extract'; extracted: number; total: number };
```

When `Content-Length` is not available, download `total` is `0`.

### `releaseArchiveCache(url?)`

```ts
releaseArchiveCache('/hero.zip'); // release one cached archive holder
releaseArchiveCache();            // release one holder for every cached archive
```

The cache is ref-counted. If the same archive was acquired by multiple callers, the blob URLs are revoked only after the final matching release.

## Security notes

Frameloom does not execute archive contents. It only:

- Reads ZIP entries in browser memory.
- Filters known image extensions.
- Creates `Blob` objects and `blob:` URLs for image decoding.
- Ignores path names except for sorting/filtering.

Still follow normal web security practices:

- Only load archives from trusted sources or your own CDN.
- Do not put private data or credentials inside public archives.
- Use HTTPS in production.
- Configure CORS correctly when loading from another origin.
- Validate uploads server-side if users can provide ZIP files.
- Set reasonable file-size limits before hosting user-generated archives.

## CORS and `crossOrigin`

For normal `images` arrays, set `crossOrigin="anonymous"` when loading from a CDN that sends proper CORS headers:

```tsx
<Frameloom id="hero" images={frames} crossOrigin="anonymous" />
```

For `archiveUrl`, the ZIP request itself is made with `fetch`, so the archive URL must be fetchable from the page origin. If it is on another domain, the server must allow CORS.

Extracted frames become same-origin `blob:` URLs, then frameloom decodes them.

## Performance model

`FrameloomScene` is optimized for layered animations:

- One canvas for all layers.
- One shared `requestAnimationFrame` loop.
- Per-layer fps throttling.
- A repaint happens only when at least one playing layer advances frame, or when an imperative tween/control changes state.
- Higher `zIndex` layers render on top.

For best performance:

- Use one `FrameloomScene` per visual scene instead of many canvases.
- Prefer `archiveUrl` for large sequences to avoid hundreds of HTTP requests.
- Use WebP/AVIF for photographic frames.
- Use PNG/WebP with transparency for overlays.
- Keep frames in a sequence the same dimensions.
- Keep `maxDpr` at the default `2` unless you need extra sharpness.
- Use `loading="lazy"` for scenes below the fold.
- Use `useCache={false}` for very large one-time scenes when memory release is more important than reload speed.

## Memory troubleshooting

If memory grows unexpectedly:

1. Confirm components unmount when expected.
2. Avoid keeping your own references to `LoadedFrame` objects after unmount.
3. Use `useCache={false}` for very large ZIP archives that are not reused.
4. If using low-level APIs, call `releaseArchiveCache(url)` when finished.
5. Avoid creating new `images` arrays every render unless the URLs actually changed.
