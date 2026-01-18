/**
 * AlertCreationForm Component
 *
 * Form for creating and editing alerts with various condition types.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  AlertType,
  AlertConfig,
  NotificationChannel,
  AlertFrequency,
  ALERT_TYPE_INFO,
} from '../../types/alerts';

interface AlertCreationFormProps {
  /** Initial values for editing */
  initialValues?: {
    name: string;
    description?: string;
    type: AlertType;
    config: AlertConfig;
    channels: NotificationChannel[];
    frequency: AlertFrequency;
    tags: string[];
  };
  /** Callback when form is submitted */
  onSubmit: (data: {
    name: string;
    description: string;
    type: AlertType;
    config: AlertConfig;
    channels: NotificationChannel[];
    frequency: AlertFrequency;
    tags: string[];
  }) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Whether form is in loading state */
  isLoading?: boolean;
}

// Alert type options with icons
const ALERT_TYPES: { value: AlertType; label: string; description: string; category: string }[] = [
  { value: 'price_above', label: 'Price Above', description: 'When price rises above target', category: 'Price' },
  { value: 'price_below', label: 'Price Below', description: 'When price falls below target', category: 'Price' },
  { value: 'price_crosses', label: 'Price Crosses', description: 'When price crosses target', category: 'Price' },
  { value: 'percent_change', label: 'Percent Change', description: 'Significant price movement', category: 'Price' },
  { value: 'portfolio_value', label: 'Portfolio Value', description: 'Portfolio reaches value', category: 'Portfolio' },
  { value: 'position_gain', label: 'Position Gain', description: 'Position gains value', category: 'Portfolio' },
  { value: 'position_loss', label: 'Position Loss', description: 'Position loses value', category: 'Portfolio' },
  { value: 'drawdown', label: 'Drawdown', description: 'Portfolio drawdown threshold', category: 'Portfolio' },
  { value: 'rebalance_due', label: 'Rebalance Due', description: 'Rebalancing reminder', category: 'Strategy' },
  { value: 'trade_executed', label: 'Trade Executed', description: 'Trade confirmation', category: 'Trading' },
];

const NOTIFICATION_CHANNELS: { value: NotificationChannel; label: string; icon: string }[] = [
  { value: 'in_app', label: 'In-App', icon: 'bell' },
  { value: 'push', label: 'Push', icon: 'smartphone' },
  { value: 'email', label: 'Email', icon: 'mail' },
];

const FREQUENCIES: { value: AlertFrequency; label: string; description: string }[] = [
  { value: 'once', label: 'Once', description: 'Trigger once then disable' },
  { value: 'every_time', label: 'Every Time', description: 'Trigger every occurrence' },
  { value: 'daily_digest', label: 'Daily Digest', description: 'Include in daily summary' },
];

