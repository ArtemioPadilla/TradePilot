/**
 * DESTINATION: web/src/lib/tools/parse-series.ts
 *
 * Tolerant number-list parsing for the public /tools calculators
 * (Sharpe calculator: pasted period returns; Drawdown calculator: pasted
 * equity values). New for the rebuild — the old app had no free-text inputs.
 *
 * Accepts values separated by commas, semicolons, or any whitespace
 * (spaces, tabs, newlines). A trailing '%' converts the token to a decimal
 * (e.g. "1.5%" → 0.015). Unparseable / non-finite tokens are skipped and
 * counted so the UI can warn without throwing.
 */

export interface ParsedSeries {
  values: number[];
  /** Number of tokens that could not be parsed into a finite number. */
  skipped: number;
}

export function parseNumberList(text: string): ParsedSeries {
  const tokens = text.split(/[,;\s]+/).filter((t) => t.length > 0);
  const values: number[] = [];
  let skipped = 0;

  for (const token of tokens) {
    const isPercent = token.endsWith('%');
    const raw = isPercent ? token.slice(0, -1) : token;
    const n = Number(raw);
    // Number('') === 0 — an empty pre-% token ("%") must count as skipped.
    if (raw.length === 0 || !Number.isFinite(n)) {
      skipped++;
      continue;
    }
    values.push(isPercent ? n / 100 : n);
  }

  return { values, skipped };
}

/**
 * Parse a pasted equity-curve series: like parseNumberList but additionally
 * rejects zero/negative values (an equity curve of dollars can't cross zero,
 * and drawdown math divides by the running peak).
 */
export function parsePositiveSeries(text: string): ParsedSeries {
  const { values, skipped } = parseNumberList(text);
  const positive = values.filter((v) => v > 0);
  return { values: positive, skipped: skipped + (values.length - positive.length) };
}
