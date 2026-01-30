import { useAlpacaData } from '../../hooks/useAlpacaData';
import { formatPercent } from '../../lib/utils';

export default function AllocationChart() {
  const { positions, isLoading, isConnected } = useAlpacaData();

  // Calculate allocation from Alpaca positions
  const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);

  const allocations = positions
    .map((pos) => ({
      symbol: pos.symbol,
      value: pos.marketValue,
      percent: totalValue > 0 ? (pos.marketValue / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.percent - a.percent);

  const colors = [
    'var(--accent)',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
  ];

  // Generate pie chart path
  const generatePieChart = () => {
    const size = 180;
    const center = size / 2;
    const radius = 70;
    const innerRadius = 45;

    let currentAngle = -90;
    const paths = allocations.map((item, index) => {
      const angle = (item.percent / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const x3 = center + innerRadius * Math.cos(endRad);
      const y3 = center + innerRadius * Math.sin(endRad);
      const x4 = center + innerRadius * Math.cos(startRad);
      const y4 = center + innerRadius * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      currentAngle = endAngle;

      return `
        <path
          d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z"
          fill="${colors[index % colors.length]}"
        />
      `;
    });

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${paths.join('')}
        <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="middle" fill="var(--text-primary)" font-size="14" font-weight="600">
          ${allocations.length}
        </text>
        <text x="${center}" y="${center + 16}" text-anchor="middle" fill="var(--text-muted)" font-size="10">
          Assets
        </text>
      </svg>
    `;
  };

  if (!isConnected && !isLoading) {
    return (
      <div className="allocation-chart">
        <div className="empty-state">
          <p>Connect to Alpaca to see your allocation</p>
          <a href="/dashboard/trading" className="connect-link">Connect Account</a>
        </div>
        <style>{`
          .allocation-chart {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
          }
          .empty-state {
            text-align: center;
            color: var(--text-muted);
          }
          .connect-link {
            display: inline-block;
            margin-top: 0.5rem;
            color: var(--accent);
            text-decoration: none;
          }
          .connect-link:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="allocation-chart">
        <div className="chart-wrapper">
          <div className="skeleton-chart" />
        </div>
        <div className="legend">
          {[1, 2, 3].map(i => (
            <div key={i} className="legend-item">
              <span className="legend-color skeleton" />
              <span className="legend-symbol skeleton" style={{ width: '60px', height: '16px' }} />
              <span className="legend-percent skeleton" style={{ width: '40px', height: '16px' }} />
            </div>
          ))}
        </div>
        <style>{`
          .allocation-chart {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: calc(1.5rem * var(--spacing-density));
            padding: calc(1rem * var(--spacing-density)) 0;
          }
          .skeleton-chart {
            width: 180px;
            height: 180px;
            border-radius: 50%;
            background: var(--bg-tertiary);
            animation: pulse 1.5s infinite;
          }
          .legend {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: calc(0.5rem * var(--spacing-density));
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: calc(0.5rem * var(--spacing-density));
          }
          .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
          }
          .skeleton {
            background: var(--bg-tertiary);
            border-radius: var(--radius-sm);
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  if (allocations.length === 0) {
    return (
      <div className="allocation-chart">
        <div className="empty-state">
          <p>No positions yet. Start trading to see your allocation.</p>
        </div>
        <style>{`
          .allocation-chart {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
          }
          .empty-state {
            text-align: center;
            color: var(--text-muted);
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="allocation-chart">
      <div className="chart-wrapper" dangerouslySetInnerHTML={{ __html: generatePieChart() }} />

      <div className="legend">
        {allocations.slice(0, 5).map((item, index) => (
          <div key={item.symbol} className="legend-item">
            <span className="legend-color" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="legend-symbol">{item.symbol}</span>
            <span className="legend-percent">{formatPercent(item.percent).replace('+', '')}</span>
          </div>
        ))}
        {allocations.length > 5 && (
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'var(--text-muted)' }} />
            <span className="legend-symbol">Others</span>
            <span className="legend-percent">
              {formatPercent(allocations.slice(5).reduce((sum, a) => sum + a.percent, 0)).replace('+', '')}
            </span>
          </div>
        )}
      </div>

      <style>{`
        .allocation-chart {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: calc(1.5rem * var(--spacing-density));
          padding: calc(1rem * var(--spacing-density)) 0;
        }

        .chart-wrapper {
          display: flex;
          justify-content: center;
        }

        .legend {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: calc(0.5rem * var(--spacing-density));
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: calc(0.5rem * var(--spacing-density));
          font-size: 0.875rem;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .legend-symbol {
          flex: 1;
          color: var(--text-primary);
          font-weight: 500;
        }

        .legend-percent {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
