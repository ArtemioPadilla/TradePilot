import { useState, useMemo } from 'react';

interface AllocInput {
  age: number;
  riskScore: number; // 1-10
  timeHorizon: number; // years
  goal: 'retirement' | 'growth' | 'income' | 'preservation';
}

interface Allocation {
  stocks: number;
  bonds: number;
  cash: number;
  alternatives: number;
}

interface CommonPortfolio {
  name: string;
  allocation: Allocation;
  description: string;
}

const COMMON_PORTFOLIOS: CommonPortfolio[] = [
  { name: '60/40', allocation: { stocks: 60, bonds: 40, cash: 0, alternatives: 0 }, description: 'Classic balanced portfolio' },
  { name: 'All-Weather', allocation: { stocks: 30, bonds: 40, cash: 7.5, alternatives: 22.5 }, description: 'Ray Dalio inspired, all conditions' },
  { name: 'Three-Fund', allocation: { stocks: 70, bonds: 25, cash: 5, alternatives: 0 }, description: 'Bogleheads simple approach' },
  { name: 'Aggressive Growth', allocation: { stocks: 90, bonds: 5, cash: 0, alternatives: 5 }, description: 'Maximum equity exposure' },
];

const COLORS: Record<string, string> = {
  stocks: '#6366f1',
  bonds: '#06b6d4',
  cash: '#16a34a',
  alternatives: '#f59e0b',
};

function computeAllocation(input: AllocInput): Allocation {
  // Age-based equity guideline: 110 - age
  const ageEquity = Math.max(20, Math.min(90, 110 - input.age));
  // Risk adjustment: scale 1-10 mapped to 0.5 - 1.5 multiplier
  const riskMult = 0.5 + (input.riskScore / 10);
  // Time horizon bonus: longer = more equity
  const timeMult = input.timeHorizon >= 20 ? 1.15 : input.timeHorizon >= 10 ? 1.05 : input.timeHorizon >= 5 ? 1.0 : 0.85;
  // Goal adjustment
  const goalAdj: Record<string, number> = { retirement: 0, growth: 5, income: -10, preservation: -20 };

  let stocks = Math.round(ageEquity * riskMult * timeMult + (goalAdj[input.goal] || 0));
  stocks = Math.max(10, Math.min(95, stocks));

  let alternatives = input.riskScore >= 7 ? 10 : input.riskScore >= 4 ? 5 : 0;
  let cash = input.goal === 'preservation' ? 15 : input.timeHorizon < 5 ? 10 : 5;
  let bonds = 100 - stocks - alternatives - cash;

  if (bonds < 0) {
    cash = Math.max(0, cash + bonds);
    bonds = 0;
  }

  // Normalize
  const total = stocks + bonds + cash + alternatives;
  return {
    stocks: Math.round((stocks / total) * 100),
    bonds: Math.round((bonds / total) * 100),
    cash: Math.round((cash / total) * 100),
    alternatives: 100 - Math.round((stocks / total) * 100) - Math.round((bonds / total) * 100) - Math.round((cash / total) * 100),
  };
}

function PieChart({ allocation }: { allocation: Allocation }) {
  const entries = Object.entries(allocation).filter(([, v]) => v > 0);
  let cumulative = 0;
  const segments = entries.map(([key, val]) => {
    const start = cumulative;
    cumulative += val;
    return { key, val, start, end: cumulative };
  });

  const toCoords = (pct: number) => {
    const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2;
    return { x: 50 + 40 * Math.cos(angle), y: 50 + 40 * Math.sin(angle) };
  };

  return (
    <div className="pie-container">
      <svg viewBox="0 0 100 100" width="160" height="160">
        {segments.map(({ key, val, start, end }) => {
          if (val >= 100) return <circle key={key} cx="50" cy="50" r="40" fill={COLORS[key]} />;
          const s = toCoords(start);
          const e = toCoords(end);
          const large = val > 50 ? 1 : 0;
          return (
            <path key={key}
              d={`M50,50 L${s.x},${s.y} A40,40 0 ${large},1 ${e.x},${e.y} Z`}
              fill={COLORS[key] || '#6b7280'} />
          );
        })}
      </svg>
      <div className="pie-legend">
        {entries.map(([key, val]) => (
          <span key={key} className="alloc-label">
            <span className="alloc-dot" style={{ backgroundColor: COLORS[key] || '#6b7280' }} />
            {key.charAt(0).toUpperCase() + key.slice(1)}: {val}%
          </span>
        ))}
      </div>
    </div>
  );
}

