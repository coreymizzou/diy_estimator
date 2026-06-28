import type { Scenario } from '../data/types';
import { LABOR_ROLES } from '../data/types';
import { laborAllocationCost, cloudAnnualCost, toolingAnnualCost, migrationCost } from './calculations';

export interface AssumptionRow {
  id: string;
  assumption: string;
  value: string;
  low: number;
  expected: number;
  high: number;
  source: string;
  owner: string;
  confidence: string;
  customerValidated: boolean;
  lastUpdated: string;
  financialImpact: number;
  notes: string;
  tag: 'Labor' | 'Cloud' | 'Cyber/authorization' | 'Tooling' | 'Operations' | 'Migration' | 'Unknown';
}

export function buildAssumptionRegister(scenario: Scenario): AssumptionRow[] {
  const rows: AssumptionRow[] = [];
  const now = scenario.lastUpdated;

  scenario.initialLabor.forEach((a, idx) => {
    const cost = laborAllocationCost(scenario, a);
    const label = LABOR_ROLES.find(r => r.id === a.roleId)?.label ?? a.roleId;
    rows.push({
      id: `init-labor-${idx}`,
      assumption: `${label} — initial implementation FTE`,
      value: `${a.fteExpected} FTE x ${a.monthsAssigned} months`,
      low: cost.low, expected: cost.expected, high: cost.high,
      source: 'Customer-entered FTE allocation x labor rate benchmark',
      owner: 'Program team', confidence: 'Medium', customerValidated: a.customerValidated, lastUpdated: now,
      financialImpact: cost.expected, notes: a.notes,
      tag: a.roleId === 'cyberEngineer' ? 'Cyber/authorization' : 'Labor',
    });
  });

  scenario.recurringLabor.forEach((a, idx) => {
    const cost = laborAllocationCost(scenario, a);
    const label = LABOR_ROLES.find(r => r.id === a.roleId)?.label ?? a.roleId;
    rows.push({
      id: `rec-labor-${idx}`,
      assumption: `${label} — recurring operations FTE`,
      value: `${a.fteExpected} FTE annually`,
      low: cost.low, expected: cost.expected, high: cost.high,
      source: 'Customer-entered FTE allocation x labor rate benchmark',
      owner: 'Program team', confidence: 'Medium', customerValidated: a.customerValidated, lastUpdated: now,
      financialImpact: cost.expected, notes: a.notes,
      tag: a.roleId === 'cyberEngineer' ? 'Cyber/authorization' : 'Operations',
    });
  });

  const cloud = cloudAnnualCost(scenario);
  rows.push({
    id: 'cloud-annual',
    assumption: `Cloud infrastructure (${scenario.cloud.mode} estimate)`,
    value: scenario.cloud.mode === 'Quick' ? scenario.cloud.footprint : `${scenario.cloud.advancedComponents.length} components`,
    low: cloud.low, expected: cloud.expected, high: cloud.high,
    source: 'AWS GovCloud planning ranges (editable)', owner: 'Cloud engineering', confidence: 'Low', customerValidated: false, lastUpdated: now,
    financialImpact: cloud.expected, notes: 'Planning range, not a configured provider quote.', tag: 'Cloud',
  });

  const tooling = toolingAnnualCost(scenario);
  rows.push({
    id: 'tooling-annual',
    assumption: `Tools and licensing (${scenario.tooling.profile})`,
    value: scenario.tooling.profile,
    low: tooling.low, expected: tooling.expected, high: tooling.high,
    source: 'Vendor public pricing pages (editable)', owner: 'Platform team', confidence: 'Medium', customerValidated: false, lastUpdated: now,
    financialImpact: tooling.expected, notes: '', tag: 'Tooling',
  });

  if (scenario.externalAssessment.enabled) {
    rows.push({
      id: 'external-assessment',
      assumption: 'External assessment / authorization support',
      value: 'One-time professional service',
      low: scenario.externalAssessment.amount.low, expected: scenario.externalAssessment.amount.expected, high: scenario.externalAssessment.amount.high,
      source: 'Illustrative planning range', owner: 'Cybersecurity team', confidence: 'Low', customerValidated: false, lastUpdated: now,
      financialImpact: scenario.externalAssessment.amount.expected, notes: '', tag: 'Cyber/authorization',
    });
  }

  const migration = migrationCost(scenario);
  rows.push({
    id: 'migration',
    assumption: `Migration and integration (${scenario.migration.complexity})`,
    value: `${scenario.migration.fteMonths.expected} FTE-months`,
    low: migration.low, expected: migration.expected, high: migration.high,
    source: 'FTE-month planning range (editable)', owner: 'Platform team', confidence: 'Medium', customerValidated: false, lastUpdated: now,
    financialImpact: migration.expected, notes: '', tag: 'Migration',
  });

  scenario.costItems.forEach(item => {
    rows.push({
      id: item.id,
      assumption: item.name,
      value: `${item.quantity} x ${item.unit}`,
      low: item.amount.low * item.quantity, expected: item.amount.expected * item.quantity, high: item.amount.high * item.quantity,
      source: item.source, owner: item.category, confidence: item.confidence, customerValidated: item.customerValidated, lastUpdated: now,
      financialImpact: item.amount.expected * item.quantity, notes: item.notes,
      tag: item.confidence === 'Unknown' ? 'Unknown' : (item.category === 'Cybersecurity and authorization' ? 'Cyber/authorization' : item.category === 'Cloud infrastructure' ? 'Cloud' : item.category === 'Tools and licensing' ? 'Tooling' : item.category === 'Migration and integration' ? 'Migration' : item.category === 'Ongoing platform operations and support' ? 'Operations' : 'Labor'),
    });
  });

  return rows;
}
