export interface ClinVarData {
  pathogenicity: "Pathogenic" | "Likely Pathogenic" | "Benign" | "Likely Benign" | "Uncertain Significance";
  significance: string;
  review_status: string;
}

export interface GnomadPopulation {
  pop: string;
  freq: number;
}

export interface GnomadData {
  allele_frequency: number;
  homozygote_count: number;
  populations: GnomadPopulation[];
}

export interface GtexEQTL {
  tissue: string;
  gene_symbol: string;
  p_value: number;
  nes: number; // Normalized Effect Size
}

export interface GtexData {
  eqtls: GtexEQTL[];
}

export interface VariantData {
  variant_id: string;
  clinvar: ClinVarData;
  gnomad: GnomadData;
  gtex: GtexData;
}
