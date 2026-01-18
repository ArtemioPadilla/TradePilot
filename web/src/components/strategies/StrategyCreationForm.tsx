/**
 * Strategy Creation Form Component
 *
 * Form for creating new trading strategies from templates or scratch.
 */

import { useState } from 'react';
import type {
  StrategyType,
  StrategyConfig,
  RebalanceFrequency,
  AssetUniverse,
  StrategyTemplate,
  ParameterDefinition,
} from '../../types/strategies';
import {
  STRATEGY_TEMPLATES,
  STRATEGY_PARAMETER_SCHEMAS,
  getStrategyTypeName,
  getRebalanceFrequencyName,
} from '../../types/strategies';

export interface StrategyCreationFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    config: StrategyConfig;
    tags: string[];
  }) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  initialTemplate?: string;
}

export function StrategyCreationForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialTemplate,
}: StrategyCreationFormProps) {
  const [step, setStep] = useState<'template' | 'config' | 'parameters'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(
    initialTemplate ? STRATEGY_TEMPLATES.find((t) => t.id === initialTemplate) || null : null
  );
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [strategyType, setStrategyType] = useState<StrategyType>('momentum');
  const [universe, setUniverse] = useState<AssetUniverse>('sp500');
  const [customSymbols, setCustomSymbols] = useState('');
  const [rebalanceFrequency, setRebalanceFrequency] = useState<RebalanceFrequency>('monthly');
  const [parameters, setParameters] = useState<Record<string, unknown>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleSelectTemplate = (template: StrategyTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setStrategyType(template.type);
    setUniverse(template.config.universe || 'sp500');
    setRebalanceFrequency(template.config.rebalanceFrequency || 'monthly');
    if (template.config.customSymbols) {
      setCustomSymbols(template.config.customSymbols.join(', '));
    }
    setParameters(template.config.parameters || {});
    setTags([template.type, template.category]);
    setStep('config');
  };

  const handleStartFromScratch = () => {
    setSelectedTemplate(null);
    setStep('config');
  };

  const handleConfigNext = () => {
    setStep('parameters');
  };

  const handleConfigBack = () => {
    setStep('template');
  };

  const handleParametersBack = () => {
    setStep('config');
  };

  const handleSubmit = () => {
    const config: StrategyConfig = {
      type: strategyType,
      parameters,
      universe,
      customSymbols: universe === 'custom' ? customSymbols.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      rebalanceFrequency,
    };

    onSubmit({
      name,
      description,
      config,
      tags,
    });
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleParameterChange = (key: string, value: unknown) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  };

  const parameterSchema = strategyType !== 'custom'
    ? STRATEGY_PARAMETER_SCHEMAS[strategyType as keyof typeof STRATEGY_PARAMETER_SCHEMAS] || []
    : [];

  return (
    <div className="strategy-creation-form" data-testid="strategy-creation-form">
      {/* Progress Steps */}
      <div className="form-steps">
        <div className={`step ${step === 'template' ? 'active' : ''} ${step !== 'template' ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Template</span>
        </div>
        <div className={`step ${step === 'config' ? 'active' : ''} ${step === 'parameters' ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Configure</span>
        </div>
        <div className={`step ${step === 'parameters' ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Parameters</span>
        </div>
      </div>

      {/* Step 1: Template Selection */}
      {step === 'template' && (
        <div className="step-content">
          <h3>Choose a Starting Point</h3>
          <p className="step-description">
            Select a pre-built template or start from scratch
          </p>

          <button
            className="scratch-button"
            onClick={handleStartFromScratch}
            data-testid="start-from-scratch"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Start from Scratch</span>
          </button>

          <div className="templates-divider">
            <span>or choose a template</span>
          </div>

          <div className="template-grid">
            {STRATEGY_TEMPLATES.map((template) => (
              <button
                key={template.id}
                className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                onClick={() => handleSelectTemplate(template)}
                data-testid={`template-${template.id}`}
              >
                <span className="template-icon">{template.icon}</span>
                <span className="template-name">{template.name}</span>
                <span className="template-description">{template.description}</span>
                <span className={`template-category category-${template.category}`}>
                  {template.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Basic Configuration */}
      {step === 'config' && (
        <div className="step-content">
          <h3>Configure Your Strategy</h3>

          <div className="form-group">
            <label htmlFor="strategy-name">Strategy Name *</label>
            <input
              id="strategy-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Strategy"
              data-testid="strategy-name-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="strategy-description">Description</label>
            <textarea
              id="strategy-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this strategy does..."
              rows={3}
              data-testid="strategy-description-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="strategy-type">Strategy Type *</label>
            <select
              id="strategy-type"
              value={strategyType}
              onChange={(e) => {
                setStrategyType(e.target.value as StrategyType);
                setParameters({});
              }}
              data-testid="strategy-type-select"
            >
              <option value="momentum">Momentum</option>
              <option value="mean_reversion">Mean Reversion</option>
              <option value="equal_weight">Equal Weight</option>
              <option value="risk_parity">Risk Parity</option>
              <option value="smart_beta">Smart Beta</option>
              <option value="buy_and_hold">Buy & Hold</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="universe">Asset Universe *</label>
              <select
                id="universe"
                value={universe}
                onChange={(e) => setUniverse(e.target.value as AssetUniverse)}
                data-testid="universe-select"
              >
                <option value="sp500">S&P 500</option>
                <option value="nasdaq100">NASDAQ 100</option>
                <option value="dow30">Dow 30</option>
                <option value="etf_universe">ETF Universe</option>
                <option value="custom">Custom Symbols</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rebalance">Rebalance Frequency *</label>
              <select
                id="rebalance"
                value={rebalanceFrequency}
                onChange={(e) => setRebalanceFrequency(e.target.value as RebalanceFrequency)}
                data-testid="rebalance-select"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>

          {universe === 'custom' && (
            <div className="form-group">
              <label htmlFor="custom-symbols">Custom Symbols</label>
              <input
                id="custom-symbols"
                type="text"
                value={customSymbols}
                onChange={(e) => setCustomSymbols(e.target.value)}
                placeholder="AAPL, MSFT, GOOGL..."
                data-testid="custom-symbols-input"
              />
              <span className="help-text">Comma-separated list of ticker symbols</span>
            </div>
          )}

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag..."
                data-testid="tag-input"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="add-tag-button"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="tags-list">
                {tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} aria-label={`Remove ${tag}`}>
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="back-button"
              onClick={handleConfigBack}
            >
              Back
            </button>
            <button
              type="button"
              className="next-button"
              onClick={handleConfigNext}
              disabled={!name.trim()}
            >
              Next: Parameters
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Strategy Parameters */}
      {step === 'parameters' && (
        <div className="step-content">
          <h3>{getStrategyTypeName(strategyType)} Parameters</h3>

          {parameterSchema.length === 0 ? (
            <div className="no-parameters">
              <p>This strategy type has no configurable parameters.</p>
              <p className="hint">
                {strategyType === 'custom'
                  ? 'Custom strategies use code to define their behavior.'
                  : 'Default parameters will be used.'}
              </p>
            </div>
          ) : (
            <div className="parameters-grid">
              {parameterSchema.map((param) => (
                <ParameterInput
                  key={param.key}
                  definition={param}
                  value={parameters[param.key] ?? param.default}
                  onChange={(value) => handleParameterChange(param.key, value)}
                />
              ))}
            </div>
          )}

          <div className="strategy-summary">
            <h4>Strategy Summary</h4>
            <dl>
              <dt>Name</dt>
              <dd>{name}</dd>
              <dt>Type</dt>
              <dd>{getStrategyTypeName(strategyType)}</dd>
              <dt>Universe</dt>
              <dd>{universe.toUpperCase()}</dd>
              <dt>Rebalance</dt>
              <dd>{getRebalanceFrequencyName(rebalanceFrequency)}</dd>
            </dl>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="back-button"
              onClick={handleParametersBack}
            >
              Back
            </button>
            <div className="right-actions">
              {onCancel && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="submit-button"
                onClick={handleSubmit}
                disabled={isSubmitting || !name.trim()}
                data-testid="create-strategy-submit"
              >
                {isSubmitting ? 'Creating...' : 'Create Strategy'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

interface ParameterInputProps {
  definition: ParameterDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

function ParameterInput({ definition, value, onChange }: ParameterInputProps) {
  const { key, label, type, description, min, max, step, options, unit, placeholder } = definition;

  const renderInput = () => {
    switch (type) {
      case 'number':
        return (
          <div className="number-input-wrapper">
            <input
              type="number"
              id={key}
              value={value as number}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              min={min}
              max={max}
              step={step || 1}
              data-testid={`param-${key}`}
            />
            {unit && <span className="unit">{unit}</span>}
          </div>
        );

      case 'select':
        return (
          <select
            id={key}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            data-testid={`param-${key}`}
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multi_select':
        return (
          <div className="multi-select">
            {options?.map((opt) => (
              <label key={opt.value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={(value as string[])?.includes(opt.value as string)}
                  onChange={(e) => {
                    const current = (value as string[]) || [];
                    if (e.target.checked) {
                      onChange([...current, opt.value]);
                    } else {
                      onChange(current.filter((v) => v !== opt.value));
                    }
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => onChange(e.target.checked)}
              data-testid={`param-${key}`}
            />
            <span className="toggle-switch" />
          </label>
        );

      case 'text':
        return (
          <input
            type="text"
            id={key}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            data-testid={`param-${key}`}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="parameter-input">
      <label htmlFor={key}>{label}</label>
      {renderInput()}
      {description && <span className="param-description">{description}</span>}
    </div>
  );
}

const styles = `
  .strategy-creation-form {
    max-width: 700px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  .form-steps {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2rem;
    position: relative;
  }

  .form-steps::before {
    content: '';
    position: absolute;
    top: 16px;
    left: 10%;
    right: 10%;
    height: 2px;
    background-color: var(--border, #e5e7eb);
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    z-index: 1;
  }

  .step-number {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: var(--bg-tertiary, #f3f4f6);
    color: var(--text-muted, #6b7280);
    font-weight: 600;
    font-size: 0.875rem;
  }

  .step.active .step-number {
    background-color: var(--accent, #6366f1);
    color: white;
  }

  .step.completed .step-number {
    background-color: #22c55e;
    color: white;
  }

  .step-label {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  .step.active .step-label {
    color: var(--text-primary, #111827);
    font-weight: 500;
  }

  .step-content h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.5rem 0;
  }

  .step-description {
    color: var(--text-muted, #6b7280);
    margin: 0 0 1.5rem 0;
  }

  .scratch-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background-color: var(--bg-secondary, #f8f9fa);
    border: 2px dashed var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    color: var(--text-secondary, #4b5563);
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .scratch-button:hover {
    border-color: var(--accent, #6366f1);
    color: var(--accent, #6366f1);
    background-color: rgba(99, 102, 241, 0.05);
  }

  .templates-divider {
    display: flex;
    align-items: center;
    margin: 1.5rem 0;
  }

  .templates-divider::before,
  .templates-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: var(--border, #e5e7eb);
  }

  .templates-divider span {
    padding: 0 1rem;
    color: var(--text-muted, #6b7280);
    font-size: 0.875rem;
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .template-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem;
    background-color: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .template-card:hover {
    border-color: var(--accent, #6366f1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .template-card.selected {
    border-color: var(--accent, #6366f1);
    background-color: rgba(99, 102, 241, 0.05);
  }

  .template-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .template-name {
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin-bottom: 0.25rem;
  }

  .template-description {
    font-size: 0.8125rem;
    color: var(--text-muted, #6b7280);
    line-height: 1.4;
    margin-bottom: 0.5rem;
  }

  .template-category {
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm, 0.25rem);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .category-beginner {
    background-color: rgba(34, 197, 94, 0.1);
    color: #16a34a;
  }

  .category-intermediate {
    background-color: rgba(234, 179, 8, 0.1);
    color: #ca8a04;
  }

  .category-advanced {
    background-color: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
    margin-bottom: 0.375rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.9375rem;
    background-color: var(--bg-primary, white);
    color: var(--text-primary, #111827);
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .help-text {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
    margin-top: 0.25rem;
  }

  .tags-input {
    display: flex;
    gap: 0.5rem;
  }

  .tags-input input {
    flex: 1;
  }

  .add-tag-button {
    padding: 0.625rem 1rem;
    background-color: var(--bg-tertiary, #f3f4f6);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    color: var(--text-primary, #111827);
    cursor: pointer;
  }

  .add-tag-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-top: 0.5rem;
  }

  .tags-list .tag {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background-color: var(--bg-tertiary, #f3f4f6);
    border-radius: var(--radius-sm, 0.25rem);
    font-size: 0.8125rem;
    color: var(--text-secondary, #4b5563);
  }

  .tags-list .tag button {
    background: none;
    border: none;
    padding: 0;
    color: var(--text-muted, #6b7280);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border, #e5e7eb);
  }

  .right-actions {
    display: flex;
    gap: 0.75rem;
  }

  .back-button,
  .cancel-button,
  .next-button,
  .submit-button {
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .back-button,
  .cancel-button {
    background-color: var(--bg-tertiary, #f3f4f6);
    border: 1px solid var(--border, #e5e7eb);
    color: var(--text-primary, #111827);
  }

  .back-button:hover,
  .cancel-button:hover {
    background-color: var(--bg-secondary, #e5e7eb);
  }

  .next-button,
  .submit-button {
    background-color: var(--accent, #6366f1);
    border: none;
    color: white;
  }

  .next-button:hover:not(:disabled),
  .submit-button:hover:not(:disabled) {
    background-color: var(--accent-hover, #4f46e5);
  }

  .next-button:disabled,
  .submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .parameters-grid {
    display: grid;
    gap: 1.25rem;
  }

  .parameter-input label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
    margin-bottom: 0.375rem;
  }

  .parameter-input input,
  .parameter-input select {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.9375rem;
    background-color: var(--bg-primary, white);
  }

  .number-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .number-input-wrapper input {
    flex: 1;
  }

  .number-input-wrapper .unit {
    color: var(--text-muted, #6b7280);
    font-size: 0.875rem;
  }

  .param-description {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
    margin-top: 0.25rem;
  }

  .multi-select {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: var(--text-secondary, #4b5563);
    cursor: pointer;
  }

  .toggle-label {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }

  .toggle-label input {
    position: absolute;
    opacity: 0;
  }

  .toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    background-color: var(--border, #e5e7eb);
    border-radius: 12px;
    transition: background-color 0.2s;
  }

  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .toggle-label input:checked + .toggle-switch {
    background-color: var(--accent, #6366f1);
  }

  .toggle-label input:checked + .toggle-switch::after {
    transform: translateX(20px);
  }

  .no-parameters {
    text-align: center;
    padding: 2rem;
    background-color: var(--bg-secondary, #f8f9fa);
    border-radius: var(--radius-lg, 0.5rem);
    margin-bottom: 1.5rem;
  }

  .no-parameters p {
    color: var(--text-secondary, #4b5563);
    margin: 0;
  }

  .no-parameters .hint {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
    margin-top: 0.5rem;
  }

  .strategy-summary {
    background-color: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    padding: 1rem;
    margin-top: 1.5rem;
  }

  .strategy-summary h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.75rem 0;
  }

  .strategy-summary dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.375rem 1rem;
    margin: 0;
  }

  .strategy-summary dt {
    font-size: 0.8125rem;
    color: var(--text-muted, #6b7280);
  }

  .strategy-summary dd {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
    margin: 0;
  }

  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr;
    }

    .template-grid {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
      gap: 0.75rem;
    }

    .right-actions {
      flex-direction: column;
    }

    .back-button,
    .cancel-button,
    .next-button,
    .submit-button {
      width: 100%;
    }
  }
`;
