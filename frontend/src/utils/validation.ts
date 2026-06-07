export type EntityType = 'gene' | 'variant' | 'disease' | 'unknown';

export function detectEntityType(query: string): EntityType {
  const trimmed = query.trim();
  if (!trimmed) return 'unknown';

  // 1. Variant Detect: rsID (e.g., rs113488022) or Chromosomal coordinates (e.g., chr7:140753336:A>T or 7:140753336:A>T)
  const rsIdPattern = /^rs\d+$/i;
  const chromosomalPattern = /^(chr)?([1-9XY]|1\d|2[0-2]):\d+:[ACTG]+>[ACTG]+$/i;
  
  if (rsIdPattern.test(trimmed) || chromosomalPattern.test(trimmed)) {
    return 'variant';
  }

  // 2. Gene Detect: standard uppercase/lowercase alphanumeric symbols, length 2 to 10.
  const genePattern = /^[A-Z0-9-]{2,10}$/i;
  const knownGenes = new Set(['BRAF', 'EGFR', 'TP53', 'BRCA1', 'BRCA2', 'KRAS', 'ALK', 'PIK3CA', 'KIT', 'NRAS']);
  
  if (genePattern.test(trimmed)) {
    // If it is a single word and does not have spaces, or matches known genes
    if (knownGenes.has(trimmed.toUpperCase()) || !/\s/.test(trimmed)) {
      return 'gene';
    }
  }

  // 3. Disease Detect: contains spaces, or matches standard cancer/disease terms.
  const diseaseKeywords = /(cancer|melanoma|tumor|carcinoma|lymphoma|sarcoma|syndrome|disease|diabetes|sclerosis|arthritis|glioma)/i;
  if (diseaseKeywords.test(trimmed) || trimmed.split(/\s+/).length >= 2) {
    return 'disease';
  }

  return 'unknown';
}
