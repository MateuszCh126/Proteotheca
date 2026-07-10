import React, { useState, useRef, useEffect } from 'react';
import { useSearch, SuggestionItem } from '../../hooks/useSearch';
import SuggestionList from './SuggestionList';
import { Search, Loader2 } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export interface SearchBarProps {
  onSearch: (query: string, detectedType: 'gene' | 'variant' | 'disease' | 'unknown') => void;
  isLoading: boolean;
  error: string | null;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, error }) => {
  const { t } = useI18n();
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
  let badgeColor = 'bg-ink-3/10 text-ink-2 border-slate-500/25';
  if (detectedType === 'gene') {
    badgeColor = 'bg-emerald-500/15 text-benign border-emerald-500/25';
  } else if (detectedType === 'variant') {
    badgeColor = 'bg-amber-500/15 text-plddt-3 border-amber-500/25';
  } else if (detectedType === 'disease') {
    badgeColor = 'bg-purple-500/15 text-ink-2 border-purple-500/25';
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="bg-surface backdrop-blur-md border border-line shadow-lg rounded-full flex items-center px-4 py-2 hover:border-ink/25 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-ink/30 transition-all duration-300">
        <Search className="w-5 h-5 text-ink-2 mr-2 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={t('search.placeholder')}
          className="bg-transparent border-none outline-none text-ink w-full text-sm placeholder-ink-3"
          data-testid="search-input"
        />

        {query.trim() && (
          <span
            data-testid="search-detected-badge"
            className={`text-3xs uppercase tracking-wider px-2.5 py-1 rounded border mr-2 shrink-0 font-bold ${badgeColor}`}
          >
            {t(`entity.${detectedType}` as const)}
          </span>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          data-testid="search-button"
          className="bg-ink hover:bg-ink disabled:bg-wash text-paper font-bold text-xs uppercase px-4 py-1.5 rounded-full transition-all flex items-center shadow-md shadow-none"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
          ) : (
            t('search.analyze')
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
        <div className="mt-2 text-xs text-path px-4" data-testid="error-banner">
          {error}
        </div>
      )}
    </div>
  );
};
export default SearchBar;
