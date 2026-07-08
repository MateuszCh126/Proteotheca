export type EntityType = 'gene' | 'variant' | 'disease' | 'unknown';

export function detectEntityType(query: string): EntityType {
  const trimmed = query.trim();
  if (!trimmed) return 'unknown';

  // 1. Variant Detect: rsID (e.g., rs113488022) or Chromosomal coordinates (e.g., chr7:140753336:A>T or 7-140753336-T-A)
  const rsIdPattern = /^rs/i;
  const chromosomalPattern = /^(chr)?[0-9XYxy]+[:\-]\d+/i;
  
  if (rsIdPattern.test(trimmed) || chromosomalPattern.test(trimmed)) {
    return 'variant';
  }

  // 2. Disease Detect: contains spaces, or matches standard cancer/disease terms.
  const diseaseKeywords = /(cancer|melanoma|tumor|carcinoma|lymphoma|sarcoma|syndrome|disease|diabetes|sclerosis|arthritis|glioma)/i;
  if (diseaseKeywords.test(trimmed) || trimmed.split(/\s+/).length >= 2) {
    return 'disease';
  }

  // 3. Fallback to gene for any other non-empty inputs to let the API handle validation/not-found responses
  return 'gene';
}
