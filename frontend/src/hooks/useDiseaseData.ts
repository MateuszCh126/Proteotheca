import { useState, useEffect } from 'react';
import { DiseaseData } from '../types/disease';
import { apiJson } from '../api/client';

export function useDiseaseData(diseaseName: string | null) {
  const [data, setData] = useState<DiseaseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!diseaseName) {
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
        const result = await apiJson<DiseaseData>(`/api/diseases/${encodeURIComponent(diseaseName as string)}`);
        if (active) {
          setData(result);
        }
      } catch (err: any) {
        if (active) {
          setData(null);
          setError(err?.message || `Disease "${diseaseName}" not found in database.`);
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
  }, [diseaseName]);

  return { data, isLoading, error };
}

