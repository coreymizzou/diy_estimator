import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { CategoryBreakdown, CostTypeBreakdown } from '../lib/calculations';

export function CategoryBarChart({ data }: { data: CategoryBreakdown[] }) {
  const chartData = data.map(d => ({
    name: d.category,
    Low: Math.round(d.periodTotal.low),
    Expected: Math.round(d.periodTotal.expected),
    High: Math.round(d.periodTotal.high),
  }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="name" width={220} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
        <Legend />
        <Bar dataKey="Low" fill="#bfdbfe" />
        <Bar dataKey="Expected" fill="#3b82f6" />
        <Bar dataKey="High" fill="#1d4ed8" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CostTypeBarChart({ data }: { data: CostTypeBreakdown[] }) {
  const chartData = data.map(d => ({ name: d.type, Expected: Math.round(d.amount.expected) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
        <Bar dataKey="Expected" fill="#0ea5e9" />
      </BarChart>
    </ResponsiveContainer>
  );
}
