/**
 * StrategySelector Component
 *
 * Allows users to select from pre-built strategies or create custom ones.
 */

import { useState } from 'react';
import type {
  StrategyType,
  StrategyConfig,
  StrategyPreset,
} from '../../types/backtest';
import { DEFAULT_STRATEGY_PRESETS } from '../../types/backtest';

interface StrategySelectorProps {
  /** Currently selected strategy */
  selectedStrategy?: StrategyConfig;
  /** Callback when strategy is selected */
  onSelect: (strategy: StrategyConfig) => void;
  /** Custom presets (user-saved) */
  customPresets?: StrategyPreset[];
}

const STRATEGY_CATEGORIES = [
  { id: 'all', name: 'All Strategies' },
  { id: 'Momentum', name: 'Momentum' },
  { id: 'Mean Reversion', name: 'Mean Reversion' },
  { id: 'Passive', name: 'Passive' },
  { id: 'Risk-Based', name: 'Risk-Based' },
  { id: 'Smart Beta', name: 'Smart Beta' },
];

const STRATEGY_ICONS: Record<StrategyType, string> = {
  momentum: '📈',
  mean_reversion: '🔄',
  equal_weight: '⚖️',
  risk_parity: '🛡️',
  smart_beta: '🧠',
  custom: '⚙️',
};

export function StrategySelector({
  selectedStrategy,
  onSelect,
  customPresets = [],
}: StrategySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine built-in and custom presets
  const allPresets = [...DEFAULT_STRATEGY_PRESETS, ...customPresets];

  // Filter presets
  const filteredPresets = allPresets.filter((preset) => {
    const matchesCategory =
      selectedCategory === 'all' || preset.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group presets by category for display
  const groupedPresets = filteredPresets.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, StrategyPreset[]>);

  return (
    <div className="strategy-selector" data-testid="strategy-selector">
      {/* Search and Filter */}
      <div className="mb-4 space-y-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search strategies..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          data-testid="strategy-search"
        />

        <div className="flex flex-wrap gap-2">
          {STRATEGY_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Grid */}
      {filteredPresets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No strategies found matching your criteria.</p>
        </div>
      ) : selectedCategory === 'all' ? (
        // Grouped view
        <div className="space-y-6">
          {Object.entries(groupedPresets).map(([category, presets]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presets.map((preset) => (
                  <StrategyCard
                    key={preset.id}
                    preset={preset}
                    isSelected={selectedStrategy?.name === preset.config.name}
                    onSelect={() => onSelect(preset.config)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat view for single category
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredPresets.map((preset) => (
            <StrategyCard
              key={preset.id}
              preset={preset}
              isSelected={selectedStrategy?.name === preset.config.name}
              onSelect={() => onSelect(preset.config)}
            />
          ))}
        </div>
      )}

      {/* Custom Strategy Option */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={() =>
            onSelect({
              type: 'custom',
              name: 'Custom Strategy',
              code: '# Write your custom strategy here\n',
            })
          }
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">⚙️</span>
            <span className="font-medium">Create Custom Strategy</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Write your own strategy using Python
          </p>
        </button>
      </div>
    </div>
  );
}

/**
 * Individual strategy card
 */
interface StrategyCardProps {
  preset: StrategyPreset;
  isSelected: boolean;
  onSelect: () => void;
}

function StrategyCard({ preset, isSelected, onSelect }: StrategyCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`strategy-card p-4 rounded-lg border-2 text-left transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
      data-testid={`strategy-card-${preset.id}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">
          {STRATEGY_ICONS[preset.config.type]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 truncate">
              {preset.name}
            </h4>
            {preset.isBuiltIn && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                Built-in
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {preset.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {preset.config.type.replace('_', ' ')}
            </span>
            {'rebalanceFrequency' in preset.config && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {(preset.config as any).rebalanceFrequency}
              </span>
            )}
          </div>
        </div>
        {isSelected && (
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </button>
  );
}

export default StrategySelector;
