/**
 * Tests for the Phase 4 zod schemas (watchlist, alert, account, holding,
 * transaction).
 *
 * DESTINATION: split per schema next to each file when landing —
 * web/src/schemas/{watchlist,alert,account,holding,transaction}.test.ts —
 * or keep combined; the describes below are already grouped per schema.
 * Node environment (no DOM needed), matching web/src/schemas/contact.test.ts.
 */
import { describe, expect, it } from 'vitest';

import { SymbolSchema, WatchlistFormSchema } from '@/schemas/watchlist';
import { AlertFormSchema, parseAlertCondition } from '@/schemas/alert';
import { AccountFormSchema } from '@/schemas/account';
import { HoldingFormSchema } from '@/schemas/holding';
import { sideNeedsSymbol, TransactionFormSchema } from '@/schemas/transaction';

describe('SymbolSchema', () => {
  it('trims and uppercases tickers', () => {
    expect(SymbolSchema.parse(' aapl ')).toBe('AAPL');
  });

  it('accepts Yahoo-style tickers', () => {
    for (const sym of ['BRK-B', '^GSPC', 'BTC-USD', 'EURUSD=X', '7203.T']) {
      expect(SymbolSchema.safeParse(sym).success).toBe(true);
    }
  });

  it('rejects garbage', () => {
    for (const sym of ['', 'HELLO WORLD', 'WAY_TOO_LONG_SYMBOL', 'a$b']) {
      expect(SymbolSchema.safeParse(sym).success).toBe(false);
    }
  });
});

