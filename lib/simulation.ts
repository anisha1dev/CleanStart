import { AdvanceDecisionInput, GameState, QuarterOutcome } from '@/types/game';

const INDUSTRY_AVG_SALARY = 30000;
const NEW_HIRE_COST = 5000;
const QUALITY_PER_ENGINEER = 0.5;
const MAX_QUALITY = 100;
export const WIN_YEAR = 10;
export const WIN_QUARTER_IN_YEAR = 4;
export const DECISION_LIMITS = {
  priceMin: 1,
  priceMax: 1_000_000_000,
  hiresMin: 0,
  hiresMax: 1_000,
  salaryPctMin: 50,
  salaryPctMax: 200,
} as const;

export function quarterLabel(quarter: number): { year: number; quarterInYear: number } {
  // Quarter index is 1-based: 1 => Y1 Q1, 2 => Y1 Q2, ..., 5 => Y2 Q1.
  const year = Math.floor((quarter - 1) / 4) + 1;
  const quarterInYear = ((quarter - 1) % 4) + 1;
  return { year, quarterInYear };
}

export function simulateQuarter(state: GameState, decision: AdvanceDecisionInput): QuarterOutcome {
  // Input normalization/clamping protects model invariants from malformed client input.
  const hiredEngineers = Math.max(DECISION_LIMITS.hiresMin, Math.min(DECISION_LIMITS.hiresMax, Math.floor(decision.newEngineers)));
  const hiredSales = Math.max(DECISION_LIMITS.hiresMin, Math.min(DECISION_LIMITS.hiresMax, Math.floor(decision.newSales)));
  const salaryPct = Math.max(DECISION_LIMITS.salaryPctMin, Math.min(DECISION_LIMITS.salaryPctMax, decision.salaryPct));
  const price = Math.max(DECISION_LIMITS.priceMin, Math.min(DECISION_LIMITS.priceMax, decision.price));

  const engineers = state.engineers + hiredEngineers;
  const salesStaff = state.sales_staff + hiredSales;
  const salaryCostPerPerson = (salaryPct / 100) * INDUSTRY_AVG_SALARY;

  const productQuality = Math.min(MAX_QUALITY, state.product_quality + engineers * QUALITY_PER_ENGINEER);
  const demand = Math.max(0, productQuality * 10 - price * 0.0001);
  const unitsSold = Math.max(0, Math.floor(demand * salesStaff * 0.5));

  const revenue = price * unitsSold;
  const totalPayroll = salaryCostPerPerson * (engineers + salesStaff);
  const netIncome = revenue - totalPayroll;
  const hireCost = (hiredEngineers + hiredSales) * NEW_HIRE_COST;
  const cashEnd = state.cash + netIncome - hireCost;
  const nextQuarter = state.quarter + 1;
  // History row uses the quarter being played this turn (state.quarter).
  const { year, quarterInYear } = quarterLabel(state.quarter);

  let status: QuarterOutcome['status'] = 'active';
  // Loss takes precedence if both conditions could happen in the same quarter.
  if (cashEnd <= 0) {
    status = 'lost';
  } else if (year === WIN_YEAR && quarterInYear === WIN_QUARTER_IN_YEAR) {
    status = 'won';
  }

  return {
    nextQuarter,
    revenue,
    netIncome,
    cashEnd,
    unitsSold,
    engineers,
    salesStaff,
    productQuality,
    year,
    quarterInYear,
    status,
    cumulativeProfit: state.cumulative_profit + netIncome,
  };
}

export const DEFAULT_GAME = {
  quarter: 1,
  cash: 1_000_000,
  engineers: 4,
  sales_staff: 2,
  product_quality: 50,
  cumulative_profit: 0,
  status: 'active' as const,
};
