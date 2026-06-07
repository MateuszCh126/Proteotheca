import React, { useState, useRef, useEffect } from 'react';
import { useSearch, SuggestionItem } from '../../hooks/useSearch';
import SuggestionList from './SuggestionList';
import { Search, Loader2 } from 'lucide-react';

export interface SearchBarProps {
  onSearch: (query: string, detectedType: 'gene' | 'variant' | 'disease' | 'unknown') => void;
  isLoading: boolean;
  error: string | null;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, error }) => {
  const { query, setQuery, suggestions, detectedType } = useSearch();
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelect(suggestions[highlightedIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: SuggestionItem) => {
    setQuery(item.value);
    setIsOpen(false);
    onSearch(item.value, item.type);
  };

  const handleSubmit = () => {
    if (query.trim()) {
      setIsOpen(false);
      onSearch(query.trim(), detectedType);
    }
  };

  // Get detected badge styles
  let badgeColor = 'bg-slate-500/10 text-slate-400 border-slate-500/25';
  if (detectedType === 'gene') {
    badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
  } else if (detectedType === 'variant') {
    badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/25';
  } else if (detectedType === 'disease') {
    badgeColor = 'bg-purple-500/15 text-purple-400 border-purple-500/25';
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-lg rounded-full flex items-center px-4 py-2 hover:border-cyan-500/30 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/10 transition-all duration-300">
        <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="Search Gene, Variant (rsID), or Disease..."
          className="bg-transparent border-none outline-none text-white w-full text-sm placeholder-slate-500"
          data-testid="search-input"
        />

        {query.trim() && (
          <span
            data-testid="search-detected-badge"
            className={`text-3xs uppercase tracking-wider px-2.5 py-1 rounded border mr-2 shrink-0 font-bold ${badgeColor}`}
          >
            {detectedType}
          </span>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          data-testid="search-button"
          className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-800 text-slate-950 font-bold text-xs uppercase px-4 py-1.5 rounded-full transition-all flex items-center shadow-md shadow-cyan-500/10"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
          ) : (
            'Analyze'
          )}
        </button>
      </div>

      {isOpen && suggestions.length > 0 && (
        <SuggestionList
          suggestions={suggestions}
          highlightedIndex={highlightedIndex}
          onSelect={handleSelect}
          onHover={setHighlightedIndex}
        />
      )}

      {error && (
        <div className="mt-2 text-xs text-rose-400 px-4" data-testid="error-banner">
          {error}
        </div>
      )}
    </div>
  );
};
export default SearchBar;
