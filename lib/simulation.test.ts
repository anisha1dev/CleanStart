import { describe, expect, it } from 'vitest';
import { quarterLabel, simulateQuarter } from './simulation';
import { GameState } from '../types/game';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'game-1',
    user_id: 'user-1',
    quarter: 1,
    cash: 1_000_000,
    engineers: 4,
    sales_staff: 2,
    product_quality: 50,
    cumulative_profit: 0,
    status: 'active',
    ...overrides,
  };
}

describe('quarterLabel', () => {
  it('maps quarter 1 to Y1 Q1', () => {
    expect(quarterLabel(1)).toEqual({ year: 1, quarterInYear: 1 });
  });

  it('maps quarter 5 to Y2 Q1', () => {
    expect(quarterLabel(5)).toEqual({ year: 2, quarterInYear: 1 });
  });

  it('maps quarter 40 to Y10 Q4', () => {
    expect(quarterLabel(40)).toEqual({ year: 10, quarterInYear: 4 });
  });
});

describe('simulateQuarter', () => {
  it('computes deterministic output from a standard turn', () => {
    const start = makeState();
    const outcome = simulateQuarter(start, {
      price: 1000,
      newEngineers: 0,
      newSales: 0,
      salaryPct: 100,
    });

    expect(outcome.nextQuarter).toBe(2);
    expect(outcome.productQuality).toBe(52);
    expect(outcome.unitsSold).toBe(519);
    expect(outcome.revenue).toBe(519000);
    expect(outcome.netIncome).toBe(339000);
    expect(outcome.cashEnd).toBe(1339000);
    expect(outcome.status).toBe('active');
    expect(outcome.cumulativeProfit).toBe(339000);
    expect(outcome.year).toBe(1);
    expect(outcome.quarterInYear).toBe(1);
  });

  it('clamps invalid decision inputs to model boundaries', () => {
    const start = makeState();
    const outcome = simulateQuarter(start, {
      price: -10,
      newEngineers: -1.2,
      newSales: 2.9,
      salaryPct: 500,
    });

    expect(outcome.engineers).toBe(4);
    expect(outcome.salesStaff).toBe(4);
    expect(outcome.revenue).toBe(1039);
    expect(outcome.netIncome).toBe(-478961);
    expect(outcome.cashEnd).toBe(511039);
  });

  it('caps product quality at 100', () => {
    const start = makeState({ product_quality: 99, engineers: 10, sales_staff: 2 });
    const outcome = simulateQuarter(start, {
      price: 1000,
      newEngineers: 0,
      newSales: 0,
      salaryPct: 100,
    });

    expect(outcome.productQuality).toBe(100);
  });

  it('marks game lost when cash reaches zero or below', () => {
    const start = makeState({ cash: 10, engineers: 4, sales_staff: 2, product_quality: 0 });
    const outcome = simulateQuarter(start, {
      price: 1,
      newEngineers: 0,
      newSales: 0,
      salaryPct: 200,
    });

    expect(outcome.cashEnd).toBeLessThanOrEqual(0);
    expect(outcome.status).toBe('lost');
  });

  it('marks game won when quarter 40 is completed with positive cash', () => {
    const start = makeState({ quarter: 40, cash: 1_000_000 });
    const outcome = simulateQuarter(start, {
      price: 1000,
      newEngineers: 0,
      newSales: 0,
      salaryPct: 100,
    });

    expect(outcome.cashEnd).toBeGreaterThan(0);
    expect(outcome.status).toBe('won');
  });

  it('prioritizes lost over won when quarter is 40 but cash drops below zero', () => {
    const start = makeState({ quarter: 40, cash: 1, product_quality: 0 });
    const outcome = simulateQuarter(start, {
      price: 1,
      newEngineers: 0,
      newSales: 0,
      salaryPct: 200,
    });

    expect(outcome.cashEnd).toBeLessThanOrEqual(0);
    expect(outcome.status).toBe('lost');
  });

  it('floors demand at zero when price is extremely high', () => {
    const start = makeState({ product_quality: 0, engineers: 0, sales_staff: 10 });
    const outcome = simulateQuarter(start, {
      price: 100_000_000,
      newEngineers: 0,
      newSales: 0,
      salaryPct: 100,
    });

    expect(outcome.unitsSold).toBe(0);
    expect(outcome.revenue).toBe(0);
  });

  it('floors fractional hires before applying headcount and hire cost', () => {
    const start = makeState();
    const outcome = simulateQuarter(start, {
      price: 1000,
      newEngineers: 1.9,
      newSales: 0.2,
      salaryPct: 100,
    });

    expect(outcome.engineers).toBe(5);
    expect(outcome.salesStaff).toBe(2);
    expect(outcome.cashEnd).toBe(1309000);
  });

  it('applies salary floor at 50 percent', () => {
    const start = makeState({ engineers: 4, sales_staff: 2, product_quality: 50 });
    const outcome = simulateQuarter(start, {
      price: 1000,
      newEngineers: 0,
      newSales: 0,
      salaryPct: 1,
    });

    expect(outcome.netIncome).toBe(429000);
    expect(outcome.cashEnd).toBe(1429000);
  });

  it('adds net income to existing cumulative profit', () => {
    const start = makeState({ cumulative_profit: 125000 });
    const outcome = simulateQuarter(start, {
      price: 1000,
      newEngineers: 0,
      newSales: 0,
      salaryPct: 100,
    });

    expect(outcome.cumulativeProfit).toBe(464000);
  });

  it('floors units sold to an integer', () => {
    const start = makeState({ product_quality: 50, engineers: 4, sales_staff: 2 });
    const outcome = simulateQuarter(start, {
      price: 1000,
      newEngineers: 0,
      newSales: 0,
      salaryPct: 100,
    });

    expect(outcome.unitsSold).toBe(519);
  });

  it('applies payroll and one-time hire cost in cash-end calculation', () => {
    const start = makeState({
      cash: 100000,
      engineers: 1,
      sales_staff: 1,
      product_quality: 0,
    });
    const outcome = simulateQuarter(start, {
      price: 1,
      newEngineers: 2,
      newSales: 1,
      salaryPct: 150,
    });

    expect(outcome.engineers).toBe(3);
    expect(outcome.salesStaff).toBe(2);
    expect(outcome.productQuality).toBe(1.5);
    expect(outcome.unitsSold).toBe(14);
    expect(outcome.revenue).toBe(14);
    expect(outcome.netIncome).toBe(-224986);
    expect(outcome.cashEnd).toBe(-139986);
  });
});
