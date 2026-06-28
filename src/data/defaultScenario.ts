import type {
  Scenario, MaturityPreset, CustomerProfile, LaborRateAssumptions, CloudAssumptions,
  ToolingAssumptions, MigrationAssumptions,
} from './types';
import {
  LABOR_RATE_BENCHMARKS, presetLabor, defaultCapabilities, CLOUD_QUICK_RANGES,
  TOOLING_PROFILE_RANGES, MIGRATION_FTE_MONTHS, TOOLING_LIST, EXTERNAL_ASSESSMENT_RANGE,
} from './benchmarks';

let idCounter = 0;
export const nextId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`;

export function defaultProfile(): CustomerProfile {
  return {
    scenarioName: 'New scenario',
    programName: '',
    organization: '',
    classification: 'IL-4',
    numApplications: 1,
    numMicroservices: 6,
    numDevelopers: 10,
    numPlatformUsers: 15,
    numEndUsers: 100,
    analysisPeriod: '3 years',
    customAnalysisYears: 3,
    targetOperationalDate: '',
    environments: { development: true, test: true, staging: true, production: true, disasterRecovery: false },
    supportModel: 'Business hours',
    availability: 'Standard',
    migrationComplexity: 'Moderate',
    dataVolume: 'Moderate',
    loggingVolume: 'Moderate',
    extendedHoursUplift: 0.20,
  };
}

export function defaultLaborRates(): LaborRateAssumptions {
  return {
    basis: 'Mixed team',
    mixGovPercent: 50,
    rates: structuredClone(LABOR_RATE_BENCHMARKS),
  };
}

export function defaultCloud(footprint: CloudAssumptions['footprint'] = 'Medium'): CloudAssumptions {
  return {
    mode: 'Quick',
    footprint,
    quickAnnual: { ...CLOUD_QUICK_RANGES[footprint] },
    advancedComponents: [],
  };
}

export function defaultTooling(profile: ToolingAssumptions['profile'] = 'Mixed commercial and open-source'): ToolingAssumptions {
  const statuses: ToolingAssumptions['toolStatuses'] = {};
  for (const t of TOOLING_LIST) statuses[t] = 'Unknown';
  return {
    profile,
    annualLicense: { ...TOOLING_PROFILE_RANGES[profile] },
    toolStatuses: statuses,
  };
}

export function defaultMigration(complexity: MigrationAssumptions['complexity'] = 'Moderate'): MigrationAssumptions {
  return {
    complexity,
    fteMonths: { ...MIGRATION_FTE_MONTHS[complexity] },
    laborRoleId: 'platformEngineer',
  };
}

export function createScenario(preset: MaturityPreset, overrides?: Partial<Scenario>): Scenario {
  const labor = presetLabor(preset);
  const scenario: Scenario = {
    id: nextId('scenario'),
    name: preset === 'Custom' ? 'Custom scenario' : preset,
    preset,
    profile: defaultProfile(),
    capabilities: defaultCapabilities(preset),
    laborRates: defaultLaborRates(),
    initialLabor: labor.initial,
    recurringLabor: labor.recurring,
    cloud: defaultCloud(),
    tooling: defaultTooling(),
    migration: defaultMigration(),
    externalAssessment: { enabled: false, amount: { ...EXTERNAL_ASSESSMENT_RANGE } },
    costItems: [],
    contingency: { enabled: false, low: 0.05, expected: 0.10, high: 0.20 },
    includeExistingCapacityInBurden: false,
    lastUpdated: new Date().toISOString(),
  };
  return { ...scenario, ...overrides };
}

export function createDemoScenario(): Scenario {
  const s = createScenario('Partially equipped', {
    name: 'Illustrative demonstration scenario',
    isDemo: true,
  });
  s.profile = {
    ...s.profile,
    scenarioName: 'Illustrative demonstration scenario',
    programName: 'Demo Program',
    organization: 'Demo Organization',
    classification: 'IL-5',
    numApplications: 1,
    numMicroservices: 4,
    numDevelopers: 25,
    numPlatformUsers: 25,
    numEndUsers: 500,
    analysisPeriod: '3 years',
    customAnalysisYears: 3,
    environments: { development: true, test: false, staging: true, production: true, disasterRecovery: false },
    supportModel: 'Business hours',
    availability: 'High availability',
    migrationComplexity: 'Moderate',
    dataVolume: 'Moderate',
    loggingVolume: 'Moderate',
  };
  s.cloud = defaultCloud('Small');
  s.migration = defaultMigration('Moderate');
  s.laborRates.basis = 'Mixed team';
  s.laborRates.mixGovPercent = 50;
  return s;
}
