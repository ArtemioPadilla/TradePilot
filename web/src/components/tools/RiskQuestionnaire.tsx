import { useState } from 'react';

interface Question {
  id: string;
  text: string;
  options: { label: string; score: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'q1', text: 'How would you react if your portfolio dropped 20% in a month?',
    options: [
      { label: 'Sell everything immediately', score: 1 },
      { label: 'Sell some positions', score: 2 },
      { label: 'Hold and wait', score: 3 },
      { label: 'Buy more at lower prices', score: 4 },
    ],
  },
  {
    id: 'q2', text: 'What is your primary investment goal?',
    options: [
      { label: 'Preserve capital', score: 1 },
      { label: 'Generate steady income', score: 2 },
      { label: 'Balanced growth and income', score: 3 },
      { label: 'Maximize long-term growth', score: 4 },
    ],
  },
  {
    id: 'q3', text: 'How long do you plan to keep your money invested?',
    options: [
      { label: 'Less than 2 years', score: 1 },
      { label: '2-5 years', score: 2 },
      { label: '5-10 years', score: 3 },
      { label: 'More than 10 years', score: 4 },
    ],
  },
  {
    id: 'q4', text: 'How much investment experience do you have?',
    options: [
      { label: 'None', score: 1 },
      { label: 'Some — basic stocks/bonds', score: 2 },
      { label: 'Moderate — diversified portfolio', score: 3 },
      { label: 'Extensive — options, alternatives, etc.', score: 4 },
    ],
  },
  {
    id: 'q5', text: 'What percentage of your monthly income can you invest?',
    options: [
      { label: 'Less than 5%', score: 1 },
      { label: '5-10%', score: 2 },
      { label: '10-20%', score: 3 },
      { label: 'More than 20%', score: 4 },
    ],
  },
  {
    id: 'q6', text: 'How would you describe your income stability?',
    options: [
      { label: 'Unstable / variable', score: 1 },
      { label: 'Somewhat stable', score: 2 },
      { label: 'Stable', score: 3 },
      { label: 'Very stable with growth potential', score: 4 },
    ],
  },
  {
    id: 'q7', text: 'Which portfolio would you prefer?',
    options: [
      { label: 'Avg +3% / worst -2%', score: 1 },
      { label: 'Avg +6% / worst -8%', score: 2 },
      { label: 'Avg +9% / worst -18%', score: 3 },
      { label: 'Avg +12% / worst -30%', score: 4 },
    ],
  },
  {
    id: 'q8', text: 'Do you have an emergency fund covering 3-6 months of expenses?',
    options: [
      { label: 'No', score: 1 },
      { label: 'Partially', score: 2 },
      { label: 'Yes, 3 months', score: 3 },
      { label: 'Yes, 6+ months', score: 4 },
    ],
  },
  {
    id: 'q9', text: 'How important is it to avoid any loss of principal?',
    options: [
      { label: 'Extremely important', score: 1 },
      { label: 'Very important', score: 2 },
      { label: 'Somewhat important', score: 3 },
      { label: 'Not very important', score: 4 },
    ],
  },
  {
    id: 'q10', text: 'How do you feel about investing in volatile assets like crypto or small-cap stocks?',
    options: [
      { label: 'Would never consider it', score: 1 },
      { label: 'Only a very small amount', score: 2 },
      { label: 'Comfortable with a moderate allocation', score: 3 },
      { label: 'Excited — higher risk, higher reward', score: 4 },
    ],
  },
];

type RiskCategory = 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive';

interface RiskResult {
  score: number;
  category: RiskCategory;
  label: string;
  allocation: { stocks: number; bonds: number; cash: number; alternatives: number };
}

function calculateResult(answers: Record<string, number>): RiskResult | null {
  const values = Object.values(answers);
  if (values.length < QUESTIONS.length) return null;
  const score = values.reduce((a, b) => a + b, 0);
  const maxScore = QUESTIONS.length * 4;
  const pct = score / maxScore;

  if (pct <= 0.35) return { score, category: 'conservative', label: 'Conservative', allocation: { stocks: 25, bonds: 50, cash: 20, alternatives: 5 } };
  if (pct <= 0.55) return { score, category: 'moderate', label: 'Moderate', allocation: { stocks: 50, bonds: 30, cash: 10, alternatives: 10 } };
  if (pct <= 0.75) return { score, category: 'aggressive', label: 'Aggressive', allocation: { stocks: 70, bonds: 15, cash: 5, alternatives: 10 } };
  return { score, category: 'very_aggressive', label: 'Very Aggressive', allocation: { stocks: 85, bonds: 5, cash: 0, alternatives: 10 } };
}

const CATEGORY_COLORS: Record<string, string> = {
  stocks: '#6366f1',
  bonds: '#06b6d4',
  cash: '#16a34a',
  alternatives: '#f59e0b',
};

