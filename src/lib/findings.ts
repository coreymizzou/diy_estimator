import type { Scenario } from '../data/types';
import type { EstimateResult } from './calculations';

export function generateFindings(scenario: Scenario, result: EstimateResult): string[] {
  const findings: string[] = [];

  const laborShare = result.byCostType.find(t => t.type === 'Labor')?.amount.expected ?? 0;
  const totalExpected = result.periodTotal.expected || 1;
  if (laborShare / totalExpected > 0.5) {
    findings.push('The estimate is driven primarily by staffing rather than software licenses.');
  }

  const cloudCapability = scenario.capabilities.cloudEnvironment;
  if (cloudCapability?.level === 'Mature') {
    findings.push('The customer reported mature cloud capability, which reduces the modeled new funding requirement relative to a greenfield buildout.');
  }

  const existingShare = result.newCashVsCapacity.existingCapacity.expected;
  if (existingShare > 0) {
    findings.push('Existing personnel capacity represents a meaningful resource commitment even though it may not require new funding.');
  }

  if (scenario.capabilities.atoPathway?.level === 'Unknown' || scenario.capabilities.atoPathway?.level === 'None') {
    findings.push('The authorization estimate has low confidence because the customer\'s current authorization pathway is unknown or not yet established.');
  }

  if (scenario.cloud.mode === 'Quick') {
    findings.push('Cloud usage is based on a planning range rather than a configured provider quote.');
  }

  const unresolvedCapabilities = Object.values(scenario.capabilities).filter(c => c.treatment === 'Unknown').length;
  if (unresolvedCapabilities > 0) {
    findings.push(`Several existing resources (${unresolvedCapabilities}) have not yet been classified as available or requiring new funding.`);
  }

  findings.push('This estimate has not been validated against the customer\'s actual cloud usage and labor sourcing.');

  return findings;
}

export interface CostDriver {
  label: string;
  expected: number;
}

export function topCostDrivers(result: EstimateResult): CostDriver[] {
  return [...result.byCategory]
    .map(c => ({ label: c.category, expected: c.periodTotal.expected }))
    .sort((a, b) => b.expected - a.expected)
    .slice(0, 5);
}

export type ReadinessStatus = 'Exploratory only' | 'Suitable for guided customer discussion' | 'Ready to submit for formal cost-estimating review';

// rangeRatio = upper / lower across the headline period total. A ratio this wide means the
// underlying assumptions disagree enough that the number can't usefully support a decision yet.
export function rangeRatio(result: EstimateResult): number {
  const lower = result.periodTotal.low;
  if (lower <= 0) return Infinity;
  return result.periodTotal.high / lower;
}

export type RangeQuality = 'Reasonably bounded' | 'Caution' | 'Too broad for decision support';

export function rangeQuality(ratio: number): RangeQuality {
  if (ratio <= 2.0) return 'Reasonably bounded';
  if (ratio <= 3.0) return 'Caution';
  return 'Too broad for decision support';
}

export interface ReadinessFlag {
  label: string;
  triggered: boolean;
}

export function readinessFlags(scenario: Scenario, result: EstimateResult): ReadinessFlag[] {
  const flags: ReadinessFlag[] = [];

  const validatedLabor = [...scenario.initialLabor, ...scenario.recurringLabor].every(a => a.customerValidated);
  flags.push({ label: 'Labor rates not customer validated', triggered: !validatedLabor });

  flags.push({ label: 'Unknown authorization pathway', triggered: scenario.capabilities.atoPathway?.level === 'Unknown' });
  flags.push({ label: 'Unknown cloud usage', triggered: scenario.cloud.mode === 'Quick' });
  flags.push({ label: 'Unknown support requirement', triggered: false });

  const existingTreatedAsNew = Object.values(scenario.capabilities).some(
    c => (c.level === 'Mature' || c.level === 'Partial') && c.treatment === 'Requires new funding'
  );
  flags.push({ label: 'Existing resources treated as new purchases', triggered: existingTreatedAsNew });

  const newTreatedAsExisting = Object.values(scenario.capabilities).some(
    c => c.level === 'None' && c.treatment === 'Already available with minimal incremental burden'
  );
  flags.push({ label: 'New hires/capability treated as existing staff', triggered: newTreatedAsExisting });

  flags.push({ label: 'Quick cloud estimate and advanced cloud estimate both enabled', triggered: scenario.cloud.mode === 'Advanced' && scenario.cloud.advancedComponents.length === 0 });

  const dupLabor = scenario.externalAssessment.enabled && scenario.costItems.some(i => i.category === 'Cybersecurity and authorization' && i.costType === 'Professional service');
  flags.push({ label: 'Duplicate labor and flat professional-service costs', triggered: dupLabor });

  const unknownTreatedZero = scenario.costItems.some(i => i.treatment === 'Unknown' && i.amount.expected === 0 && i.included);
  flags.push({ label: 'Unknown costs treated as zero', triggered: unknownTreatedZero });

  flags.push({ label: 'Customer-common work included as DIY-only', triggered: false });

  const periodMismatch = scenario.profile.analysisPeriod === 'Custom' && scenario.profile.customAnalysisYears <= 0;
  flags.push({ label: 'Analysis period mismatch', triggered: periodMismatch });

  const missingRecurrence = scenario.costItems.some(i => i.included && i.phase !== 'Initial' && !i.recurrence);
  flags.push({ label: 'Missing recurrence on a recurring cost item', triggered: missingRecurrence });

  const lowConfItems = scenario.costItems.filter(i => i.included && i.confidence === 'Low');
  const lowConfTotal = lowConfItems.reduce((acc, i) => acc + i.amount.expected * (i.quantity || 1), 0);
  flags.push({ label: 'Low-confidence items drive more than 25% of the estimate', triggered: result.periodTotal.expected > 0 && lowConfTotal / result.periodTotal.expected > 0.25 });

  return flags;
}

export function readinessStatus(flags: ReadinessFlag[], result: EstimateResult): ReadinessStatus {
  const triggeredCount = flags.filter(f => f.triggered).length;
  const ratio = rangeRatio(result);
  if (ratio > 3.0 || triggeredCount > 3) return 'Exploratory only';
  if (triggeredCount === 0 && ratio <= 2.0) return 'Ready to submit for formal cost-estimating review';
  return 'Suitable for guided customer discussion';
}

export function overallConfidence(scenario: Scenario): 'High' | 'Medium' | 'Low' {
  const items = scenario.costItems.filter(i => i.included);
  if (items.length === 0) return 'Medium';
  const score = items.reduce((acc, i) => {
    if (i.confidence === 'High') return acc + 3;
    if (i.confidence === 'Medium') return acc + 2;
    if (i.confidence === 'Low') return acc + 1;
    return acc;
  }, 0) / items.length;
  if (score >= 2.5) return 'High';
  if (score >= 1.5) return 'Medium';
  return 'Low';
}
