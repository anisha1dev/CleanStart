import { NextResponse } from 'next/server';
import { getOrCreateGame } from '@/lib/game-store';
import { DECISION_LIMITS, simulateQuarter } from '@/lib/simulation';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const price = Number(body.price);
  const newEngineers = Number(body.newEngineers);
  const newSales = Number(body.newSales);
  const salaryPct = Number(body.salaryPct);

  if (![price, newEngineers, newSales, salaryPct].every((value) => Number.isFinite(value))) {
    return NextResponse.json({ error: 'Invalid decision input' }, { status: 400 });
  }
  if (price < DECISION_LIMITS.priceMin || price > DECISION_LIMITS.priceMax) {
    return NextResponse.json(
      { error: `Price must be between ${DECISION_LIMITS.priceMin} and ${DECISION_LIMITS.priceMax}` },
      { status: 400 },
    );
  }
  if (newEngineers < DECISION_LIMITS.hiresMin || newEngineers > DECISION_LIMITS.hiresMax) {
    return NextResponse.json(
      { error: `New engineers must be between ${DECISION_LIMITS.hiresMin} and ${DECISION_LIMITS.hiresMax}` },
      { status: 400 },
    );
  }
  if (newSales < DECISION_LIMITS.hiresMin || newSales > DECISION_LIMITS.hiresMax) {
    return NextResponse.json(
      { error: `New sales must be between ${DECISION_LIMITS.hiresMin} and ${DECISION_LIMITS.hiresMax}` },
      { status: 400 },
    );
  }
  if (salaryPct < DECISION_LIMITS.salaryPctMin || salaryPct > DECISION_LIMITS.salaryPctMax) {
    return NextResponse.json(
      { error: `Salary % must be between ${DECISION_LIMITS.salaryPctMin} and ${DECISION_LIMITS.salaryPctMax}` },
      { status: 400 },
    );
  }

  const game = await getOrCreateGame(user.id);
  // Guard against advancing after terminal states. UI should show reset path instead.
  if (game.status !== 'active') {
    return NextResponse.json({ error: 'Cannot advance', status: game.status }, { status: 400 });
  }

  // Simulation is server-authoritative; client never computes outcomes.
  const outcome = simulateQuarter(game, { price, newEngineers, newSales, salaryPct });

  // Persist game state first, then append immutable quarter history.
  const { error: updateError } = await supabase
    .from('games')
    .update({
      quarter: outcome.nextQuarter,
      cash: outcome.cashEnd,
      engineers: outcome.engineers,
      sales_staff: outcome.salesStaff,
      product_quality: outcome.productQuality,
      status: outcome.status,
      cumulative_profit: outcome.cumulativeProfit,
    })
    .eq('id', game.id)
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: historyError } = await supabase.from('quarter_history').insert({
    game_id: game.id,
    // This history row represents the quarter that just completed.
    quarter: game.quarter,
    year: outcome.year,
    quarter_in_year: outcome.quarterInYear,
    price,
    salary_pct: salaryPct,
    hired_engineers: Math.max(DECISION_LIMITS.hiresMin, Math.min(DECISION_LIMITS.hiresMax, Math.floor(newEngineers))),
    hired_sales: Math.max(DECISION_LIMITS.hiresMin, Math.min(DECISION_LIMITS.hiresMax, Math.floor(newSales))),
    revenue: outcome.revenue,
    net_income: outcome.netIncome,
    cash_end: outcome.cashEnd,
    engineers: outcome.engineers,
    sales_staff: outcome.salesStaff,
    product_quality: outcome.productQuality,
    units_sold: outcome.unitsSold,
  });

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, outcome });
}
