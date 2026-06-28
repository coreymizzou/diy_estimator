import type {
  LaborRoleId, LaborRateRange, LaborAllocation, CapabilityMap, CapabilityId,
  CloudFootprint, RangeValue, ToolingProfile, MaturityPreset,
} from './types';

export const BENCHMARK_LABEL =
  'Illustrative public-sector planning benchmark — replace with organization-specific labor rates.';

// 2026 illustrative fully burdened annual planning ranges. Not official rates.
export const LABOR_RATE_BENCHMARKS: Record<LaborRoleId, LaborRateRange> = {
  platformArchitect:     { govLow: 170000, govExpected: 220000, govHigh: 290000, ctrLow: 250000, ctrExpected: 350000, ctrHigh: 480000 },
  platformEngineer:      { govLow: 145000, govExpected: 190000, govHigh: 250000, ctrLow: 220000, ctrExpected: 300000, ctrHigh: 410000 },
  cloudEngineer:         { govLow: 140000, govExpected: 185000, govHigh: 245000, ctrLow: 210000, ctrExpected: 285000, ctrHigh: 390000 },
  cyberEngineer:         { govLow: 150000, govExpected: 200000, govHigh: 270000, ctrLow: 230000, ctrExpected: 325000, ctrHigh: 450000 },
  sreOps:                { govLow: 145000, govExpected: 190000, govHigh: 250000, ctrLow: 220000, ctrExpected: 300000, ctrHigh: 410000 },
  dbNetworkSpecialist:   { govLow: 135000, govExpected: 175000, govHigh: 230000, ctrLow: 190000, ctrExpected: 260000, ctrHigh: 360000 },
  userSupport:           { govLow: 85000,  govExpected: 115000, govHigh: 155000, ctrLow: 125000, ctrExpected: 175000, ctrHigh: 250000 },
  programManager:        { govLow: 125000, govExpected: 165000, govHigh: 220000, ctrLow: 180000, ctrExpected: 250000, ctrHigh: 340000 },
};

export const LABOR_RATE_SOURCES = [
  { label: 'OPM 2026 General Schedule tables', url: 'https://www.opm.gov/policy-data-oversight/pay-leave/salaries-wages/2026/general-schedule/' },
  { label: 'GSA CALC+ Labor Ceiling Rates', url: 'https://buy.gsa.gov/pricing/qr/mas' },
];

export const LABOR_RATE_SOURCE_EXPLANATION =
  'OPM tables provide salary benchmarks; GSA CALC+ provides awarded fully burdened ceiling-rate market research. Neither source automatically determines the customer\'s actual cost.';

