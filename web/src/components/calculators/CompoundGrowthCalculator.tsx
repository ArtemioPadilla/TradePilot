/**
 * Compound Growth Calculator Component
 *
 * Interactive calculator for projecting investment growth over time.
 */

import { useState, useMemo } from 'react';
import type { CompoundGrowthInput, CompoundGrowthResult } from '../../types/reports';
import { calculateCompoundGrowth, formatCurrency } from '../../lib/utils/calculators';

export function CompoundGrowthCalculator() {
  const [input, setInput] = useState<CompoundGrowthInput>({
    initialInvestment: 10000,
    monthlyContribution: 500,
    annualReturnRate: 7,
    years: 20,
    compoundingFrequency: 'monthly',
  });

  const result = useMemo(() => calculateCompoundGrowth(input), [input]);

  const handleInputChange = (field: keyof CompoundGrowthInput, value: string | number) => {
    setInput((prev) => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="calculator" data-testid="compound-growth-calculator">
      <div className="calculator-header">
        <h3>Compound Growth Calculator</h3>
        <p>See how your investments can grow over time</p>
      </div>

      <div className="calculator-grid">
        <div className="calculator-inputs">
          <div className="input-group">
            <label htmlFor="initial-investment">Initial Investment</label>
            <div className="input-with-prefix">
              <span className="prefix">$</span>
              <input
                id="initial-investment"
                type="number"
                value={input.initialInvestment}
                onChange={(e) => handleInputChange('initialInvestment', e.target.value)}
                min={0}
                step={1000}
                data-testid="input-initial"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="monthly-contribution">Monthly Contribution</label>
            <div className="input-with-prefix">
              <span className="prefix">$</span>
              <input
                id="monthly-contribution"
                type="number"
                value={input.monthlyContribution}
                onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
                min={0}
                step={100}
                data-testid="input-monthly"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="return-rate">Expected Annual Return</label>
            <div className="input-with-suffix">
              <input
                id="return-rate"
                type="number"
                value={input.annualReturnRate}
                onChange={(e) => handleInputChange('annualReturnRate', e.target.value)}
                min={0}
                max={30}
                step={0.5}
                data-testid="input-return"
              />
              <span className="suffix">%</span>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="years">Time Period</label>
            <div className="input-with-suffix">
              <input
                id="years"
                type="number"
                value={input.years}
                onChange={(e) => handleInputChange('years', e.target.value)}
                min={1}
                max={50}
                step={1}
                data-testid="input-years"
              />
              <span className="suffix">years</span>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="compounding">Compounding Frequency</label>
            <select
              id="compounding"
              value={input.compoundingFrequency}
              onChange={(e) =>
                handleInputChange(
                  'compoundingFrequency',
                  e.target.value as CompoundGrowthInput['compoundingFrequency']
                )
              }
              data-testid="input-frequency"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
        </div>

        <div className="calculator-results">
          <div className="result-card highlight" data-testid="result-final">
            <span className="result-label">Future Value</span>
            <span className="result-value">{formatCurrency(result.finalValue)}</span>
          </div>

          <div className="result-breakdown">
            <div className="result-card" data-testid="result-contributions">
              <span className="result-label">Total Contributions</span>
              <span className="result-value">{formatCurrency(result.totalContributions)}</span>
            </div>

            <div className="result-card" data-testid="result-interest">
              <span className="result-label">Interest Earned</span>
              <span className="result-value positive">
                {formatCurrency(result.totalInterestEarned)}
              </span>
            </div>
          </div>

          <div className="growth-chart" data-testid="growth-chart">
            <div className="chart-header">
              <span>Growth Over Time</span>
            </div>
            <div className="chart-bars">
              {result.yearlyBreakdown
                .filter((_, i) => i % Math.ceil(input.years / 10) === 0 || i === input.years - 1)
                .map((year) => (
                  <div key={year.year} className="chart-bar-container">
                    <div
                      className="chart-bar"
                      style={{
                        height: `${(year.endBalance / result.finalValue) * 100}%`,
                      }}
                    >
                      <div
                        className="bar-contributions"
                        style={{
                          height: `${
                            ((input.initialInvestment + year.contributions * year.year) /
                              year.endBalance) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="chart-label">Y{year.year}</span>
                  </div>
                ))}
            </div>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-color contributions" />
                Contributions
              </span>
              <span className="legend-item">
                <span className="legend-color interest" />
                Interest
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .calculator {
    background-color: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    padding: 1.5rem;
  }

  .calculator-header {
    margin-bottom: 1.5rem;
  }

  .calculator-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.25rem 0;
  }

  .calculator-header p {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
    margin: 0;
  }

  .calculator-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 768px) {
    .calculator-grid {
      grid-template-columns: 1fr;
    }
  }

  .calculator-inputs {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .input-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .input-with-prefix,
  .input-with-suffix {
    display: flex;
    align-items: center;
    background-color: var(--bg-primary, white);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    overflow: hidden;
  }

  .input-with-prefix:focus-within,
  .input-with-suffix:focus-within {
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }

  .prefix,
  .suffix {
    padding: 0.5rem 0.75rem;
    background-color: var(--bg-tertiary, #f3f4f6);
    color: var(--text-muted, #6b7280);
    font-size: 0.875rem;
  }

  .input-with-prefix input,
  .input-with-suffix input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: none;
    outline: none;
    font-size: 0.875rem;
  }

  .input-group select {
    padding: 0.5rem 0.75rem;
    background-color: var(--bg-primary, white);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    cursor: pointer;
  }

  .calculator-results {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .result-card {
    padding: 1rem;
    background-color: var(--bg-primary, white);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
  }

  .result-card.highlight {
    background: linear-gradient(135deg, var(--accent, #6366f1), var(--accent-hover, #4f46e5));
    border: none;
    color: white;
  }

  .result-label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    margin-bottom: 0.25rem;
  }

  .result-card.highlight .result-label {
    opacity: 0.9;
  }

  .result-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .result-breakdown {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .result-breakdown .result-value {
    font-size: 1.125rem;
  }

  .result-value.positive {
    color: #16a34a;
  }

  .growth-chart {
    padding: 1rem;
    background-color: var(--bg-primary, white);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
  }

  .chart-header {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.025em;
    margin-bottom: 0.75rem;
  }

  .chart-bars {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    height: 120px;
    padding-bottom: 1.5rem;
  }

  .chart-bar-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .chart-bar {
    width: 100%;
    background-color: var(--accent, #6366f1);
    border-radius: 2px 2px 0 0;
    position: relative;
    overflow: hidden;
  }

  .bar-contributions {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #a5b4fc;
  }

  .chart-label {
    font-size: 0.625rem;
    color: var(--text-muted, #6b7280);
    margin-top: 0.25rem;
    position: absolute;
    bottom: 0;
  }

  .chart-legend {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 0.5rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }

  .legend-color.contributions {
    background-color: #a5b4fc;
  }

  .legend-color.interest {
    background-color: var(--accent, #6366f1);
  }
`;

export default CompoundGrowthCalculator;
