import React from 'react';
import { SuggestionItem } from '../../hooks/useSearch';
import { useI18n } from '../../context/I18nContext';

interface SuggestionListProps {
  suggestions: SuggestionItem[];
  highlightedIndex: number;
  onSelect: (item: SuggestionItem) => void;
  onHover: (index: number) => void;
}

export const SuggestionList: React.FC<SuggestionListProps> = ({
  suggestions,
  highlightedIndex,
  onSelect,
  onHover,
}) => {
  const { t } = useI18n();
  if (suggestions.length === 0) return null;

  return (
    <div
      className="absolute left-0 right-0 mt-2 bg-surface/90 backdrop-blur-xl border border-line rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-line"
      data-testid="autocomplete-dropdown"
    >
      {suggestions.map((item, index) => {
        const isHighlighted = index === highlightedIndex;
        let badgeColor = 'bg-ink-3/10 text-ink-2 border-slate-500/25';
        if (item.type === 'gene') {
          badgeColor = 'bg-wash text-benign border-emerald-500/25';
        } else if (item.type === 'variant') {
          badgeColor = 'bg-wash text-plddt-3 border-amber-500/25';
        } else if (item.type === 'disease') {
          badgeColor = 'bg-wash text-ink-2 border-purple-500/25';
        }

        return (
          <div
            key={`${item.type}-${item.value}`}
            data-testid={`autocomplete-item-${item.type}-${item.value.toLowerCase()}`}
            onClick={() => onSelect(item)}
            onMouseEnter={() => onHover(index)}
            className={`flex items-center justify-between px-5 py-3 cursor-pointer transition-all duration-150 ${
              isHighlighted ? 'bg-wash' : 'hover:bg-wash'
            }`}
          >
            <span className="text-ink font-medium font-sans">{item.value}</span>
            <span className={`text-2xs uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor} font-semibold`}>
              {t(`entity.${item.type}` as const)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
export default SuggestionList;
