import type { Scenario } from '../data/types';
import type { LaborSummaryRow } from '../lib/calculations';
import { formatCurrency } from '../lib/calculations';
import { Card, Badge } from './ui';

export default function FteSummary({ scenario, rows }: { scenario: Scenario; rows: LaborSummaryRow[] }) {
  const rate = (roleId: LaborSummaryRow['roleId']) => {
    const r = scenario.laborRates.rates[roleId];
    const basis = scenario.laborRates.basis;
    if (basis === 'Government civilian') return r.govExpected;
    if (basis === 'Contractor') return r.ctrExpected;
    const g = scenario.laborRates.mixGovPercent / 100;
    return r.govExpected * g + r.ctrExpected * (1 - g);
  };

  return (
    <Card title="FTE summary by role">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            <th className="py-1 pr-2">Role</th>
            <th className="py-1 pr-2">Initial FTE (exp.)</th>
            <th className="py-1 pr-2">Recurring FTE (exp.)</th>
            <th className="py-1 pr-2">Gov/Contractor mix</th>
            <th className="py-1 pr-2">Annual loaded rate</th>
            <th className="py-1 pr-2">New funding</th>
            <th className="py-1 pr-2">Existing capacity</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter(r => r.initialFte.expected > 0 || r.recurringFte.expected > 0).map(r => (
            <tr key={r.roleId} className="border-b border-slate-100">
              <td className="py-1 pr-2 text-slate-800">{r.label}</td>
              <td className="py-1 pr-2">{r.initialFte.expected.toFixed(2)}</td>
              <td className="py-1 pr-2">{r.recurringFte.expected.toFixed(2)}</td>
              <td className="py-1 pr-2">{scenario.laborRates.basis === 'Mixed team' || scenario.laborRates.basis === 'Custom' ? `${scenario.laborRates.mixGovPercent}% gov` : scenario.laborRates.basis}</td>
              <td className="py-1 pr-2">{formatCurrency(rate(r.roleId))}</td>
              <td className="py-1 pr-2">{formatCurrency(r.newCash.expected)}</td>
              <td className="py-1 pr-2">{formatCurrency(r.existingCapacity.expected)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-500 mt-2">
        <Badge tone="blue">FTE allocation</Badge> values represent partial or full-time equivalents, not mandatory headcount.
      </p>
    </Card>
  );
}
