import type { FrameFit } from './types';

export type ObjectFitRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CanvasRenderOptions = {
  fit?: FrameFit;
  maxDpr?: number;
  clear?: boolean;
  background?: string;
};

export type CanvasResizeResult = {
  width: number;
  height: number;
  dpr: number;
  resized: boolean;
};

type SizeLike = {
  width: number;
  height: number;
};

function hasNumericSize(source: CanvasImageSource): source is CanvasImageSource & SizeLike {
  return (
    'width' in source &&
    'height' in source &&
    typeof source.width === 'number' &&
    typeof source.height === 'number'
  );
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getCanvasSourceSize(source: CanvasImageSource) {
  if (
    typeof HTMLImageElement !== 'undefined' &&
    source instanceof HTMLImageElement &&
    source.naturalWidth > 0 &&
    source.naturalHeight > 0
  ) {
    return {
      width: source.naturalWidth,
      height: source.naturalHeight,
    };
  }

  if (
    typeof HTMLVideoElement !== 'undefined' &&
    source instanceof HTMLVideoElement &&
    source.videoWidth > 0 &&
    source.videoHeight > 0
  ) {
    return {
      width: source.videoWidth,
      height: source.videoHeight,
    };
  }

  if (hasNumericSize(source)) {
    return {
      width: source.width,
      height: source.height,
    };
  }

  return {
    width: 0,
    height: 0,
  };
}

export function calculateObjectFitRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  fit: FrameFit = 'cover',
): ObjectFitRect {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
  }

  if (fit === 'fill') {
    return {
      x: 0,
      y: 0,
      width: targetWidth,
      height: targetHeight,
    };
  }

  const scale =
    fit === 'contain'
      ? Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
      : Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return {
    x: (targetWidth - width) / 2,
    y: (targetHeight - height) / 2,
    width,
    height,
  };
}

export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  maxDpr = 2,
): CanvasResizeResult {
  const rect = canvas.getBoundingClientRect();
  const devicePixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const dpr = clamp(devicePixelRatio, 1, maxDpr);
  const width = Math.max(1, rect.width || canvas.clientWidth || canvas.width / dpr || 1);
  const height = Math.max(1, rect.height || canvas.clientHeight || canvas.height / dpr || 1);
  const nextWidth = Math.round(width * dpr);
  const nextHeight = Math.round(height * dpr);
  const resized = canvas.width !== nextWidth || canvas.height !== nextHeight;

  if (resized) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  return {
    width,
    height,
    dpr,
    resized,
  };
}

export function drawFrameToCanvas(
  canvas: HTMLCanvasElement,
  frame: CanvasImageSource,
  options: CanvasRenderOptions = {},
) {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to get a 2D canvas rendering context.');
  }

  const { width, height, dpr } = resizeCanvasToDisplaySize(canvas, options.maxDpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (options.clear !== false) {
    context.clearRect(0, 0, width, height);
  }

  if (options.background) {
    context.fillStyle = options.background;
    context.fillRect(0, 0, width, height);
  }

  const source = getCanvasSourceSize(frame);
  const rect = calculateObjectFitRect(source.width, source.height, width, height, options.fit);

  if (rect.width > 0 && rect.height > 0) {
    context.drawImage(frame, rect.x, rect.y, rect.width, rect.height);
  }

  return {
    width,
    height,
    dpr,
    frame: rect,
  };
}
