import { useState, useEffect } from 'react';
import { detectEntityType, EntityType } from '../utils/validation';
import { mockGenes, mockVariants, mockDiseases } from '../api/mockData';

export interface SuggestionItem {
  value: string;
  type: EntityType;
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [detectedType, setDetectedType] = useState<EntityType>('unknown');

  useEffect(() => {
    const type = detectEntityType(query);
    setDetectedType(type);

    if (query.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matches: SuggestionItem[] = [];

    // Search genes
    Object.keys(mockGenes).forEach(symbol => {
      if (symbol.toLowerCase().includes(lowerQuery)) {
        matches.push({ value: symbol, type: 'gene' });
      }
    });

    // Search variants
    Object.keys(mockVariants).forEach(variantId => {
      if (variantId.toLowerCase().includes(lowerQuery)) {
        matches.push({ value: variantId, type: 'variant' });
      }
    });

    // Search diseases
    Object.keys(mockDiseases).forEach(diseaseName => {
      if (diseaseName.toLowerCase().includes(lowerQuery)) {
        matches.push({ value: diseaseName, type: 'disease' });
      }
    });

    setSuggestions(matches.slice(0, 8)); // Limit to top 8 suggestions
  }, [query]);

  return {
    query,
    setQuery,
    suggestions,
    detectedType,
  };
}
