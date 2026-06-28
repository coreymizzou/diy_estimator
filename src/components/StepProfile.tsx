import type { Scenario } from '../data/types';
import { Card, Field, TextInput, NumberInput, Select, Checkbox } from './ui';

export default function StepProfile({ scenario, onChange }: { scenario: Scenario; onChange: (updater: (s: Scenario) => Scenario) => void }) {
  const p = scenario.profile;
  const set = <K extends keyof typeof p>(key: K, value: (typeof p)[K]) =>
    onChange(s => ({ ...s, profile: { ...s.profile, [key]: value } }));

  return (
    <div className="space-y-4">
      <Card title="Program information">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Scenario name">
            <TextInput value={p.scenarioName} onChange={e => set('scenarioName', e.target.value)} />
          </Field>
          <Field label="Program or application name">
            <TextInput value={p.programName} onChange={e => set('programName', e.target.value)} />
          </Field>
          <Field label="Organization">
            <TextInput value={p.organization} onChange={e => set('organization', e.target.value)} />
          </Field>
          <Field label="Classification or impact level">
            <Select value={p.classification} onChange={v => set('classification', v as any)} options={['IL-2', 'IL-4', 'IL-5', 'Other']} />
          </Field>
          <Field label="Number of applications">
            <NumberInput value={p.numApplications} min={0} onChange={e => set('numApplications', Number(e.target.value))} />
          </Field>
          <Field label="Number of microservices">
            <NumberInput value={p.numMicroservices} min={0} onChange={e => set('numMicroservices', Number(e.target.value))} />
          </Field>
          <Field label="Number of developers">
            <NumberInput value={p.numDevelopers} min={0} onChange={e => set('numDevelopers', Number(e.target.value))} />
          </Field>
          <Field label="Number of platform users">
            <NumberInput value={p.numPlatformUsers} min={0} onChange={e => set('numPlatformUsers', Number(e.target.value))} />
          </Field>
          <Field label="Number of end users">
            <NumberInput value={p.numEndUsers} min={0} onChange={e => set('numEndUsers', Number(e.target.value))} />
          </Field>
          <Field label="Analysis period">
            <Select value={p.analysisPeriod} onChange={v => set('analysisPeriod', v as any)} options={['1 year', '3 years', '5 years', 'Custom']} />
          </Field>
          {p.analysisPeriod === 'Custom' && (
            <Field label="Custom analysis period (years)">
              <NumberInput value={p.customAnalysisYears} min={1} onChange={e => set('customAnalysisYears', Number(e.target.value))} />
            </Field>
          )}
          <Field label="Target operational date">
            <TextInput type="date" value={p.targetOperationalDate} onChange={e => set('targetOperationalDate', e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Required environments">
        <div className="grid grid-cols-2 gap-1">
          {(['development', 'test', 'staging', 'production', 'disasterRecovery'] as const).map(env => (
            <Checkbox
              key={env}
              checked={p.environments[env]}
              onChange={v => set('environments', { ...p.environments, [env]: v })}
              label={env === 'disasterRecovery' ? 'Disaster recovery' : env.charAt(0).toUpperCase() + env.slice(1)}
            />
          ))}
        </div>
      </Card>

      <Card title="Operational requirements">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Support model">
            <Select value={p.supportModel} onChange={v => set('supportModel', v as any)} options={['Business hours', 'Extended business hours', '24x7']} />
          </Field>
          {p.supportModel === 'Extended business hours' && (
            <Field label="Extended-hours staffing uplift" hint="Editable 15-30% increase to operations labor">
              <NumberInput value={Math.round(p.extendedHoursUplift * 100)} min={15} max={30} onChange={e => set('extendedHoursUplift', Number(e.target.value) / 100)} />
            </Field>
          )}
          <Field label="Availability requirement">
            <Select value={p.availability} onChange={v => set('availability', v as any)} options={['Standard', 'High availability', 'Mission critical']} />
          </Field>
          <Field label="Migration complexity">
            <Select value={p.migrationComplexity} onChange={v => set('migrationComplexity', v as any)} options={['Minimal', 'Simple', 'Moderate', 'Complex']} />
          </Field>
          <Field label="Data volume" hint="Scales the Quick-mode cloud cost estimate (storage typically drives 25-40% of cloud spend).">
            <Select value={p.dataVolume} onChange={v => set('dataVolume', v as any)} options={['Low', 'Moderate', 'High', 'Custom']} />
          </Field>
          <Field label="Logging volume" hint="Scales the Quick-mode cloud cost estimate (CloudWatch Logs ingestion/storage typically drives 10-20% of cloud spend).">
            <Select value={p.loggingVolume} onChange={v => set('loggingVolume', v as any)} options={['Low', 'Moderate', 'High', 'Custom']} />
          </Field>
        </div>
      </Card>
    </div>
  );
}
