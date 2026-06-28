import { useState } from 'react';
import { Info, FileWarning, RotateCcw, Copy, Plus } from 'lucide-react';
import { useScenarioStore } from './lib/useScenarioStore';
import StepProfile from './components/StepProfile';
import StepCapability from './components/StepCapability';
import StepCostAssumptions from './components/StepCostAssumptions';
import StepResults from './components/StepResults';
import SummaryPanel from './components/SummaryPanel';
import { Select, Badge } from './components/ui';
import type { MaturityPreset } from './data/types';

const STEPS = ['Customer Profile', 'Existing Capability', 'Cost Assumptions', 'Estimate and Findings'];

export default function App() {
  const store = useScenarioStore();
  const [step, setStep] = useState(0);
  const { active } = store;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 no-print">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-slate-900">Customer-Managed DevSecOps Cost Range Estimator</h1>
          <p className="text-sm text-slate-600 mt-1">
            Estimate the potential cost and staffing burden of establishing and operating a customer-managed DevSecOps environment.
          </p>
          <div className="mt-3 flex flex-col gap-1 text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded p-3">
            <p className="flex items-start gap-1"><FileWarning size={14} className="mt-0.5 shrink-0" /> This exploratory estimate is based on editable planning assumptions. It is not an official government cost estimate, acquisition decision, vendor quote, authorization determination, or guarantee of technical suitability or schedule.</p>
            <p>This tool does not include or compare Party Bus pricing.</p>
            <p>Customer-provided and authoritative program data should replace illustrative assumptions before the estimate is used for decision-making.</p>
            <p>Unknown costs are not assumed to be zero.</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 no-print">
        <Select
          value={active.name}
          options={store.scenarios.map(s => s.name)}
          onChange={name => {
            const s = store.scenarios.find(sc => sc.name === name);
            if (s) store.setActiveId(s.id);
          }}
        />
        {active.isDemo && <Badge tone="blue">Illustrative demonstration scenario — not a real customer estimate</Badge>}
        <button onClick={() => store.duplicateScenario(active.id)} className="flex items-center gap-1 text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-100"><Copy size={12} /> Duplicate</button>
        <button onClick={() => store.addScenario('Greenfield' as MaturityPreset)} className="flex items-center gap-1 text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-100"><Plus size={12} /> New scenario</button>
        <button onClick={store.resetActive} className="flex items-center gap-1 text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-100"><RotateCcw size={12} /> Reset to defaults</button>
        <input
          className="text-sm border border-slate-300 rounded px-2 py-1 ml-auto"
          value={active.name}
          onChange={e => store.renameScenario(active.id, e.target.value)}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-[1fr_280px] gap-6 pb-12">
        <main>
          <nav className="flex gap-2 mb-4 no-print">
            {STEPS.map((label, i) => (
              <button
                key={label}
                onClick={() => setStep(i)}
                className={`px-3 py-2 text-sm rounded ${step === i ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                {i + 1}. {label}
              </button>
            ))}
          </nav>

          {step === 0 && <StepProfile scenario={active} onChange={store.updateActive} />}
          {step === 1 && <StepCapability scenario={active} onChange={store.updateActive} onApplyPreset={store.applyPreset} />}
          {step === 2 && <StepCostAssumptions scenario={active} onChange={store.updateActive} />}
          {step === 3 && <StepResults scenario={active} />}

          <div className="flex justify-between mt-6 no-print">
            <button disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))} className="px-4 py-2 text-sm border border-slate-300 rounded disabled:opacity-40">Back</button>
            <button disabled={step === STEPS.length - 1} onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))} className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-40">Next</button>
          </div>

          <p className="flex items-center gap-1 text-xs text-slate-400 mt-8 no-print">
            <Info size={12} /> All dollar amounts are illustrative planning assumptions. Replace with customer-validated data before use in decision-making.
          </p>
        </main>

        <aside className="no-print">
          <SummaryPanel scenario={active} />
        </aside>
      </div>
    </div>
  );
}
