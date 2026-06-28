import type {
  Scenario, RangeValue, LaborAllocation, LaborRoleId, Treatment, CostCategory, CostType,
} from '../data/types';
import { zeroRange } from '../data/types';
import { LABOR_ROLES } from '../data/types';
import {
  DATA_VOLUME_MULTIPLIERS, LOGGING_VOLUME_MULTIPLIERS, AVAILABILITY_MULTIPLIERS,
  CLASSIFICATION_CYBER_MULTIPLIERS, TOOLING_BASELINE_SEATS, MICROSERVICE_BASELINE,
} from '../data/benchmarks';

export const addRange = (a: RangeValue, b: RangeValue): RangeValue => ({
  low: a.low + b.low,
  expected: a.expected + b.expected,
  high: a.high + b.high,
});

export const scaleRange = (a: RangeValue, f: number): RangeValue => ({
  low: a.low * f, expected: a.expected * f, high: a.high * f,
});

export function analysisYears(scenario: Scenario): number {
  const p = scenario.profile.analysisPeriod;
  if (p === '1 year') return 1;
  if (p === '3 years') return 3;
  if (p === '5 years') return 5;
  return Math.max(1, scenario.profile.customAnalysisYears || 1);
}

function blendedAnnualRate(scenario: Scenario, roleId: LaborRoleId): RangeValue {
  const r = scenario.laborRates.rates[roleId];
  const basis = scenario.laborRates.basis;
  if (basis === 'Government civilian') {
    return { low: r.govLow, expected: r.govExpected, high: r.govHigh };
  }
  if (basis === 'Contractor') {
    return { low: r.ctrLow, expected: r.ctrExpected, high: r.ctrHigh };
  }
  // Mixed team or Custom: blend by mixGovPercent
  const g = scenario.laborRates.mixGovPercent / 100;
  const c = 1 - g;
  return {
    low: r.govLow * g + r.ctrLow * c,
    expected: r.govExpected * g + r.ctrExpected * c,
    high: r.govHigh * g + r.ctrHigh * c,
  };
}

// Labor cost = annual fully burdened cost x FTE allocation x months assigned / 12
export function laborAllocationCost(scenario: Scenario, alloc: LaborAllocation): RangeValue {
  const annualRate = blendedAnnualRate(scenario, alloc.roleId);
  const months = alloc.monthsAssigned / 12;
  const cost = {
    low: annualRate.low * alloc.fteLow * months,
    expected: annualRate.expected * alloc.fteExpected * months,
    high: annualRate.high * alloc.fteHigh * months,
  };
  // Higher impact levels require more authorization/control-implementation effort from
  // cybersecurity engineers specifically, not the rest of the team.
  if (alloc.roleId === 'cyberEngineer') {
    return scaleRange(cost, CLASSIFICATION_CYBER_MULTIPLIERS[scenario.profile.classification]);
  }
  return cost;
}

export interface LaborSummaryRow {
  roleId: LaborRoleId;
  label: string;
  initialFte: RangeValue;
  recurringFte: RangeValue;
  initialCost: RangeValue;
  recurringCostAnnual: RangeValue;
  newCash: RangeValue;
  existingCapacity: RangeValue;
}

export function laborSummary(scenario: Scenario): LaborSummaryRow[] {
  return LABOR_ROLES.map(role => {
    const initialAllocs = scenario.initialLabor.filter(a => a.roleId === role.id);
    const recurringAllocs = scenario.recurringLabor.filter(a => a.roleId === role.id);
    const initialFte = initialAllocs.reduce((acc, a) => addRange(acc, { low: a.fteLow, expected: a.fteExpected, high: a.fteHigh }), zeroRange());
    const recurringFte = recurringAllocs.reduce((acc, a) => addRange(acc, { low: a.fteLow, expected: a.fteExpected, high: a.fteHigh }), zeroRange());
    const initialCost = initialAllocs.reduce((acc, a) => addRange(acc, laborAllocationCost(scenario, a)), zeroRange());
    const recurringCostAnnual = recurringAllocs.reduce((acc, a) => addRange(acc, laborAllocationCost(scenario, a)), zeroRange());
    const allAllocs = [...initialAllocs, ...recurringAllocs];
    const newCash = allAllocs
      .filter(a => a.treatment === 'New funding required')
      .reduce((acc, a) => addRange(acc, laborAllocationCost(scenario, a)), zeroRange());
    const existingCapacity = allAllocs
      .filter(a => a.treatment === 'Existing funded capacity consumed')
      .reduce((acc, a) => addRange(acc, laborAllocationCost(scenario, a)), zeroRange());
    return { roleId: role.id, label: role.label, initialFte, recurringFte, initialCost, recurringCostAnnual, newCash, existingCapacity };
  });
}

