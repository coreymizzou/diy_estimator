import type { Scenario, CapabilityLevel, CapabilityTreatment, MaturityPreset } from '../data/types';
import { CAPABILITIES } from '../data/types';
import { Card, Select, Badge } from './ui';

const LEVELS: CapabilityLevel[] = ['None', 'Partial', 'Mature', 'Unknown'];
const TREATMENTS: CapabilityTreatment[] = [
  'Already available with minimal incremental burden',
  'Available but requires additional capacity',
  'Requires new funding',
  'Unknown',
];
const PRESETS: MaturityPreset[] = ['Greenfield', 'Partially equipped', 'Mature platform', 'Custom'];

const PRESET_DESCRIPTIONS: Record<MaturityPreset, string> = {
  Greenfield: 'Little existing platform, cloud, cybersecurity, authorization, or operations capability.',
  'Partially equipped': 'Some existing capability but requires meaningful expansion, integration, staffing, or authorization work.',
  'Mature platform': 'Funded personnel, tooling, cloud infrastructure, and authorization pathways already exist.',
  Custom: 'Each capability is configured manually.',
};

export default function StepCapability({
  scenario, onChange, onApplyPreset,
}: {
  scenario: Scenario;
  onChange: (updater: (s: Scenario) => Scenario) => void;
  onApplyPreset: (preset: MaturityPreset) => void;
}) {
  return (
    <div className="space-y-4">
      <Card title="Maturity preset">
        <div className="grid grid-cols-4 gap-3">
          {PRESETS.map(preset => (
            <button
              key={preset}
              onClick={() => onApplyPreset(preset)}
              className={`text-left p-3 rounded border transition ${scenario.preset === preset ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <p className="font-semibold text-sm text-slate-900">{preset}</p>
              <p className="text-xs text-slate-500 mt-1">{PRESET_DESCRIPTIONS[preset]}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">Presets populate suggested assumptions. All values remain editable below, and switching presets overwrites capability and labor allocations with the new preset's starting point.</p>
      </Card>

      <Card title="Existing customer capability">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-2">Capability</th>
              <th className="py-2 pr-2">Maturity</th>
              <th className="py-2 pr-2">Treatment</th>
            </tr>
          </thead>
          <tbody>
            {CAPABILITIES.map(cap => {
              const entry = scenario.capabilities[cap.id];
              return (
                <tr key={cap.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 text-slate-800">{cap.label}</td>
                  <td className="py-2 pr-2 w-44">
                    <Select
                      value={entry.level}
                      options={LEVELS}
                      onChange={v => onChange(s => ({ ...s, capabilities: { ...s.capabilities, [cap.id]: { ...entry, level: v as CapabilityLevel } } }))}
                    />
                  </td>
                  <td className="py-2 pr-2 w-72">
                    <Select
                      value={entry.treatment}
                      options={TREATMENTS}
                      onChange={v => onChange(s => ({ ...s, capabilities: { ...s.capabilities, [cap.id]: { ...entry, treatment: v as CapabilityTreatment } } }))}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-slate-500 mt-3">
          A capability marked <Badge>Already available with minimal incremental burden</Badge> is not automatically charged to the estimate.
        </p>
      </Card>
    </div>
  );
}
