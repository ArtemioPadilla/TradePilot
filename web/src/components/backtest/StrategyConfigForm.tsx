/**
 * StrategyConfigForm Component
 *
 * Dynamic configuration forms for different strategy types.
 */

import { useState, useEffect } from 'react';
import type {
  StrategyConfig,
  MomentumStrategyConfig,
  MeanReversionStrategyConfig,
  EqualWeightStrategyConfig,
  RiskParityStrategyConfig,
  SmartBetaStrategyConfig,
  RebalanceFrequency,
} from '../../types/backtest';

interface StrategyConfigFormProps {
  /** Current strategy configuration */
  config: StrategyConfig;
  /** Callback when configuration changes */
  onChange: (config: StrategyConfig) => void;
}

const REBALANCE_OPTIONS: { value: RebalanceFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export function StrategyConfigForm({ config, onChange }: StrategyConfigFormProps) {
  switch (config.type) {
    case 'momentum':
      return (
        <MomentumConfigForm
          config={config as MomentumStrategyConfig}
          onChange={onChange}
        />
      );
    case 'mean_reversion':
      return (
        <MeanReversionConfigForm
          config={config as MeanReversionStrategyConfig}
          onChange={onChange}
        />
      );
    case 'equal_weight':
      return (
        <EqualWeightConfigForm
          config={config as EqualWeightStrategyConfig}
          onChange={onChange}
        />
      );
    case 'risk_parity':
      return (
        <RiskParityConfigForm
          config={config as RiskParityStrategyConfig}
          onChange={onChange}
        />
      );
    case 'smart_beta':
      return (
        <SmartBetaConfigForm
          config={config as SmartBetaStrategyConfig}
          onChange={onChange}
        />
      );
    case 'custom':
      return (
        <CustomStrategyForm
          config={config}
          onChange={onChange}
        />
      );
    default:
      return <div>Unknown strategy type</div>;
  }
}

/**
 * Momentum Strategy Configuration Form
 */
function MomentumConfigForm({
  config,
  onChange,
}: {
  config: MomentumStrategyConfig;
  onChange: (config: StrategyConfig) => void;
}) {
  const updateConfig = (updates: Partial<MomentumStrategyConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="strategy-config-form space-y-4" data-testid="momentum-config-form">
      <div className="form-header mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Momentum Strategy</h3>
        <p className="text-sm text-gray-600">
          Select top performing assets based on past returns
        </p>
      </div>

      {/* Lookback Period */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lookback Period (Days)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="21"
            max="504"
            step="21"
            value={config.lookbackPeriod}
            onChange={(e) =>
              updateConfig({ lookbackPeriod: parseInt(e.target.value) })
            }
            className="flex-1"
            data-testid="lookback-slider"
          />
          <span className="w-16 text-right text-sm font-medium">
            {config.lookbackPeriod} days
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          ~{Math.round(config.lookbackPeriod / 21)} months
        </p>
      </div>

      {/* Top N Assets */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of Top Assets
        </label>
        <input
          type="number"
          min="1"
          max="50"
          value={config.topN}
          onChange={(e) => updateConfig({ topN: parseInt(e.target.value) || 10 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="top-n-input"
        />
        <p className="text-xs text-gray-500 mt-1">
          Select the top {config.topN} assets with highest momentum
        </p>
      </div>

      {/* Rebalance Frequency */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rebalance Frequency
        </label>
        <select
          value={config.rebalanceFrequency}
          onChange={(e) =>
            updateConfig({ rebalanceFrequency: e.target.value as RebalanceFrequency })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="rebalance-select"
        >
          {REBALANCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Volatility Adjustment */}
      <div className="form-group">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.volatilityAdjusted || false}
            onChange={(e) => updateConfig({ volatilityAdjusted: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            data-testid="volatility-adjusted"
          />
          <span className="text-sm text-gray-700">
            Volatility-adjusted momentum
          </span>
        </label>
        <p className="text-xs text-gray-500 ml-6 mt-1">
          Divide momentum by volatility for risk-adjusted ranking
        </p>
      </div>

      {/* Minimum Momentum Threshold */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Momentum Threshold (Optional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            value={config.minMomentum || ''}
            onChange={(e) =>
              updateConfig({
                minMomentum: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder="e.g., 0.05 for 5%"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">%</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Only select assets with momentum above this threshold
        </p>
      </div>
    </div>
  );
}

/**
 * Mean Reversion Strategy Configuration Form
 */
function MeanReversionConfigForm({
  config,
  onChange,
}: {
  config: MeanReversionStrategyConfig;
  onChange: (config: StrategyConfig) => void;
}) {
  const updateConfig = (updates: Partial<MeanReversionStrategyConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="strategy-config-form space-y-4" data-testid="mean-reversion-config-form">
      <div className="form-header mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Mean Reversion Strategy</h3>
        <p className="text-sm text-gray-600">
          Buy oversold assets that deviate from their moving average
        </p>
      </div>

      {/* MA Period */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Moving Average Period (Days)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={config.maPeriod}
            onChange={(e) => updateConfig({ maPeriod: parseInt(e.target.value) })}
            className="flex-1"
            data-testid="ma-period-slider"
          />
          <span className="w-16 text-right text-sm font-medium">
            {config.maPeriod} days
          </span>
        </div>
      </div>

      {/* Entry Threshold */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Entry Threshold (Standard Deviations)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="-4"
            max="0"
            step="0.1"
            value={config.entryThreshold}
            onChange={(e) =>
              updateConfig({ entryThreshold: parseFloat(e.target.value) })
            }
            className="flex-1"
            data-testid="entry-threshold-slider"
          />
          <span className="w-16 text-right text-sm font-medium">
            {config.entryThreshold.toFixed(1)} σ
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Buy when price is {Math.abs(config.entryThreshold).toFixed(1)} standard deviations below MA
        </p>
      </div>

      {/* Exit Threshold */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Exit Threshold (Standard Deviations)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={config.exitThreshold}
            onChange={(e) =>
              updateConfig({ exitThreshold: parseFloat(e.target.value) })
            }
            className="flex-1"
            data-testid="exit-threshold-slider"
          />
          <span className="w-16 text-right text-sm font-medium">
            {config.exitThreshold.toFixed(1)} σ
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Sell when price returns to {config.exitThreshold.toFixed(1)} standard deviations from MA
        </p>
      </div>

      {/* Top N Assets */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Maximum Positions
        </label>
        <input
          type="number"
          min="1"
          max="50"
          value={config.topN}
          onChange={(e) => updateConfig({ topN: parseInt(e.target.value) || 10 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="max-positions-input"
        />
      </div>

      {/* Rebalance Frequency */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rebalance Frequency
        </label>
        <select
          value={config.rebalanceFrequency}
          onChange={(e) =>
            updateConfig({ rebalanceFrequency: e.target.value as RebalanceFrequency })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {REBALANCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Equal Weight Strategy Configuration Form
 */
function EqualWeightConfigForm({
  config,
  onChange,
}: {
  config: EqualWeightStrategyConfig;
  onChange: (config: StrategyConfig) => void;
}) {
  const [symbolInput, setSymbolInput] = useState('');

  const updateConfig = (updates: Partial<EqualWeightStrategyConfig>) => {
    onChange({ ...config, ...updates });
  };

  const addSymbol = () => {
    const symbol = symbolInput.toUpperCase().trim();
    if (symbol && !config.symbols.includes(symbol)) {
      updateConfig({ symbols: [...config.symbols, symbol] });
      setSymbolInput('');
    }
  };

  const removeSymbol = (symbol: string) => {
    updateConfig({ symbols: config.symbols.filter((s) => s !== symbol) });
  };

  return (
    <div className="strategy-config-form space-y-4" data-testid="equal-weight-config-form">
      <div className="form-header mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Equal Weight Strategy</h3>
        <p className="text-sm text-gray-600">
          Allocate equal weight to all selected assets
        </p>
      </div>

      {/* Symbol Input */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Symbols
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
            placeholder="Enter symbol..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="symbol-input"
          />
          <button
            onClick={addSymbol}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Symbol List */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selected Symbols ({config.symbols.length})
        </label>
        <div className="flex flex-wrap gap-2">
          {config.symbols.map((symbol) => (
            <span
              key={symbol}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded"
            >
              {symbol}
              <button
                onClick={() => removeSymbol(symbol)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
          {config.symbols.length === 0 && (
            <span className="text-gray-500 text-sm">
              No symbols selected. Add symbols or use a preset universe.
            </span>
          )}
        </div>
      </div>

      {/* Rebalance Frequency */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rebalance Frequency
        </label>
        <select
          value={config.rebalanceFrequency}
          onChange={(e) =>
            updateConfig({ rebalanceFrequency: e.target.value as RebalanceFrequency })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {REBALANCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Risk Parity Strategy Configuration Form
 */
function RiskParityConfigForm({
  config,
  onChange,
}: {
  config: RiskParityStrategyConfig;
  onChange: (config: StrategyConfig) => void;
}) {
  const [symbolInput, setSymbolInput] = useState('');

  const updateConfig = (updates: Partial<RiskParityStrategyConfig>) => {
    onChange({ ...config, ...updates });
  };

  const addSymbol = () => {
    const symbol = symbolInput.toUpperCase().trim();
    if (symbol && !config.symbols.includes(symbol)) {
      updateConfig({ symbols: [...config.symbols, symbol] });
      setSymbolInput('');
    }
  };

  const removeSymbol = (symbol: string) => {
    updateConfig({ symbols: config.symbols.filter((s) => s !== symbol) });
  };

  return (
    <div className="strategy-config-form space-y-4" data-testid="risk-parity-config-form">
      <div className="form-header mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Risk Parity Strategy</h3>
        <p className="text-sm text-gray-600">
          Allocate inversely proportional to volatility
        </p>
      </div>

      {/* Volatility Lookback */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Volatility Lookback (Days)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="20"
            max="252"
            step="1"
            value={config.volatilityLookback}
            onChange={(e) =>
              updateConfig({ volatilityLookback: parseInt(e.target.value) })
            }
            className="flex-1"
          />
          <span className="w-16 text-right text-sm font-medium">
            {config.volatilityLookback} days
          </span>
        </div>
      </div>

      {/* Target Volatility */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Portfolio Volatility (Optional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={config.targetVolatility || ''}
            onChange={(e) =>
              updateConfig({
                targetVolatility: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder="e.g., 0.10 for 10%"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">annualized</span>
        </div>
      </div>

      {/* Symbol Input */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Symbols
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
            placeholder="Enter symbol..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addSymbol}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Symbol List */}
      <div className="form-group">
        <div className="flex flex-wrap gap-2">
          {config.symbols.map((symbol) => (
            <span
              key={symbol}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded"
            >
              {symbol}
              <button
                onClick={() => removeSymbol(symbol)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Rebalance Frequency */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rebalance Frequency
        </label>
        <select
          value={config.rebalanceFrequency}
          onChange={(e) =>
            updateConfig({ rebalanceFrequency: e.target.value as RebalanceFrequency })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {REBALANCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Smart Beta Strategy Configuration Form
 */
function SmartBetaConfigForm({
  config,
  onChange,
}: {
  config: SmartBetaStrategyConfig;
  onChange: (config: StrategyConfig) => void;
}) {
  const updateConfig = (updates: Partial<SmartBetaStrategyConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateFactor = (factor: string, value: number) => {
    updateConfig({
      factors: {
        ...config.factors,
        [factor]: value,
      },
    });
  };

  const factors = [
    { key: 'momentum', label: 'Momentum', description: 'Recent price performance' },
    { key: 'value', label: 'Value', description: 'Low price-to-book or P/E' },
    { key: 'quality', label: 'Quality', description: 'High ROE, low debt' },
    { key: 'lowVolatility', label: 'Low Volatility', description: 'Lower price swings' },
    { key: 'size', label: 'Size', description: 'Smaller market cap' },
  ];

  return (
    <div className="strategy-config-form space-y-4" data-testid="smart-beta-config-form">
      <div className="form-header mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Smart Beta Strategy</h3>
        <p className="text-sm text-gray-600">
          Combine multiple factors to select stocks
        </p>
      </div>

      {/* Factor Weights */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Factor Weights
        </label>
        <div className="space-y-4">
          {factors.map((factor) => (
            <div key={factor.key} className="flex items-center gap-4">
              <div className="w-32">
                <span className="text-sm font-medium">{factor.label}</span>
                <p className="text-xs text-gray-500">{factor.description}</p>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={(config.factors as any)[factor.key] || 0}
                onChange={(e) => updateFactor(factor.key, parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-right text-sm">
                {((config.factors as any)[factor.key] || 0).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top N Assets */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of Stocks to Select
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={config.topN}
          onChange={(e) => updateConfig({ topN: parseInt(e.target.value) || 20 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Rebalance Frequency */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rebalance Frequency
        </label>
        <select
          value={config.rebalanceFrequency}
          onChange={(e) =>
            updateConfig({ rebalanceFrequency: e.target.value as RebalanceFrequency })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {REBALANCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Custom Strategy Form (Code Editor)
 */
function CustomStrategyForm({
  config,
  onChange,
}: {
  config: StrategyConfig;
  onChange: (config: StrategyConfig) => void;
}) {
  const customConfig = config as { type: 'custom'; name: string; code: string };

  return (
    <div className="strategy-config-form space-y-4" data-testid="custom-strategy-form">
      <div className="form-header mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Custom Strategy</h3>
        <p className="text-sm text-gray-600">
          Write your own strategy using Python
        </p>
      </div>

      {/* Strategy Name */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Strategy Name
        </label>
        <input
          type="text"
          value={customConfig.name}
          onChange={(e) => onChange({ ...customConfig, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Code Editor */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Strategy Code
        </label>
        <textarea
          value={customConfig.code}
          onChange={(e) => onChange({ ...customConfig, code: e.target.value })}
          rows={15}
          className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder={`# Define your ranking function
def rank_assets(data, date):
    """
    Args:
        data: Historical price data (pandas DataFrame)
        date: Current date
    Returns:
        dict: {symbol: weight} for portfolio allocation
    """
    # Your strategy logic here
    pass`}
        />
        <p className="text-xs text-gray-500 mt-1">
          Note: Custom strategies require PyScript to be enabled
        </p>
      </div>
    </div>
  );
}

export default StrategyConfigForm;
