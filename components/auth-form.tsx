'use client';

import { useState, type FormEvent } from 'react';
import { API_BASE } from '@/lib/api';

type Mode = 'login' | 'signup';

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [awaitingDashboard, setAwaitingDashboard] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'notice'>('error');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setMessageType('error');
    let navigatingToDashboard = false;

    const endpoint = mode === 'login' ? `${API_BASE}/auth/login` : `${API_BASE}/auth/signup`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      if (!response.ok) {
        setMessage(data?.error ?? `Authentication failed (${response.status})`);
        return;
      }

      if (mode === 'signup') {
        setMessageType('notice');
        setMessage(
          'Account created. Check your email inbox and spam folder for the confirmation link, then sign in.',
        );
        return;
      }

      // Force full navigation so freshly set auth cookies are guaranteed on the next request.
      setAwaitingDashboard(true);
      navigatingToDashboard = true;
      window.location.assign('/dashboard');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setMessage('Request timed out. Please try again.');
      } else {
        setMessage('Network error. Please try again.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (!navigatingToDashboard) {
        setLoading(false);
      }
    }
  }

  return (
    <section className="card auth-card">
      <h1>CleanStart Simulation</h1>
      <p>{mode === 'login' ? 'Sign in to continue your startup run.' : 'Create an account to start your run.'}</p>
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? (awaitingDashboard ? 'Loading dashboard...' : 'Please wait...') : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
      </button>
      {message ? <p className={messageType === 'error' ? 'error' : 'notice'}>{message}</p> : null}
    </section>
  );
}