export function AlertCreationForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: AlertCreationFormProps) {
  // Form state
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [alertType, setAlertType] = useState<AlertType>(initialValues?.type || 'price_above');
  const [channels, setChannels] = useState<NotificationChannel[]>(
    initialValues?.channels || ['in_app']
  );
  const [frequency, setFrequency] = useState<AlertFrequency>(
    initialValues?.frequency || 'once'
  );
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Config state based on type
  const [symbol, setSymbol] = useState(
    (initialValues?.config as any)?.symbol || ''
  );
  const [targetPrice, setTargetPrice] = useState(
    (initialValues?.config as any)?.targetPrice || 0
  );
  const [percentThreshold, setPercentThreshold] = useState(
    (initialValues?.config as any)?.percentThreshold || 5
  );
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>(
    (initialValues?.config as any)?.period || 'day'
  );
  const [targetValue, setTargetValue] = useState(
    (initialValues?.config as any)?.targetValue || 0
  );
  const [operator, setOperator] = useState<'greater_than' | 'less_than'>(
    (initialValues?.config as any)?.operator || 'greater_than'
  );
  const [daysBefore, setDaysBefore] = useState(
    (initialValues?.config as any)?.daysBefore || 1
  );
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell' | 'both'>(
    (initialValues?.config as any)?.side || 'both'
  );

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Build config based on type
  const buildConfig = useCallback((): AlertConfig => {
    switch (alertType) {
      case 'price_above':
        return { type: 'price_above', symbol, targetPrice };
      case 'price_below':
        return { type: 'price_below', symbol, targetPrice };
      case 'price_crosses':
        return { type: 'price_crosses', symbol, targetPrice };
      case 'percent_change':
        return { type: 'percent_change', symbol, percentThreshold, period };
      case 'portfolio_value':
        return { type: 'portfolio_value', operator, targetValue };
      case 'position_gain':
        return { type: 'position_gain', symbol, percentThreshold };
      case 'position_loss':
        return { type: 'position_loss', symbol, percentThreshold };
      case 'drawdown':
        return { type: 'drawdown', operator, targetValue, isPercentage: true };
      case 'rebalance_due':
        return { type: 'rebalance_due', daysBefore };
      case 'trade_executed':
        return { type: 'trade_executed', symbol: symbol || undefined, side: tradeSide };
      default:
        return { type: 'custom', expression: '', variables: {} };
    }
  }, [
    alertType,
    symbol,
    targetPrice,
    percentThreshold,
    period,
    targetValue,
    operator,
    daysBefore,
    tradeSide,
  ]);

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Alert name is required';
    }

    if (channels.length === 0) {
      newErrors.channels = 'Select at least one notification channel';
    }

    // Type-specific validation
    const needsSymbol = [
      'price_above',
      'price_below',
      'price_crosses',
      'percent_change',
      'position_gain',
      'position_loss',
    ].includes(alertType);

    if (needsSymbol && !symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    }

    if (['price_above', 'price_below', 'price_crosses'].includes(alertType) && targetPrice <= 0) {
      newErrors.targetPrice = 'Target price must be greater than 0';
    }

    if (['percent_change', 'position_gain', 'position_loss'].includes(alertType) && percentThreshold <= 0) {
      newErrors.percentThreshold = 'Percentage must be greater than 0';
    }

    if (['portfolio_value', 'drawdown'].includes(alertType) && targetValue <= 0) {
      newErrors.targetValue = 'Target value must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, channels, alertType, symbol, targetPrice, percentThreshold, targetValue]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        type: alertType,
        config: buildConfig(),
        channels,
        frequency,
        tags,
      });
    },
    [validate, onSubmit, name, description, alertType, buildConfig, channels, frequency, tags]
  );

  // Toggle channel
  const toggleChannel = useCallback((channel: NotificationChannel) => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  }, []);

  // Add tag
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  // Remove tag
  const handleRemoveTag = useCallback((tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  }, [tags]);

  // Group alert types by category
  const groupedTypes = useMemo(() => {
    const groups: Record<string, typeof ALERT_TYPES> = {};
    ALERT_TYPES.forEach((type) => {
      if (!groups[type.category]) {
        groups[type.category] = [];
      }
      groups[type.category].push(type);
    });
    return groups;
  }, []);

  // Render config fields based on type
  const renderConfigFields = () => {
    switch (alertType) {
      case 'price_above':
      case 'price_below':
      case 'price_crosses':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.symbol ? 'border-red-500' : 'border-gray-300'
                }`}
                data-testid="alert-symbol-input"
              />
              {errors.symbol && (
                <p className="text-red-500 text-sm mt-1">{errors.symbol}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  min={0}
                  step={0.01}
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.targetPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                  data-testid="alert-price-input"
                />
              </div>
              {errors.targetPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.targetPrice}</p>
              )}
            </div>
          </>
        );

      case 'percent_change':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.symbol ? 'border-red-500' : 'border-gray-300'
                }`}
                data-testid="alert-symbol-input"
              />
              {errors.symbol && (
                <p className="text-red-500 text-sm mt-1">{errors.symbol}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Percentage Change
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={percentThreshold}
                    onChange={(e) => setPercentThreshold(Number(e.target.value))}
                    min={0}
                    step={0.1}
                    className={`w-full pr-8 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.percentThreshold ? 'border-red-500' : 'border-gray-300'
                    }`}
                    data-testid="alert-percent-input"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Period
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  data-testid="alert-period-select"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>
            </div>
          </>
        );

      case 'portfolio_value':
      case 'drawdown':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as 'greater_than' | 'less_than')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="alert-operator-select"
              >
                <option value="greater_than">Greater than</option>
                <option value="less_than">Less than</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {alertType === 'drawdown' ? 'Drawdown %' : 'Target Value'}
              </label>
              <div className="relative">
                {alertType !== 'drawdown' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                )}
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  min={0}
                  step={alertType === 'drawdown' ? 0.1 : 100}
                  className={`w-full ${alertType === 'drawdown' ? 'px-4 pr-8' : 'pl-8 pr-4'} py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.targetValue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  data-testid="alert-value-input"
                />
                {alertType === 'drawdown' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                )}
              </div>
            </div>
          </div>
        );

      case 'position_gain':
      case 'position_loss':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.symbol ? 'border-red-500' : 'border-gray-300'
                }`}
                data-testid="alert-symbol-input"
              />
              {errors.symbol && (
                <p className="text-red-500 text-sm mt-1">{errors.symbol}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {alertType === 'position_gain' ? 'Gain Threshold' : 'Loss Threshold'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={percentThreshold}
                  onChange={(e) => setPercentThreshold(Number(e.target.value))}
                  min={0}
                  step={0.1}
                  className={`w-full pr-8 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.percentThreshold ? 'border-red-500' : 'border-gray-300'
                  }`}
                  data-testid="alert-threshold-input"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </>
        );

      case 'rebalance_due':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Days Before Rebalance
            </label>
            <input
              type="number"
              value={daysBefore}
              onChange={(e) => setDaysBefore(Number(e.target.value))}
              min={1}
              max={30}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="alert-days-input"
            />
          </div>
        );

      case 'trade_executed':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol (optional)
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="All symbols"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="alert-symbol-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trade Side
              </label>
              <select
                value={tradeSide}
                onChange={(e) => setTradeSide(e.target.value as 'buy' | 'sell' | 'both')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="alert-side-select"
              >
                <option value="both">Both</option>
                <option value="buy">Buy only</option>
                <option value="sell">Sell only</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="alert-creation-form">
      {/* Alert Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alert Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Price Alert"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          data-testid="alert-name-input"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
          data-testid="alert-description-input"
        />
      </div>

      {/* Alert Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alert Type *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {ALERT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setAlertType(type.value)}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                alertType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid={`alert-type-${type.value}`}
            >
              <div className="font-medium text-sm">{type.label}</div>
              <div className="text-xs text-gray-500">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Type-specific Configuration */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-gray-900">Configuration</h3>
        {renderConfigFields()}
      </div>

      {/* Notification Channels */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notification Channels *
        </label>
        <div className="flex gap-3">
          {NOTIFICATION_CHANNELS.map((channel) => (
            <button
              key={channel.value}
              type="button"
              onClick={() => toggleChannel(channel.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                channels.includes(channel.value)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              data-testid={`channel-${channel.value}`}
            >
              {channel.label}
            </button>
          ))}
        </div>
        {errors.channels && (
          <p className="text-red-500 text-sm mt-1">{errors.channels}</p>
        )}
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trigger Frequency
        </label>
        <div className="grid grid-cols-3 gap-3">
          {FREQUENCIES.map((freq) => (
            <button
              key={freq.value}
              type="button"
              onClick={() => setFrequency(freq.value)}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                frequency === freq.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid={`frequency-${freq.value}`}
            >
              <div className="font-medium text-sm">{freq.label}</div>
              <div className="text-xs text-gray-500">{freq.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="Add a tag..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="alert-tag-input"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-gray-500 hover:text-red-500"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          data-testid="submit-alert-button"
        >
          {isLoading ? (
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
          ) : initialValues ? (
            'Update Alert'
          ) : (
            'Create Alert'
          )}
        </button>
      </div>
    </form>
  );
}

export default AlertCreationForm;