export function extendedHoursMultiplier(scenario: Scenario): number {
  if (scenario.profile.supportModel === 'Extended business hours') return 1 + scenario.profile.extendedHoursUplift;
  if (scenario.profile.supportModel === '24x7') return 2.5; // multiple staff/rotations required, not a single continuous person
  return 1;
}

export function cloudAnnualCost(scenario: Scenario): RangeValue {
  if (scenario.cloud.mode === 'Quick') {
    // Quick mode is a flat planning range, so volume/availability/service-count are applied
    // here as multipliers. Advanced mode is already itemized component-by-component, so
    // applying the same multipliers there would double-count effects already priced in.
    const dataFactor = DATA_VOLUME_MULTIPLIERS[scenario.profile.dataVolume];
    const loggingFactor = LOGGING_VOLUME_MULTIPLIERS[scenario.profile.loggingVolume];
    const availabilityFactor = AVAILABILITY_MULTIPLIERS[scenario.profile.availability];
    const microserviceFactor = Math.min(3, Math.max(0.5, scenario.profile.numMicroservices / MICROSERVICE_BASELINE));
    return scaleRange(scenario.cloud.quickAnnual, dataFactor * loggingFactor * availabilityFactor * microserviceFactor);
  }
  return scenario.cloud.advancedComponents
    .filter(c => c.included)
    .reduce((acc, c) => addRange(acc, c.recurrence === 'Monthly' ? scaleRange(c.amount, 12) : c.amount), zeroRange());
}

export function toolingAnnualCost(scenario: Scenario): RangeValue {
  // Per-seat tooling pricing (TOOLING_SOURCES) scales with headcount; the benchmark range
  // is calibrated to a ~25-seat team, so scale it by actual developers + platform users.
  const seats = scenario.profile.numDevelopers + scenario.profile.numPlatformUsers;
  const seatFactor = Math.min(4, Math.max(0.4, seats / TOOLING_BASELINE_SEATS));
  return scaleRange(scenario.tooling.annualLicense, seatFactor);
}

export function migrationCost(scenario: Scenario): RangeValue {
  const rate = blendedAnnualRate(scenario, scenario.migration.laborRoleId);
  const fteMonths = scenario.migration.fteMonths;
  return {
    low: (rate.low / 12) * fteMonths.low,
    expected: (rate.expected / 12) * fteMonths.expected,
    high: (rate.high / 12) * fteMonths.high,
  };
}

export interface CategoryBreakdown {
  category: CostCategory;
  initial: RangeValue;
  recurringAnnual: RangeValue;
  periodTotal: RangeValue;
}

export interface CostTypeBreakdown {
  type: CostType;
  amount: RangeValue;
}

export interface NewCashVsCapacity {
  newCash: RangeValue;
  existingCapacity: RangeValue;
  alreadyAvailable: RangeValue;
  unknown: RangeValue;
}

export interface EstimateResult {
  years: number;
  initialTotal: RangeValue;
  recurringAnnualTotal: RangeValue;
  periodTotal: RangeValue; // before contingency
  contingencyAmount: RangeValue;
  periodTotalWithContingency: RangeValue;
  byCategory: CategoryBreakdown[];
  byCostType: CostTypeBreakdown[];
  newCashVsCapacity: NewCashVsCapacity;
  economicBurdenTotal: RangeValue;
  fteYearsInitial: RangeValue;
  fteYearsRecurringAnnual: RangeValue;
  fteYearsTotal: RangeValue;
  laborRows: LaborSummaryRow[];
}

function treatmentBucket(t: Treatment, ranges: NewCashVsCapacity, amount: RangeValue) {
  if (t === 'New funding required') ranges.newCash = addRange(ranges.newCash, amount);
  else if (t === 'Existing funded capacity consumed') ranges.existingCapacity = addRange(ranges.existingCapacity, amount);
  else if (t === 'Already available') ranges.alreadyAvailable = addRange(ranges.alreadyAvailable, amount);
  else ranges.unknown = addRange(ranges.unknown, amount);
}

