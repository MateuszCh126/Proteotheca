export interface OpenTargetsAssociatedGene {
  symbol: string;
  score: number; // Gene-disease association score
}

export interface OpenTargetsDiseaseData {
  associated_genes: OpenTargetsAssociatedGene[];
}

export interface ChEMBLActiveCompound {
  chembl_id: string;
  name: string;
  ic50_nm: number; // IC50 value in nanomolar units
}

export interface ChEMBLData {
  active_compounds: ChEMBLActiveCompound[];
}

export interface ClinicalTrial {
  nct_id: string;
  title: string;
  status: "COMPLETED" | "RECRUITING" | "ACTIVE_NOT_RECRUITING" | "TERMINATED" | "UNKNOWN" | "NOT_YET_RECRUITING";
}

export interface ClinicalTrialsData {
  trial_count: number;
  trials: ClinicalTrial[];
}

export interface AdverseEventTerm {
  term: string;     // Event symptom name (e.g. "Fatigue", "Neutropenia")
  count: number;    // Number of FDA reports
}

export interface DemographicData {
  name: string;     // e.g. "Male", "Female", "Unknown" or age groups
  value: number;    // Count
}

export interface OpenFdaData {
  active_substance: string;
  total_reports: number;
  events: AdverseEventTerm[];
  sex_breakdown: DemographicData[];
  age_breakdown: DemographicData[];
}

export interface PubChemData {
  cid: number;
  name: string;
  formula: string;
  smiles: string;
  weight: number;
}

export interface OlsData {
  obo_id: string;
  label: string;
  description: string[];
  path?: string[];
}

export interface EncodeCcre {
  accession: string;
  chrom: string;
  start: number;
  len: number;
  pct: string; // e.g. pELS, dELS, PLS
}

export interface EncodeData {
  ccres: EncodeCcre[];
}

export interface DiseaseData {
  disease_name: string;
  opentargets: OpenTargetsDiseaseData;
  chembl: ChEMBLData;
  clinical_trials: ClinicalTrialsData;
  openfda: OpenFdaData;
  pubchem?: PubChemData;
  ols?: OlsData;
  encode?: EncodeData;
}
