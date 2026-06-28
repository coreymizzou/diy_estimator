import type { LaborAllocation, LaborRoleId, Treatment, Scenario } from '../data/types';
import { LABOR_ROLES } from '../data/types';
import { laborAllocationCost } from '../lib/calculations';
import { formatCurrency } from '../lib/calculations';
import { Select, NumberInput, Checkbox } from './ui';

const TREATMENTS: Treatment[] = ['New funding required', 'Existing funded capacity consumed', 'Already available', 'Unknown'];

export default function LaborAllocationTable({
  scenario, allocations, onUpdate, title,
}: {
  scenario: Scenario;
  allocations: LaborAllocation[];
  onUpdate: (next: LaborAllocation[]) => void;
  title: string;
}) {
  const usedRoles = new Set(allocations.map(a => a.roleId));
  const availableToAdd = LABOR_ROLES.filter(r => !usedRoles.has(r.id));

  const update = (idx: number, patch: Partial<LaborAllocation>) => {
    const next = allocations.map((a, i) => (i === idx ? { ...a, ...patch } : a));
    onUpdate(next);
  };
  const remove = (idx: number) => onUpdate(allocations.filter((_, i) => i !== idx));
  const add = (roleId: LaborRoleId) => onUpdate([...allocations, { roleId, fteLow: 0.1, fteExpected: 0.25, fteHigh: 0.5, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' }]);

  return (
    <div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            <th className="py-2 pr-1">Role</th>
            <th className="py-2 pr-1">Low FTE</th>
            <th className="py-2 pr-1">Exp FTE</th>
            <th className="py-2 pr-1">High FTE</th>
            <th className="py-2 pr-1">Months</th>
            <th className="py-2 pr-1">Treatment</th>
            <th className="py-2 pr-1">Validated</th>
            <th className="py-2 pr-1">Cost (expected)</th>
            <th className="py-2 pr-1"></th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((a, idx) => {
            const cost = laborAllocationCost(scenario, a);
            const label = LABOR_ROLES.find(r => r.id === a.roleId)?.label ?? a.roleId;
            return (
              <tr key={`${title}-${a.roleId}-${idx}`} className="border-b border-slate-100">
                <td className="py-1 pr-1 text-slate-800">{label}</td>
                <td className="py-1 pr-1 w-20"><NumberInput step="0.05" value={a.fteLow} onChange={e => update(idx, { fteLow: Number(e.target.value) })} /></td>
                <td className="py-1 pr-1 w-20"><NumberInput step="0.05" value={a.fteExpected} onChange={e => update(idx, { fteExpected: Number(e.target.value) })} /></td>
                <td className="py-1 pr-1 w-20"><NumberInput step="0.05" value={a.fteHigh} onChange={e => update(idx, { fteHigh: Number(e.target.value) })} /></td>
                <td className="py-1 pr-1 w-20"><NumberInput value={a.monthsAssigned} onChange={e => update(idx, { monthsAssigned: Number(e.target.value) })} /></td>
                <td className="py-1 pr-1 w-56"><Select value={a.treatment} options={TREATMENTS} onChange={v => update(idx, { treatment: v as Treatment })} /></td>
                <td className="py-1 pr-1"><Checkbox checked={a.customerValidated} onChange={v => update(idx, { customerValidated: v })} label="" /></td>
                <td className="py-1 pr-1 whitespace-nowrap">{formatCurrency(cost.expected)}</td>
                <td className="py-1 pr-1"><button onClick={() => remove(idx)} className="text-rose-600 text-xs hover:underline">Remove</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {availableToAdd.length > 0 && (
        <div className="mt-2">
          <Select
            value=""
            options={['Add a role...', ...availableToAdd.map(r => r.label)]}
            onChange={label => {
              const role = availableToAdd.find(r => r.label === label);
              if (role) add(role.id);
            }}
          />
        </div>
      )}
    </div>
  );
}
