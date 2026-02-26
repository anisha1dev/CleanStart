import { NextResponse } from 'next/server';
import { getOrCreateGame, resetGameForUser } from '@/lib/game-store';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const game = await getOrCreateGame(user.id);
    await resetGameForUser(user.id, game.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not reset simulation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
