import { DEFAULT_GAME, quarterLabel } from '@/lib/simulation';
import { createClient } from '@/lib/supabase/server';
import { withTimeout } from '@/lib/timeout';
import { GameState, QuarterHistoryRow } from '@/types/game';

export async function getOrCreateGame(userId: string): Promise<GameState> {
  const supabase = await createClient();

  const { data: existing, error: selectError } = await withTimeout(
    supabase.from('games').select('*').eq('user_id', userId).maybeSingle(),
    6000,
    'Load game',
  );

  if (selectError) throw selectError;
  // One game per user; create initial state on first access.
  if (existing) return existing as GameState;

  const { data: created, error: insertError } = await withTimeout(
    supabase.from('games').insert({ user_id: userId, ...DEFAULT_GAME }).select('*').single(),
    6000,
    'Create game',
  );

  if (insertError) throw insertError;
  return created as GameState;
}

export async function getRecentHistory(gameId: string, limit = 4): Promise<QuarterHistoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await withTimeout(
    supabase
      .from('quarter_history')
      .select('*')
      .eq('game_id', gameId)
      .order('quarter', { ascending: false })
      .limit(limit),
    6000,
    'Load history',
  );

  if (error) throw error;
  // Query newest-first for DB efficiency, then reverse for chart display.
  return ((data ?? []) as QuarterHistoryRow[]).reverse();
}

export async function resetGameForUser(userId: string, gameId: string): Promise<void> {
  const supabase = await createClient();

  // Clear dependent history first, then reset the game row to defaults.
  const { error: historyError } = await withTimeout(
    supabase.from('quarter_history').delete().eq('game_id', gameId),
    6000,
    'Clear history',
  );
  if (historyError) throw historyError;

  const { error: gameError } = await withTimeout(
    supabase
      .from('games')
      .update({
        ...DEFAULT_GAME,
      })
      .eq('id', gameId)
      .eq('user_id', userId),
    6000,
    'Reset game',
  );

  if (gameError) throw gameError;
}

export function readableQuarter(quarter: number): string {
  const { year, quarterInYear } = quarterLabel(quarter);
  return `Y${year} Q${quarterInYear}`;
}
