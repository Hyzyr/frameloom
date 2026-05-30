import { useMemo } from 'react';

import { useFrameStageLayerRegistration } from './FrameStageContext';
import type { FrameStageSequenceLayerConfig } from './FrameStage';

export type SequenceLayerProps = Omit<FrameStageSequenceLayerConfig, 'type'>;

export function SequenceLayer({
  id,
  images,
  archiveUrl,
  placement,
  fit,
  initialFrame,
  initialProgress,
  visible,
  preloadConcurrency,
  crossOrigin,
}: SequenceLayerProps) {
  const layer = useMemo<FrameStageSequenceLayerConfig>(
    () => ({
      id,
      type: 'sequence',
      images,
      archiveUrl,
      placement,
      fit,
      initialFrame,
      initialProgress,
      visible,
      preloadConcurrency,
      crossOrigin,
    }),
    [
      archiveUrl,
      crossOrigin,
      fit,
      id,
      images,
      initialFrame,
      initialProgress,
      placement,
      preloadConcurrency,
      visible,
    ],
  );

  useFrameStageLayerRegistration(layer);

  return null;
}
