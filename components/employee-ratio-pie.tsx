'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface EmployeeRatioPieProps {
  engineers: number;
  sales: number;
}

export default function EmployeeRatioPie({ engineers, sales }: EmployeeRatioPieProps) {
  const total = engineers + sales;
  const engineersPct = total > 0 ? (engineers / total) * 100 : 0;
  const salesPct = total > 0 ? (sales / total) * 100 : 0;
  const data = [
    { name: 'Engineers', value: engineers, pct: engineersPct },
    { name: 'Sales & Admin', value: sales, pct: salesPct },
  ];

  return (
    <section className="card ratio-pie-card">
      <h4>Employee Ratio</h4>
      <div className="ratio-pie-chart-wrap" onMouseDown={(e) => e.preventDefault()}>
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Tooltip
              trigger="hover"
              cursor={false}
              formatter={(value: number, _n: string, entry: any) => [
                `${value} (${Number(entry?.payload?.pct ?? 0).toFixed(1)}%)`,
                'Count',
              ]}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={68}
              innerRadius={28}
              rootTabIndex={-1}
              style={{ cursor: 'default' }}
            >
              <Cell fill="var(--eng)" stroke="#7da9df" />
              <Cell fill="var(--sales)" stroke="#da9c69" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="ratio-pie-legend">
        <span>
          <i className="dot eng" /> Engineers: {engineers}
        </span>
        <span>
          <i className="dot sales" /> Sales &amp; Admin: {sales}
        </span>
      </div>
    </section>
  );
}
