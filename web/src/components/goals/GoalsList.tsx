/**
 * Goals List Component
 *
 * Displays and manages financial goals with progress tracking.
 */

import { useState, useEffect } from 'react';
import type { Goal, GoalProgress, GoalFormData, GoalCategory } from '../../types/reports';
import { getGoalCategoryIcon, getGoalCategoryName } from '../../types/reports';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  calculateGoalProgress,
} from '../../lib/services/goals';
import { formatCurrency } from '../../lib/utils/calculators';

export function GoalsList() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (err) {
      setError('Failed to load goals');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async (formData: GoalFormData) => {
    try {
      const newGoal = await createGoal(formData);
      setGoals((prev) => [...prev, newGoal]);
      setShowForm(false);
    } catch (err) {
      setError('Failed to create goal');
    }
  };

  const handleUpdateGoal = async (goalId: string, formData: Partial<GoalFormData>) => {
    try {
      await updateGoal(goalId, formData);
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, ...formData } : g))
      );
      setEditingGoal(null);
    } catch (err) {
      setError('Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (err) {
      setError('Failed to delete goal');
    }
  };

  const handleUpdateProgress = async (goalId: string, amount: number) => {
    try {
      await updateGoal(goalId, { currentAmount: amount });
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, currentAmount: amount } : g))
      );
    } catch (err) {
      setError('Failed to update progress');
    }
  };

  if (isLoading) {
    return (
      <div className="goals-list" data-testid="goals-list">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading goals...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="goals-list" data-testid="goals-list">
      <div className="goals-header">
        <div>
          <h2>Financial Goals</h2>
          <p>Track your progress toward financial milestones</p>
        </div>
        <button
          className="add-goal-button"
          onClick={() => setShowForm(true)}
          data-testid="add-goal-button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Goal
        </button>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {showForm && (
        <GoalForm
          onSubmit={handleCreateGoal}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingGoal && (
        <GoalForm
          goal={editingGoal}
          onSubmit={(data) => handleUpdateGoal(editingGoal.id, data)}
          onCancel={() => setEditingGoal(null)}
        />
      )}

      {goals.length === 0 ? (
        <div className="empty-state" data-testid="empty-goals">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h3>No goals yet</h3>
          <p>Create your first financial goal to start tracking your progress</p>
          <button className="primary-button" onClick={() => setShowForm(true)}>
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="goals-grid" data-testid="goals-grid">
          {goals.map((goal) => {
            const progress = calculateGoalProgress(goal);
            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                progress={progress}
                onEdit={() => setEditingGoal(goal)}
                onDelete={() => handleDeleteGoal(goal.id)}
                onUpdateProgress={(amount) => handleUpdateProgress(goal.id, amount)}
              />
            );
          })}
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  progress: GoalProgress;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateProgress: (amount: number) => void;
}

function GoalCard({ goal, progress, onEdit, onDelete, onUpdateProgress }: GoalCardProps) {
  const [showUpdateInput, setShowUpdateInput] = useState(false);
  const [newAmount, setNewAmount] = useState(goal.currentAmount);

  const handleSubmitProgress = () => {
    onUpdateProgress(newAmount);
    setShowUpdateInput(false);
  };

  return (
    <div className={`goal-card ${progress.onTrack ? 'on-track' : 'off-track'}`} data-testid={`goal-${goal.id}`}>
      <div className="goal-header">
        <span className="goal-icon">{getGoalCategoryIcon(goal.category)}</span>
        <div className="goal-info">
          <h4>{goal.name}</h4>
          <span className="goal-category">{getGoalCategoryName(goal.category)}</span>
        </div>
        <div className="goal-actions">
          <button className="icon-button" onClick={onEdit} aria-label="Edit goal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="icon-button danger" onClick={onDelete} aria-label="Delete goal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="goal-progress">
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${Math.min(100, progress.percentComplete)}%` }}
          />
        </div>
        <div className="progress-stats">
          <span className="current">{formatCurrency(goal.currentAmount)}</span>
          <span className="separator">/</span>
          <span className="target">{formatCurrency(goal.targetAmount)}</span>
        </div>
        <span className="progress-percent">{progress.percentComplete.toFixed(1)}%</span>
      </div>

      <div className="goal-details">
        <div className="detail">
          <span className="label">Remaining</span>
          <span className="value">{formatCurrency(progress.amountRemaining)}</span>
        </div>
        <div className="detail">
          <span className="label">Days Left</span>
          <span className="value">{progress.daysRemaining}</span>
        </div>
        <div className="detail">
          <span className="label">Required/Month</span>
          <span className="value">{formatCurrency(progress.requiredMonthlyContribution)}</span>
        </div>
      </div>

      <div className="goal-status">
        {progress.onTrack ? (
          <span className="status on-track">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            On Track
          </span>
        ) : (
          <span className="status off-track">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            Behind Schedule
          </span>
        )}
      </div>

      {showUpdateInput ? (
        <div className="update-progress-form">
          <input
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
            placeholder="Current amount"
          />
          <button className="save-btn" onClick={handleSubmitProgress}>Save</button>
          <button className="cancel-btn" onClick={() => setShowUpdateInput(false)}>Cancel</button>
        </div>
      ) : (
        <button
          className="update-progress-button"
          onClick={() => setShowUpdateInput(true)}
        >
          Update Progress
        </button>
      )}
    </div>
  );
}

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (data: GoalFormData) => void;
  onCancel: () => void;
}

function GoalForm({ goal, onSubmit, onCancel }: GoalFormProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    name: goal?.name || '',
    description: goal?.description || '',
    category: goal?.category || 'investment',
    targetAmount: goal?.targetAmount || 10000,
    targetDate: goal?.targetDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    monthlyContribution: goal?.monthlyContribution || 0,
  });

  const categories: GoalCategory[] = [
    'retirement',
    'emergency_fund',
    'home_purchase',
    'education',
    'vacation',
    'investment',
    'debt_payoff',
    'other',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="goal-form-overlay">
      <form className="goal-form" onSubmit={handleSubmit} data-testid="goal-form">
        <h3>{goal ? 'Edit Goal' : 'Create New Goal'}</h3>

        <div className="form-group">
          <label htmlFor="goal-name">Goal Name</label>
          <input
            id="goal-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            data-testid="goal-name-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="goal-category">Category</label>
          <select
            id="goal-category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value as GoalCategory })
            }
            data-testid="goal-category-select"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {getGoalCategoryIcon(cat)} {getGoalCategoryName(cat)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="goal-target">Target Amount</label>
            <input
              id="goal-target"
              type="number"
              value={formData.targetAmount}
              onChange={(e) =>
                setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })
              }
              required
              min={0}
              data-testid="goal-target-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-date">Target Date</label>
            <input
              id="goal-date"
              type="date"
              value={formData.targetDate.toISOString().split('T')[0]}
              onChange={(e) =>
                setFormData({ ...formData, targetDate: new Date(e.target.value) })
              }
              required
              data-testid="goal-date-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="goal-contribution">Monthly Contribution (optional)</label>
          <input
            id="goal-contribution"
            type="number"
            value={formData.monthlyContribution || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                monthlyContribution: parseFloat(e.target.value) || undefined,
              })
            }
            min={0}
            data-testid="goal-contribution-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="goal-description">Description (optional)</label>
          <textarea
            id="goal-description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            data-testid="goal-description-input"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="submit-button" data-testid="goal-submit">
            {goal ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = `
  .goals-list {
    padding: 1rem;
  }

  .goals-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .goals-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.25rem 0;
  }

  .goals-header p {
    color: var(--text-muted, #6b7280);
    font-size: 0.875rem;
    margin: 0;
  }

  .add-goal-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: var(--accent, #6366f1);
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .add-goal-button:hover {
    background-color: var(--accent-hover, #4f46e5);
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border, #e5e7eb);
    border-top-color: var(--accent, #6366f1);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-icon {
    color: var(--text-muted, #6b7280);
    opacity: 0.5;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .empty-state p {
    color: var(--text-muted, #6b7280);
    margin: 0 0 1.5rem 0;
  }

  .primary-button {
    padding: 0.625rem 1.25rem;
    background-color: var(--accent, #6366f1);
    border: none;
    border-radius: var(--radius-md, 0.375rem);
    color: white;
    font-weight: 500;
    cursor: pointer;
  }

  .error-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.2);
    border-radius: var(--radius-md, 0.375rem);
    color: #dc2626;
    margin-bottom: 1rem;
  }

  .error-banner button {
    background: none;
    border: none;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
  }

  .goals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }

  .goal-card {
    background-color: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    padding: 1rem;
  }

  .goal-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .goal-icon {
    font-size: 1.5rem;
  }

  .goal-info {
    flex: 1;
  }

  .goal-info h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.125rem 0;
  }

  .goal-category {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  .goal-actions {
    display: flex;
    gap: 0.25rem;
  }

  .icon-button {
    padding: 0.375rem;
    background: none;
    border: none;
    border-radius: var(--radius-sm, 0.25rem);
    color: var(--text-muted, #6b7280);
    cursor: pointer;
  }

  .icon-button:hover {
    background-color: var(--bg-tertiary, #f3f4f6);
    color: var(--text-primary, #111827);
  }

  .icon-button.danger:hover {
    background-color: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }

  .goal-progress {
    margin-bottom: 1rem;
  }

  .progress-bar-container {
    height: 8px;
    background-color: var(--border, #e5e7eb);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-bar {
    height: 100%;
    background-color: var(--accent, #6366f1);
    border-radius: 4px;
    transition: width 0.3s;
  }

  .goal-card.on-track .progress-bar {
    background-color: #16a34a;
  }

  .goal-card.off-track .progress-bar {
    background-color: #f59e0b;
  }

  .progress-stats {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    font-size: 0.875rem;
  }

  .progress-stats .current {
    font-weight: 600;
    color: var(--text-primary, #111827);
  }

  .progress-stats .separator {
    color: var(--text-muted, #6b7280);
  }

  .progress-stats .target {
    color: var(--text-muted, #6b7280);
  }

  .progress-percent {
    float: right;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
  }

  .goal-details {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background-color: var(--bg-primary, white);
    border-radius: var(--radius-md, 0.375rem);
  }

  .goal-details .detail {
    text-align: center;
  }

  .goal-details .label {
    display: block;
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: var(--text-muted, #6b7280);
    margin-bottom: 0.125rem;
  }

  .goal-details .value {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
  }

  .goal-status {
    margin-bottom: 0.75rem;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm, 0.25rem);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status.on-track {
    background-color: rgba(22, 163, 74, 0.1);
    color: #16a34a;
  }

  .status.off-track {
    background-color: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  .update-progress-button {
    width: 100%;
    padding: 0.5rem;
    background: none;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.8125rem;
    color: var(--text-primary, #111827);
    cursor: pointer;
  }

  .update-progress-button:hover {
    background-color: var(--bg-tertiary, #f3f4f6);
  }

  .update-progress-form {
    display: flex;
    gap: 0.5rem;
  }

  .update-progress-form input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.8125rem;
  }

  .update-progress-form .save-btn,
  .update-progress-form .cancel-btn {
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .update-progress-form .save-btn {
    background-color: var(--accent, #6366f1);
    border: none;
    color: white;
  }

  .update-progress-form .cancel-btn {
    background: none;
    border: 1px solid var(--border, #e5e7eb);
  }

  /* Goal Form Overlay */
  .goal-form-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
  }

  .goal-form {
    width: 100%;
    max-width: 480px;
    background-color: var(--bg-primary, white);
    border-radius: var(--radius-lg, 0.5rem);
    padding: 1.5rem;
    max-height: 90vh;
    overflow-y: auto;
  }

  .goal-form h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.375rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
  }

  .form-group textarea {
    resize: vertical;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }

  .cancel-button,
  .submit-button {
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .cancel-button {
    background: none;
    border: 1px solid var(--border, #e5e7eb);
    color: var(--text-primary, #111827);
  }

  .submit-button {
    background-color: var(--accent, #6366f1);
    border: none;
    color: white;
  }

  .submit-button:hover {
    background-color: var(--accent-hover, #4f46e5);
  }
`;

export default GoalsList;
