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

export interface GeneData {
  symbol: string;
  ensembl: EnsemblData;
  uniprot: UniProtData;
  opentargets: OpenTargetsGeneData;
}
