/**
 * Skeleton Loading Component
 *
 * Displays placeholder loading animations for content.
 */

import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius,
  className = '',
  variant = 'text',
  animation = 'pulse',
}: SkeletonProps) {
  const getVariantStyles = (): CSSProperties => {
    switch (variant) {
      case 'circular':
        return {
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof width === 'number' ? `${width}px` : width,
          borderRadius: '50%',
        };
      case 'rectangular':
        return {
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          borderRadius: 0,
        };
      case 'rounded':
        return {
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          borderRadius: borderRadius || '0.5rem',
        };
      case 'text':
      default:
        return {
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          borderRadius: borderRadius || '0.25rem',
        };
    }
  };

  return (
    <div
      className={`skeleton skeleton-${animation} ${className}`}
      style={getVariantStyles()}
      data-testid="skeleton"
    >
      <style>{styles}</style>
    </div>
  );
}

interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

export function SkeletonCard({ lines = 3, showAvatar = false, showImage = false }: SkeletonCardProps) {
  return (
    <div className="skeleton-card" data-testid="skeleton-card">
      {showImage && (
        <Skeleton variant="rectangular" height={160} className="skeleton-image" />
      )}
      <div className="skeleton-card-content">
        {showAvatar && (
          <div className="skeleton-header">
            <Skeleton variant="circular" width={40} />
            <div className="skeleton-header-text">
              <Skeleton width="60%" height="0.875rem" />
              <Skeleton width="40%" height="0.75rem" />
            </div>
          </div>
        )}
        {!showAvatar && <Skeleton width="70%" height="1.25rem" />}
        <div className="skeleton-lines">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              width={i === lines - 1 ? '80%' : '100%'}
              height="0.875rem"
            />
          ))}
        </div>
      </div>
      <style>{cardStyles}</style>
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="skeleton-table" data-testid="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width="80%" height="0.75rem" />
        ))}
      </div>
      <div className="skeleton-table-body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="skeleton-table-row">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                width={colIndex === 0 ? '60%' : '80%'}
                height="0.875rem"
              />
            ))}
          </div>
        ))}
      </div>
      <style>{tableStyles}</style>
    </div>
  );
}

const styles = `
  .skeleton {
    background-color: var(--bg-tertiary, #e5e7eb);
    display: block;
  }

  .skeleton-pulse {
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  .skeleton-wave {
    position: relative;
    overflow: hidden;
  }

  .skeleton-wave::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    animation: skeleton-wave 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes skeleton-wave {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const cardStyles = `
  .skeleton-card {
    background-color: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    overflow: hidden;
  }

  .skeleton-card-content {
    padding: 1rem;
  }

  .skeleton-image {
    width: 100%;
  }

  .skeleton-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .skeleton-header-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .skeleton-lines {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
`;

const tableStyles = `
  .skeleton-table {
    background-color: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    overflow: hidden;
  }

  .skeleton-table-header {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
    padding: 0.75rem 1rem;
    background-color: var(--bg-tertiary, #f3f4f6);
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .skeleton-table-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .skeleton-table-row:last-child {
    border-bottom: none;
  }
`;

export default Skeleton;