// Greenfield initial implementation FTE allocations (12-month duration)
const greenfieldInitial: LaborAllocation[] = [
  { roleId: 'platformArchitect', fteLow: 0.40, fteExpected: 0.75, fteHigh: 1.00, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
  { roleId: 'platformEngineer', fteLow: 1.50, fteExpected: 3.00, fteHigh: 4.00, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
  { roleId: 'cloudEngineer', fteLow: 0.50, fteExpected: 1.00, fteHigh: 1.50, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
  { roleId: 'cyberEngineer', fteLow: 0.75, fteExpected: 1.50, fteHigh: 2.50, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
  { roleId: 'sreOps', fteLow: 0.25, fteExpected: 0.50, fteHigh: 1.00, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
  { roleId: 'dbNetworkSpecialist', fteLow: 0.10, fteExpected: 0.30, fteHigh: 0.50, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
  { roleId: 'programManager', fteLow: 0.20, fteExpected: 0.50, fteHigh: 0.75, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
];

// Greenfield recurring operations FTE allocations (annual)
const greenfieldRecurring: LaborAllocation[] = [
  { roleId: 'platformEngineer', fteLow: 1.00, fteExpected: 1.50, fteHigh: 2.50, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
  { roleId: 'cloudEngineer', fteLow: 0.25, fteExpected: 0.50, fteHigh: 1.00, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
  { roleId: 'cyberEngineer', fteLow: 0.40, fteExpected: 0.75, fteHigh: 1.25, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
  { roleId: 'sreOps', fteLow: 0.75, fteExpected: 1.25, fteHigh: 2.00, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
  { roleId: 'dbNetworkSpecialist', fteLow: 0.10, fteExpected: 0.25, fteHigh: 0.50, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
  { roleId: 'userSupport', fteLow: 0.20, fteExpected: 0.50, fteHigh: 1.00, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
  { roleId: 'programManager', fteLow: 0.10, fteExpected: 0.30, fteHigh: 0.50, monthsAssigned: 12, treatment: 'New funding required', customerValidated: false, notes: '' },
];

const scaleAllocations = (allocs: LaborAllocation[], factor: number, treatment: LaborAllocation['treatment']): LaborAllocation[] =>
  allocs.map(a => ({
    ...a,
    fteLow: Math.round(a.fteLow * factor * 100) / 100,
    fteExpected: Math.round(a.fteExpected * factor * 100) / 100,
    fteHigh: Math.round(a.fteHigh * factor * 100) / 100,
    treatment,
  }));

export function presetLabor(preset: MaturityPreset): { initial: LaborAllocation[]; recurring: LaborAllocation[] } {
  switch (preset) {
    case 'Greenfield':
      return { initial: greenfieldInitial, recurring: greenfieldRecurring };
    case 'Partially equipped':
      return {
        initial: scaleAllocations(greenfieldInitial, 0.65, 'New funding required'),
        recurring: scaleAllocations(greenfieldRecurring, 0.65, 'Existing funded capacity consumed'),
      };
    case 'Mature platform':
      return {
        initial: scaleAllocations(greenfieldInitial, 0.32, 'Existing funded capacity consumed'),
        recurring: scaleAllocations(greenfieldRecurring, 0.32, 'Existing funded capacity consumed'),
      };
    case 'Custom':
    default:
      return { initial: greenfieldInitial.map(a => ({ ...a })), recurring: greenfieldRecurring.map(a => ({ ...a })) };
  }
}

export function defaultCapabilities(preset: MaturityPreset): CapabilityMap {
  const ids: CapabilityId[] = [
    'cloudEnvironment', 'platformTeam', 'cloudTeam', 'cyberTeam', 'atoPathway', 'cicd', 'iac',
    'containerPlatform', 'monitoringLogging', 'securityScanning', 'databaseServices', 'networking',
    'iam', 'secretsManagement', 'backupRecovery', 'helpDesk', 'sourceControl', 'artifactRegistry',
    'jira', 'confluence', 'mattermost', 'govPlatformServices', 'acquisitionSupport',
  ];
  const map = {} as CapabilityMap;
  for (const id of ids) {
    if (preset === 'Greenfield') {
      map[id] = { level: 'None', treatment: 'Requires new funding' };
    } else if (preset === 'Partially equipped') {
      map[id] = { level: 'Partial', treatment: 'Available but requires additional capacity' };
    } else if (preset === 'Mature platform') {
      map[id] = { level: 'Mature', treatment: 'Already available with minimal incremental burden' };
    } else {
      map[id] = { level: 'Unknown', treatment: 'Unknown' };
    }
  }
  return map;
}

export const CLOUD_QUICK_RANGES: Record<CloudFootprint, RangeValue> = {
  Small: { low: 60000, expected: 140000, high: 320000 },
  Medium: { low: 150000, expected: 350000, high: 750000 },
  Large: { low: 400000, expected: 900000, high: 1800000 },
  Custom: { low: 0, expected: 0, high: 0 },
};

export const CLOUD_SOURCES = [
  'https://aws.amazon.com/govcloud-us/',
  'https://aws.amazon.com/ec2/pricing/',
  'https://aws.amazon.com/eks/pricing/',
  'https://aws.amazon.com/rds/pricing/',
  'https://aws.amazon.com/s3/pricing/',
  'https://aws.amazon.com/cloudwatch/pricing/',
  'https://aws.amazon.com/backup/pricing/',
];

export const CLOUD_SOURCE_EXPLANATION =
  'Actual GovCloud costs depend on region, architecture, usage, commitment model, data movement, retention, and service configuration.';

export const TOOLING_PROFILE_RANGES: Record<ToolingProfile, RangeValue> = {
  'Open-source or government-provided': { low: 0, expected: 15000, high: 50000 },
  'Mixed commercial and open-source': { low: 30000, expected: 90000, high: 220000 },
  'Enterprise commercial toolchain': { low: 90000, expected: 220000, high: 500000 },
  Custom: { low: 0, expected: 0, high: 0 },
};

export const TOOLING_SOURCES = [
  { label: 'GitLab pricing', url: 'https://about.gitlab.com/pricing/' },
  { label: 'Atlassian Jira pricing', url: 'https://www.atlassian.com/software/jira/pricing' },
  { label: 'Atlassian Confluence pricing', url: 'https://www.atlassian.com/software/confluence/pricing' },
  { label: 'Mattermost pricing', url: 'https://mattermost.com/pricing/' },
];

export const TOOLING_LIST = [
  'Source-code management', 'CI/CD tooling', 'Container or artifact registry', 'Security scanning',
  'Dependency scanning', 'Container scanning', 'Infrastructure scanning', 'Jira or equivalent',
  'Confluence or equivalent', 'Mattermost or equivalent', 'Monitoring and logging tools',
];

export const MIGRATION_FTE_MONTHS: Record<'Minimal' | 'Simple' | 'Moderate' | 'Complex', RangeValue> = {
  Minimal: { low: 1, expected: 2, high: 4 },
  Simple: { low: 2, expected: 4, high: 8 },
  Moderate: { low: 6, expected: 12, high: 24 },
  Complex: { low: 12, expected: 24, high: 48 },
};

export const EXTERNAL_ASSESSMENT_RANGE: RangeValue = { low: 25000, expected: 125000, high: 400000 };

export const CUSTOMER_COMMON_WORK = [
  'Application development',
  'Product ownership',
  'Mission testing',
  'Application-specific defect remediation',
  'Application-specific security remediation',
  'Business-process development',
  'End-user training',
  'Customer data preparation',
  'Customer-specific functional requirements',
];

export const ADVANCED_COST_AREAS = [
  'Disaster recovery',
  'Multi-region resilience',
  'Acquisition and procurement effort',
  'Training and knowledge transfer',
  'Program management (advanced)',
  'Higher availability',
  'After-hours support',
  'Future growth',
  'Transition or exit costs',
  'Independent assessment',
  'Additional environments',
  'Additional classification requirements',
];
