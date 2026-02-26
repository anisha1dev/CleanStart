'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { API_BASE } from '@/lib/api';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <button type="button" className="inline-link" onClick={logout} disabled={loading}>
      {loading ? 'Logging out...' : 'Log out'}
    </button>
  );
}

