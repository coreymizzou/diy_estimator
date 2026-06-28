import type { ReactNode } from 'react';

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 ${className}`}>
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-3 tracking-wide uppercase">{title}</h3>}
      {children}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${props.className ?? ''}`}
    />
  );
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput type="number" {...props} />;
}

export function Select({ value, onChange, options, ...rest }: { value: string; onChange: (v: string) => void; options: string[] } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      {...rest}
      className="w-full rounded border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-slate-300" />
      {label}
    </label>
  );
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'amber' | 'blue' | 'green' | 'red' }) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-rose-100 text-rose-800',
  };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function RangeBar3({ low, expected, high }: { low: number; expected: number; high: number }) {
  const max = Math.max(high, 1);
  return (
    <div className="w-full h-2 bg-slate-100 rounded relative">
      <div className="absolute h-2 bg-blue-200 rounded" style={{ left: 0, width: `${(low / max) * 100}%` }} />
      <div className="absolute h-2 w-1 bg-blue-600 rounded" style={{ left: `${(expected / max) * 100}%` }} />
      <div className="absolute h-2 bg-blue-100 rounded" style={{ left: `${(low / max) * 100}%`, width: `${((high - low) / max) * 100}%` }} />
    </div>
  );
}
