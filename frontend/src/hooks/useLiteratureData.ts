import { useState, useEffect } from 'react';
import { LiteratureData } from '../types/literature';
import { apiJson } from '../api/client';

export function useLiteratureData(query: string | null) {
  const [data, setData] = useState<LiteratureData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
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
        const result = await apiJson<LiteratureData>(`/api/literature?query=${encodeURIComponent(query as string)}`);
        if (active) {
          setData(result);
        }
      } catch (err: any) {
        if (active) {
          setData(null);
          setError(err?.message || `Literature query failed for "${query}".`);
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
  }, [query]);

  return { data, isLoading, error };
}

