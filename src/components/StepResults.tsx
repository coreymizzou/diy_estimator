import type { Scenario } from '../data/types';
import { computeEstimate, formatCurrency, formatRange } from '../lib/calculations';
import { generateFindings, topCostDrivers } from '../lib/findings';
import { Card, Badge } from './ui';
import { CategoryBarChart, CostTypeBarChart } from './Charts';
import ReadinessPanel from './ReadinessPanel';
import FteSummary from './FteSummary';
import AssumptionRegister from './AssumptionRegister';
import { exportScenarioJSON, exportCostLinesCSV } from '../lib/exports';

export default function StepResults({ scenario }: { scenario: Scenario }) {
  const result = computeEstimate(scenario);
  const findings = generateFindings(scenario, result);
  const drivers = topCostDrivers(result);

  const unknownCapabilities = Object.entries(scenario.capabilities).filter(([, c]) => c.treatment === 'Unknown' || c.level === 'Unknown');
  const lowConfidenceItems = scenario.costItems.filter(i => i.included && i.confidence === 'Low');

  return (
    <div className="space-y-4">
      <Card title="Primary estimates">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500">Total through go-live ({scenario.profile.implementationMonths}-month implementation)</p>
            <p className="text-base font-semibold">{formatRange(result.initialTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Steady-state annual operating (post go-live)</p>
            <p className="text-base font-semibold">{formatRange(result.recurringAnnualTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total through {result.years}-year operating period (base, no contingency)</p>
            <p className="text-base font-semibold">{formatRange(result.periodTotal)}</p>
          </div>
          {scenario.contingency.enabled && (
            <div>
              <p className="text-xs text-slate-500">{result.years}-year total (with optional contingency)</p>
              <p className="text-base font-semibold">{formatRange(result.periodTotalWithContingency)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500">FTE-years (period)</p>
            <p className="text-base font-semibold">{result.fteYearsTotal.low.toFixed(1)} – {result.fteYearsTotal.high.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">New cash required</p>
            <p className="text-base font-semibold text-blue-800">{formatRange(result.newCashVsCapacity.newCash)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Existing capacity consumed</p>
            <p className="text-base font-semibold">{formatRange(result.newCashVsCapacity.existingCapacity)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Initial FTE requirement</p>
            <p className="text-base font-semibold">{result.fteYearsInitial.expected.toFixed(2)} FTE-years (midpoint)</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Recurring FTE requirement</p>
            <p className="text-base font-semibold">{result.fteYearsRecurringAnnual.expected.toFixed(2)} FTE/year (midpoint)</p>
          </div>
        </div>
      </Card>

      <Card title="Breakdown by category (lower / midpoint / upper planning case)">
        <CategoryBarChart data={result.byCategory} />
      </Card>

      <Card title="Breakdown by cost type">
        <CostTypeBarChart data={result.byCostType} />
      </Card>

      <Card title="Top modeled cost drivers">
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          {drivers.map(d => (
            <li key={d.label}>{d.label}: <strong>{formatCurrency(d.expected)}</strong> planning midpoint over the analysis period</li>
          ))}
        </ol>
      </Card>

      <Card title="Neutral findings">
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          {findings.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      </Card>

      <FteSummary scenario={scenario} rows={result.laborRows} />

      <Card title="Major unknowns">
        <p className="text-sm text-slate-700 mb-2">Unresolved capability classifications:</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {unknownCapabilities.length === 0 && <Badge tone="green">None</Badge>}
          {unknownCapabilities.map(([id]) => <Badge key={id} tone="amber">{id}</Badge>)}
        </div>
        <p className="text-sm text-slate-700 mb-2">Low-confidence cost items:</p>
        <div className="flex flex-wrap gap-2">
          {lowConfidenceItems.length === 0 && <Badge tone="green">None</Badge>}
          {lowConfidenceItems.map(i => <Badge key={i.id} tone="amber">{i.name}</Badge>)}
        </div>
      </Card>

      <ReadinessPanel scenario={scenario} result={result} />

      <AssumptionRegister scenario={scenario} />

      <Card title="Exports">
        <div className="flex gap-3 no-print">
          <button onClick={() => exportScenarioJSON(scenario)} className="px-3 py-2 text-sm bg-slate-800 text-white rounded hover:bg-slate-700">Export scenario JSON</button>
          <button onClick={() => exportCostLinesCSV(scenario)} className="px-3 py-2 text-sm bg-slate-800 text-white rounded hover:bg-slate-700">Export cost lines CSV</button>
          <button onClick={() => window.print()} className="px-3 py-2 text-sm bg-slate-800 text-white rounded hover:bg-slate-700">Print-friendly report</button>
        </div>
      </Card>
    </div>
  );
}
