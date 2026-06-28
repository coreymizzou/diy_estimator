import type { Scenario } from '../data/types';
import { computeEstimate, formatCurrency, formatRange } from '../lib/calculations';
import { overallConfidence } from '../lib/findings';
import { Card, Badge } from './ui';

export default function SummaryPanel({ scenario }: { scenario: Scenario }) {
  const result = computeEstimate(scenario);
  const confidence = overallConfidence(scenario);
  const unresolvedCount = Object.values(scenario.capabilities).filter(c => c.treatment === 'Unknown').length
    + scenario.costItems.filter(i => i.treatment === 'Unknown' && i.included).length;

  const confidenceTone = confidence === 'High' ? 'green' : confidence === 'Medium' ? 'amber' : 'red';

  return (
    <div className="space-y-4 sticky top-4">
      <Card title={`Total through go-live (${scenario.profile.implementationMonths}-mo. implementation)`}>
        <p className="text-lg font-semibold text-slate-900">{formatCurrency(result.initialTotal.low)} – {formatCurrency(result.initialTotal.high)}</p>
        <p className="text-xs text-slate-500">Planning midpoint:{formatCurrency(result.initialTotal.expected)}</p>
      </Card>
      <Card title="Steady-state annual operating (post go-live)">
        <p className="text-lg font-semibold text-slate-900">{formatCurrency(result.recurringAnnualTotal.low)} – {formatCurrency(result.recurringAnnualTotal.high)}</p>
        <p className="text-xs text-slate-500">Planning midpoint:{formatCurrency(result.recurringAnnualTotal.expected)}</p>
      </Card>
      <Card title={`Total through ${result.years}-year operating period (base)`}>
        <p className="text-lg font-semibold text-slate-900">{formatCurrency(result.periodTotal.low)} – {formatCurrency(result.periodTotal.high)}</p>
        <p className="text-xs text-slate-500">Planning midpoint: {formatCurrency(result.periodTotal.expected)}</p>
      </Card>
      {scenario.contingency.enabled && (
        <Card title="With contingency (optional adjustment)" className="border-amber-200 bg-amber-50">
          <p className="text-lg font-semibold text-slate-900">{formatCurrency(result.periodTotalWithContingency.low)} – {formatCurrency(result.periodTotalWithContingency.high)}</p>
          <p className="text-xs text-slate-600">Adds {formatCurrency(result.contingencyAmount.low)} – {formatCurrency(result.contingencyAmount.high)} contingency on top of the base range above. Confirm this doesn't double-count uncertainty already reflected in the base range.</p>
        </Card>
      )}
      <Card title="FTE-years (period)">
        <p className="text-lg font-semibold text-slate-900">{result.fteYearsTotal.low.toFixed(1)} – {result.fteYearsTotal.high.toFixed(1)}</p>
        <p className="text-xs text-slate-500">Planning midpoint:{result.fteYearsTotal.expected.toFixed(1)} FTE-years</p>
      </Card>
      <Card title="New cash required">
        <p className="text-base font-semibold text-blue-900">{formatRange(result.newCashVsCapacity.newCash)}</p>
      </Card>
      <Card title="Existing capacity consumed">
        <p className="text-base font-semibold text-slate-700">{formatRange(result.newCashVsCapacity.existingCapacity)}</p>
      </Card>
      <Card title="Status">
        <div className="flex flex-col gap-2">
          <div>Unresolved assumptions: <Badge tone={unresolvedCount > 0 ? 'amber' : 'green'}>{unresolvedCount}</Badge></div>
          <div>Overall confidence: <Badge tone={confidenceTone as any}>{confidence}</Badge></div>
        </div>
      </Card>
    </div>
  );
}
