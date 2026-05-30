export * from '../core/types';
export { nativeAnimationDriver } from '../core/nativeDriver';

// ─── FrameStage / FrameloomScene ──────────────────────────────────────────────
export { FrameStage } from './FrameStage';
/** Branded alias for FrameStage — the multi-layer canvas container. */
export { FrameStage as FrameloomScene } from './FrameStage';
export type {
  FrameStageCustomLayerConfig,
  FrameStageHandle,
  FrameStageLayerTransform,
  FrameStageLayerConfig,
  FrameStageLayerLoadProgress,
  FrameStageLoadComplete,
  FrameStageLoadStart,
  FrameStageProps,
  FrameStageSequenceLayerConfig,
  FrameStageTweenOptions,
} from './FrameStage';
/** Branded handle alias for FrameStageHandle. */
export type { FrameStageHandle as FrameloomSceneHandle } from './FrameStage';
/** Branded props alias for FrameStageProps. */
export type { FrameStageProps as FrameloomSceneProps } from './FrameStage';

// ─── SequenceLayer / Frameloom ────────────────────────────────────────────────
export { SequenceLayer } from './SequenceLayer';
/** Branded alias for SequenceLayer — an image-sequence layer inside FrameloomScene. */
export { SequenceLayer as Frameloom } from './SequenceLayer';
export type { SequenceLayerProps } from './SequenceLayer';
/** Branded props alias for SequenceLayerProps. */
export type { SequenceLayerProps as FrameloomProps } from './SequenceLayer';

// ─── useFrameStageControls / useFrameloomSceneControls ───────────────────────
export { useFrameStageControls } from './useFrameStageControls';
/** Branded alias for useFrameStageControls. */
export { useFrameStageControls as useFrameloomSceneControls } from './useFrameStageControls';
export type { FrameStageControls } from './useFrameStageControls';
/** Branded controls type alias. */
export type { FrameStageControls as FrameloomSceneControls } from './useFrameStageControls';

// ─── FrameSequence / useFrameSequenceControls ────────────────────────────────
export { FrameSequence } from './FrameSequence';
export type {
  FrameSequenceHandle,
  FrameSequenceLoading,
  FrameSequenceProps,
  FrameSequenceTweenOptions,
} from './FrameSequence';
export { useFrameSequenceControls } from './useFrameSequenceControls';
/** Branded alias for useFrameSequenceControls — for standalone single-sequence use. */
export { useFrameSequenceControls as useFrameloomControls } from './useFrameSequenceControls';
export type { FrameSequenceControls } from './useFrameSequenceControls';
/** Branded controls type alias for standalone FrameSequence. */
export type { FrameSequenceControls as FrameloomControls } from './useFrameSequenceControls';