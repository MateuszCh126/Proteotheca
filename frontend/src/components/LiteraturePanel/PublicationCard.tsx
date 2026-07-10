import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface PublicationCardProps {
  id: string; // pmid or doi
  title: string;
  authors: string;
  journal?: string;
  pubDate: string;
  abstract: string;
  doi?: string;
  source: 'pubmed' | 'biorxiv' | 'openalex' | 'arxiv' | 'europepmc';
}

export const PublicationCard: React.FC<PublicationCardProps> = ({
  id,
  title,
  authors,
  journal,
  pubDate,
  abstract,
  doi,
  source,
}) => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyDoi = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = doi || id;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let badgeColor = 'bg-blue-500/15 text-plddt-1 border-line';
  if (source === 'biorxiv') badgeColor = 'bg-amber-500/15 text-plddt-3 border-line';
  if (source === 'openalex') badgeColor = 'bg-violet-500/15 text-ink-2 border-line';
  if (source === 'arxiv') badgeColor = 'bg-red-500/15 text-path border-red-500/20';
  if (source === 'europepmc') badgeColor = 'bg-emerald-500/15 text-benign border-line';

  return (
    <div
      data-testid="publication-card"
      className="p-3 bg-wash border border-line rounded-xl space-y-2.5 hover:border-line transition-all cursor-pointer"
      onClick={() => setIsExpanded(prev => !prev)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className={`text-4xs uppercase tracking-widest px-1.5 py-0.5 rounded border font-extrabold ${badgeColor}`}>
              {source}
            </span>
            <span className="text-3xs font-mono text-ink-3">{pubDate}</span>
          </div>
          <h4 className="text-xs font-bold text-ink leading-snug font-sans select-none">
            {title}
          </h4>
        </div>
        <button
          data-testid={`literature-expand-btn-${String(id ?? '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
          className="p-1 hover:bg-wash rounded text-ink-2 transition-colors shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(prev => !prev);
          }}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-3xs text-ink-2 italic line-clamp-1">
        {authors} {journal ? `| ${journal}` : ''}
      </p>

      {/* Accordion abstract drawer */}
      <div
        data-testid="abstract-drawer"
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-3 bg-wash border border-line rounded-lg text-2xs text-ink-2 leading-relaxed font-sans">
          <strong className="text-ink-2 block mb-1">{t('literature.abstract')}</strong>
          {abstract}
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between border-t border-line pt-2 text-3xs font-mono text-ink-3">
        <span>ID: {id}</span>
        <div className="flex items-center space-x-2.5">
          {doi && (
            <button
              data-testid="literature-doi-link"
              onClick={handleCopyDoi}
              className="flex items-center space-x-1 hover:text-ink transition-colors p-1"
              title={t('literature.copyDoi')}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-benign" />
                  <span className="text-benign">{t('literature.copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>{t('literature.copyDoi')}</span>
                </>
              )}
            </button>
          )}
          {doi && (
            <a
              href={`https://doi.org/${doi}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-0.5 hover:text-ink transition-colors p-1"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
export default PublicationCard;
