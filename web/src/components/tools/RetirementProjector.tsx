import { useState, useMemo } from 'react';
import { formatCurrency } from '../../lib/utils/calculators';

interface RetirementInput {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  expectedReturn: number;
  inflationRate: number;
}

interface Scenario {
  ages: number[];
  balances: number[];
}

function runMonteCarlo(input: RetirementInput, numScenarios: number = 100): Scenario[] {
  const years = input.retirementAge - input.currentAge;
  if (years <= 0) return [];

  const scenarios: Scenario[] = [];
  const meanReturn = input.expectedReturn / 100;
  const volatility = meanReturn * 0.8;

  for (let s = 0; s < numScenarios; s++) {
    let balance = input.currentSavings;
    const ages: number[] = [input.currentAge];
    const balances: number[] = [balance];

    for (let y = 1; y <= years; y++) {
      // Simple normal approximation using Box-Muller
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const yearReturn = meanReturn + volatility * z;

      balance = balance * (1 + yearReturn) + input.monthlyContribution * 12;
      ages.push(input.currentAge + y);
      balances.push(Math.max(0, balance));
    }
    scenarios.push({ ages, balances });
  }
  return scenarios;
}

function getPercentile(scenarios: Scenario[], yearIndex: number, pct: number): number {
  const values = scenarios.map((s) => s.balances[yearIndex]).sort((a, b) => a - b);
  const idx = Math.floor(values.length * (pct / 100));
  return values[Math.min(idx, values.length - 1)];
}

export function RetirementProjector() {
  const [input, setInput] = useState<RetirementInput>({
    currentAge: 30,
    retirementAge: 65,
    currentSavings: 50000,
    monthlyContribution: 1000,
    expectedReturn: 7,
    inflationRate: 3,
  });

  const scenarios = useMemo(() => runMonteCarlo(input, 100), [input]);

  const years = input.retirementAge - input.currentAge;
  const p10 = years > 0 ? getPercentile(scenarios, years, 10) : 0;
  const p50 = years > 0 ? getPercentile(scenarios, years, 50) : 0;
  const p90 = years > 0 ? getPercentile(scenarios, years, 90) : 0;

  const successThreshold = input.monthlyContribution * 12 * 25;
  const successCount = scenarios.filter((s) => s.balances[s.balances.length - 1] >= successThreshold).length;
  const successPct = scenarios.length > 0 ? Math.round((successCount / scenarios.length) * 100) : 0;

  const maxVal = years > 0 ? getPercentile(scenarios, years, 95) : 1;

  const chartPoints = years > 0
    ? Array.from({ length: years + 1 }, (_, i) => ({
        age: input.currentAge + i,
        p10: getPercentile(scenarios, i, 10),
        p50: getPercentile(scenarios, i, 50),
        p90: getPercentile(scenarios, i, 90),
      }))
    : [];

  const handleChange = (field: keyof RetirementInput, value: string) => {
    setInput((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  return (
    <div className="calculator" data-testid="retirement-projector">
      <div className="calculator-header">
        <h3>Retirement Projector</h3>
        <p>Monte Carlo simulation of your retirement savings</p>
      </div>

      <div className="calculator-grid">
        <div className="calculator-inputs">
          <div className="input-group">
            <label htmlFor="ret-current-age">Current Age</label>
            <input id="ret-current-age" type="number" value={input.currentAge}
              onChange={(e) => handleChange('currentAge', e.target.value)} min={18} max={80} />
          </div>
          <div className="input-group">
            <label htmlFor="ret-retirement-age">Retirement Age</label>
            <input id="ret-retirement-age" type="number" value={input.retirementAge}
              onChange={(e) => handleChange('retirementAge', e.target.value)} min={input.currentAge + 1} max={100} />
          </div>
          <div className="input-group">
            <label htmlFor="ret-savings">Current Savings</label>
            <div className="input-with-prefix">
              <span className="prefix">$</span>
              <input id="ret-savings" type="number" value={input.currentSavings}
                onChange={(e) => handleChange('currentSavings', e.target.value)} min={0} step={5000} />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="ret-monthly">Monthly Contribution</label>
            <div className="input-with-prefix">
              <span className="prefix">$</span>
              <input id="ret-monthly" type="number" value={input.monthlyContribution}
                onChange={(e) => handleChange('monthlyContribution', e.target.value)} min={0} step={100} />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="ret-return">Expected Return</label>
            <div className="input-with-suffix">
              <input id="ret-return" type="number" value={input.expectedReturn}
                onChange={(e) => handleChange('expectedReturn', e.target.value)} min={0} max={20} step={0.5} />
              <span className="suffix">%</span>
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="ret-inflation">Inflation Rate</label>
            <div className="input-with-suffix">
              <input id="ret-inflation" type="number" value={input.inflationRate}
                onChange={(e) => handleChange('inflationRate', e.target.value)} min={0} max={10} step={0.5} />
              <span className="suffix">%</span>
            </div>
          </div>
        </div>

        <div className="calculator-results">
          <div className="result-card highlight">
            <span className="result-label">Success Probability</span>
            <span className="result-value">{successPct}%</span>
          </div>

          <div className="result-breakdown">
            <div className="result-card">
              <span className="result-label">10th Percentile</span>
              <span className="result-value">{formatCurrency(p10)}</span>
            </div>
            <div className="result-card">
              <span className="result-label">Median (50th)</span>
              <span className="result-value">{formatCurrency(p50)}</span>
            </div>
          </div>
          <div className="result-card">
            <span className="result-label">90th Percentile</span>
            <span className="result-value positive">{formatCurrency(p90)}</span>
          </div>

          <div className="growth-chart" data-testid="retirement-chart">
            <div className="chart-header"><span>Projected Range (100 scenarios)</span></div>
            <div className="projection-bars">
              {chartPoints
                .filter((_, i) => i % Math.max(1, Math.ceil(years / 10)) === 0 || i === years)
                .map((pt) => (
                  <div key={pt.age} className="projection-bar-group">
                    <div className="projection-bar-track">
                      <div className="projection-bar-range" style={{
                        bottom: `${(pt.p10 / maxVal) * 100}%`,
                        height: `${((pt.p90 - pt.p10) / maxVal) * 100}%`,
                      }} />
                      <div className="projection-bar-median" style={{
                        bottom: `${(pt.p50 / maxVal) * 100}%`,
                      }} />
                    </div>
                    <span className="chart-label">{pt.age}</span>
                  </div>
                ))}
            </div>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-color range" />10th-90th</span>
              <span className="legend-item"><span className="legend-color median" />Median</span>
            </div>
          </div>
        </div>
      </div>

      <style>{retirementStyles}</style>
    </div>
  );
}

const retirementStyles = `
  .projection-bars {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    height: 120px;
    padding-bottom: 1.5rem;
    position: relative;
  }
  .projection-bar-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    position: relative;
  }
  .projection-bar-track {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .projection-bar-range {
    position: absolute;
    left: 20%;
    right: 20%;
    background-color: rgba(99, 102, 241, 0.25);
    border-radius: 2px;
  }
  .projection-bar-median {
    position: absolute;
    left: 10%;
    right: 10%;
    height: 3px;
    background-color: var(--accent, #6366f1);
    border-radius: 1px;
  }
  .legend-color.range {
    background-color: rgba(99, 102, 241, 0.25);
  }
  .legend-color.median {
    background-color: var(--accent, #6366f1);
  }
`;

export default RetirementProjector;
