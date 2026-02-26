'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import { DECISION_LIMITS } from '@/lib/simulation';

interface DecisionPanelProps {
  bankrupt: boolean;
  won: boolean;
}

export default function DecisionPanel({ bankrupt, won }: DecisionPanelProps) {
  const router = useRouter();
  const disabled = bankrupt || won;
  const [price, setPrice] = useState('1000');
  const [newEngineers, setNewEngineers] = useState('0');
  const [newSales, setNewSales] = useState('0');
  const [salaryPct, setSalaryPct] = useState('100');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  function parseOrDefault(value: string, fallback: number): number {
    if (value.trim() === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  async function advanceQuarter() {
    setSubmitting(true);
    setError(null);

    try {
      const parsedPrice = clamp(
        parseOrDefault(price, DECISION_LIMITS.priceMin),
        DECISION_LIMITS.priceMin,
        DECISION_LIMITS.priceMax,
      );
      const parsedNewEngineers = clamp(
        parseOrDefault(newEngineers, DECISION_LIMITS.hiresMin),
        DECISION_LIMITS.hiresMin,
        DECISION_LIMITS.hiresMax,
      );
      const parsedNewSales = clamp(
        parseOrDefault(newSales, DECISION_LIMITS.hiresMin),
        DECISION_LIMITS.hiresMin,
        DECISION_LIMITS.hiresMax,
      );
      const parsedSalaryPct = clamp(
        parseOrDefault(salaryPct, 100),
        DECISION_LIMITS.salaryPctMin,
        DECISION_LIMITS.salaryPctMax,
      );

      const response = await fetch(`${API_BASE}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: parsedPrice,
          newEngineers: parsedNewEngineers,
          newSales: parsedNewSales,
          salaryPct: parsedSalaryPct,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data?.status === 'lost' || data?.status === 'won' || data?.error === 'Game already finished') {
          router.refresh();
          return;
        }
        throw new Error(data.error ?? 'Could not advance quarter');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  }

  async function resetSimulation() {
    setResetting(true);
    setResetError(null);

    try {
      const response = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Could not reset simulation');
      }
      router.refresh();
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setResetting(false);
    }
  }

  return (
    <section className="card">
      <h2>Quarterly Decisions</h2>
      <div className="decision-grid">
        <label>
          Unit Price ($)
          <input
            type="number"
            min={DECISION_LIMITS.priceMin}
            max={DECISION_LIMITS.priceMax}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={disabled || submitting}
          />
        </label>
        <label>
          New Engineers
          <input
            type="number"
            min={DECISION_LIMITS.hiresMin}
            max={DECISION_LIMITS.hiresMax}
            value={newEngineers}
            onChange={(e) => setNewEngineers(e.target.value)}
            disabled={disabled || submitting}
          />
        </label>
        <label>
          New Sales Staff
          <input
            type="number"
            min={DECISION_LIMITS.hiresMin}
            max={DECISION_LIMITS.hiresMax}
            value={newSales}
            onChange={(e) => setNewSales(e.target.value)}
            disabled={disabled || submitting}
          />
        </label>
        <label>
          Salary (% of industry)
          <input
            type="number"
            min={DECISION_LIMITS.salaryPctMin}
            max={DECISION_LIMITS.salaryPctMax}
            value={salaryPct}
            onChange={(e) => setSalaryPct(e.target.value)}
            disabled={disabled || submitting}
          />
        </label>
      </div>

      {bankrupt ? (
        <button type="button" className="danger" onClick={resetSimulation} disabled={resetting}>
          {resetting ? 'Resetting...' : 'Reset Simulation'}
        </button>
      ) : (
        <>
          <button type="button" onClick={advanceQuarter} disabled={disabled || submitting}>
            {submitting ? 'Advancing...' : 'Advance Quarter'}
          </button>
          <button type="button" className="inline-link" onClick={resetSimulation} disabled={resetting}>
            {resetting ? 'Resetting...' : 'Reset Simulation'}
          </button>
        </>
      )}
      {error ? <p className="error">{error}</p> : null}
      {resetError ? <p className="error">{resetError}</p> : null}
    </section>
  );
}

