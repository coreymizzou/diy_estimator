import type { Scenario } from '../data/types';
import type { EstimateResult } from '../lib/calculations';
import { readinessFlags, readinessStatus } from '../lib/findings';
import { Card, Badge } from './ui';

export default function ReadinessPanel({ scenario, result }: { scenario: Scenario; result: EstimateResult }) {
  const flags = readinessFlags(scenario, result);
  const status = readinessStatus(flags);
  const tone = status === 'Ready for formal cost-estimating review' ? 'green' : status === 'Suitable for customer discussion' ? 'amber' : 'red';

  return (
    <Card title="Estimate readiness">
      <p className="mb-3">Status: <Badge tone={tone as any}>{status}</Badge></p>
      <ul className="text-sm space-y-1">
        {flags.map(f => (
          <li key={f.label} className="flex items-center gap-2">
            <Badge tone={f.triggered ? 'amber' : 'green'}>{f.triggered ? 'Flagged' : 'Clear'}</Badge>
            <span className="text-slate-700">{f.label}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mt-3">This status describes maturity of the estimate's inputs. It is never an "approved" cost estimate and should not be represented as an official IGCE.</p>
    </Card>
  );
}
