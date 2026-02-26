export type GameStatus = 'active' | 'won' | 'lost';

export interface GameState {
  id: string;
  user_id: string;
  quarter: number;
  cash: number;
  engineers: number;
  sales_staff: number;
  product_quality: number;
  cumulative_profit: number;
  status: GameStatus;
  created_at?: string;
  updated_at?: string;
}

export interface QuarterHistoryRow {
  id: string;
  game_id: string;
  quarter: number;
  year: number;
  quarter_in_year: number;
  price: number;
  salary_pct: number;
  hired_engineers: number;
  hired_sales: number;
  revenue: number;
  net_income: number;
  cash_end: number;
  engineers: number;
  sales_staff: number;
  product_quality: number;
  units_sold: number;
  created_at?: string;
}

export interface AdvanceDecisionInput {
  price: number;
  newEngineers: number;
  newSales: number;
  salaryPct: number;
}

export interface QuarterOutcome {
  nextQuarter: number;
  revenue: number;
  netIncome: number;
  cashEnd: number;
  unitsSold: number;
  engineers: number;
  salesStaff: number;
  productQuality: number;
  year: number;
  quarterInYear: number;
  status: GameStatus;
  cumulativeProfit: number;
}
