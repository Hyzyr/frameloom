import {
  calculateObjectFitRect,
  clamp,
  getCanvasSourceSize,
  resizeCanvasToDisplaySize,
} from './canvasRenderer';
import type { FrameFit, NormalizedPlacement } from './types';

export type StagePlacement = Partial<NormalizedPlacement>;

export type ResolvedStagePlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  rotation: number;
  skewX: number;
  skewY: number;
  opacity: number;
  zIndex: number;
  blendMode?: GlobalCompositeOperation;
};

export type StageLayerRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
};

export type StageSequenceLayer = {
  id: string;
  type: 'sequence';
  frames: readonly CanvasImageSource[];
  frame?: number;
  progress?: number;
  placement?: StagePlacement;
  fit?: FrameFit;
  visible?: boolean;
};

export type StageCustomRenderInfo = {
  layer: StageCustomLayer;
  placement: ResolvedStagePlacement;
  rect: StageLayerRect;
  width: number;
  height: number;
  time: number;
};

export type StageCustomLayer = {
  id: string;
  type: 'custom';
  placement?: StagePlacement;
  visible?: boolean;
  render: (context: CanvasRenderingContext2D, info: StageCustomRenderInfo) => void;
};

export type StageLayer = StageSequenceLayer | StageCustomLayer;

export type StageRenderOptions = {
  background?: string;
  clear?: boolean;
  maxDpr?: number;
  time?: number;
};

export type StageRenderResult = {
  width: number;
  height: number;
  dpr: number;
  renderedLayers: number;
};

type IndexedStageLayer = {
  layer: StageLayer;
  index: number;
};

export function resolveStagePlacement(placement: StagePlacement = {}): ResolvedStagePlacement {
  return {
    x: placement.x ?? 0,
    y: placement.y ?? 0,
    width: placement.width ?? 1,
    height: placement.height ?? 1,
    anchorX: placement.anchorX ?? 0,
    anchorY: placement.anchorY ?? 0,
    rotation: placement.rotation ?? 0,
    skewX: placement.skewX ?? 0,
    skewY: placement.skewY ?? 0,
    opacity: clamp(placement.opacity ?? 1, 0, 1),
    zIndex: placement.zIndex ?? 0,
    blendMode: placement.blendMode,
  };
}

export function calculateStageLayerRect(
  placement: ResolvedStagePlacement,
  stageWidth: number,
  stageHeight: number,
): StageLayerRect {
  const width = placement.width * stageWidth;
  const height = placement.height * stageHeight;
  const anchorX = placement.x * stageWidth;
  const anchorY = placement.y * stageHeight;

  return {
    x: anchorX - width * placement.anchorX,
    y: anchorY - height * placement.anchorY,
    width,
    height,
    anchorX,
    anchorY,
  };
}

export function sortStageLayers(layers: readonly StageLayer[]) {
  return layers
    .map<IndexedStageLayer>((layer, index) => ({ layer, index }))
    .sort((a, b) => {
      const aPlacement = resolveStagePlacement(a.layer.placement);
      const bPlacement = resolveStagePlacement(b.layer.placement);
      return aPlacement.zIndex - bPlacement.zIndex || a.index - b.index;
    })
    .map(({ layer }) => layer);
}

function getSequenceFrame(layer: StageSequenceLayer) {
  if (layer.frames.length === 0) return undefined;

  const frame =
    layer.frame ??
    (layer.progress === undefined ? 0 : clamp(layer.progress, 0, 1) * (layer.frames.length - 1));
  const index = Math.round(clamp(frame, 0, layer.frames.length - 1));

  return layer.frames[index];
}

function withLayerTransform(
  context: CanvasRenderingContext2D,
  placement: ResolvedStagePlacement,
  rect: StageLayerRect,
  render: () => void,
) {
  context.save();
  context.globalAlpha *= placement.opacity;

  if (placement.blendMode) {
    context.globalCompositeOperation = placement.blendMode;
  }

  context.translate(rect.anchorX, rect.anchorY);
  context.rotate(placement.rotation);
  context.transform(1, Math.tan(placement.skewY), Math.tan(placement.skewX), 1, 0, 0);
  context.translate(-rect.width * placement.anchorX, -rect.height * placement.anchorY);
  render();
  context.restore();
}

function renderSequenceLayer(
  context: CanvasRenderingContext2D,
  layer: StageSequenceLayer,
  placement: ResolvedStagePlacement,
  rect: StageLayerRect,
) {
  const frame = getSequenceFrame(layer);

  if (!frame) {
    return false;
  }

  const source = getCanvasSourceSize(frame);
  const frameRect = calculateObjectFitRect(source.width, source.height, rect.width, rect.height, layer.fit);

  if (frameRect.width <= 0 || frameRect.height <= 0) {
    return false;
  }

  withLayerTransform(context, placement, rect, () => {
    context.drawImage(frame, frameRect.x, frameRect.y, frameRect.width, frameRect.height);
  });

  return true;
}

function renderCustomLayer(
  context: CanvasRenderingContext2D,
  layer: StageCustomLayer,
  placement: ResolvedStagePlacement,
  rect: StageLayerRect,
  time: number,
) {
  withLayerTransform(context, placement, rect, () => {
    layer.render(context, {
      layer,
      placement,
      rect,
      width: rect.width,
      height: rect.height,
      time,
    });
  });

  return true;
}

export function renderStageToCanvas(
  canvas: HTMLCanvasElement,
  layers: readonly StageLayer[],
  options: StageRenderOptions = {},
): StageRenderResult {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to get a 2D canvas rendering context.');
  }

  const { width, height, dpr } = resizeCanvasToDisplaySize(canvas, options.maxDpr);
  const time = options.time ?? (typeof performance === 'undefined' ? 0 : performance.now());
  let renderedLayers = 0;

  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (options.clear !== false) {
    context.clearRect(0, 0, width, height);
  }

  if (options.background) {
    context.fillStyle = options.background;
    context.fillRect(0, 0, width, height);
  }

  sortStageLayers(layers).forEach((layer) => {
    if (layer.visible === false) {
      return;
    }

    const placement = resolveStagePlacement(layer.placement);
    const rect = calculateStageLayerRect(placement, width, height);

    if (rect.width <= 0 || rect.height <= 0 || placement.opacity <= 0) {
      return;
    }

    const rendered =
      layer.type === 'sequence'
        ? renderSequenceLayer(context, layer, placement, rect)
        : renderCustomLayer(context, layer, placement, rect, time);

    if (rendered) {
      renderedLayers += 1;
    }
  });

  return {
    width,
    height,
    dpr,
    renderedLayers,
  };
}
