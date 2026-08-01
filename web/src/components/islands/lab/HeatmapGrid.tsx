import * as React from 'react';

import { cn } from '@/lib/utils';

export interface HeatmapGridProps {
  /** Column labels (x axis — first sweep parameter). */
  xLabels: string[];
  /** Row labels (y axis — second sweep parameter, or a single row). */
  yLabels: string[];
  /** cells[row][col] — null = run failed/missing. */
  cells: (number | null)[][];
  /** Axis names for the accessible summary, e.g. "t" / "topN". */
  xName: string;
  yName: string;
  /** Metric shown, e.g. "Sharpe". */
  metricLabel: string;
  onCellClick?: (row: number, col: number) => void;
  formatValue?: (v: number) => string;
}

/**
 * Sweep result heatmap. Pure CSS grid — no chart library. Colors derive from
 * the theme tokens via color-mix: positive values tint toward --primary,
 * negative toward --destructive, so light/dark themes both work. Values stay
 * printed in each cell (color is reinforcement, never the only signal).
 */
export function HeatmapGrid({
  xLabels,
  yLabels,
  cells,
  xName,
  yName,
  metricLabel,
  onCellClick,
  formatValue = (v) => v.toFixed(2),
}: HeatmapGridProps) {
  const flat = cells.flat().filter((v): v is number => v !== null && Number.isFinite(v));
  const max = flat.length ? Math.max(...flat) : 0;
  const min = flat.length ? Math.min(...flat) : 0;

  function cellStyle(v: number | null): React.CSSProperties {
    if (v === null || !Number.isFinite(v)) return {};
    // Normalize magnitude within the observed range, floor at 8% tint so
    // small-but-real values remain visibly colored.
    const span = v >= 0 ? Math.max(max, 1e-9) : Math.min(min, -1e-9);
    const strength = Math.round(Math.max(0.08, Math.min(1, v / span)) * 62);
    const hue = v >= 0 ? 'var(--primary)' : 'var(--destructive)';
    return { backgroundColor: `color-mix(in oklab, ${hue} ${strength}%, transparent)` };
  }

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-separate border-spacing-1"
        aria-label={`${metricLabel} by ${xName} and ${yName}`}
      >
        <thead>
          <tr>
            <th scope="col" className="p-1 text-left font-mono text-[11px] text-muted-foreground">
              {yName} \ {xName}
            </th>
            {xLabels.map((x) => (
              <th
                key={x}
                scope="col"
                className="p-1 text-center font-mono text-[11px] text-muted-foreground"
              >
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yLabels.map((y, r) => (
            <tr key={y}>
              <th
                scope="row"
                className="p-1 text-left font-mono text-[11px] text-muted-foreground"
              >
                {y}
              </th>
              {xLabels.map((x, c) => {
                const v = cells[r]?.[c] ?? null;
                const clickable = Boolean(onCellClick) && v !== null;
                return (
                  <td key={x} className="p-0">
                    <button
                      type="button"
                      disabled={!clickable}
                      onClick={() => onCellClick?.(r, c)}
                      style={cellStyle(v)}
                      className={cn(
                        'w-full rounded px-2 py-2 text-center font-mono text-xs text-foreground',
                        clickable && 'cursor-pointer transition-transform hover:scale-105',
                        v === null && 'text-muted-foreground',
                      )}
                      aria-label={
                        v === null
                          ? `${yName} ${y}, ${xName} ${x}: no result`
                          : `${yName} ${y}, ${xName} ${x}: ${metricLabel} ${formatValue(v)}`
                      }
                    >
                      {v === null ? '—' : formatValue(v)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
