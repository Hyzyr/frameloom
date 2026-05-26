export type FrameFit = 'cover' | 'contain' | 'fill';
export type FrameLoop = 'loop' | 'once' | 'ping-pong';
export type FrameEase = string | ((progress: number) => number);

export type AnimationDriverName = 'native' | 'gsap' | 'motion' | 'custom';

export type TweenOptions = {
  from: number;
  to: number;
  duration: number;
  ease?: FrameEase;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
};

export type TweenHandle = {
  stop: () => void;
};

export type AnimationDriver = {
  name: AnimationDriverName;
  tween: (options: TweenOptions) => TweenHandle;
};

export type NormalizedPlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX?: number;
  anchorY?: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  blendMode?: GlobalCompositeOperation;
};

export type SequenceLayer = {
  id: string;
  type: 'sequence';
  frames: string[];
  placement: NormalizedPlacement;
  fit?: FrameFit;
  initialFrame?: number;
};

export type CloudLayer = {
  id: string;
  type: 'clouds';
  placement?: Partial<NormalizedPlacement>;
  opacity?: number;
  driftX?: number;
  driftY?: number;
  blur?: number;
};

export type CustomLayer = {
  id: string;
  type: 'custom';
  placement: NormalizedPlacement;
  render: (context: CanvasRenderingContext2D, time: number) => void;
};

export type FrameLayer = SequenceLayer | CloudLayer | CustomLayer;

export type FrameLoomStageHandle = {
  setLayerFrame: (layerId: string, frame: number, options?: Partial<TweenOptions>) => void;
  setLayerProgress: (layerId: string, progress: number, options?: Partial<TweenOptions>) => void;
  playLayer: (layerId: string, fps?: number) => void;
  pauseLayer: (layerId: string) => void;
  render: () => void;
};