import { useState, useEffect } from 'react';
import { GeneData } from '../types/gene';
import { mockGenes } from '../api/mockData';

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

    const timer = setTimeout(() => {
      const found = mockGenes[symbol.toUpperCase()];
      if (found) {
        setData(found);
      } else {
        setData(null);
        setError(`Gene symbol "${symbol}" not found in database.`);
      }
      setIsLoading(false);
    }, 400); // Simulated delay

    return () => clearTimeout(timer);
  }, [symbol]);

  return { data, isLoading, error };
}
