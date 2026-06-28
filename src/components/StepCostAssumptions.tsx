import type { Scenario } from '../data/types';
import { Card, Field, NumberInput, Checkbox } from './ui';
import LaborRatesEditor from './LaborRatesEditor';
import LaborAllocationTable from './LaborAllocationTable';
import { CloudEditor, ToolingEditor, MigrationEditor, ExternalAssessmentEditor } from './CloudToolingMigration';
import CostItemsEditor from './CostItemsEditor';
import { CUSTOMER_COMMON_WORK } from '../data/benchmarks';

export default function StepCostAssumptions({ scenario, onChange }: { scenario: Scenario; onChange: (u: (s: Scenario) => Scenario) => void }) {
  return (
    <div className="space-y-4">
      <Card title="Labor rates and basis">
        <LaborRatesEditor scenario={scenario} onChange={onChange} />
      </Card>

      <Card title="Initial implementation labor (FTE allocations)">
        <LaborAllocationTable
          scenario={scenario}
          allocations={scenario.initialLabor}
          onUpdate={next => onChange(s => ({ ...s, initialLabor: next }))}
          title="initial"
        />
        <p className="text-xs text-slate-500 mt-2">Covers architecture, environment design, infrastructure-as-code development, pipeline creation, security-control implementation, authorization documentation, deployment, and initial integration.</p>
      </Card>

      <Card title="Recurring operations labor (FTE allocations, annual)">
        <LaborAllocationTable
          scenario={scenario}
          allocations={scenario.recurringLabor}
          onUpdate={next => onChange(s => ({ ...s, recurringLabor: next }))}
          title="recurring"
        />
        <p className="text-xs text-slate-500 mt-2">Covers platform operations, patching, upgrades, monitoring, incident response, vulnerability management, continuous monitoring, authorization maintenance, capacity management, user support, and license administration. Support-model uplift is applied automatically to operations-related roles (SRE/ops, cloud engineer, user support).</p>
      </Card>

      <CloudEditor scenario={scenario} onChange={onChange} />
      <ToolingEditor scenario={scenario} onChange={onChange} />
      <ExternalAssessmentEditor scenario={scenario} onChange={onChange} />
      <MigrationEditor scenario={scenario} onChange={onChange} />

      <CostItemsEditor
        scenario={scenario}
        onChange={onChange}
        categoryFilter="Optional advanced costs"
        title="Optional advanced assumptions"
      />

      <CostItemsEditor
        scenario={scenario}
        onChange={onChange}
        title="Additional cost items (any category)"
      />

      <Card title="Contingency and uncertainty">
        <Checkbox
          checked={scenario.contingency.enabled}
          onChange={v => onChange(s => ({ ...s, contingency: { ...s.contingency, enabled: v } }))}
          label="Apply an explicit contingency on top of the period total"
        />
        {scenario.contingency.enabled && (
          <div className="grid grid-cols-3 gap-3 mt-2">
            <Field label="Low contingency %"><NumberInput value={Math.round(scenario.contingency.low * 100)} onChange={e => onChange(s => ({ ...s, contingency: { ...s.contingency, low: Number(e.target.value) / 100 } }))} /></Field>
            <Field label="Expected contingency %"><NumberInput value={Math.round(scenario.contingency.expected * 100)} onChange={e => onChange(s => ({ ...s, contingency: { ...s.contingency, expected: Number(e.target.value) / 100 } }))} /></Field>
            <Field label="High contingency %"><NumberInput value={Math.round(scenario.contingency.high * 100)} onChange={e => onChange(s => ({ ...s, contingency: { ...s.contingency, high: Number(e.target.value) / 100 } }))} /></Field>
          </div>
        )}
        <p className="text-xs text-slate-500 mt-2">The underlying low/expected/high ranges already account for a degree of uncertainty. Adding contingency on top can double-count risk — use deliberately, not by default.</p>
      </Card>

      <Card title="New cash vs. existing capacity">
        <Checkbox
          checked={scenario.includeExistingCapacityInBurden}
          onChange={v => onChange(s => ({ ...s, includeExistingCapacityInBurden: v }))}
          label="Include existing capacity in economic-burden total"
        />
        <p className="text-xs text-slate-500 mt-2">Off by default. Existing staff capacity is never presented as a new invoice or budget request unless this is enabled.</p>
      </Card>

      <Card title="Customer work generally required regardless of platform approach">
        <p className="text-xs text-slate-500 mb-2">These items are excluded from the DIY platform estimate by default, because they would be incurred under any hosting or platform approach.</p>
        <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
          {CUSTOMER_COMMON_WORK.map(w => <li key={w}>{w}</li>)}
        </ul>
      </Card>
    </div>
  );
}
