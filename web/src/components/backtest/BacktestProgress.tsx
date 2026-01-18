/**
 * BacktestProgress Component
 *
 * Displays the progress of a running backtest with visual feedback.
 */

import { useState, useEffect } from 'react';
import type { BacktestJobStatus } from '../../types/backtest';

interface BacktestProgressProps {
  /** Current status of the backtest */
  status: BacktestJobStatus;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Status message */
  message?: string;
  /** Callback when user cancels */
  onCancel?: () => void;
  /** Whether cancel is allowed */
  canCancel?: boolean;
}

const STATUS_CONFIG: Record<BacktestJobStatus, {
  label: string;
  color: string;
  bgColor: string;
  animate: boolean;
}> = {
  pending: {
    label: 'Queued',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    animate: true,
  },
  running: {
    label: 'Running',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    animate: true,
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    animate: false,
  },
  failed: {
    label: 'Failed',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    animate: false,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    animate: false,
  },
};

export function BacktestProgress({
  status,
  progress = 0,
  message = '',
  onCancel,
  canCancel = true,
}: BacktestProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const config = STATUS_CONFIG[status];

  // Track elapsed time while running
  useEffect(() => {
    if (status === 'running' || status === 'pending') {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div
      className="backtest-progress bg-white border border-gray-200 rounded-lg p-6"
      data-testid="backtest-progress"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {config.animate && (
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-4 border-gray-200"></div>
              <div
                className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"
              ></div>
            </div>
          )}
          {!config.animate && status === 'completed' && (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          {!config.animate && status === 'failed' && (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          {!config.animate && status === 'cancelled' && (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <div>
            <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
            <p className="text-sm text-gray-500">
              {message || 'Processing backtest...'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">Elapsed Time</div>
          <div className="font-mono text-lg">{formatTime(elapsedTime)}</div>
        </div>
      </div>

      {/* Progress Bar */}
      {(status === 'running' || status === 'pending') && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === 'pending' ? 'bg-yellow-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Progress Steps */}
      {status === 'running' && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <ProgressStep
            label="Load Data"
            isComplete={progress >= 25}
            isActive={progress > 0 && progress < 25}
          />
          <ProgressStep
            label="Initialize"
            isComplete={progress >= 50}
            isActive={progress >= 25 && progress < 50}
          />
          <ProgressStep
            label="Simulate"
            isComplete={progress >= 75}
            isActive={progress >= 50 && progress < 75}
          />
          <ProgressStep
            label="Analyze"
            isComplete={progress >= 100}
            isActive={progress >= 75 && progress < 100}
          />
        </div>
      )}

      {/* Cancel Button */}
      {(status === 'running' || status === 'pending') && canCancel && onCancel && (
        <div className="text-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            data-testid="cancel-backtest-button"
          >
            Cancel Backtest
          </button>
        </div>
      )}
    </div>
  );
}

interface ProgressStepProps {
  label: string;
  isComplete: boolean;
  isActive: boolean;
}

function ProgressStep({ label, isComplete, isActive }: ProgressStepProps) {
  return (
    <div
      className={`text-center p-2 rounded ${
        isComplete
          ? 'bg-green-100 text-green-700'
          : isActive
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      <div className="text-xs">{label}</div>
      {isComplete && (
        <svg className="w-4 h-4 mx-auto mt-1" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {isActive && (
        <div className="flex justify-center mt-1">
          <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
      )}
    </div>
  );
}

export default BacktestProgress;
