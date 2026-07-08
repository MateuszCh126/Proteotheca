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

export interface AlphaGenomePrediction {
  biosample_name: string;
  output_type: string;
  quantile_score: number;
  raw_score: number;
}

export interface AlphaGenomeData {
  variant_id: string;
  predictions: AlphaGenomePrediction[];
}

export interface DbSnpData {
  rsid: string;
  chromosome: string;
  position: number;
  ref: string;
  alt: string;
  gene: string;
}

export interface UcscTfbsOverlap {
  tf_name: string;
  score: number;
}

export interface UcscData {
  coordinate: string;
  phylop: number;
  phastcons: number;
  tfbs_overlaps: UcscTfbsOverlap[];
}

export interface UniBindDataset {
  dataset_id: string;
  species: string;
  cell_line: string;
  count: number;
}

export interface UniBindData {
  tf_name: string;
  datasets: UniBindDataset[];
}

export interface JasparProfile {
  matrix_id: string;
  name: string;
  pfm: {
    A: number[];
    C: number[];
    G: number[];
    T: number[];
  };
}

export interface JasparData {
  symbol: string;
  profiles: JasparProfile[];
}

export interface VariantData {
  variant_id: string;
  clinvar: ClinVarData;
  gnomad: GnomadData;
  gtex: GtexData;
  alphagenome?: AlphaGenomeData;
  dbsnp?: DbSnpData;
  ucsc?: UcscData;
  unibind?: UniBindData;
  jaspar?: JasparData;
}
