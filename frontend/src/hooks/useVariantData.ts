import { useState, useEffect } from 'react';
import { VariantData } from '../types/variant';
import { apiJson } from '../api/client';

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
    let active = true;

    async function fetchData() {
      try {
        const result = await apiJson<VariantData>(`/api/variants/${encodeURIComponent(variantId as string)}`);
        if (active) {
          setData(result);
        }
      } catch (err: any) {
        if (active) {
          setData(null);
          setError(err?.message || `Variant ID "${variantId}" not found in database.`);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, [variantId]);

  return { data, isLoading, error };
}