export function computeEstimate(scenario: Scenario): EstimateResult {
  const years = analysisYears(scenario);
  const uplift = extendedHoursMultiplier(scenario);
  const rows = laborSummary(scenario);

  const byCategory: Record<CostCategory, CategoryBreakdown> = {
    'Initial engineering and deployment': { category: 'Initial engineering and deployment', initial: zeroRange(), recurringAnnual: zeroRange(), periodTotal: zeroRange() },
    'Cybersecurity and authorization': { category: 'Cybersecurity and authorization', initial: zeroRange(), recurringAnnual: zeroRange(), periodTotal: zeroRange() },
    'Cloud infrastructure': { category: 'Cloud infrastructure', initial: zeroRange(), recurringAnnual: zeroRange(), periodTotal: zeroRange() },
    'Tools and licensing': { category: 'Tools and licensing', initial: zeroRange(), recurringAnnual: zeroRange(), periodTotal: zeroRange() },
    'Ongoing platform operations and support': { category: 'Ongoing platform operations and support', initial: zeroRange(), recurringAnnual: zeroRange(), periodTotal: zeroRange() },
    'Migration and integration': { category: 'Migration and integration', initial: zeroRange(), recurringAnnual: zeroRange(), periodTotal: zeroRange() },
    'Optional advanced costs': { category: 'Optional advanced costs', initial: zeroRange(), recurringAnnual: zeroRange(), periodTotal: zeroRange() },
  };
  const byCostType: Record<CostType, RangeValue> = {
    Labor: zeroRange(), Cloud: zeroRange(), License: zeroRange(), 'Professional service': zeroRange(), Other: zeroRange(),
  };
  const newCashVsCapacity: NewCashVsCapacity = { newCash: zeroRange(), existingCapacity: zeroRange(), alreadyAvailable: zeroRange(), unknown: zeroRange() };

  // Initial labor -> split: architecture/eng/cyber-authorization buckets approximated by role
  for (const alloc of scenario.initialLabor) {
    const cost = laborAllocationCost(scenario, alloc);
    const category: CostCategory = alloc.roleId === 'cyberEngineer' ? 'Cybersecurity and authorization' : 'Initial engineering and deployment';
    byCategory[category].initial = addRange(byCategory[category].initial, cost);
    byCostType.Labor = addRange(byCostType.Labor, cost);
    treatmentBucket(alloc.treatment, newCashVsCapacity, cost);
  }

  // Recurring labor (operations) -> apply support-model uplift to ops-related roles
  for (const alloc of scenario.recurringLabor) {
    const baseCost = laborAllocationCost(scenario, alloc);
    const opsRoles: LaborRoleId[] = ['sreOps', 'userSupport', 'cloudEngineer'];
    const cost = opsRoles.includes(alloc.roleId) ? scaleRange(baseCost, uplift) : baseCost;
    const category: CostCategory = alloc.roleId === 'cyberEngineer' ? 'Cybersecurity and authorization' : 'Ongoing platform operations and support';
    byCategory[category].recurringAnnual = addRange(byCategory[category].recurringAnnual, cost);
    byCostType.Labor = addRange(byCostType.Labor, cost);
    treatmentBucket(alloc.treatment, newCashVsCapacity, cost);
  }

  // Cloud infrastructure (recurring annual)
  const cloudAnnual = cloudAnnualCost(scenario);
  byCategory['Cloud infrastructure'].recurringAnnual = addRange(byCategory['Cloud infrastructure'].recurringAnnual, cloudAnnual);
  byCostType.Cloud = addRange(byCostType.Cloud, cloudAnnual);
  treatmentBucket('New funding required', newCashVsCapacity, cloudAnnual);

  // Tooling (recurring annual)
  const toolingAnnual = toolingAnnualCost(scenario);
  byCategory['Tools and licensing'].recurringAnnual = addRange(byCategory['Tools and licensing'].recurringAnnual, toolingAnnual);
  byCostType.License = addRange(byCostType.License, toolingAnnual);
  treatmentBucket('New funding required', newCashVsCapacity, toolingAnnual);

  // External assessment (initial, professional service) — only if enabled. Higher impact
  // levels require a deeper 3PAO/independent assessment against more controls.
  if (scenario.externalAssessment.enabled) {
    const assessmentAmount = scaleRange(scenario.externalAssessment.amount, CLASSIFICATION_CYBER_MULTIPLIERS[scenario.profile.classification]);
    byCategory['Cybersecurity and authorization'].initial = addRange(byCategory['Cybersecurity and authorization'].initial, assessmentAmount);
    byCostType['Professional service'] = addRange(byCostType['Professional service'], assessmentAmount);
    treatmentBucket('New funding required', newCashVsCapacity, assessmentAmount);
  }

  // Migration (initial, labor-derived)
  const migration = migrationCost(scenario);
  byCategory['Migration and integration'].initial = addRange(byCategory['Migration and integration'].initial, migration);
  byCostType.Labor = addRange(byCostType.Labor, migration);
  treatmentBucket('New funding required', newCashVsCapacity, migration);

  // Custom cost items (advanced / extra) — respects phase, costType, treatment, included flag
  for (const item of scenario.costItems) {
    if (!item.included) continue;
    let amount = scaleRange(item.amount, item.quantity || 1);
    if (item.recurrence === 'Monthly') amount = scaleRange(amount, 12);
    byCostType[item.costType] = addRange(byCostType[item.costType], amount);
    treatmentBucket(item.treatment, newCashVsCapacity, amount);
    if (item.phase === 'Initial') {
      byCategory[item.category].initial = addRange(byCategory[item.category].initial, amount);
    } else if (item.phase === 'Recurring') {
      byCategory[item.category].recurringAnnual = addRange(byCategory[item.category].recurringAnnual, amount);
    } else {
      byCategory[item.category].initial = addRange(byCategory[item.category].initial, amount);
      byCategory[item.category].recurringAnnual = addRange(byCategory[item.category].recurringAnnual, amount);
    }
  }

  // Period totals per category: initial + recurringAnnual * years
  for (const cat of Object.keys(byCategory) as CostCategory[]) {
    const b = byCategory[cat];
    b.periodTotal = addRange(b.initial, scaleRange(b.recurringAnnual, years));
  }

  const initialTotal = Object.values(byCategory).reduce((acc, b) => addRange(acc, b.initial), zeroRange());
  const recurringAnnualTotal = Object.values(byCategory).reduce((acc, b) => addRange(acc, b.recurringAnnual), zeroRange());
  const periodTotal = addRange(initialTotal, scaleRange(recurringAnnualTotal, years));

  const contingencyAmount = scenario.contingency.enabled
    ? { low: periodTotal.low * scenario.contingency.low, expected: periodTotal.expected * scenario.contingency.expected, high: periodTotal.high * scenario.contingency.high }
    : zeroRange();
  const periodTotalWithContingency = addRange(periodTotal, contingencyAmount);

  // Recurring labor/cloud/tooling new-cash-vs-capacity buckets above only captured one year's worth for recurring items;
  // scale recurring portion of newCash/existingCapacity by years for period-level totals, while initial stays as-is.
  // We recompute precisely below for accuracy.
  const newCashVsCapacityPeriod: NewCashVsCapacity = { newCash: zeroRange(), existingCapacity: zeroRange(), alreadyAvailable: zeroRange(), unknown: zeroRange() };
  const addBucket = (t: Treatment, amount: RangeValue) => treatmentBucket(t, newCashVsCapacityPeriod, amount);
  for (const alloc of scenario.initialLabor) addBucket(alloc.treatment, laborAllocationCost(scenario, alloc));
  for (const alloc of scenario.recurringLabor) {
    const baseCost = laborAllocationCost(scenario, alloc);
    const opsRoles: LaborRoleId[] = ['sreOps', 'userSupport', 'cloudEngineer'];
    const cost = opsRoles.includes(alloc.roleId) ? scaleRange(baseCost, uplift) : baseCost;
    addBucket(alloc.treatment, scaleRange(cost, years));
  }
  addBucket('New funding required', scaleRange(cloudAnnual, years));
  addBucket('New funding required', scaleRange(toolingAnnual, years));
  if (scenario.externalAssessment.enabled) addBucket('New funding required', scaleRange(scenario.externalAssessment.amount, CLASSIFICATION_CYBER_MULTIPLIERS[scenario.profile.classification]));
  addBucket('New funding required', migration);
  for (const item of scenario.costItems) {
    if (!item.included) continue;
    let amount = scaleRange(item.amount, item.quantity || 1);
    if (item.recurrence === 'Monthly') amount = scaleRange(amount, 12);
    if (item.phase === 'Recurring') amount = scaleRange(amount, years);
    if (item.phase === 'Both') amount = addRange(amount, scaleRange(amount, years - 1 >= 0 ? years - 1 : 0));
    addBucket(item.treatment, amount);
  }

  const economicBurdenTotal = scenario.includeExistingCapacityInBurden
    ? addRange(newCashVsCapacityPeriod.newCash, newCashVsCapacityPeriod.existingCapacity)
    : newCashVsCapacityPeriod.newCash;

  const fteYearsInitial = rows.reduce((acc, r) => addRange(acc, r.initialFte), zeroRange());
  const fteYearsRecurringAnnual = rows.reduce((acc, r) => addRange(acc, r.recurringFte), zeroRange());
  const fteYearsTotal = addRange(fteYearsInitial, scaleRange(fteYearsRecurringAnnual, years));

  return {
    years,
    initialTotal,
    recurringAnnualTotal,
    periodTotal,
    contingencyAmount,
    periodTotalWithContingency,
    byCategory: Object.values(byCategory),
    byCostType: (Object.keys(byCostType) as CostType[]).map(type => ({ type, amount: byCostType[type] })),
    newCashVsCapacity: newCashVsCapacityPeriod,
    economicBurdenTotal,
    fteYearsInitial,
    fteYearsRecurringAnnual,
    fteYearsTotal,
    laborRows: rows,
  };
}

export function formatCurrency(n: number): string {
  if (!isFinite(n)) return '$0';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function formatRange(r: RangeValue): string {
  return `${formatCurrency(r.low)} - ${formatCurrency(r.high)} (exp. ${formatCurrency(r.expected)})`;
}