export function AllocationRecommender() {
  const [input, setInput] = useState<AllocInput>({
    age: 35,
    riskScore: 6,
    timeHorizon: 20,
    goal: 'retirement',
  });

  const recommended = useMemo(() => computeAllocation(input), [input]);

  const handleChange = (field: keyof AllocInput, value: string | number) => {
    setInput((prev) => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'goal' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="calculator" data-testid="allocation-recommender">
      <div className="calculator-header">
        <h3>Allocation Recommender</h3>
        <p>Get a personalized asset allocation based on your profile</p>
      </div>

      <div className="calculator-grid">
        <div className="calculator-inputs">
          <div className="input-group">
            <label htmlFor="alloc-age">Age</label>
            <input id="alloc-age" type="number" value={input.age}
              onChange={(e) => handleChange('age', e.target.value)} min={18} max={90} />
          </div>

          <div className="input-group">
            <label htmlFor="alloc-risk">Risk Score (1-10)</label>
            <input id="alloc-risk" type="range" value={input.riskScore}
              onChange={(e) => handleChange('riskScore', e.target.value)}
              min={1} max={10} step={1} />
            <div className="range-labels">
              <span>Conservative</span>
              <span>{input.riskScore}/10</span>
              <span>Aggressive</span>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="alloc-horizon">Time Horizon</label>
            <div className="input-with-suffix">
              <input id="alloc-horizon" type="number" value={input.timeHorizon}
                onChange={(e) => handleChange('timeHorizon', e.target.value)} min={1} max={50} />
              <span className="suffix">years</span>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="alloc-goal">Primary Goal</label>
            <select id="alloc-goal" value={input.goal}
              onChange={(e) => handleChange('goal', e.target.value)}>
              <option value="retirement">Retirement</option>
              <option value="growth">Growth</option>
              <option value="income">Income</option>
              <option value="preservation">Capital Preservation</option>
            </select>
          </div>
        </div>

        <div className="calculator-results">
          <h4 className="rec-title">Your Recommended Allocation</h4>
          <PieChart allocation={recommended} />

          <div className="comparison-section">
            <h4 className="rec-title">Compare with Common Portfolios</h4>
            <div className="comparison-grid">
              {COMMON_PORTFOLIOS.map((p) => (
                <div key={p.name} className="comparison-card">
                  <strong>{p.name}</strong>
                  <span className="comparison-desc">{p.description}</span>
                  <div className="comparison-bars">
                    {Object.entries(p.allocation).filter(([, v]) => v > 0).map(([k, v]) => (
                      <div key={k} className="mini-bar" style={{
                        width: `${v}%`,
                        backgroundColor: COLORS[k] || '#6b7280',
                      }} title={`${k}: ${v}%`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{allocStyles}</style>
    </div>
  );
}

const allocStyles = `
  .rec-title {
    font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827);
    margin: 0 0 0.75rem 0;
  }
  .pie-container { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .pie-legend { display: flex; flex-direction: column; gap: 0.375rem; }
  .alloc-label {
    font-size: 0.75rem; color: var(--text-muted, #6b7280);
    display: flex; align-items: center; gap: 0.375rem;
  }
  .alloc-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
  .range-labels {
    display: flex; justify-content: space-between; font-size: 0.7rem;
    color: var(--text-muted, #6b7280);
  }
  input[type="range"] {
    width: 100%; accent-color: var(--accent, #6366f1);
  }
  .comparison-section { margin-top: 1rem; }
  .comparison-grid { display: flex; flex-direction: column; gap: 0.5rem; }
  .comparison-card {
    padding: 0.75rem; background: var(--bg-primary, white);
    border: 1px solid var(--border, #e5e7eb); border-radius: var(--radius-md, 0.375rem);
    display: flex; flex-direction: column; gap: 0.25rem;
  }
  .comparison-card strong { font-size: 0.8125rem; color: var(--text-primary, #111827); }
  .comparison-desc { font-size: 0.7rem; color: var(--text-muted, #6b7280); }
  .comparison-bars { display: flex; height: 6px; border-radius: 3px; overflow: hidden; margin-top: 0.25rem; }
  .mini-bar { height: 100%; }
`;

export default AllocationRecommender;
