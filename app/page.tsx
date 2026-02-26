import { redirect } from 'next/navigation';

export default async function HomePage() {
  // Route root directly to dashboard; dashboard handles auth redirect to login.
  redirect('/dashboard');
}
