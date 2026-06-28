import type { Scenario, LaborBasis } from '../data/types';
import { LABOR_ROLES } from '../data/types';
import { LABOR_RATE_BENCHMARKS, BENCHMARK_LABEL, LABOR_RATE_SOURCES, LABOR_RATE_SOURCE_EXPLANATION } from '../data/benchmarks';
import { Select, NumberInput, Badge } from './ui';

const BASES: LaborBasis[] = ['Government civilian', 'Contractor', 'Mixed team', 'Custom'];

export default function LaborRatesEditor({ scenario, onChange }: { scenario: Scenario; onChange: (updater: (s: Scenario) => Scenario) => void }) {
  const lr = scenario.laborRates;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Badge tone="amber">{BENCHMARK_LABEL}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <span className="block text-sm font-medium text-slate-700 mb-1">Labor basis</span>
          <Select value={lr.basis} options={BASES} onChange={v => onChange(s => ({ ...s, laborRates: { ...s.laborRates, basis: v as LaborBasis } }))} />
        </div>
        {(lr.basis === 'Mixed team' || lr.basis === 'Custom') && (
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1">Government share of mixed team (%)</span>
            <NumberInput min={0} max={100} value={lr.mixGovPercent} onChange={e => onChange(s => ({ ...s, laborRates: { ...s.laborRates, mixGovPercent: Number(e.target.value) } }))} />
          </div>
        )}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            <th className="py-2 pr-1">Role</th>
            <th className="py-2 pr-1" colSpan={3}>Government civilian (low/exp/high)</th>
            <th className="py-2 pr-1" colSpan={3}>Contractor (low/exp/high)</th>
          </tr>
        </thead>
        <tbody>
          {LABOR_ROLES.map(role => {
            const r = lr.rates[role.id];
            const update = (patch: Partial<typeof r>) =>
              onChange(s => ({ ...s, laborRates: { ...s.laborRates, rates: { ...s.laborRates.rates, [role.id]: { ...s.laborRates.rates[role.id], ...patch } } } }));
            return (
              <tr key={role.id} className="border-b border-slate-100">
                <td className="py-1 pr-1 text-slate-800">{role.label}</td>
                <td className="py-1 pr-1 w-24"><NumberInput value={r.govLow} onChange={e => update({ govLow: Number(e.target.value) })} /></td>
                <td className="py-1 pr-1 w-24"><NumberInput value={r.govExpected} onChange={e => update({ govExpected: Number(e.target.value) })} /></td>
                <td className="py-1 pr-1 w-24"><NumberInput value={r.govHigh} onChange={e => update({ govHigh: Number(e.target.value) })} /></td>
                <td className="py-1 pr-1 w-24"><NumberInput value={r.ctrLow} onChange={e => update({ ctrLow: Number(e.target.value) })} /></td>
                <td className="py-1 pr-1 w-24"><NumberInput value={r.ctrExpected} onChange={e => update({ ctrExpected: Number(e.target.value) })} /></td>
                <td className="py-1 pr-1 w-24"><NumberInput value={r.ctrHigh} onChange={e => update({ ctrHigh: Number(e.target.value) })} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-slate-500 mt-3">{LABOR_RATE_SOURCE_EXPLANATION}</p>
      <div className="flex gap-3 mt-1">
        {LABOR_RATE_SOURCES.map(s => (
          <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{s.label}</a>
        ))}
      </div>
      <button
        className="mt-3 text-xs text-slate-600 hover:underline"
        onClick={() => onChange(s => ({ ...s, laborRates: { ...s.laborRates, rates: structuredClone(LABOR_RATE_BENCHMARKS) } }))}
      >
        Reset rates to benchmark
      </button>
    </div>
  );
}
