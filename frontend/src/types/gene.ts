export interface EnsemblTranscript {
  transcript_id: string;
  length: number;
}

export interface EnsemblData {
  gene_id: string;
  transcripts: EnsemblTranscript[];
}

export interface UniProtData {
  accession: string;
  name: string;
  sequence: string;
}

export interface OpenTargetsAssociation {
  disease_id: string;
  disease_name: string;
  score: number; // Association strength [0.0 - 1.0]
}

export interface OpenTargetsGeneData {
  target_id: string;
  associations: OpenTargetsAssociation[];
}

export interface AlphaFoldData {
  uniprot_id: string;
  entryId: string;
  pdbUrl: string;
  plddt_summary: {
    very_high: number;
    confident: number;
    low: number;
    very_low: number;
  };
}

export interface HpaExpression {
  tissue: string;
  level: string;
  reliability: string;
}

export interface HpaData {
  symbol: string;
  expression: HpaExpression[];
  localization: string[];
}

export interface InterProDomain {
  accession: string;
  name: string;
  start: number;
  end: number;
}

export interface InterProData {
  uniprot_id: string;
  domains: InterProDomain[];
}

export interface NcbiSeqData {
  accession: string;
  fasta: string;
}

export interface QuickGoAnnotation {
  go_id: string;
  go_name: string;
  evidence_code: string;
}

export interface QuickGoData {
  uniprot_id: string;
  annotations: QuickGoAnnotation[];
}

export interface ReactomePathway {
  dbId: number;
  displayName: string;
  stId: string;
}

export interface ReactomeData {
  uniprot_id: string;
  pathways: ReactomePathway[];
}

export interface GeneData {
  symbol: string;
  ensembl: EnsemblData;
  uniprot: UniProtData;
  opentargets: OpenTargetsGeneData;
  alphafold?: AlphaFoldData;
  hpa?: HpaData;
  interpro?: InterProData;
  ncbi_seq?: NcbiSeqData;
  quickgo?: QuickGoData;
  reactome?: ReactomeData;
}
