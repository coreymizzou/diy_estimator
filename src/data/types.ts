// Core data model for the Customer-Managed DevSecOps Cost Range Estimator.
// All dollar figures in this file are illustrative planning benchmarks only.

export type Confidence = 'High' | 'Medium' | 'Low' | 'Unknown';

export type Treatment =
  | 'New funding required'
  | 'Existing funded capacity consumed'
  | 'Already available'
  | 'Unknown';

export type CapabilityLevel = 'None' | 'Partial' | 'Mature' | 'Unknown';

export type CapabilityTreatment =
  | 'Already available with minimal incremental burden'
  | 'Available but requires additional capacity'
  | 'Requires new funding'
  | 'Unknown';

export type MaturityPreset =
  | 'Greenfield'
  | 'Partially equipped'
  | 'Mature platform'
  | 'Custom';

export type LaborBasis = 'Government civilian' | 'Contractor' | 'Mixed team' | 'Custom';

export type CostCategory =
  | 'Initial engineering and deployment'
  | 'Cybersecurity and authorization'
  | 'Cloud infrastructure'
  | 'Tools and licensing'
  | 'Ongoing platform operations and support'
  | 'Migration and integration'
  | 'Optional advanced costs';

export type CostPhase = 'Initial' | 'Recurring' | 'Both';

export type CostType = 'Labor' | 'Cloud' | 'License' | 'Professional service' | 'Other';

export interface RangeValue {
  low: number;
  expected: number;
  high: number;
}

export const zeroRange = (): RangeValue => ({ low: 0, expected: 0, high: 0 });

export interface CostItem {
  id: string;
  name: string;
  category: CostCategory;
  description: string;
  phase: CostPhase;
  costType: CostType;
  // Either a direct dollar range (for non-labor items) ...
  amount: RangeValue;
  quantity: number;
  unit: string;
  durationMonths: number; // months the cost applies for, within the analysis period
  recurrence: 'One-time' | 'Annual' | 'Monthly';
  source: string;
  confidence: Confidence;
  treatment: Treatment;
  included: boolean;
  customerValidated: boolean;
  notes: string;
}

export type LaborRoleId =
  | 'platformArchitect'
  | 'platformEngineer'
  | 'cloudEngineer'
  | 'cyberEngineer'
  | 'sreOps'
  | 'dbNetworkSpecialist'
  | 'userSupport'
  | 'programManager';

export interface LaborRoleDef {
  id: LaborRoleId;
  label: string;
}

export const LABOR_ROLES: LaborRoleDef[] = [
  { id: 'platformArchitect', label: 'Platform architect' },
  { id: 'platformEngineer', label: 'Platform/DevSecOps engineer' },
  { id: 'cloudEngineer', label: 'Cloud engineer' },
  { id: 'cyberEngineer', label: 'Cybersecurity/authorization engineer' },
  { id: 'sreOps', label: 'SRE/platform operations engineer' },
  { id: 'dbNetworkSpecialist', label: 'Database/network specialist' },
  { id: 'userSupport', label: 'User-support specialist' },
  { id: 'programManager', label: 'Program/service manager' },
];

export interface LaborRateRange {
  govLow: number; govExpected: number; govHigh: number;
  ctrLow: number; ctrExpected: number; ctrHigh: number;
}

export interface LaborAllocation {
  roleId: LaborRoleId;
  fteLow: number;
  fteExpected: number;
  fteHigh: number;
  monthsAssigned: number; // months assigned within the period being modeled
  treatment: Treatment;
  customerValidated: boolean;
  notes: string;
}

export type CapabilityId =
  | 'cloudEnvironment'
  | 'platformTeam'
  | 'cloudTeam'
  | 'cyberTeam'
  | 'atoPathway'
  | 'cicd'
  | 'iac'
  | 'containerPlatform'
  | 'monitoringLogging'
  | 'securityScanning'
  | 'databaseServices'
  | 'networking'
  | 'iam'
  | 'secretsManagement'
  | 'backupRecovery'
  | 'helpDesk'
  | 'sourceControl'
  | 'artifactRegistry'
  | 'jira'
  | 'confluence'
  | 'mattermost'
  | 'govPlatformServices'
  | 'acquisitionSupport';

export interface CapabilityDef {
  id: CapabilityId;
  label: string;
}

