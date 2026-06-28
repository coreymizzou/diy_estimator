import type { Scenario } from '../data/types';
import type { EstimateResult } from './calculations';
import { addRange, scaleRange } from './calculations';
import type { RangeValue } from '../data/types';

export interface TimeModel {
  implementationMonths: number;
  operatingYears: number;
  // One-time cost to reach go-live. Never annualized.
  initialImplementationCost: RangeValue;
  // Cost of one full year of steady-state operations after go-live.
  steadyStateAnnualOperating: RangeValue;
  // Implementation cost only — what it costs to reach go-live.
  totalThroughGoLive: RangeValue;
  // Implementation cost plus the selected number of operating years after go-live.
  totalThroughOperatingPeriod: RangeValue;
}

// Implementation (build) and operating (post-go-live) periods are independent questions.
// totalThroughGoLive and totalThroughOperatingPeriod are never the same figure unless
// operatingYears is 0, and neither silently assumes a 1-year operating selection also
// covers the implementation effort.
export function computeTimeModel(scenario: Scenario, result: EstimateResult): TimeModel {
  return {
    implementationMonths: scenario.profile.implementationMonths,
    operatingYears: result.years,
    initialImplementationCost: result.initialTotal,
    steadyStateAnnualOperating: result.recurringAnnualTotal,
    totalThroughGoLive: result.initialTotal,
    totalThroughOperatingPeriod: addRange(result.initialTotal, scaleRange(result.recurringAnnualTotal, result.years)),
  };
}
