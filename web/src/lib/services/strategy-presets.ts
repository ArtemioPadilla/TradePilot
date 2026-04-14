export interface StrategyPreset {
  id: string;
  name: string;
  description: string;
  type: string;
  config: any;
}

const PRESETS: StrategyPreset[] = [
  {
    id: 'momentum',
    name: 'Momentum',
    description: 'Select stocks with strongest recent price momentum',
    type: 'momentum',
    config: { n_stocks: 5, optimization: 'MSR' },
  },
  {
    id: 'mean_reversion',
    name: 'Mean Reversion',
    description: 'Select oversold stocks trading below moving average',
    type: 'mean_reversion',
    config: { n_stocks: 5, optimization: 'GMV' },
  },
  {
    id: 'equal_weight',
    name: 'Equal Weight',
    description: 'Equal allocation across all assets in universe',
    type: 'equal_weight',
    config: { n_stocks: 10, optimization: 'EW' },
  },
];

export function getStrategyPresets(): StrategyPreset[] {
  return PRESETS;
}

export function getPresetById(id: string): StrategyPreset | null {
  return PRESETS.find((preset) => preset.id === id) ?? null;
}
