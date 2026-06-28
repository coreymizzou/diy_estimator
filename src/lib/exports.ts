import type { Scenario } from '../data/types';
import { buildAssumptionRegister } from './assumptionRegister';

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportScenarioJSON(scenario: Scenario) {
  downloadFile(`${scenario.name.replace(/\s+/g, '_')}.json`, JSON.stringify(scenario, null, 2), 'application/json');
}

function csvEscape(v: unknown): string {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportCostLinesCSV(scenario: Scenario) {
  const rows = buildAssumptionRegister(scenario);
  const header = ['Assumption', 'Value', 'Low', 'Expected', 'High', 'Source', 'Owner', 'Confidence', 'Customer Validated', 'Tag', 'Notes'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([r.assumption, r.value, r.low, r.expected, r.high, r.source, r.owner, r.confidence, r.customerValidated, r.tag, r.notes].map(csvEscape).join(','));
  }
  downloadFile(`${scenario.name.replace(/\s+/g, '_')}_cost_lines.csv`, lines.join('\n'), 'text/csv');
}
