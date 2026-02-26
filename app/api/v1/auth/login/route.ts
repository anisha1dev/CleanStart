import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { withTimeout } from '@/lib/timeout';

export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const body = await request.json();

    const { error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      }),
      7000,
      'Login',
    );

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('email not confirmed') || msg.includes('email not verified')) {
        return NextResponse.json(
          { error: 'Email not confirmed. Check inbox/spam, click confirmation link, then sign in again.' },
          { status: 400 },
        );
      }
      if (msg.includes('invalid login credentials')) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
