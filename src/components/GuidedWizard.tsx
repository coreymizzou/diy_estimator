import { useState } from 'react';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import type { Scenario, MaturityPreset } from '../data/types';
import { Card, Field, NumberInput } from './ui';
import { computeEstimate, formatCurrency } from '../lib/calculations';
import { MIGRATION_FTE_MONTHS } from '../data/benchmarks';

interface GuidedWizardProps {
  scenario: Scenario;
  onChange: (updater: (s: Scenario) => Scenario) => void;
  onApplyPreset: (preset: MaturityPreset) => void;
  onFinish: () => void;
}

const GROUPS = ['Your project', 'Where you are starting from', 'Operations & data', 'Review'];

// "Unsure" answers don't block the estimate, but they are tracked and surfaced as a distinct
// uncertainty note — never folded into contingency, which stays a separate, opt-in adjustment.
function ChoiceGroup<T extends string>({
  label, hint, options, value, moderateValue, onChange, unsure, onUnsureChange,
}: {
  label: string;
  hint?: string;
  options: readonly T[];
  value: T;
  moderateValue: T;
  onChange: (v: T) => void;
  unsure: boolean;
  onUnsureChange: (v: boolean) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => { onUnsureChange(false); onChange(opt); }}
            className={`px-3 py-2 text-sm rounded-lg border transition ${
              !unsure && value === opt
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
            }`}
          >
            {opt}
          </button>
        ))}
        <button
          onClick={() => { onUnsureChange(true); onChange(moderateValue); }}
          className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition ${
            unsure ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'
          }`}
        >
          <HelpCircle size={14} /> Not sure
        </button>
      </div>
    </Field>
  );
}

export default function GuidedWizard({ scenario, onChange, onApplyPreset, onFinish }: GuidedWizardProps) {
  const [step, setStep] = useState(0);
  const [unsureFields, setUnsureFields] = useState<Set<string>>(new Set());
  const p = scenario.profile;
  const set = <K extends keyof typeof p>(key: K, value: (typeof p)[K]) =>
    onChange(s => ({ ...s, profile: { ...s.profile, [key]: value } }));

  // The guided migration-complexity answer and the advanced editor's migration cost inputs
  // share one underlying cost driver — keep them in sync so this answer actually changes
  // the estimate instead of only updating a copy that calculations.ts never reads.
  const setMigrationComplexity = (v: typeof p.migrationComplexity) =>
    onChange(s => ({
      ...s,
      profile: { ...s.profile, migrationComplexity: v },
      migration: { ...s.migration, complexity: v, fteMonths: { ...MIGRATION_FTE_MONTHS[v] } },
    }));

  const toggleUnsure = (field: string, v: boolean) => {
    setUnsureFields(prev => {
      const next = new Set(prev);
      if (v) next.add(field); else next.delete(field);
      return next;
    });
  };

  const last = step === GROUPS.length - 1;
  const result = computeEstimate(scenario);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {GROUPS.map((label, i) => (
            <button
              key={label}
              onClick={() => setStep(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
                i === step
                  ? 'bg-blue-600 text-white border-blue-600'
                  : i < step
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {i < step && <CheckCircle2 size={12} className="inline mr-1 -mt-0.5" />}
              {label}
            </button>
          ))}
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-1.5 bg-blue-600 rounded-full transition-all" style={{ width: `${((step + 1) / GROUPS.length) * 100}%` }} />
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Your estimate so far (lower planning case – upper planning case)</p>
        <p className="text-2xl font-semibold text-slate-900">
          {formatCurrency(result.periodTotal.low)} – {formatCurrency(result.periodTotal.high)}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Total over {result.years} year{result.years > 1 ? 's' : ''}, including build and operations. Updates live as you
          answer. This does not include contingency, which is a separate, optional adjustment in advanced mode.
          {unsureFields.size > 0 && ` ${unsureFields.size} answer${unsureFields.size > 1 ? 's are' : ' is'} marked "not sure," which adds uncertainty beyond what this range reflects.`}
        </p>
      </Card>

      {step === 0 && (
        <Card title="Tell us about your project">
          <p className="text-sm text-slate-600 mb-4">A rough idea is fine — you can refine everything later.</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="How many applications are you standing up?">
              <NumberInput value={p.numApplications} min={1} onChange={e => set('numApplications', Number(e.target.value))} />
            </Field>
            <Field label="Roughly how many microservices total?">
              <NumberInput value={p.numMicroservices} min={1} onChange={e => set('numMicroservices', Number(e.target.value))} />
            </Field>
            <Field label="Developers" hint="People building the application(s).">
              <NumberInput value={p.numDevelopers} min={0} onChange={e => set('numDevelopers', Number(e.target.value))} />
            </Field>
            <Field label="Platform users" hint="People operating the platform itself.">
              <NumberInput value={p.numPlatformUsers} min={0} onChange={e => set('numPlatformUsers', Number(e.target.value))} />
            </Field>
            <Field label="End users" hint="People using the finished application(s).">
              <NumberInput value={p.numEndUsers} min={0} onChange={e => set('numEndUsers', Number(e.target.value))} />
            </Field>
          </div>
          <div className="mt-4">
            <ChoiceGroup
              label="How many months until go-live (implementation period)?"
              hint="Time to build, migrate, and authorize the platform, ending at go-live. Modeled separately from the operating period below — it is not assumed to be 12 months just because the operating period is in years."
              options={['3', '6', '9', '12', '18', '24'] as const}
              value={String(p.implementationMonths) as any}
              moderateValue={'12' as any}
              onChange={v => set('implementationMonths', Number(v) as any)}
              unsure={unsureFields.has('implementationMonths')}
              onUnsureChange={v => toggleUnsure('implementationMonths', v)}
            />
          </div>
          <div className="mt-4">
            <ChoiceGroup
              label="How many years of operations after go-live should this estimate cover?"
              hint="Operating period after go-live, separate from the implementation period above. Most programs plan in 3-year increments."
              options={['1 year', '3 years', '5 years'] as const}
              value={p.analysisPeriod === 'Custom' ? '3 years' : p.analysisPeriod}
              moderateValue="3 years"
              onChange={v => set('analysisPeriod', v)}
              unsure={unsureFields.has('analysisPeriod')}
              onUnsureChange={v => toggleUnsure('analysisPeriod', v)}
            />
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card title="Where are you starting from?">
          <ChoiceGroup
            label="Impact level / data sensitivity"
            hint="Impact level (IL-2/IL-4/IL-5) is a DoD cloud authorization tier, not the same as a formal security classification. Higher impact levels typically require more cybersecurity engineering and authorization effort."
            options={['IL-2', 'IL-4', 'IL-5', 'Other'] as const}
            value={p.classification}
            moderateValue="IL-4"
            onChange={v => set('classification', v)}
            unsure={unsureFields.has('classification')}
            onUnsureChange={v => toggleUnsure('classification', v)}
          />
          <p className="block text-sm font-medium text-slate-700 mt-4 mb-2">Existing platform maturity</p>
          <div className="grid grid-cols-1 gap-3">
            {([
              ['Greenfield', 'Nothing in place yet — building the platform and team from scratch.'],
              ['Partially equipped', 'Some infrastructure, tooling, or staff already exist but need expansion.'],
              ['Mature platform', 'A platform and team already exist and are largely operational.'],
            ] as [MaturityPreset, string][]).map(([preset, desc]) => (
              <button
                key={preset}
                onClick={() => onApplyPreset(preset)}
                className={`text-left p-3 rounded-lg border transition ${scenario.preset === preset ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="text-sm font-medium text-slate-900">{preset}</div>
                <div className="text-xs text-slate-600">{desc}</div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title="Operations & data">
          <ChoiceGroup
            label="Support hours"
            hint="24x7 requires multiple rotating staff, not just one person working longer hours."
            options={['Business hours', 'Extended business hours', '24x7'] as const}
            value={p.supportModel}
            moderateValue="Business hours"
            onChange={v => set('supportModel', v)}
            unsure={unsureFields.has('supportModel')}
            onUnsureChange={v => toggleUnsure('supportModel', v)}
          />
          <ChoiceGroup
            label="Availability requirement"
            options={['Standard', 'High availability', 'Mission critical'] as const}
            value={p.availability}
            moderateValue="Standard"
            onChange={v => set('availability', v)}
            unsure={unsureFields.has('availability')}
            onUnsureChange={v => toggleUnsure('availability', v)}
          />
          <ChoiceGroup
            label="Data volume"
            hint="Scales the cloud cost estimate — storage typically drives 25-40% of cloud spend."
            options={['Low', 'Moderate', 'High'] as const}
            value={p.dataVolume === 'Custom' ? 'Moderate' : p.dataVolume}
            moderateValue="Moderate"
            onChange={v => set('dataVolume', v)}
            unsure={unsureFields.has('dataVolume')}
            onUnsureChange={v => toggleUnsure('dataVolume', v)}
          />
          <ChoiceGroup
            label="Logging volume"
            hint="Log ingestion/storage typically drives another 10-20% of cloud spend."
            options={['Low', 'Moderate', 'High'] as const}
            value={p.loggingVolume === 'Custom' ? 'Moderate' : p.loggingVolume}
            moderateValue="Moderate"
            onChange={v => set('loggingVolume', v)}
            unsure={unsureFields.has('loggingVolume')}
            onUnsureChange={v => toggleUnsure('loggingVolume', v)}
          />
          <ChoiceGroup
            label="Migration complexity"
            hint="How much work is involved moving existing applications/data onto the new platform."
            options={['Minimal', 'Simple', 'Moderate', 'Complex'] as const}
            value={p.migrationComplexity}
            moderateValue="Moderate"
            onChange={setMigrationComplexity}
            unsure={unsureFields.has('migrationComplexity')}
            onUnsureChange={v => toggleUnsure('migrationComplexity', v)}
          />
        </Card>
      )}

      {last && (
        <Card title="You're set">
          <p className="text-sm text-slate-600 mb-4">
            That's everything we need for a planning-level range. From here you can fine-tune every individual
            assumption as an engineer would, or check where the underlying pricing benchmarks come from.
          </p>
          <div className="flex gap-3">
            <button onClick={onFinish} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Switch to advanced/engineer mode
            </button>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <button disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))} className="px-4 py-2 text-sm border border-slate-300 rounded-lg disabled:opacity-40">Back</button>
        <button disabled={last} onClick={() => setStep(s => Math.min(GROUPS.length - 1, s + 1))} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
