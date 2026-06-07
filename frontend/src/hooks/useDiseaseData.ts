import { useState, useEffect } from 'react';
import { DiseaseData } from '../types/disease';
import { mockDiseases } from '../api/mockData';

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

    const timer = setTimeout(() => {
      // Perform case-insensitive match on disease name keys
      const key = Object.keys(mockDiseases).find(
        k => k.toLowerCase() === diseaseName.toLowerCase()
      );
      const found = key ? mockDiseases[key] : null;

      if (found) {
        setData(found);
      } else {
        setData(null);
        setError(`Disease "${diseaseName}" not found in database.`);
      }
      setIsLoading(false);
    }, 500); // Simulated delay

    return () => clearTimeout(timer);
  }, [diseaseName]);

  return { data, isLoading, error };
}