export const CAPABILITIES: CapabilityDef[] = [
  { id: 'cloudEnvironment', label: 'Cloud environment' },
  { id: 'platformTeam', label: 'Platform engineering team' },
  { id: 'cloudTeam', label: 'Cloud engineering team' },
  { id: 'cyberTeam', label: 'Cybersecurity team' },
  { id: 'atoPathway', label: 'Authorization (ATO) pathway' },
  { id: 'cicd', label: 'CI/CD pipelines' },
  { id: 'iac', label: 'Infrastructure as code' },
  { id: 'containerPlatform', label: 'Container platform' },
  { id: 'monitoringLogging', label: 'Monitoring and logging' },
  { id: 'securityScanning', label: 'Security scanning' },
  { id: 'databaseServices', label: 'Database services' },
  { id: 'networking', label: 'Networking' },
  { id: 'iam', label: 'Identity and access management' },
  { id: 'secretsManagement', label: 'Secrets management' },
  { id: 'backupRecovery', label: 'Backup and recovery' },
  { id: 'helpDesk', label: 'Help desk or user support' },
  { id: 'sourceControl', label: 'Source-code management' },
  { id: 'artifactRegistry', label: 'Artifact or container registry' },
  { id: 'jira', label: 'Jira or equivalent' },
  { id: 'confluence', label: 'Confluence or equivalent' },
  { id: 'mattermost', label: 'Mattermost or equivalent' },
  { id: 'govPlatformServices', label: 'Government-provided platform services' },
  { id: 'acquisitionSupport', label: 'Acquisition or contract support' },
];

export interface CapabilityEntry {
  level: CapabilityLevel;
  treatment: CapabilityTreatment;
}

export type CapabilityMap = Record<CapabilityId, CapabilityEntry>;

export interface CustomerProfile {
  scenarioName: string;
  programName: string;
  organization: string;
  classification: 'IL-2' | 'IL-4' | 'IL-5' | 'Other';
  numApplications: number;
  numMicroservices: number;
  numDevelopers: number;
  numPlatformUsers: number;
  numEndUsers: number;
  analysisPeriod: '1 year' | '3 years' | '5 years' | 'Custom';
  customAnalysisYears: number;
  targetOperationalDate: string;
  environments: {
    development: boolean;
    test: boolean;
    staging: boolean;
    production: boolean;
    disasterRecovery: boolean;
  };
  supportModel: 'Business hours' | 'Extended business hours' | '24x7';
  availability: 'Standard' | 'High availability' | 'Mission critical';
  migrationComplexity: 'Minimal' | 'Simple' | 'Moderate' | 'Complex';
  dataVolume: 'Low' | 'Moderate' | 'High' | 'Custom';
  loggingVolume: 'Low' | 'Moderate' | 'High' | 'Custom';
  extendedHoursUplift: number; // 0.15 - 0.30
}

export type CloudFootprint = 'Small' | 'Medium' | 'Large' | 'Custom';
export type ToolingProfile = 'Open-source or government-provided' | 'Mixed commercial and open-source' | 'Enterprise commercial toolchain' | 'Custom';

export interface CloudAdvancedComponent {
  id: string;
  name: string;
  amount: RangeValue;
  recurrence: 'Annual' | 'Monthly';
  included: boolean;
  notes: string;
}

export interface CloudAssumptions {
  mode: 'Quick' | 'Advanced';
  footprint: CloudFootprint;
  quickAnnual: RangeValue; // editable
  advancedComponents: CloudAdvancedComponent[];
}

export interface ToolingAssumptions {
  profile: ToolingProfile;
  annualLicense: RangeValue;
  toolStatuses: Record<string, 'Already licensed' | 'Government provided' | 'New purchase required' | 'Open-source alternative' | 'Unknown'>;
}

export interface MigrationAssumptions {
  complexity: 'Minimal' | 'Simple' | 'Moderate' | 'Complex';
  fteMonths: RangeValue;
  laborRoleId: LaborRoleId;
}

export interface ExternalAssessment {
  enabled: boolean;
  amount: RangeValue;
}

export interface ContingencyAssumptions {
  enabled: boolean;
  low: number;
  expected: number;
  high: number;
}

export interface LaborRateAssumptions {
  basis: LaborBasis;
  mixGovPercent: number; // 0-100, used for Mixed team
  rates: Record<LaborRoleId, LaborRateRange>;
}

export interface Scenario {
  id: string;
  name: string;
  preset: MaturityPreset;
  isDemo?: boolean;
  profile: CustomerProfile;
  capabilities: CapabilityMap;
  laborRates: LaborRateAssumptions;
  initialLabor: LaborAllocation[];
  recurringLabor: LaborAllocation[];
  cloud: CloudAssumptions;
  tooling: ToolingAssumptions;
  migration: MigrationAssumptions;
  externalAssessment: ExternalAssessment;
  costItems: CostItem[];
  contingency: ContingencyAssumptions;
  includeExistingCapacityInBurden: boolean;
  lastUpdated: string;
}
