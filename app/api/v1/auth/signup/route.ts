import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createRouteHandlerClient();
  const body = await request.json();

  const { error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
