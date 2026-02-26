create extension if not exists "pgcrypto";

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  quarter integer not null default 1,
  cash numeric not null default 1000000,
  engineers integer not null default 4,
  sales_staff integer not null default 2,
  product_quality numeric not null default 50,
  cumulative_profit numeric not null default 0,
  status text not null default 'active' check (status in ('active', 'won', 'lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quarter_history (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  quarter integer not null,
  year integer not null,
  quarter_in_year integer not null,
  price numeric not null,
  salary_pct numeric not null,
  hired_engineers integer not null,
  hired_sales integer not null,
  revenue numeric not null,
  net_income numeric not null,
  cash_end numeric not null,
  engineers integer not null,
  sales_staff integer not null,
  product_quality numeric not null,
  units_sold integer not null,
  created_at timestamptz not null default now()
);

create index if not exists quarter_history_game_quarter_idx on public.quarter_history (game_id, quarter desc);

alter table public.games enable row level security;
alter table public.quarter_history enable row level security;

drop policy if exists "games_select_own" on public.games;
create policy "games_select_own" on public.games
for select using (auth.uid() = user_id);

drop policy if exists "games_insert_own" on public.games;
create policy "games_insert_own" on public.games
for insert with check (auth.uid() = user_id);

drop policy if exists "games_update_own" on public.games;
create policy "games_update_own" on public.games
for update using (auth.uid() = user_id);

drop policy if exists "history_select_own" on public.quarter_history;
create policy "history_select_own" on public.quarter_history
for select using (
  exists (
    select 1 from public.games g
    where g.id = quarter_history.game_id and g.user_id = auth.uid()
  )
);

drop policy if exists "history_insert_own" on public.quarter_history;
create policy "history_insert_own" on public.quarter_history
for insert with check (
  exists (
    select 1 from public.games g
    where g.id = quarter_history.game_id and g.user_id = auth.uid()
  )
);

drop policy if exists "history_delete_own" on public.quarter_history;
create policy "history_delete_own" on public.quarter_history
for delete using (
  exists (
    select 1 from public.games g
    where g.id = quarter_history.game_id and g.user_id = auth.uid()
  )
);
