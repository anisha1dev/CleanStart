# CleanStart Simulation

Single-player, turn-based startup simulation inspired by MIT CleanStart. Each turn is one quarter.

## What was built

- Email/password auth with Supabase (`/login`) and persisted session cookies.
- Server-authoritative simulation: decisions post to `POST /api/v1/advance`; model runs on server only.
- Per-user persisted game state (`games`) and quarter history (`quarter_history`).
- Dashboard with required metrics: cash, revenue, net income, headcount, current quarter.
- Last 4 quarters shown as a trend chart.
- Office visualization with visible empty desks and role-based coloring (Engineering vs Sales).
- Win/Lose states:
  - Lose when cash reaches 0 (or below) at end of quarter.
  - Win at Year 10 Q4 with positive cash; displays cumulative profit.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and set Supabase values.
3. Run `supabase/schema.sql` in your Supabase SQL editor.
4. `npm run dev`

## Tests

- Run once: `npm test`
- Watch mode: `npm run test:watch`

## How to play

1. Sign up or log in with email/password.
2. Enter quarterly decisions:
   - Unit price
   - New engineers to hire
   - New sales staff to hire
   - Salary as % of industry average (default 100)
3. Click `Advance Quarter` to run one server-side quarter.
4. Review updated results:
   - Charts (last 4 quarters): cash, revenue, net income, employees
   - Employee ratio pie chart
   - Office visualization (engineering/sales/empty desks)
5. Repeat until:
   - `GAME OVER: Bankrupt` when cash reaches zero, or
   - Win at Year 10 Q4 with positive cash.
6. Use `Reset Simulation` to start over from initial state.

## Simulation model implementation notes

Implemented per prompt with one explicit sequencing assumption:

- New hires are applied at the start of the quarter, so they affect quality, units sold capacity, and payroll in that same quarter.
- New hire one-time cost (`$5,000` each) is deducted from cash in the same quarter.

No model constant changes were made.

## API surface

- `POST /api/v1/auth/signup` - email/password signup
- `POST /api/v1/auth/login` - email/password login
- `POST /api/v1/auth/logout` - log out
- `POST /api/v1/advance` - submit decisions and advance one quarter
- `POST /api/v1/reset` - reset game state and clear quarter history

## Codebase guide

- `app/dashboard/page.tsx`: main authenticated screen; loads current game + last 4 quarters.
- `components/decision-panel.tsx`: quarter inputs and actions (`Advance`, `Reset`).
- `components/metrics-trend-chart.tsx`: required dashboard trend charts.
- `components/employee-ratio-pie.tsx`: engineer vs sales ratio pie chart.
- `components/office-visualization.tsx`: office desk visualization (eng/sales/empty).
- `app/api/v1/advance/route.ts`: server-authoritative turn advance endpoint.
- `app/api/v1/reset/route.ts`: reset endpoint (game + history).
- `lib/simulation.ts`: simulation model implementation.
- `lib/game-store.ts`: data access helpers for game and history.
- `types/game.ts`: shared domain types.
- `supabase/schema.sql`: database schema + RLS policies.

## Request flow

1. UI posts decisions to `POST /api/v1/advance`.
2. Server validates input and auth.
3. Server runs `simulateQuarter(...)` in `lib/simulation.ts`.
4. Server persists updated `games` row + one `quarter_history` row.
5. UI calls `router.refresh()` and re-renders from server state.

## Tradeoffs

- No optimistic UI or background polling; the dashboard refreshes after each authoritative turn advance.

## Known issues

- If Supabase email confirmation is enabled, users must confirm email before first login.
