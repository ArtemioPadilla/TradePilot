/**
 * BacktestConfigForm Component
 *
 * Main form for configuring and running backtests.
 * Combines strategy selection, configuration, and backtest parameters.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  BacktestConfig,
  StrategyConfig,
  AssetUniverse,
  Benchmark,
  StrategyPreset,
} from '../../types/backtest';
import { DEFAULT_STRATEGY_PRESETS } from '../../types/backtest';
import { StrategySelector } from './StrategySelector';
import { StrategyConfigForm } from './StrategyConfigForm';

interface BacktestConfigFormProps {
  /** Initial configuration (for editing) */
  initialConfig?: Partial<BacktestConfig>;
  /** Custom strategy presets */
  customPresets?: StrategyPreset[];
  /** Callback when form is submitted */
  onSubmit: (config: BacktestConfig) => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Callback when config is saved as preset */
  onSavePreset?: (preset: { name: string; description: string; config: BacktestConfig }) => Promise<void>;
  /** Whether the form is in a loading state */
  isLoading?: boolean;
}

const UNIVERSES: { value: AssetUniverse; label: string; description: string }[] = [
  { value: 'sp500', label: 'S&P 500', description: '500 large-cap US stocks' },
  { value: 'nasdaq100', label: 'NASDAQ 100', description: '100 largest NASDAQ stocks' },
  { value: 'dow30', label: 'Dow 30', description: '30 blue-chip stocks' },
  { value: 'custom', label: 'Custom', description: 'Define your own symbols' },
];

const BENCHMARKS: { value: Benchmark; label: string; description: string }[] = [
  { value: 'SPY', label: 'SPY', description: 'S&P 500 ETF' },
  { value: 'QQQ', label: 'QQQ', description: 'NASDAQ 100 ETF' },
  { value: 'DIA', label: 'DIA', description: 'Dow Jones ETF' },
  { value: 'IWM', label: 'IWM', description: 'Russell 2000 ETF' },
  { value: 'VTI', label: 'VTI', description: 'Total Stock Market ETF' },
  { value: 'custom', label: 'Custom', description: 'Enter custom symbol' },
];

type Step = 'strategy' | 'config' | 'parameters' | 'review';

const STEPS: { id: Step; label: string }[] = [
  { id: 'strategy', label: 'Select Strategy' },
  { id: 'config', label: 'Configure Strategy' },
  { id: 'parameters', label: 'Backtest Parameters' },
  { id: 'review', label: 'Review & Run' },
];

// Default initial capital
const DEFAULT_INITIAL_CAPITAL = 100000;

// Date helpers
function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDefaultStartDate(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 5);
  return date;
}

function getDefaultEndDate(): Date {
  return new Date();
}

