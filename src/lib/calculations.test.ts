import { describe, it, expect } from 'vitest';
import { createScenario } from '../data/defaultScenario';
import {
  laborAllocationCost, laborAllocationCalculation, cloudAnnualCost, computeEstimate,
} from './calculations';
import { rangeRatio, rangeQuality, readinessFlags, readinessStatus } from './findings';
import type { LaborAllocation } from '../data/types';

describe('labor cost formula', () => {
  it('computes rate x FTE x months/12 with no footprint/classification adjustment at baseline footprint', () => {
    const scenario = createScenario('Custom');
    scenario.profile.numMicroservices = 6;
    scenario.profile.numDevelopers = 10;
    scenario.profile.numPlatformUsers = 15; // matches LABOR_FOOTPRINT_BASELINE -> factor 1
    scenario.laborRates.basis = 'Government civilian';
    scenario.laborRates.rates.platformEngineer.govExpected = 245000;
    const alloc: LaborAllocation = {
      roleId: 'platformEngineer', fteLow: 0.98, fteExpected: 0.98, fteHigh: 0.98,
      monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '',
    };
    const cost = laborAllocationCost(scenario, alloc);
    expect(cost.expected).toBeCloseTo(0.98 * 245000 * 1, 2);
  });

  it('scales linearly with partial-year duration', () => {
    const scenario = createScenario('Custom');
    scenario.profile.numMicroservices = 6; scenario.profile.numDevelopers = 10; scenario.profile.numPlatformUsers = 15;
    scenario.laborRates.basis = 'Government civilian';
    scenario.laborRates.rates.platformEngineer.govExpected = 240000;
    const full: LaborAllocation = { roleId: 'platformEngineer', fteLow: 1, fteExpected: 1, fteHigh: 1, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' };
    const half: LaborAllocation = { ...full, monthsAssigned: 6 };
    expect(laborAllocationCost(scenario, half).expected).toBeCloseTo(laborAllocationCost(scenario, full).expected / 2, 2);
  });

  it('blends government/contractor rates by mix percentage', () => {
    const scenario = createScenario('Custom');
    scenario.laborRates.basis = 'Mixed team';
    scenario.laborRates.mixGovPercent = 50;
    scenario.laborRates.rates.platformEngineer = { govLow: 100000, govExpected: 200000, govHigh: 300000, ctrLow: 200000, ctrExpected: 400000, ctrHigh: 600000 };
    const alloc: LaborAllocation = { roleId: 'platformEngineer', fteLow: 1, fteExpected: 1, fteHigh: 1, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' };
    expect(laborAllocationCost(scenario, alloc).expected).toBeCloseTo(300000, 2);
  });

  it('records every non-base adjustment as a named, explained calculation step', () => {
    const scenario = createScenario('Custom');
    scenario.profile.numMicroservices = 1; scenario.profile.numDevelopers = 1; scenario.profile.numPlatformUsers = 1;
    scenario.profile.classification = 'IL-5';
    const alloc: LaborAllocation = { roleId: 'cyberEngineer', fteLow: 1, fteExpected: 1, fteHigh: 1, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' };
    const calc = laborAllocationCalculation(scenario, alloc);
    const ids = calc.steps.map(s => s.id);
    expect(ids).toContain('base');
    expect(ids).toContain('footprint');
    expect(ids).toContain('impactLevel');
    for (const step of calc.steps) {
      expect(step.explanation.length).toBeGreaterThan(0);
    }
  });
});

describe('cloud cost', () => {
  it('never double-counts between quick and advanced mode (advanced ignores quick multipliers)', () => {
    const scenario = createScenario('Custom');
    scenario.cloud.mode = 'Advanced';
    scenario.cloud.advancedComponents = [{ id: 'c1', name: 'EC2', amount: { low: 100, expected: 200, high: 300 }, recurrence: 'Annual', included: true, notes: '' }];
    scenario.profile.availability = 'Mission critical';
    scenario.profile.dataVolume = 'High';
    const cost = cloudAnnualCost(scenario);
    expect(cost).toEqual({ low: 100, expected: 200, high: 300 });
  });

  it('caps the combined quick-mode multiplier so factors cannot compound without bound', () => {
    const scenario = createScenario('Custom');
    scenario.cloud.mode = 'Quick';
    scenario.profile.dataVolume = 'High';
    scenario.profile.loggingVolume = 'High';
    scenario.profile.availability = 'Mission critical';
    scenario.profile.numMicroservices = 1000;
    scenario.profile.numEndUsers = 100000;
    const cost = cloudAnnualCost(scenario);
    const base = scenario.cloud.quickAnnual.expected;
    expect(cost.expected / base).toBeLessThanOrEqual(5);
  });
});

describe('contingency', () => {
  it('defaults to disabled and contributes zero to the headline total', () => {
    const scenario = createScenario('Custom');
    expect(scenario.contingency.enabled).toBe(false);
    const result = computeEstimate(scenario);
    expect(result.contingencyAmount).toEqual({ low: 0, expected: 0, high: 0 });
    expect(result.periodTotalWithContingency).toEqual(result.periodTotal);
  });

  it('only adds cost when explicitly enabled, as a separate adjustment on top of the base range', () => {
    const scenario = createScenario('Custom');
    scenario.contingency = { enabled: true, low: 0.1, expected: 0.1, high: 0.1 };
    const result = computeEstimate(scenario);
    expect(result.contingencyAmount.expected).toBeCloseTo(result.periodTotal.expected * 0.1, 2);
    expect(result.periodTotalWithContingency.expected).toBeCloseTo(result.periodTotal.expected * 1.1, 2);
  });
});

describe('range quality', () => {
  it('flags a reasonably bounded range at or below 2x', () => {
    expect(rangeQuality(1.5)).toBe('Reasonably bounded');
    expect(rangeQuality(2.0)).toBe('Reasonably bounded');
  });
  it('flags caution between 2x and 3x', () => {
    expect(rangeQuality(2.5)).toBe('Caution');
  });
  it('flags too broad above 3x', () => {
    expect(rangeQuality(3.5)).toBe('Too broad for decision support');
  });
  it('computes ratio as upper / lower of the base period total', () => {
    const scenario = createScenario('Custom');
    const result = computeEstimate(scenario);
    expect(rangeRatio(result)).toBeCloseTo(result.periodTotal.high / result.periodTotal.low, 5);
  });
});

describe('readiness status', () => {
  it('is never "Ready to submit" when the range ratio exceeds 3.0, regardless of flags', () => {
    const scenario = createScenario('Custom');
    const result = computeEstimate(scenario);
    const flags = readinessFlags(scenario, result).map(f => ({ ...f, triggered: false }));
    const wideResult = { ...result, periodTotal: { low: 10, expected: 50, high: 100 } } as typeof result;
    expect(readinessStatus(flags, wideResult)).toBe('Exploratory only');
  });

  it('only reaches "Ready to submit for formal cost-estimating review" with zero flags and a bounded range', () => {
    const scenario = createScenario('Custom');
    const result = computeEstimate(scenario);
    const flags = readinessFlags(scenario, result).map(f => ({ ...f, triggered: false }));
    const boundedResult = { ...result, periodTotal: { low: 100, expected: 150, high: 180 } } as typeof result;
    expect(readinessStatus(flags, boundedResult)).toBe('Ready to submit for formal cost-estimating review');
  });
});