export function RiskQuestionnaire() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);

  const result = calculateResult(answers);
  const progress = (Object.keys(answers).length / QUESTIONS.length) * 100;

  const handleAnswer = (questionId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentQ(0);
  };

  return (
    <div className="calculator" data-testid="risk-questionnaire">
      <div className="calculator-header">
        <h3>Risk Assessment</h3>
        <p>Answer 10 questions to determine your risk tolerance</p>
      </div>

      {!result ? (
        <div className="questionnaire">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress-text">Question {currentQ + 1} of {QUESTIONS.length}</p>

          <div className="question-card">
            <h4>{QUESTIONS[currentQ].text}</h4>
            <div className="options">
              {QUESTIONS[currentQ].options.map((opt) => (
                <button
                  key={opt.score}
                  className={`option-btn ${answers[QUESTIONS[currentQ].id] === opt.score ? 'selected' : ''}`}
                  onClick={() => handleAnswer(QUESTIONS[currentQ].id, opt.score)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="nav-buttons">
            <button className="nav-btn" disabled={currentQ === 0}
              onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}>Previous</button>
            <button className="nav-btn" disabled={currentQ >= QUESTIONS.length - 1 || !answers[QUESTIONS[currentQ].id]}
              onClick={() => setCurrentQ((p) => Math.min(QUESTIONS.length - 1, p + 1))}>Next</button>
          </div>
        </div>
      ) : (
        <div className="risk-result" data-testid="risk-result">
          <div className="result-card highlight">
            <span className="result-label">Your Risk Profile</span>
            <span className="result-value">{result.label}</span>
            <span className="result-label">Score: {result.score} / {QUESTIONS.length * 4}</span>
          </div>

          <div className="allocation-section">
            <h4>Recommended Allocation</h4>
            <div className="pie-visual">
              {Object.entries(result.allocation).filter(([, v]) => v > 0).map(([key, val]) => (
                <div key={key} className="alloc-item">
                  <div className="alloc-bar-track">
                    <div className="alloc-bar-fill" style={{
                      width: `${val}%`,
                      backgroundColor: CATEGORY_COLORS[key] || '#6b7280',
                    }} />
                  </div>
                  <span className="alloc-label">
                    <span className="alloc-dot" style={{ backgroundColor: CATEGORY_COLORS[key] || '#6b7280' }} />
                    {key.charAt(0).toUpperCase() + key.slice(1)}: {val}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button className="nav-btn retake" onClick={handleReset}>Retake Assessment</button>
        </div>
      )}

      <style>{riskStyles}</style>
    </div>
  );
}

const riskStyles = `
  .questionnaire { display: flex; flex-direction: column; gap: 1rem; }
  .progress-bar {
    height: 6px; background: var(--bg-tertiary, #f3f4f6);
    border-radius: 3px; overflow: hidden;
  }
  .progress-fill {
    height: 100%; background: var(--accent, #6366f1);
    transition: width 0.3s ease; border-radius: 3px;
  }
  .progress-text { font-size: 0.75rem; color: var(--text-muted, #6b7280); margin: 0; }
  .question-card {
    padding: 1.25rem; background: var(--bg-primary, white);
    border: 1px solid var(--border, #e5e7eb); border-radius: var(--radius-md, 0.375rem);
  }
  .question-card h4 {
    font-size: 1rem; font-weight: 600; color: var(--text-primary, #111827);
    margin: 0 0 1rem 0;
  }
  .options { display: flex; flex-direction: column; gap: 0.5rem; }
  .option-btn {
    padding: 0.75rem 1rem; text-align: left; background: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border, #e5e7eb); border-radius: var(--radius-md, 0.375rem);
    cursor: pointer; font-size: 0.875rem; color: var(--text-primary, #111827);
    transition: all 0.15s ease;
  }
  .option-btn:hover { border-color: var(--accent, #6366f1); }
  .option-btn.selected {
    background: rgba(99,102,241,0.1); border-color: var(--accent, #6366f1);
    color: var(--accent, #6366f1); font-weight: 500;
  }
  .nav-buttons { display: flex; gap: 0.75rem; justify-content: space-between; }
  .nav-btn {
    padding: 0.5rem 1.25rem; border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem); background: var(--bg-primary, white);
    cursor: pointer; font-size: 0.875rem; color: var(--text-primary, #111827);
  }
  .nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .nav-btn.retake {
    margin-top: 1rem; width: 100%; text-align: center;
    background: var(--bg-secondary, #f8f9fa);
  }
  .risk-result { display: flex; flex-direction: column; gap: 1rem; }
  .allocation-section {
    padding: 1rem; background: var(--bg-primary, white);
    border: 1px solid var(--border, #e5e7eb); border-radius: var(--radius-md, 0.375rem);
  }
  .allocation-section h4 {
    font-size: 0.875rem; font-weight: 600; color: var(--text-primary, #111827);
    margin: 0 0 0.75rem 0;
  }
  .pie-visual { display: flex; flex-direction: column; gap: 0.5rem; }
  .alloc-item { display: flex; flex-direction: column; gap: 0.25rem; }
  .alloc-bar-track {
    height: 8px; background: var(--bg-tertiary, #f3f4f6);
    border-radius: 4px; overflow: hidden;
  }
  .alloc-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
  .alloc-label {
    font-size: 0.75rem; color: var(--text-muted, #6b7280);
    display: flex; align-items: center; gap: 0.375rem;
  }
  .alloc-dot {
    display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  }
`;

export default RiskQuestionnaire;
