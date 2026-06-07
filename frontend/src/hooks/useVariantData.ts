import { useState, useEffect } from 'react';
import { VariantData } from '../types/variant';
import { mockVariants } from '../api/mockData';

export function useVariantData(variantId: string | null) {
  const [data, setData] = useState<VariantData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!variantId) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      const found = mockVariants[variantId.toLowerCase()];
      if (found) {
        setData(found);
      } else {
        setData(null);
        setError(`Variant ID "${variantId}" not found in database.`);
      }
      setIsLoading(false);
    }, 450); // Simulated delay

    return () => clearTimeout(timer);
  }, [variantId]);

  return { data, isLoading, error };
}
