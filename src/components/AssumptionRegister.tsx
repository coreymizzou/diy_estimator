import { useMemo, useState } from 'react';
import type { Scenario } from '../data/types';
import { buildAssumptionRegister } from '../lib/assumptionRegister';
import { formatCurrency } from '../lib/calculations';
import { Card, Select, TextInput, Badge } from './ui';

const FILTERS = ['All', 'Labor', 'Cloud', 'Cyber/authorization', 'Tooling', 'Operations', 'Migration', 'Unknown', 'Low confidence', 'Not customer validated'];

export default function AssumptionRegister({ scenario }: { scenario: Scenario }) {
  const rows = useMemo(() => buildAssumptionRegister(scenario), [scenario]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = rows.filter(r => {
    if (search && !r.assumption.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'All') return true;
    if (filter === 'Low confidence') return r.confidence === 'Low';
    if (filter === 'Not customer validated') return !r.customerValidated;
    return r.tag === filter;
  });

  return (
    <Card title="Assumption register">
      <div className="flex gap-3 mb-3">
        <TextInput placeholder="Search assumptions..." value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={filter} options={FILTERS} onChange={setFilter} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-1 pr-2">Assumption</th>
              <th className="py-1 pr-2">Value</th>
              <th className="py-1 pr-2">Low</th>
              <th className="py-1 pr-2">Expected</th>
              <th className="py-1 pr-2">High</th>
              <th className="py-1 pr-2">Source</th>
              <th className="py-1 pr-2">Owner</th>
              <th className="py-1 pr-2">Confidence</th>
              <th className="py-1 pr-2">Validated</th>
              <th className="py-1 pr-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="py-1 pr-2 text-slate-800">{r.assumption}</td>
                <td className="py-1 pr-2 text-slate-600">{r.value}</td>
                <td className="py-1 pr-2">{formatCurrency(r.low)}</td>
                <td className="py-1 pr-2">{formatCurrency(r.expected)}</td>
                <td className="py-1 pr-2">{formatCurrency(r.high)}</td>
                <td className="py-1 pr-2 text-slate-500">{r.source}</td>
                <td className="py-1 pr-2 text-slate-500">{r.owner}</td>
                <td className="py-1 pr-2"><Badge tone={r.confidence === 'Low' || r.confidence === 'Unknown' ? 'amber' : 'green'}>{r.confidence}</Badge></td>
                <td className="py-1 pr-2">{r.customerValidated ? <Badge tone="green">Yes</Badge> : <Badge tone="amber">No</Badge>}</td>
                <td className="py-1 pr-2 text-slate-500">{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-xs text-slate-500 py-4">No assumptions match this filter.</p>}
      </div>
    </Card>
  );
}
