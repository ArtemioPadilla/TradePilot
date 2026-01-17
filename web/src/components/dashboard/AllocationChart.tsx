import { useStore } from '@nanostores/react';
import { $accounts } from '../../stores/portfolio';
import { formatPercent } from '../../lib/utils';

export default function AllocationChart() {
  const accounts = useStore($accounts);

  // Calculate allocation by symbol
  const allHoldings = accounts.flatMap((account) =>
    account.holdings.map((h) => ({
      symbol: h.symbol,
      value: h.quantity * h.currentPrice,
    }))
  );

  const totalValue = allHoldings.reduce((sum, h) => sum + h.value, 0);

  const allocations = allHoldings
    .map((h) => ({
      symbol: h.symbol,
      value: h.value,
      percent: (h.value / totalValue) * 100,
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
          gap: 1.5rem;
          padding: 1rem 0;
        }

        .chart-wrapper {
          display: flex;
          justify-content: center;
        }

        .legend {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
