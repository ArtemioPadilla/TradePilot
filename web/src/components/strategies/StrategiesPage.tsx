import { appPath } from '../../lib/utils/paths';
/**
 * Strategies Page Component
 *
 * Container component that orchestrates the StrategiesList and StrategyCreationForm
 * components with proper state management and callbacks.
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase';
import { StrategiesList } from './StrategiesList';
import { StrategyCreationForm } from './StrategyCreationForm';
import type { Strategy, StrategyConfig, StrategyStatus } from '../../types/strategies';

type ViewState = 'list' | 'create' | 'edit';

export function StrategiesPage() {
  // Auth state
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // View state
  const [view, setView] = useState<ViewState>('list');
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  // Data state
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen to auth state
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadStrategies(user.uid);
      } else {
        setUserId(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle URL hash for direct navigation
  useEffect(() => {
    function handleHash() {
      if (window.location.hash === '#create') {
        setView('create');
      }
    }

    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const loadStrategies = async (uid: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual Firestore service call
      // For now, use mock data or empty array
      // const strategiesData = await getStrategies(uid);
      // setStrategies(strategiesData);
      setStrategies([]);
    } catch (error) {
      console.error('Failed to load strategies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = useCallback(() => {
    setEditingStrategy(null);
    setView('create');
    window.history.pushState(null, '', '#create');
  }, []);

  const handleEdit = useCallback((strategy: Strategy) => {
    setEditingStrategy(strategy);
    setView('edit');
  }, []);

  const handleCancel = useCallback(() => {
    setView('list');
    setEditingStrategy(null);
    window.history.pushState(null, '', window.location.pathname);
  }, []);

  const handleSubmit = useCallback(async (data: {
    name: string;
    description: string;
    config: StrategyConfig;
    tags: string[];
  }) => {
    if (!userId) return;

    setIsSubmitting(true);
    try {
      const now = new Date();

      if (editingStrategy) {
        // Update existing strategy
        const updatedStrategy: Strategy = {
          ...editingStrategy,
          ...data,
          updatedAt: now,
        };

        // TODO: Save to Firestore
        // await updateStrategy(userId, updatedStrategy);

        setStrategies(prev =>
          prev.map(s => s.id === editingStrategy.id ? updatedStrategy : s)
        );
      } else {
        // Create new strategy
        const newStrategy: Strategy = {
          id: `strategy_${Date.now()}`,
          userId,
          name: data.name,
          description: data.description,
          config: data.config,
          tags: data.tags,
          status: 'draft',
          isFavorite: false,
          isPublic: false,
          createdAt: now,
          updatedAt: now,
        };

        // TODO: Save to Firestore
        // await createStrategy(userId, newStrategy);

        setStrategies(prev => [newStrategy, ...prev]);
      }

      setView('list');
      setEditingStrategy(null);
      window.history.pushState(null, '', window.location.pathname);
    } catch (error) {
      console.error('Failed to save strategy:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, editingStrategy]);

  const handleDuplicate = useCallback(async (strategy: Strategy) => {
    if (!userId) return;

    const now = new Date();
    const duplicatedStrategy: Strategy = {
      ...strategy,
      id: `strategy_${Date.now()}`,
      name: `${strategy.name} (Copy)`,
      status: 'draft',
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };

    // TODO: Save to Firestore
    // await createStrategy(userId, duplicatedStrategy);

    setStrategies(prev => [duplicatedStrategy, ...prev]);
  }, [userId]);

  const handleDelete = useCallback(async (strategy: Strategy) => {
    if (!userId) return;

    try {
      // TODO: Delete from Firestore
      // await deleteStrategy(userId, strategy.id);

      setStrategies(prev => prev.filter(s => s.id !== strategy.id));
    } catch (error) {
      console.error('Failed to delete strategy:', error);
    }
  }, [userId]);

  const handleToggleFavorite = useCallback(async (strategy: Strategy) => {
    if (!userId) return;

    const updatedStrategy: Strategy = {
      ...strategy,
      isFavorite: !strategy.isFavorite,
      updatedAt: new Date(),
    };

    // TODO: Update in Firestore
    // await updateStrategy(userId, updatedStrategy);

    setStrategies(prev =>
      prev.map(s => s.id === strategy.id ? updatedStrategy : s)
    );
  }, [userId]);

  const handleStatusChange = useCallback(async (strategy: Strategy, status: StrategyStatus) => {
    if (!userId) return;

    const updatedStrategy: Strategy = {
      ...strategy,
      status,
      updatedAt: new Date(),
    };

    // TODO: Update in Firestore
    // await updateStrategy(userId, updatedStrategy);

    setStrategies(prev =>
      prev.map(s => s.id === strategy.id ? updatedStrategy : s)
    );
  }, [userId]);

  const handleRunBacktest = useCallback((strategy: Strategy) => {
    // Navigate to backtest page with strategy pre-selected
    window.location.href = appPath(`/dashboard/backtest?strategy=${strategy.id}`);
  }, []);

  // Render not authenticated state
  if (!userId && !isLoading) {
    return (
      <div className="strategies-page strategies-page--not-auth" data-testid="strategies-page-not-auth">
        <div className="message-container">
          <div className="message-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2>Authentication Required</h2>
          <p>Please sign in to manage your strategies.</p>
          <a href={appPath("/auth/login")} className="btn btn-primary">Sign In</a>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Render creation/edit view
  if (view === 'create' || view === 'edit') {
    return (
      <div className="strategies-page" data-testid="strategies-page">
        <div className="creation-header">
          <button className="back-button" onClick={handleCancel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Strategies
          </button>
          <h1>{view === 'edit' ? 'Edit Strategy' : 'Create New Strategy'}</h1>
        </div>
        <StrategyCreationForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          initialTemplate={editingStrategy?.config.type}
        />
        <style>{styles}</style>
      </div>
    );
  }

  // Render list view
  return (
    <div className="strategies-page" data-testid="strategies-page">
      <StrategiesList
        strategies={strategies}
        isLoading={isLoading}
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggleFavorite={handleToggleFavorite}
        onStatusChange={handleStatusChange}
        onRunBacktest={handleRunBacktest}
      />
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .strategies-page {
    min-height: calc(100vh - 120px);
  }

  .strategies-page--not-auth {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }

  .message-container {
    text-align: center;
  }

  .message-icon {
    color: var(--accent);
    margin-bottom: 1rem;
    opacity: 0.8;
  }

  .message-container h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .message-container p {
    color: var(--text-muted);
    margin: 0 0 1.5rem 0;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    border-radius: var(--radius-md, 8px);
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
  }

  .btn-primary:hover {
    background: var(--accent-hover, #2563eb);
  }

  .creation-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border);
    background-color: var(--bg-secondary);
  }

  .creation-header h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .back-button {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.875rem;
    cursor: pointer;
    transition: color 0.2s;
  }

  .back-button:hover {
    color: var(--text-primary);
  }

  @media (max-width: 640px) {
    .creation-header {
      padding: 1rem;
    }
  }
`;

export default StrategiesPage;