describe('WatchlistFormSchema', () => {
  it('accepts a valid watchlist and normalizes symbols', () => {
    const result = WatchlistFormSchema.safeParse({
      name: 'Tech megacaps',
      symbols: ['aapl', 'MSFT'],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.symbols).toEqual(['AAPL', 'MSFT']);
  });

  it('rejects an empty symbols list', () => {
    expect(WatchlistFormSchema.safeParse({ name: 'Empty', symbols: [] }).success).toBe(false);
  });

  it('rejects a blank name', () => {
    expect(WatchlistFormSchema.safeParse({ name: '  ', symbols: ['AAPL'] }).success).toBe(false);
  });

  it('rejects more than 30 symbols', () => {
    const symbols = Array.from({ length: 31 }, (_, i) => `S${i}`);
    expect(WatchlistFormSchema.safeParse({ name: 'Big', symbols }).success).toBe(false);
  });
});

describe('AlertFormSchema', () => {
  it('accepts a valid alert and coerces the price string', () => {
    const result = AlertFormSchema.safeParse({
      symbol: 'aapl',
      condition: { kind: 'above', price: '150.5' },
      is_active: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.symbol).toBe('AAPL');
      expect(result.data.condition).toEqual({ kind: 'above', price: 150.5 });
    }
  });

  it('defaults is_active to true', () => {
    const result = AlertFormSchema.safeParse({
      symbol: 'AAPL',
      condition: { kind: 'below', price: 100 },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.is_active).toBe(true);
  });

  it('rejects non-positive prices and unknown kinds', () => {
    expect(
      AlertFormSchema.safeParse({ symbol: 'AAPL', condition: { kind: 'above', price: 0 } })
        .success,
    ).toBe(false);
    expect(
      AlertFormSchema.safeParse({ symbol: 'AAPL', condition: { kind: 'crosses', price: 10 } })
        .success,
    ).toBe(false);
  });

  it('parseAlertCondition returns null for malformed JSONB', () => {
    expect(parseAlertCondition(null)).toBeNull();
    expect(parseAlertCondition('above 150')).toBeNull();
    expect(parseAlertCondition({ kind: 'above' })).toBeNull();
    expect(parseAlertCondition({ kind: 'below', price: 99 })).toEqual({
      kind: 'below',
      price: 99,
    });
  });
});

describe('AccountFormSchema', () => {
  it('accepts a valid account', () => {
    const result = AccountFormSchema.safeParse({
      name: 'Main brokerage',
      broker: 'Alpaca',
      currency: 'USD',
      type: 'brokerage',
    });
    expect(result.success).toBe(true);
  });

  it('applies defaults (USD, brokerage, broker null)', () => {
    const result = AccountFormSchema.safeParse({ name: 'Cash stash' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('USD');
      expect(result.data.type).toBe('brokerage');
      expect(result.data.broker).toBeNull();
    }
  });

  it('turns an empty broker string into null', () => {
    const result = AccountFormSchema.safeParse({ name: 'A', broker: '  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.broker).toBeNull();
  });

  it('rejects a blank name and unknown currency/type', () => {
    expect(AccountFormSchema.safeParse({ name: '' }).success).toBe(false);
    expect(AccountFormSchema.safeParse({ name: 'A', currency: 'DOGE' }).success).toBe(false);
    expect(AccountFormSchema.safeParse({ name: 'A', type: 'margin' }).success).toBe(false);
  });
});

describe('HoldingFormSchema', () => {
  it('accepts a valid holding and coerces numeric strings', () => {
    const result = HoldingFormSchema.safeParse({
      symbol: 'aapl',
      qty: '10.5',
      cost_basis: '150',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ symbol: 'AAPL', qty: 10.5, cost_basis: 150 });
    }
  });

  it('treats an empty cost basis as null', () => {
    const result = HoldingFormSchema.safeParse({ symbol: 'AAPL', qty: 1, cost_basis: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.cost_basis).toBeNull();
  });

  it('rejects zero or negative quantities', () => {
    expect(HoldingFormSchema.safeParse({ symbol: 'AAPL', qty: 0 }).success).toBe(false);
    expect(HoldingFormSchema.safeParse({ symbol: 'AAPL', qty: -1 }).success).toBe(false);
  });

  it('rejects a negative cost basis', () => {
    expect(
      HoldingFormSchema.safeParse({ symbol: 'AAPL', qty: 1, cost_basis: -5 }).success,
    ).toBe(false);
  });
});

describe('TransactionFormSchema', () => {
  const base = { qty: '10', price: '150', executed_at: '2026-07-31' };

  it('accepts a buy with a symbol and coerces numbers', () => {
    const result = TransactionFormSchema.safeParse({ ...base, side: 'buy', symbol: 'aapl' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.symbol).toBe('AAPL');
      expect(result.data.qty).toBe(10);
      expect(result.data.price).toBe(150);
    }
  });

  it('requires a symbol for buy/sell/dividend', () => {
    for (const side of ['buy', 'sell', 'dividend'] as const) {
      expect(sideNeedsSymbol(side)).toBe(true);
      expect(TransactionFormSchema.safeParse({ ...base, side, symbol: '' }).success).toBe(false);
    }
  });

  it('allows deposits and withdrawals without a symbol', () => {
    for (const side of ['deposit', 'withdrawal'] as const) {
      expect(sideNeedsSymbol(side)).toBe(false);
      const result = TransactionFormSchema.safeParse({ ...base, side, symbol: '' });
      expect(result.success).toBe(true);
    }
  });

  it('treats an empty price as null', () => {
    const result = TransactionFormSchema.safeParse({
      side: 'buy',
      symbol: 'AAPL',
      qty: 1,
      price: '',
      executed_at: '2026-07-31',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBeNull();
  });

  it('rejects invalid dates, sides, and non-positive quantities', () => {
    expect(
      TransactionFormSchema.safeParse({ ...base, side: 'buy', symbol: 'AAPL', executed_at: 'not-a-date' }).success,
    ).toBe(false);
    expect(
      TransactionFormSchema.safeParse({ ...base, side: 'short', symbol: 'AAPL' }).success,
    ).toBe(false);
    expect(
      TransactionFormSchema.safeParse({ ...base, side: 'buy', symbol: 'AAPL', qty: '0' }).success,
    ).toBe(false);
  });
});
