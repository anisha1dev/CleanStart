import { redirect } from 'next/navigation';
import DecisionPanel from '@/components/decision-panel';
import LogoutButton from '@/components/logout-button';
import OfficeVisualization from '@/components/office-visualization';
import { getOrCreateGame, getRecentHistory, readableQuarter } from '@/lib/game-store';
import { WIN_YEAR } from '@/lib/simulation';
import { getUserSafe } from '@/lib/supabase/get-user-safe';
import { createClient } from '@/lib/supabase/server';
import MetricsTrendChart from '@/components/metrics-trend-chart';
import EmployeeRatioPie from '@/components/employee-ratio-pie';

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    value,
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getUserSafe(supabase, 8000);

  if (!user) {
    redirect('/login');
  }

  try {
    const game = await getOrCreateGame(user.id);
    const history = await getRecentHistory(game.id, 4);
    const username = user.email?.split('@')[0] || user.email || user.id;

    const bankrupt = game.status === 'lost';
    const won = game.status === 'won';
    const quarter = readableQuarter(game.quarter);
    const latestQuarter = history[history.length - 1];

    return (
      <main className="dashboard">
        <header className="topbar">
          <div>
            <h1>Startup Simulation</h1>
            <p>Current quarter: {quarter}</p>
          </div>
          <div className="topbar-actions">
            <div className="account-meta">
              <LogoutButton />
              <p>Logged in as {username}</p>
            </div>
          </div>
        </header>

        {bankrupt ? <div className="banner lose">GAME OVER: Bankrupt</div> : null}
        {won ? (
          <div className="banner win">
            You reached Year {WIN_YEAR} with positive cash. Cumulative profit: {money(game.cumulative_profit)}
          </div>
        ) : null}

        <section className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <DecisionPanel bankrupt={bankrupt} won={won} />
            <EmployeeRatioPie engineers={game.engineers} sales={game.sales_staff} />
          </aside>

          <div className="dashboard-main">
            <section className="card kpi-strip" aria-label="Quarter summary">
              <p>Cash: {money(Number(game.cash))}</p>
              <p>Revenue (last qtr): {money(Number(latestQuarter?.revenue ?? 0))}</p>
              <p>Net Income (last qtr): {money(Number(latestQuarter?.net_income ?? 0))}</p>
              <p>
                Headcount: Eng {game.engineers} | Sales {game.sales_staff}
              </p>
              <p>Current Quarter: {quarter}</p>
            </section>
            <MetricsTrendChart history={history} />
            <OfficeVisualization engineers={game.engineers} sales={game.sales_staff} />
          </div>
        </section>
      </main>
    );
  } catch {
    return (
      <main className="dashboard">
        <section className="card">
          <h2>Dashboard unavailable</h2>
          <p>Backend request timed out. Refresh to retry.</p>
        </section>
      </main>
    );
  }
}