export function BacktestConfigForm({
  initialConfig,
  customPresets = [],
  onSubmit,
  onCancel,
  onSavePreset,
  isLoading = false,
}: BacktestConfigFormProps) {
  // Current step in the wizard
  const [currentStep, setCurrentStep] = useState<Step>('strategy');

  // Save preset modal state
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [savePresetError, setSavePresetError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(initialConfig?.name || '');
  const [strategy, setStrategy] = useState<StrategyConfig | undefined>(
    initialConfig?.strategy
  );
  const [universe, setUniverse] = useState<AssetUniverse>(
    initialConfig?.universe || 'sp500'
  );
  const [customSymbols, setCustomSymbols] = useState<string[]>(
    initialConfig?.customSymbols || []
  );
  const [customSymbolInput, setCustomSymbolInput] = useState('');
  const [startDate, setStartDate] = useState(
    formatDateForInput(initialConfig?.startDate || getDefaultStartDate())
  );
  const [endDate, setEndDate] = useState(
    formatDateForInput(initialConfig?.endDate || getDefaultEndDate())
  );
  const [initialCapital, setInitialCapital] = useState(
    initialConfig?.initialCapital || DEFAULT_INITIAL_CAPITAL
  );
  const [benchmark, setBenchmark] = useState<Benchmark>(
    initialConfig?.benchmark || 'SPY'
  );
  const [customBenchmark, setCustomBenchmark] = useState(
    initialConfig?.customBenchmark || ''
  );
  const [includeTransactionCosts, setIncludeTransactionCosts] = useState(
    initialConfig?.includeTransactionCosts ?? true
  );
  const [transactionCost, setTransactionCost] = useState(
    initialConfig?.transactionCost ?? 0.001
  );
  const [includeSlippage, setIncludeSlippage] = useState(
    initialConfig?.includeSlippage ?? true
  );
  const [slippage, setSlippage] = useState(initialConfig?.slippage ?? 0.001);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step navigation
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const canGoBack = currentStepIndex > 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const validateCurrentStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'strategy':
        if (!strategy) {
          newErrors.strategy = 'Please select a strategy';
        }
        break;

      case 'config':
        // Strategy config form handles its own validation
        break;

      case 'parameters':
        if (!name.trim()) {
          newErrors.name = 'Backtest name is required';
        }
        if (new Date(startDate) >= new Date(endDate)) {
          newErrors.dateRange = 'Start date must be before end date';
        }
        if (new Date(startDate) > new Date()) {
          newErrors.startDate = 'Start date cannot be in the future';
        }
        if (initialCapital < 1000) {
          newErrors.initialCapital = 'Initial capital must be at least $1,000';
        }
        if (universe === 'custom' && customSymbols.length === 0) {
          newErrors.customSymbols = 'Please add at least one symbol';
        }
        if (benchmark === 'custom' && !customBenchmark.trim()) {
          newErrors.customBenchmark = 'Please enter a benchmark symbol';
        }
        break;

      case 'review':
        // All validation should have passed by now
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    currentStep,
    strategy,
    name,
    startDate,
    endDate,
    initialCapital,
    universe,
    customSymbols,
    benchmark,
    customBenchmark,
  ]);

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  }, [currentStepIndex, validateCurrentStep]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  }, [currentStepIndex]);

  const handleSubmit = useCallback(() => {
    if (!validateCurrentStep() || !strategy) return;

    const config: BacktestConfig = {
      name: name.trim(),
      strategy,
      universe,
      customSymbols: universe === 'custom' ? customSymbols : undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      initialCapital,
      benchmark,
      customBenchmark: benchmark === 'custom' ? customBenchmark : undefined,
      includeTransactionCosts,
      transactionCost: includeTransactionCosts ? transactionCost : undefined,
      includeSlippage,
      slippage: includeSlippage ? slippage : undefined,
    };

    onSubmit(config);
  }, [
    validateCurrentStep,
    strategy,
    name,
    universe,
    customSymbols,
    startDate,
    endDate,
    initialCapital,
    benchmark,
    customBenchmark,
    includeTransactionCosts,
    transactionCost,
    includeSlippage,
    slippage,
    onSubmit,
  ]);

  // Add custom symbol
  const handleAddSymbol = useCallback(() => {
    const symbol = customSymbolInput.trim().toUpperCase();
    if (symbol && !customSymbols.includes(symbol)) {
      setCustomSymbols([...customSymbols, symbol]);
      setCustomSymbolInput('');
    }
  }, [customSymbolInput, customSymbols]);

  const handleRemoveSymbol = useCallback(
    (symbol: string) => {
      setCustomSymbols(customSymbols.filter((s) => s !== symbol));
    },
    [customSymbols]
  );

  // Save as preset handler
  const handleSaveAsPreset = useCallback(async () => {
    if (!strategy || !presetName.trim()) return;

    const config: BacktestConfig = {
      name: name.trim() || presetName.trim(),
      strategy,
      universe,
      customSymbols: universe === 'custom' ? customSymbols : undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      initialCapital,
      benchmark,
      customBenchmark: benchmark === 'custom' ? customBenchmark : undefined,
      includeTransactionCosts,
      transactionCost: includeTransactionCosts ? transactionCost : undefined,
      includeSlippage,
      slippage: includeSlippage ? slippage : undefined,
    };

    setIsSavingPreset(true);
    setSavePresetError(null);

    try {
      await onSavePreset?.({
        name: presetName.trim(),
        description: presetDescription.trim(),
        config,
      });
      setShowSavePresetModal(false);
      setPresetName('');
      setPresetDescription('');
    } catch (error) {
      setSavePresetError(error instanceof Error ? error.message : 'Failed to save preset');
    } finally {
      setIsSavingPreset(false);
    }
  }, [
    strategy,
    presetName,
    presetDescription,
    name,
    universe,
    customSymbols,
    startDate,
    endDate,
    initialCapital,
    benchmark,
    customBenchmark,
    includeTransactionCosts,
    transactionCost,
    includeSlippage,
    slippage,
    onSavePreset,
  ]);

  // Calculate backtest duration for display
  const backtestDuration = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    if (years > 0 && months > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  }, [startDate, endDate]);

  return (
    <div className="backtest-config-form" data-testid="backtest-config-form">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < STEPS.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : index === currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    index === currentStepIndex
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Strategy Selection */}
        {currentStep === 'strategy' && (
          <div data-testid="step-strategy">
            <h2 className="text-xl font-semibold mb-4">Choose a Strategy</h2>
            <p className="text-gray-600 mb-6">
              Select a pre-built strategy or create your own custom strategy.
            </p>
            <StrategySelector
              selectedStrategy={strategy}
              onSelect={setStrategy}
              customPresets={customPresets}
            />
            {errors.strategy && (
              <p className="text-red-500 text-sm mt-2">{errors.strategy}</p>
            )}
          </div>
        )}

        {/* Step 2: Strategy Configuration */}
        {currentStep === 'config' && strategy && (
          <div data-testid="step-config">
            <h2 className="text-xl font-semibold mb-4">Configure Strategy</h2>
            <p className="text-gray-600 mb-6">
              Adjust the parameters for your selected strategy.
            </p>
            <StrategyConfigForm
              config={strategy}
              onChange={setStrategy}
            />
          </div>
        )}

        {/* Step 3: Backtest Parameters */}
        {currentStep === 'parameters' && (
          <div data-testid="step-parameters" className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Backtest Parameters</h2>

            {/* Backtest Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Backtest Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Backtest"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                data-testid="backtest-name-input"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Universe Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Universe
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {UNIVERSES.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setUniverse(u.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      universe === u.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid={`universe-${u.value}`}
                  >
                    <div className="font-medium">{u.label}</div>
                    <div className="text-xs text-gray-500">{u.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Symbols */}
            {universe === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Symbols
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={customSymbolInput}
                    onChange={(e) => setCustomSymbolInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
                    placeholder="Enter symbol (e.g., AAPL)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    data-testid="custom-symbol-input"
                  />
                  <button
                    type="button"
                    onClick={handleAddSymbol}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                {customSymbols.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customSymbols.map((symbol) => (
                      <span
                        key={symbol}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                      >
                        {symbol}
                        <button
                          type="button"
                          onClick={() => handleRemoveSymbol(symbol)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {errors.customSymbols && (
                  <p className="text-red-500 text-sm mt-1">{errors.customSymbols}</p>
                )}
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate || errors.dateRange
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  data-testid="start-date-input"
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={formatDateForInput(new Date())}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.dateRange ? 'border-red-500' : 'border-gray-300'
                  }`}
                  data-testid="end-date-input"
                />
              </div>
            </div>
            {errors.dateRange && (
              <p className="text-red-500 text-sm -mt-4">{errors.dateRange}</p>
            )}
            <p className="text-sm text-gray-500 -mt-4">
              Duration: {backtestDuration}
            </p>

            {/* Initial Capital */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Capital
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Number(e.target.value))}
                  min={1000}
                  step={1000}
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.initialCapital ? 'border-red-500' : 'border-gray-300'
                  }`}
                  data-testid="initial-capital-input"
                />
              </div>
              {errors.initialCapital && (
                <p className="text-red-500 text-sm mt-1">{errors.initialCapital}</p>
              )}
            </div>

            {/* Benchmark */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benchmark
              </label>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {BENCHMARKS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setBenchmark(b.value)}
                    className={`p-2 rounded-lg border-2 text-center transition-colors ${
                      benchmark === b.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={b.description}
                    data-testid={`benchmark-${b.value}`}
                  >
                    <div className="font-medium text-sm">{b.label}</div>
                  </button>
                ))}
              </div>
              {benchmark === 'custom' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customBenchmark}
                    onChange={(e) => setCustomBenchmark(e.target.value.toUpperCase())}
                    placeholder="Enter benchmark symbol"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.customBenchmark ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-testid="custom-benchmark-input"
                  />
                  {errors.customBenchmark && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.customBenchmark}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Transaction Costs & Slippage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTransactionCosts}
                    onChange={(e) => setIncludeTransactionCosts(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    data-testid="include-transaction-costs"
                  />
                  <span className="font-medium">Include Transaction Costs</span>
                </label>
                {includeTransactionCosts && (
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 mb-1">
                      Cost per trade (%)
                    </label>
                    <input
                      type="number"
                      value={(transactionCost * 100).toFixed(2)}
                      onChange={(e) =>
                        setTransactionCost(Number(e.target.value) / 100)
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      data-testid="transaction-cost-input"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSlippage}
                    onChange={(e) => setIncludeSlippage(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    data-testid="include-slippage"
                  />
                  <span className="font-medium">Include Slippage</span>
                </label>
                {includeSlippage && (
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 mb-1">
                      Slippage (%)
                    </label>
                    <input
                      type="number"
                      value={(slippage * 100).toFixed(2)}
                      onChange={(e) => setSlippage(Number(e.target.value) / 100)}
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      data-testid="slippage-input"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 'review' && strategy && (
          <div data-testid="step-review" className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Review Configuration</h2>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              {/* Backtest Name */}
              <div className="flex justify-between">
                <span className="text-gray-600">Backtest Name</span>
                <span className="font-medium">{name}</span>
              </div>

              <hr className="border-gray-200" />

              {/* Strategy */}
              <div>
                <span className="text-gray-600">Strategy</span>
                <div className="mt-1">
                  <span className="font-medium">{strategy.name}</span>
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded">
                    {strategy.type.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Universe */}
              <div className="flex justify-between">
                <span className="text-gray-600">Asset Universe</span>
                <span className="font-medium">
                  {UNIVERSES.find((u) => u.value === universe)?.label}
                  {universe === 'custom' && ` (${customSymbols.length} symbols)`}
                </span>
              </div>

              {/* Date Range */}
              <div className="flex justify-between">
                <span className="text-gray-600">Date Range</span>
                <span className="font-medium">
                  {new Date(startDate).toLocaleDateString()} -{' '}
                  {new Date(endDate).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{backtestDuration}</span>
              </div>

              <hr className="border-gray-200" />

              {/* Capital */}
              <div className="flex justify-between">
                <span className="text-gray-600">Initial Capital</span>
                <span className="font-medium">
                  ${initialCapital.toLocaleString()}
                </span>
              </div>

              {/* Benchmark */}
              <div className="flex justify-between">
                <span className="text-gray-600">Benchmark</span>
                <span className="font-medium">
                  {benchmark === 'custom' ? customBenchmark : benchmark}
                </span>
              </div>

              <hr className="border-gray-200" />

              {/* Costs */}
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Costs</span>
                <span className="font-medium">
                  {includeTransactionCosts
                    ? `${(transactionCost * 100).toFixed(2)}%`
                    : 'None'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Slippage</span>
                <span className="font-medium">
                  {includeSlippage ? `${(slippage * 100).toFixed(2)}%` : 'None'}
                </span>
              </div>
            </div>

            {/* Estimation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-medium text-blue-800">Ready to Run</p>
                  <p className="text-sm text-blue-600 mt-1">
                    The backtest will be executed in your browser using historical
                    market data. Results will be available once complete.
                  </p>
                </div>
              </div>
            </div>

            {/* Save as Preset */}
            {onSavePreset && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setPresetName(name || strategy.name);
                    setPresetDescription(`${strategy.type.replace('_', ' ')} strategy with ${universe} universe`);
                    setShowSavePresetModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="save-preset-button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Save as Preset
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {canGoBack && (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
              data-testid="back-button"
            >
              Back
            </button>
          )}
          {isLastStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
              data-testid="run-backtest-button"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Run Backtest
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="next-button"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Save Preset Modal */}
      {showSavePresetModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !isSavingPreset && setShowSavePresetModal(false)}
          data-testid="save-preset-modal"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Save as Preset</h3>
            <p className="text-sm text-gray-600 mb-4">
              Save this configuration as a preset to reuse in future backtests.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preset Name *
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="My Custom Strategy"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  data-testid="preset-name-input"
                  disabled={isSavingPreset}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  placeholder="Describe what this preset does..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  data-testid="preset-description-input"
                  disabled={isSavingPreset}
                />
              </div>

              {savePresetError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{savePresetError}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowSavePresetModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSavingPreset}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAsPreset}
                disabled={!presetName.trim() || isSavingPreset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                data-testid="confirm-save-preset-button"
              >
                {isSavingPreset ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Preset'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BacktestConfigForm;
