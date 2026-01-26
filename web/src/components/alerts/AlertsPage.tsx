/**
 * Alerts Page Component
 *
 * Container component that orchestrates the AlertsList and AlertCreationForm
 * components with proper state management and callbacks.
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase';
import { AlertsList } from './AlertsList';
import { AlertCreationForm } from './AlertCreationForm';
import type {
  Alert,
  AlertType,
  AlertConfig,
  AlertStatus,
  NotificationChannel,
  AlertFrequency,
} from '../../types/alerts';

type ViewState = 'list' | 'create' | 'edit';

export function AlertsPage() {
  // Auth state
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // View state
  const [view, setView] = useState<ViewState>('list');
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  // Data state
  const [alerts, setAlerts] = useState<Alert[]>([]);
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
        loadAlerts(user.uid);
      } else {
        setUserId(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadAlerts = async (uid: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual Firestore service call
      // const alertsData = await getAlerts(uid);
      // setAlerts(alertsData);
      setAlerts([]);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = useCallback(() => {
    setEditingAlert(null);
    setView('create');
  }, []);

  const handleAlertClick = useCallback((alert: Alert) => {
    setEditingAlert(alert);
    setView('edit');
  }, []);

  const handleCancel = useCallback(() => {
    setView('list');
    setEditingAlert(null);
  }, []);

  const handleSubmit = useCallback(async (data: {
    name: string;
    description: string;
    type: AlertType;
    config: AlertConfig;
    channels: NotificationChannel[];
    frequency: AlertFrequency;
    tags: string[];
  }) => {
    if (!userId) return;

    setIsSubmitting(true);
    try {
      const now = new Date();

      if (editingAlert) {
        // Update existing alert
        const updatedAlert: Alert = {
          ...editingAlert,
          ...data,
          updatedAt: now,
        };

        // TODO: Save to Firestore
        // await updateAlert(userId, updatedAlert);

        setAlerts(prev =>
          prev.map(a => a.id === editingAlert.id ? updatedAlert : a)
        );
      } else {
        // Create new alert
        const newAlert: Alert = {
          id: `alert_${Date.now()}`,
          userId,
          name: data.name,
          description: data.description,
          type: data.type,
          config: data.config,
          channels: data.channels,
          frequency: data.frequency,
          tags: data.tags,
          status: 'active',
          enabled: true,
          triggerCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        // TODO: Save to Firestore
        // await createAlert(userId, newAlert);

        setAlerts(prev => [newAlert, ...prev]);
      }

      setView('list');
      setEditingAlert(null);
    } catch (error) {
      console.error('Failed to save alert:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, editingAlert]);

  const handleToggleAlert = useCallback(async (alertId: string, enabled: boolean) => {
    if (!userId) return;

    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    const updatedAlert: Alert = {
      ...alert,
      enabled: enabled,
      status: enabled ? 'active' : 'disabled',
      updatedAt: new Date(),
    };

    // TODO: Update in Firestore
    // await updateAlert(userId, updatedAlert);

    setAlerts(prev =>
      prev.map(a => a.id === alertId ? updatedAlert : a)
    );
  }, [userId, alerts]);

  const handleDeleteAlert = useCallback(async (alertId: string) => {
    if (!userId) return;

    try {
      // TODO: Delete from Firestore
      // await deleteAlert(userId, alertId);

      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  }, [userId]);

  const handleDuplicateAlert = useCallback(async (alertId: string) => {
    if (!userId) return;

    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    const now = new Date();
    const duplicatedAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}`,
      name: `${alert.name} (Copy)`,
      status: 'active',
      enabled: true,
      triggerCount: 0,
      lastTriggeredAt: undefined,
      createdAt: now,
      updatedAt: now,
    };

    // TODO: Save to Firestore
    // await createAlert(userId, duplicatedAlert);

    setAlerts(prev => [duplicatedAlert, ...prev]);
  }, [userId, alerts]);

  // Render not authenticated state
  if (!userId && !isLoading) {
    return (
      <div className="alerts-page alerts-page--not-auth" data-testid="alerts-page-not-auth">
        <div className="message-container">
          <div className="message-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </div>
          <h2>Authentication Required</h2>
          <p>Please sign in to manage your alerts.</p>
          <a href="/auth/login" className="btn btn-primary">Sign In</a>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Render creation/edit view
  if (view === 'create' || view === 'edit') {
    return (
      <div className="alerts-page" data-testid="alerts-page">
        <div className="creation-header">
          <button className="back-button" onClick={handleCancel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Alerts
          </button>
          <h1>{view === 'edit' ? 'Edit Alert' : 'Create New Alert'}</h1>
        </div>
        <div className="form-container">
          <AlertCreationForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
            initialValues={editingAlert ? {
              name: editingAlert.name,
              description: editingAlert.description,
              type: editingAlert.type,
              config: editingAlert.config,
              channels: editingAlert.channels,
              frequency: editingAlert.frequency,
              tags: editingAlert.tags,
            } : undefined}
          />
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Render list view
  return (
    <div className="alerts-page" data-testid="alerts-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Alerts</h1>
          <span className="alert-count">{alerts.length} alerts</span>
        </div>
        <button className="create-button" onClick={handleCreateNew} data-testid="create-alert-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Alert
        </button>
      </div>

      {/* Alerts List */}
      <AlertsList
        alerts={alerts}
        isLoading={isLoading}
        onAlertClick={handleAlertClick}
        onToggleAlert={handleToggleAlert}
        onDeleteAlert={handleDeleteAlert}
        onDuplicateAlert={handleDuplicateAlert}
      />
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .alerts-page {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .alerts-page--not-auth {
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

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .header-left {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .alert-count {
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .create-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background-color: var(--accent);
    color: white;
    border: none;
    border-radius: var(--radius-md, 8px);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .create-button:hover {
    background-color: var(--accent-hover, #4f46e5);
  }

  .creation-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border);
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

  .form-container {
    max-width: 700px;
  }

  @media (max-width: 640px) {
    .alerts-page {
      padding: 1rem;
    }

    .page-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .create-button {
      justify-content: center;
    }
  }
`;

export default AlertsPage;
