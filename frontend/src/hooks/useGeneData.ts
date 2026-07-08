import { useState, useEffect } from 'react';
import { GeneData } from '../types/gene';
import { apiJson } from '../api/client';

export function useGeneData(symbol: string | null) {
  const [data, setData] = useState<GeneData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
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
        const result = await apiJson<GeneData>(`/api/genes/${encodeURIComponent(symbol as string)}`);
        if (active) {
          setData(result);
        }
      } catch (err: any) {
        if (active) {
          setData(null);
          setError(err?.message || `Gene symbol "${symbol}" not found in database.`);
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
  }, [symbol]);

  return { data, isLoading, error };
}

