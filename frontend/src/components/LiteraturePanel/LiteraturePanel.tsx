import React, { useState } from 'react';
import { LiteratureData } from '../../types/literature';
import PublicationCard from './PublicationCard';
import { BookOpen } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface LiteraturePanelProps {
  literatureData: LiteratureData | null;
  isLoading: boolean;
}

export const LiteraturePanel: React.FC<LiteraturePanelProps> = ({ literatureData, isLoading }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PUBMED' | 'BIORXIV' | 'OPENALEX' | 'ARXIV' | 'EUROPEPMC'>('ALL');

  if (isLoading) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px]" data-testid="literature-panel">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-mono text-accent-blue">{t('literature.fetching')}</span>
      </div>
    );
  }

  if (!literatureData) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px] text-center" data-testid="literature-panel">
        <div className="p-3 bg-wash rounded-full text-ink-2 mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-ink mb-1 font-sans">{t('literature.noEvidence')}</h3>
        <p className="text-xs text-ink-2 max-w-xs leading-relaxed">
          {t('literature.noEvidenceDescription')}
        </p>
      </div>
    );
  }

  const { pubmed, biorxiv, openalex, arxiv, europepmc } = literatureData;

  const totalCount = pubmed.length + biorxiv.length + openalex.length + (arxiv?.length || 0) + (europepmc?.length || 0);

  const filteredArticles = (() => {
    switch (activeTab) {
      case 'PUBMED':
        return pubmed.map(a => ({ ...a, source: 'pubmed' as const, id: a.pmid }));
      case 'BIORXIV':
        return biorxiv.map(a => ({ ...a, source: 'biorxiv' as const, id: a.doi }));
      case 'OPENALEX':
        return openalex.map(a => ({ ...a, source: 'openalex' as const, id: a.id }));
      case 'ARXIV':
        return (arxiv || []).map(a => ({ ...a, source: 'arxiv' as const, id: a.id }));
      case 'EUROPEPMC':
        return (europepmc || []).map(a => ({ ...a, source: 'europepmc' as const, id: a.pmcid }));
      default:
        return [
          ...pubmed.map(a => ({ ...a, source: 'pubmed' as const, id: a.pmid })),
          ...biorxiv.map(a => ({ ...a, source: 'biorxiv' as const, id: a.doi })),
          ...openalex.map(a => ({ ...a, source: 'openalex' as const, id: a.id })),
          ...(arxiv || []).map(a => ({ ...a, source: 'arxiv' as const, id: a.id })),
          ...(europepmc || []).map(a => ({ ...a, source: 'europepmc' as const, id: a.pmcid })),
        ];
    }
  })();

  return (
    <div className="glass-panel p-5 space-y-4" data-testid="literature-panel">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-extrabold text-ink tracking-tight font-sans">
            {t('literature.title')}
          </h2>
          <span className="text-3xs font-mono bg-wash text-plddt-1 px-1.5 py-0.5 rounded border border-line">
            {t('literature.publications', { count: totalCount })}
          </span>
        </div>
        <p className="text-3xs text-ink-2 font-mono mt-0.5">
          {t('literature.synthesisForQuery', { query: literatureData.query })}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line pb-px overflow-x-auto custom-scrollbar">
        {([
          { id: 'ALL', label: t('literature.all', { count: totalCount }) },
          { id: 'PUBMED', label: `PubMed (${pubmed.length})` },
          { id: 'BIORXIV', label: `bioRxiv (${biorxiv.length})` },
          { id: 'OPENALEX', label: `OpenAlex (${openalex.length})` },
          { id: 'ARXIV', label: `arXiv (${arxiv?.length || 0})` },
          { id: 'EUROPEPMC', label: `EuropePMC (${europepmc?.length || 0})` },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold tracking-tight border-b-2 transition-all mr-4 relative -bottom-px shrink-0 ${
                isActive
                  ? 'border-accent-blue text-ink font-bold'
                  : 'border-transparent text-ink-2 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
        {filteredArticles.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-3 italic border border-dashed border-line rounded-xl">
            {t('literature.noArticles')}
          </div>
        ) : (
          filteredArticles.map((a) => (
            <PublicationCard
              key={a.id}
              id={a.id}
              title={a.title}
              authors={a.authors}
              journal={'journal' in a ? a.journal : undefined}
              pubDate={a.pub_date}
              abstract={a.abstract}
              doi={'doi' in a ? a.doi : undefined}
              source={a.source}
            />
          ))
        )}
      </div>
    </div>
  );
};
export default LiteraturePanel;
