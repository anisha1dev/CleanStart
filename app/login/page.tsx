import { redirect } from 'next/navigation';
import AuthForm from '@/components/auth-form';
import { getUserSafe } from '@/lib/supabase/get-user-safe';
import { createClient } from '@/lib/supabase/server';

export default async function LoginPage() {
  const supabase = await createClient();
  const user = await getUserSafe(supabase);

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="page-center">
      <AuthForm />
    </main>
  );
}
