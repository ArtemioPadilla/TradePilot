import { useEffect, useRef } from 'react';

export default function PerformanceChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate mock performance data
    const generateData = () => {
      const data = [];
      let value = 100000;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        value = value * (1 + (Math.random() - 0.48) * 0.02);
        data.push({
          date: date.toISOString().split('T')[0],
          value: value,
        });
      }
      return data;
    };

    const data = generateData();

    // Simple SVG chart rendering
    if (chartRef.current) {
      const width = chartRef.current.offsetWidth;
      const height = 250;
      const padding = { top: 20, right: 20, bottom: 30, left: 60 };

      const values = data.map((d) => d.value);
      const minValue = Math.min(...values) * 0.995;
      const maxValue = Math.max(...values) * 1.005;

      const xScale = (i: number) => padding.left + (i / (data.length - 1)) * (width - padding.left - padding.right);
      const yScale = (v: number) =>
        height - padding.bottom - ((v - minValue) / (maxValue - minValue)) * (height - padding.top - padding.bottom);

      const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.value)}`).join(' ');

      const areaD = `${pathD} L ${xScale(data.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

      const lastValue = data[data.length - 1].value;
      const firstValue = data[0].value;
      const isPositive = lastValue >= firstValue;

      chartRef.current.innerHTML = `
        <svg width="${width}" height="${height}" style="overflow: visible;">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${isPositive ? 'var(--positive)' : 'var(--negative)'}" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="${isPositive ? 'var(--positive)' : 'var(--negative)'}" stop-opacity="0"/>
            </linearGradient>
          </defs>

          <!-- Grid lines -->
          ${[0, 0.25, 0.5, 0.75, 1]
            .map((ratio) => {
              const y = padding.top + ratio * (height - padding.top - padding.bottom);
              const value = maxValue - ratio * (maxValue - minValue);
              return `
              <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--border)" stroke-dasharray="4"/>
              <text x="${padding.left - 10}" y="${y + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end">
                $${(value / 1000).toFixed(1)}K
              </text>
            `;
            })
            .join('')}

          <!-- Area fill -->
          <path d="${areaD}" fill="url(#areaGradient)"/>

          <!-- Line -->
          <path d="${pathD}" fill="none" stroke="${isPositive ? 'var(--positive)' : 'var(--negative)'}" stroke-width="2"/>

          <!-- End point -->
          <circle cx="${xScale(data.length - 1)}" cy="${yScale(lastValue)}" r="4" fill="${isPositive ? 'var(--positive)' : 'var(--negative)'}"/>
        </svg>
      `;
    }
  }, []);

  return (
    <div className="performance-chart">
      <div ref={chartRef} className="chart-container"></div>

      <style>{`
        .performance-chart {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .chart-container {
          flex: 1;
          min-height: 250px;
        }
      `}</style>
    </div>
  );
}
