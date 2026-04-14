// TODO: implement strategy presets

export interface StrategyPreset {
  id: string;
  name: string;
  description: string;
  type: string;
  config: any;
}

export function getStrategyPresets(): StrategyPreset[] {
  // TODO: implement preset loading
  return [];
}

export function getPresetById(id: string): StrategyPreset | null {
  // TODO: implement preset lookup by ID
  return null;
}
