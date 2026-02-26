'use client';

import { QuarterHistoryRow } from '@/types/game';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface MetricsTrendChartProps {
  history: QuarterHistoryRow[];
}

function compact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(1);
}

function formatQuarter(row: QuarterHistoryRow) {
  return `Y${row.year} Q${row.quarter_in_year}`;
}

function CardChart({
  title,
  data,
  dataKey,
  color,
  unit,
}: {
  title: string;
  data: Array<Record<string, number | string>>;
  dataKey: string;
  color: string;
  unit: string;
}) {
  return (
    <article className="card axis-chart-card">
      <h4>{title}</h4>
      <div className="rechart-wrap">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d6deea" />
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 11, fill: '#556980' }}
              tickMargin={6}
              interval={0}
              minTickGap={0}
            />
            <YAxis tick={{ fontSize: 11, fill: '#556980' }} tickFormatter={(v) => compact(Number(v))} width={48} />
            <Tooltip
              formatter={(value: number) => [`${compact(Number(value))} ${unit}`, title]}
              labelFormatter={(label) => `Quarter: ${label}`}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default function MetricsTrendChart({ history }: MetricsTrendChartProps) {
  if (history.length === 0) {
    return (
      <section className="card chart-card">
        <h3>Last 4 Quarters</h3>
        <p>No quarter data yet.</p>
      </section>
    );
  }

  const recent = history.slice(-4);

  const data = recent.map((h) => {
    const employees = Number(h.engineers + h.sales_staff);
    return {
      quarter: formatQuarter(h),
      cash: Number(h.cash_end),
      revenue: Number(h.revenue),
      netIncome: Number(h.net_income),
      employees,
    };
  });

  return (
    <section className="chart-grid">
      <CardChart title="Cash" data={data} dataKey="cash" color="#2e5ea8" unit="$" />
      <CardChart title="Revenue" data={data} dataKey="revenue" color="#2f9f69" unit="$" />
      <CardChart title="Net Income" data={data} dataKey="netIncome" color="#c47138" unit="$" />
      <CardChart title="Employees (Count)" data={data} dataKey="employees" color="#7a4fc4" unit="people" />
    </section>
  );
}
