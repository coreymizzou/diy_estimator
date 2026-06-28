import type { Scenario, CostItem, CostCategory, CostPhase, CostType, Confidence, Treatment } from '../data/types';
import { nextId } from '../data/defaultScenario';
import { Card, Select, NumberInput, Checkbox, TextInput } from './ui';
import { ADVANCED_COST_AREAS } from '../data/benchmarks';

const CATEGORIES: CostCategory[] = [
  'Initial engineering and deployment', 'Cybersecurity and authorization', 'Cloud infrastructure',
  'Tools and licensing', 'Ongoing platform operations and support', 'Migration and integration', 'Optional advanced costs',
];
const PHASES: CostPhase[] = ['Initial', 'Recurring', 'Both'];
const TYPES: CostType[] = ['Labor', 'Cloud', 'License', 'Professional service', 'Other'];
const CONFIDENCES: Confidence[] = ['High', 'Medium', 'Low', 'Unknown'];
const TREATMENTS: Treatment[] = ['New funding required', 'Existing funded capacity consumed', 'Already available', 'Unknown'];

export default function CostItemsEditor({ scenario, onChange, categoryFilter, title }: {
  scenario: Scenario;
  onChange: (u: (s: Scenario) => Scenario) => void;
  categoryFilter?: CostCategory;
  title: string;
}) {
  const items = categoryFilter ? scenario.costItems.filter(i => i.category === categoryFilter) : scenario.costItems;

  const update = (id: string, patch: Partial<CostItem>) =>
    onChange(s => ({ ...s, costItems: s.costItems.map(i => (i.id === id ? { ...i, ...patch } : i)) }));
  const remove = (id: string) => onChange(s => ({ ...s, costItems: s.costItems.filter(i => i.id !== id) }));
  const add = () =>
    onChange(s => ({
      ...s,
      costItems: [...s.costItems, {
        id: nextId('item'), name: 'New cost item', category: categoryFilter ?? 'Optional advanced costs',
        description: '', phase: 'Initial', costType: 'Other', amount: { low: 0, expected: 0, high: 0 },
        quantity: 1, unit: 'each', durationMonths: 12, recurrence: 'One-time', source: '', confidence: 'Unknown',
        treatment: 'Unknown', included: false, customerValidated: false, notes: '',
      }],
    }));

  return (
    <Card title={title}>
      {items.length === 0 && <p className="text-xs text-slate-500 mb-2">No items added yet.</p>}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="border border-slate-200 rounded p-3">
            <div className="grid grid-cols-4 gap-2 mb-2">
              <TextInput value={item.name} onChange={e => update(item.id, { name: e.target.value })} placeholder="Name" />
              {!categoryFilter && <Select value={item.category} options={CATEGORIES} onChange={v => update(item.id, { category: v as CostCategory })} />}
              <Select value={item.phase} options={PHASES} onChange={v => update(item.id, { phase: v as CostPhase })} />
              <Select value={item.costType} options={TYPES} onChange={v => update(item.id, { costType: v as CostType })} />
            </div>
            <div className="grid grid-cols-6 gap-2 mb-2">
              <NumberInput placeholder="Low" value={item.amount.low} onChange={e => update(item.id, { amount: { ...item.amount, low: Number(e.target.value) } })} />
              <NumberInput placeholder="Expected" value={item.amount.expected} onChange={e => update(item.id, { amount: { ...item.amount, expected: Number(e.target.value) } })} />
              <NumberInput placeholder="High" value={item.amount.high} onChange={e => update(item.id, { amount: { ...item.amount, high: Number(e.target.value) } })} />
              <NumberInput placeholder="Qty" value={item.quantity} onChange={e => update(item.id, { quantity: Number(e.target.value) })} />
              <Select value={item.recurrence} options={['One-time', 'Annual', 'Monthly']} onChange={v => update(item.id, { recurrence: v as any })} />
              <Select value={item.confidence} options={CONFIDENCES} onChange={v => update(item.id, { confidence: v as Confidence })} />
            </div>
            <div className="grid grid-cols-4 gap-2 mb-2">
              <Select value={item.treatment} options={TREATMENTS} onChange={v => update(item.id, { treatment: v as Treatment })} />
              <TextInput placeholder="Source" value={item.source} onChange={e => update(item.id, { source: e.target.value })} />
              <Checkbox checked={item.included} onChange={v => update(item.id, { included: v })} label="Included" />
              <Checkbox checked={item.customerValidated} onChange={v => update(item.id, { customerValidated: v })} label="Customer validated" />
            </div>
            <textarea
              className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
              placeholder="Notes / description"
              value={item.notes}
              onChange={e => update(item.id, { notes: e.target.value })}
            />
            <div className="text-right mt-1">
              <button onClick={() => remove(item.id)} className="text-xs text-rose-600 hover:underline">Remove item</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-3 text-xs text-blue-600 hover:underline">+ Add cost item</button>
      {categoryFilter === 'Optional advanced costs' && (
        <p className="text-xs text-slate-500 mt-3">Suggested areas: {ADVANCED_COST_AREAS.join(', ')}.</p>
      )}
    </Card>
  );
}
