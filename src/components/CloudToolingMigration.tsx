import type { Scenario, CloudFootprint, ToolingProfile } from '../data/types';
import { nextId } from '../data/defaultScenario';
import {
  CLOUD_QUICK_RANGES, CLOUD_SOURCES, CLOUD_SOURCE_EXPLANATION,
  TOOLING_PROFILE_RANGES, TOOLING_SOURCES, TOOLING_LIST, MIGRATION_FTE_MONTHS,
  EXTERNAL_ASSESSMENT_RANGE,
} from '../data/benchmarks';
import { LABOR_ROLES } from '../data/types';
import { Card, Select, NumberInput, Checkbox, Field } from './ui';

export function CloudEditor({ scenario, onChange }: { scenario: Scenario; onChange: (u: (s: Scenario) => Scenario) => void }) {
  const c = scenario.cloud;
  return (
    <Card title="Cloud infrastructure">
      <div className="flex gap-4 mb-3">
        <Field label="Estimation mode">
          <Select value={c.mode} options={['Quick', 'Advanced']} onChange={v => onChange(s => ({ ...s, cloud: { ...s.cloud, mode: v as any } }))} />
        </Field>
        {c.mode === 'Quick' && (
          <Field label="Footprint">
            <Select
              value={c.footprint}
              options={['Small', 'Medium', 'Large', 'Custom']}
              onChange={v => onChange(s => ({ ...s, cloud: { ...s.cloud, footprint: v as CloudFootprint, quickAnnual: { ...CLOUD_QUICK_RANGES[v as CloudFootprint] } } }))}
            />
          </Field>
        )}
      </div>
      {c.mode === 'Quick' ? (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Low (annual)"><NumberInput value={c.quickAnnual.low} onChange={e => onChange(s => ({ ...s, cloud: { ...s.cloud, quickAnnual: { ...s.cloud.quickAnnual, low: Number(e.target.value) } } }))} /></Field>
          <Field label="Expected (annual)"><NumberInput value={c.quickAnnual.expected} onChange={e => onChange(s => ({ ...s, cloud: { ...s.cloud, quickAnnual: { ...s.cloud.quickAnnual, expected: Number(e.target.value) } } }))} /></Field>
          <Field label="High (annual)"><NumberInput value={c.quickAnnual.high} onChange={e => onChange(s => ({ ...s, cloud: { ...s.cloud, quickAnnual: { ...s.cloud.quickAnnual, high: Number(e.target.value) } } }))} /></Field>
        </div>
      ) : (
        <div>
          <table className="w-full text-xs mb-2">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-1">Component</th><th>Low</th><th>Expected</th><th>High</th><th>Recurrence</th><th>Included</th><th></th>
              </tr>
            </thead>
            <tbody>
              {c.advancedComponents.map((comp, idx) => (
                <tr key={comp.id} className="border-b border-slate-100">
                  <td className="py-1 pr-1"><input className="w-full border border-slate-300 rounded px-1 py-1" value={comp.name} onChange={e => onChange(s => { const arr = [...s.cloud.advancedComponents]; arr[idx] = { ...arr[idx], name: e.target.value }; return { ...s, cloud: { ...s.cloud, advancedComponents: arr } }; })} /></td>
                  <td className="py-1 pr-1 w-20"><NumberInput value={comp.amount.low} onChange={e => onChange(s => { const arr = [...s.cloud.advancedComponents]; arr[idx] = { ...arr[idx], amount: { ...arr[idx].amount, low: Number(e.target.value) } }; return { ...s, cloud: { ...s.cloud, advancedComponents: arr } }; })} /></td>
                  <td className="py-1 pr-1 w-20"><NumberInput value={comp.amount.expected} onChange={e => onChange(s => { const arr = [...s.cloud.advancedComponents]; arr[idx] = { ...arr[idx], amount: { ...arr[idx].amount, expected: Number(e.target.value) } }; return { ...s, cloud: { ...s.cloud, advancedComponents: arr } }; })} /></td>
                  <td className="py-1 pr-1 w-20"><NumberInput value={comp.amount.high} onChange={e => onChange(s => { const arr = [...s.cloud.advancedComponents]; arr[idx] = { ...arr[idx], amount: { ...arr[idx].amount, high: Number(e.target.value) } }; return { ...s, cloud: { ...s.cloud, advancedComponents: arr } }; })} /></td>
                  <td className="py-1 pr-1 w-24"><Select value={comp.recurrence} options={['Annual', 'Monthly']} onChange={v => onChange(s => { const arr = [...s.cloud.advancedComponents]; arr[idx] = { ...arr[idx], recurrence: v as any }; return { ...s, cloud: { ...s.cloud, advancedComponents: arr } }; })} /></td>
                  <td className="py-1 pr-1"><Checkbox checked={comp.included} onChange={v => onChange(s => { const arr = [...s.cloud.advancedComponents]; arr[idx] = { ...arr[idx], included: v }; return { ...s, cloud: { ...s.cloud, advancedComponents: arr } }; })} label="" /></td>
                  <td><button className="text-rose-600 text-xs hover:underline" onClick={() => onChange(s => ({ ...s, cloud: { ...s.cloud, advancedComponents: s.cloud.advancedComponents.filter((_, i) => i !== idx) } }))}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="text-xs text-blue-600 hover:underline"
            onClick={() => onChange(s => ({ ...s, cloud: { ...s.cloud, advancedComponents: [...s.cloud.advancedComponents, { id: nextId('cloud'), name: 'New component', amount: { low: 0, expected: 0, high: 0 }, recurrence: 'Annual', included: true, notes: '' }] } }))}
          >
            + Add component (e.g. compute, managed database, object storage, logging, NAT gateway)
          </button>
        </div>
      )}
      <p className="text-xs text-slate-500 mt-3">{CLOUD_SOURCE_EXPLANATION} These figures are editable planning ranges, not AWS quotes. Use only the quick estimate or the advanced estimate — never both.</p>
      <div className="flex flex-wrap gap-3 mt-1">
        {CLOUD_SOURCES.map(u => <a key={u} href={u} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{u}</a>)}
      </div>
    </Card>
  );
}

export function ToolingEditor({ scenario, onChange }: { scenario: Scenario; onChange: (u: (s: Scenario) => Scenario) => void }) {
  const t = scenario.tooling;
  return (
    <Card title="Tools and licensing">
      <Field label="Tooling profile">
        <Select
          value={t.profile}
          options={['Open-source or government-provided', 'Mixed commercial and open-source', 'Enterprise commercial toolchain', 'Custom']}
          onChange={v => onChange(s => ({ ...s, tooling: { ...s.tooling, profile: v as ToolingProfile, annualLicense: { ...TOOLING_PROFILE_RANGES[v as ToolingProfile] } } }))}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Field label="Low (annual)"><NumberInput value={t.annualLicense.low} onChange={e => onChange(s => ({ ...s, tooling: { ...s.tooling, annualLicense: { ...s.tooling.annualLicense, low: Number(e.target.value) } } }))} /></Field>
        <Field label="Expected (annual)"><NumberInput value={t.annualLicense.expected} onChange={e => onChange(s => ({ ...s, tooling: { ...s.tooling, annualLicense: { ...s.tooling.annualLicense, expected: Number(e.target.value) } } }))} /></Field>
        <Field label="High (annual)"><NumberInput value={t.annualLicense.high} onChange={e => onChange(s => ({ ...s, tooling: { ...s.tooling, annualLicense: { ...s.tooling.annualLicense, high: Number(e.target.value) } } }))} /></Field>
      </div>
      <p className="text-xs text-slate-500 mb-2">Lower license cost may require greater administration and maintenance labor — reflect that in operations FTE allocations.</p>
      <table className="w-full text-xs mb-2">
        <thead><tr className="text-left text-slate-500 border-b border-slate-200"><th className="py-1">Tool</th><th>Status</th></tr></thead>
        <tbody>
          {TOOLING_LIST.map(tool => (
            <tr key={tool} className="border-b border-slate-100">
              <td className="py-1 text-slate-800">{tool}</td>
              <td className="py-1 w-56">
                <Select
                  value={t.toolStatuses[tool]}
                  options={['Already licensed', 'Government provided', 'New purchase required', 'Open-source alternative', 'Unknown']}
                  onChange={v => onChange(s => ({ ...s, tooling: { ...s.tooling, toolStatuses: { ...s.tooling.toolStatuses, [tool]: v as any } } }))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-500">Some enterprise and government offerings require custom quotes.</p>
      <div className="flex flex-wrap gap-3 mt-1">
        {TOOLING_SOURCES.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{s.label}</a>)}
      </div>
    </Card>
  );
}

export function MigrationEditor({ scenario, onChange }: { scenario: Scenario; onChange: (u: (s: Scenario) => Scenario) => void }) {
  const m = scenario.migration;
  return (
    <Card title="Migration and integration">
      <div className="grid grid-cols-2 gap-4 mb-3">
        <Field label="Migration complexity">
          <Select
            value={m.complexity}
            options={['Minimal', 'Simple', 'Moderate', 'Complex']}
            onChange={v => onChange(s => ({ ...s, migration: { ...s.migration, complexity: v as any, fteMonths: { ...MIGRATION_FTE_MONTHS[v as keyof typeof MIGRATION_FTE_MONTHS] } } }))}
          />
        </Field>
        <Field label="Labor role used for migration rate">
          <Select
            value={LABOR_ROLES.find(r => r.id === m.laborRoleId)?.label ?? LABOR_ROLES[0].label}
            options={LABOR_ROLES.map(r => r.label)}
            onChange={label => { const role = LABOR_ROLES.find(r => r.label === label); if (role) onChange(s => ({ ...s, migration: { ...s.migration, laborRoleId: role.id } })); }}
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Low (FTE-months)"><NumberInput value={m.fteMonths.low} onChange={e => onChange(s => ({ ...s, migration: { ...s.migration, fteMonths: { ...s.migration.fteMonths, low: Number(e.target.value) } } }))} /></Field>
        <Field label="Expected (FTE-months)"><NumberInput value={m.fteMonths.expected} onChange={e => onChange(s => ({ ...s, migration: { ...s.migration, fteMonths: { ...s.migration.fteMonths, expected: Number(e.target.value) } } }))} /></Field>
        <Field label="High (FTE-months)"><NumberInput value={m.fteMonths.high} onChange={e => onChange(s => ({ ...s, migration: { ...s.migration, fteMonths: { ...s.migration.fteMonths, high: Number(e.target.value) } } }))} /></Field>
      </div>
      <p className="text-xs text-slate-500 mt-2">May include containerization, pipeline migration, data migration, identity integration, network integration, testing, cutover, rollback planning, and customer-specific interfaces.</p>
    </Card>
  );
}

export function ExternalAssessmentEditor({ scenario, onChange }: { scenario: Scenario; onChange: (u: (s: Scenario) => Scenario) => void }) {
  const ea = scenario.externalAssessment;
  return (
    <Card title="Independent assessment / external authorization support">
      <Checkbox
        checked={ea.enabled}
        onChange={v => onChange(s => ({ ...s, externalAssessment: { ...s.externalAssessment, enabled: v } }))}
        label="External assessment or professional-services support required"
      />
      {ea.enabled && (
        <div className="grid grid-cols-3 gap-3 mt-2">
          <Field label="Low"><NumberInput value={ea.amount.low} onChange={e => onChange(s => ({ ...s, externalAssessment: { ...s.externalAssessment, amount: { ...s.externalAssessment.amount, low: Number(e.target.value) } } }))} /></Field>
          <Field label="Expected"><NumberInput value={ea.amount.expected} onChange={e => onChange(s => ({ ...s, externalAssessment: { ...s.externalAssessment, amount: { ...s.externalAssessment.amount, expected: Number(e.target.value) } } }))} /></Field>
          <Field label="High"><NumberInput value={ea.amount.high} onChange={e => onChange(s => ({ ...s, externalAssessment: { ...s.externalAssessment, amount: { ...s.externalAssessment.amount, high: Number(e.target.value) } } }))} /></Field>
        </div>
      )}
      <p className="text-xs text-slate-500 mt-2">Default seeded range: {EXTERNAL_ASSESSMENT_RANGE.low.toLocaleString()} – {EXTERNAL_ASSESSMENT_RANGE.high.toLocaleString()}. Disabled and excluded until the customer indicates external support is required.</p>
    </Card>
  );
}
