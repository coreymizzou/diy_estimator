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
            <th className="py-1 pr-2 no-print">Calculation</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter(r => r.initialFte.expected > 0 || r.recurringFte.expected > 0).map(r => (
            <tr key={r.roleId} className="border-b border-slate-100 align-top">
              <td className="py-1 pr-2 text-slate-800">{r.label}</td>
              <td className="py-1 pr-2">{r.initialFte.expected.toFixed(2)}</td>
              <td className="py-1 pr-2">{r.recurringFte.expected.toFixed(2)}</td>
              <td className="py-1 pr-2">{scenario.laborRates.basis === 'Mixed team' || scenario.laborRates.basis === 'Custom' ? `${scenario.laborRates.mixGovPercent}% gov` : scenario.laborRates.basis}</td>
              <td className="py-1 pr-2">{formatCurrency(rate(r.roleId))}</td>
              <td className="py-1 pr-2">{formatCurrency(r.newCash.expected)}</td>
              <td className="py-1 pr-2">{formatCurrency(r.existingCapacity.expected)}</td>
              <td className="py-1 pr-2 no-print">
                {r.calculationTrace.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-blue-700">View calculation</summary>
                    <ul className="mt-1 space-y-1 text-slate-600 max-w-xs">
                      {r.calculationTrace.map(step => (
                        <li key={step.id}>
                          <span className="font-medium text-slate-800">{step.label}</span>
                          {step.operation === 'multiply' && ` (×${step.value.toFixed(2)})`}
                          : {step.explanation}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-500 mt-2">
        <Badge tone="blue">FTE allocation</Badge> values represent partial or full-time equivalents, not mandatory headcount.
        Every adjustment beyond rate × FTE × months is listed under "View calculation" for that role.
      </p>
    </Card>
  );
}
