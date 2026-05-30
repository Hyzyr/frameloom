import { createContext, useContext, useEffect } from 'react';

import type { FrameStageLayerConfig } from './FrameStage';

export type FrameStageRegistrationContextValue = {
  registerLayer: (layer: FrameStageLayerConfig) => () => void;
};

export const FrameStageRegistrationContext =
  createContext<FrameStageRegistrationContextValue | null>(null);

export function useFrameStageLayerRegistration(layer: FrameStageLayerConfig) {
  const context = useContext(FrameStageRegistrationContext);

  if (!context) {
    throw new Error('FrameStage child layers must be rendered inside a FrameStage.');
  }

  useEffect(() => context.registerLayer(layer), [context, layer]);
}
