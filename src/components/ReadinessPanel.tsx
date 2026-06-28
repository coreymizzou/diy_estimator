import type { Scenario } from '../data/types';
import type { EstimateResult } from '../lib/calculations';
import { readinessFlags, readinessStatus, rangeRatio, rangeQuality } from '../lib/findings';
import { Card, Badge } from './ui';

export default function ReadinessPanel({ scenario, result }: { scenario: Scenario; result: EstimateResult }) {
  const flags = readinessFlags(scenario, result);
  const status = readinessStatus(flags, result);
  const tone = status === 'Ready to submit for formal cost-estimating review' ? 'green' : status === 'Suitable for guided customer discussion' ? 'amber' : 'red';

  const ratio = rangeRatio(result);
  const quality = rangeQuality(ratio);
  const qualityTone = quality === 'Reasonably bounded' ? 'green' : quality === 'Caution' ? 'amber' : 'red';

  return (
    <Card title="Estimate readiness">
      <p className="mb-3">Status: <Badge tone={tone as any}>{status}</Badge></p>
      <p className="mb-3 flex items-center gap-2">
        Range quality: <Badge tone={qualityTone as any}>{quality}</Badge>
        <span className="text-xs text-slate-500">(upper ÷ lower = {isFinite(ratio) ? ratio.toFixed(1) : '—'}x)</span>
      </p>
      {quality === 'Too broad for decision support' && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2 mb-3">
          This range is too broad for decision support. The gap between the lower and upper planning case is driven by
          assumptions that haven't been narrowed yet — review the flagged items below and resolve "Not sure"
          answers to tighten the range before relying on this estimate for guided discussion.
        </p>
      )}
      <ul className="text-sm space-y-1">
        {flags.map(f => (
          <li key={f.label} className="flex items-center gap-2">
            <Badge tone={f.triggered ? 'amber' : 'green'}>{f.triggered ? 'Flagged' : 'Clear'}</Badge>
            <span className="text-slate-700">{f.label}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mt-3">
        This status describes the maturity of the estimate's inputs. It is never an "approved" or "official" cost
        estimate, is not an IGCE, and should not be represented as decision-ready procurement guidance.
      </p>
    </Card>
  );
}
