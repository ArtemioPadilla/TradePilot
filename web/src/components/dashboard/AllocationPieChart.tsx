import { useState, useMemo } from 'react';
import type { AllocationItem } from '../../types/portfolio';

/**
 * Chart colors palette
 */
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
];

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Grouping type for allocation
 */
export type AllocationGrouping = 'asset_type' | 'account' | 'sector' | 'custom';

interface AllocationPieChartProps {
  /** Allocation data to display */
  data: AllocationItem[];
  /** Title for the chart */
  title?: string;
  /** Current grouping type */
  grouping?: AllocationGrouping;
  /** Available grouping options */
  groupingOptions?: { value: AllocationGrouping; label: string }[];
  /** Callback when grouping changes */
  onGroupingChange?: (grouping: AllocationGrouping) => void;
  /** Show as donut (with center hole) */
  donut?: boolean;
  /** Size of the chart */
  size?: number;
  /** Show legend */
  showLegend?: boolean;
  /** Maximum items to show in legend */
  maxLegendItems?: number;
  /** Loading state */
  loading?: boolean;
}

export function AllocationPieChart({
  data,
  title = 'Allocation',
  grouping,
  groupingOptions,
  onGroupingChange,
  donut = true,
  size = 200,
  showLegend = true,
  maxLegendItems = 6,
  loading = false,
}: AllocationPieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sort data by value descending
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value);
  }, [data]);

  // Calculate total
  const total = useMemo(() => {
    return sortedData.reduce((sum, item) => sum + item.value, 0);
  }, [sortedData]);

  // Generate pie/donut chart paths
  const chartPaths = useMemo(() => {
    if (sortedData.length === 0 || total === 0) return [];

    const center = size / 2;
    const radius = size / 2 - 10;
    const innerRadius = donut ? radius * 0.6 : 0;

    let currentAngle = -90; // Start from top
    const paths: {
      path: string;
      color: string;
      item: AllocationItem;
      index: number;
      startAngle: number;
      endAngle: number;
    }[] = [];

    sortedData.forEach((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      // Convert to radians
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      // Calculate arc points
      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      // Inner arc points (for donut)
      const x3 = center + innerRadius * Math.cos(endRad);
      const y3 = center + innerRadius * Math.sin(endRad);
      const x4 = center + innerRadius * Math.cos(startRad);
      const y4 = center + innerRadius * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      let path: string;
      if (donut) {
        path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
      } else {
        path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      }

      paths.push({
        path,
        color: CHART_COLORS[index % CHART_COLORS.length],
        item,
        index,
        startAngle,
        endAngle,
      });

      currentAngle = endAngle;
    });

    return paths;
  }, [sortedData, total, size, donut]);

  // Legend items (top N + "Others")
  const legendItems = useMemo(() => {
    if (sortedData.length <= maxLegendItems) {
      return sortedData.map((item, index) => ({
        ...item,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));
    }

    const topItems = sortedData.slice(0, maxLegendItems - 1);
    const otherItems = sortedData.slice(maxLegendItems - 1);
    const othersValue = otherItems.reduce((sum, item) => sum + item.value, 0);
    const othersPercentage = otherItems.reduce((sum, item) => sum + item.percentage, 0);
    const othersCount = otherItems.reduce((sum, item) => sum + item.holdingCount, 0);

    return [
      ...topItems.map((item, index) => ({
        ...item,
        color: CHART_COLORS[index % CHART_COLORS.length],
      })),
      {
        category: 'Others',
        value: othersValue,
        percentage: othersPercentage,
        holdingCount: othersCount,
        color: 'var(--text-muted)',
      },
    ];
  }, [sortedData, maxLegendItems]);

  // Hovered item info
  const hoveredItem = hoveredIndex !== null ? sortedData[hoveredIndex] : null;

  return (
    <div className="allocation-pie-chart" data-testid="allocation-pie-chart">
      {/* Header */}
      <div className="chart-header">
        <h3>{title}</h3>
        {groupingOptions && groupingOptions.length > 1 && onGroupingChange && (
          <select
            value={grouping}
            onChange={(e) => onGroupingChange(e.target.value as AllocationGrouping)}
            className="grouping-select"
            data-testid="allocation-grouping-select"
          >
            {groupingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Chart */}
      <div className="chart-content">
        {loading ? (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="chart-empty">
            <p>No allocation data</p>
          </div>
        ) : (
          <div className="chart-wrapper">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="pie-svg"
            >
              {chartPaths.map((segment) => (
                <path
                  key={segment.index}
                  d={segment.path}
                  fill={segment.color}
                  className={`pie-segment ${hoveredIndex === segment.index ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredIndex(segment.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}

              {/* Center text for donut */}
              {donut && (
                <g className="center-text">
                  {hoveredItem ? (
                    <>
                      <text
                        x={size / 2}
                        y={size / 2 - 8}
                        textAnchor="middle"
                        className="center-value"
                      >
                        {hoveredItem.percentage.toFixed(1)}%
                      </text>
                      <text
                        x={size / 2}
                        y={size / 2 + 12}
                        textAnchor="middle"
                        className="center-label"
                      >
                        {hoveredItem.category.length > 12
                          ? hoveredItem.category.slice(0, 10) + '...'
                          : hoveredItem.category}
                      </text>
                    </>
                  ) : (
                    <>
                      <text
                        x={size / 2}
                        y={size / 2 - 8}
                        textAnchor="middle"
                        className="center-value"
                      >
                        {formatCurrency(total)}
                      </text>
                      <text
                        x={size / 2}
                        y={size / 2 + 12}
                        textAnchor="middle"
                        className="center-label"
                      >
                        Total
                      </text>
                    </>
                  )}
                </g>
              )}
            </svg>
          </div>
        )}

        {/* Legend */}
        {showLegend && !loading && sortedData.length > 0 && (
          <div className="legend" data-testid="allocation-legend">
            {legendItems.map((item, index) => (
              <div
                key={item.category}
                className={`legend-item ${hoveredIndex === index ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredIndex(index < sortedData.length ? index : null)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span
                  className="legend-color"
                  style={{ backgroundColor: item.color }}
                />
                <span className="legend-category">{item.category}</span>
                <span className="legend-value">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .allocation-pie-chart {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 12px);
          padding: 1.5rem;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .chart-header h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: var(--text-primary);
        }

        .grouping-select {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md, 8px);
          color: var(--text-primary);
          cursor: pointer;
        }

        .grouping-select:focus {
          outline: none;
          border-color: var(--accent);
        }

        .chart-content {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .chart-loading,
        .chart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 200px;
          color: var(--text-muted);
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .chart-wrapper {
          flex-shrink: 0;
        }

        .pie-svg {
          display: block;
        }

        .pie-segment {
          transition: transform 0.2s, opacity 0.2s;
          transform-origin: center;
          cursor: pointer;
        }

        .pie-segment:hover,
        .pie-segment.hovered {
          transform: scale(1.03);
          filter: brightness(1.1);
        }

        .center-text .center-value {
          font-size: 1rem;
          font-weight: 700;
          fill: var(--text-primary);
        }

        .center-text .center-label {
          font-size: 0.625rem;
          fill: var(--text-muted);
        }

        .legend {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 0;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem;
          border-radius: var(--radius-sm, 4px);
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .legend-item:hover,
        .legend-item.hovered {
          background: var(--bg-tertiary);
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .legend-category {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .legend-value {
          font-size: 0.875rem;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .chart-content {
            flex-direction: column;
          }

          .legend {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default AllocationPieChart;
