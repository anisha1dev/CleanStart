import { redirect } from 'next/navigation';
import { getUserSafe } from '@/lib/supabase/get-user-safe';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const user = await getUserSafe(supabase, 3000);

  if (user) {
    redirect('/dashboard');
  }

  redirect('/login');
}
