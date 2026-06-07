import React, { useState } from 'react';
import { LiteratureData } from '../../types/literature';
import PublicationCard from './PublicationCard';
import { BookOpen } from 'lucide-react';

interface LiteraturePanelProps {
  literatureData: LiteratureData | null;
  isLoading: boolean;
}

export const LiteraturePanel: React.FC<LiteraturePanelProps> = ({ literatureData, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PUBMED' | 'BIORXIV' | 'OPENALEX'>('ALL');

  if (isLoading) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px]" data-testid="literature-panel">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-mono text-accent-blue">FETCHING LITERATURE EVIDENCE...</span>
      </div>
    );
  }

  if (!literatureData) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px] text-center" data-testid="literature-panel">
        <div className="p-3 bg-white/5 rounded-full text-slate-400 mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1 font-outfit">No Literature Evidence Loaded</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Search for an entity to synthesize PubMed, bioRxiv, and OpenAlex publication findings.
        </p>
      </div>
    );
  }

  const { pubmed, biorxiv, openalex } = literatureData;

  const filteredArticles = (() => {
    switch (activeTab) {
      case 'PUBMED':
        return pubmed.map(a => ({ ...a, source: 'pubmed' as const, id: a.pmid }));
      case 'BIORXIV':
        return biorxiv.map(a => ({ ...a, source: 'biorxiv' as const, id: a.doi }));
      case 'OPENALEX':
        return openalex.map(a => ({ ...a, source: 'openalex' as const, id: a.id }));
      default:
        return [
          ...pubmed.map(a => ({ ...a, source: 'pubmed' as const, id: a.pmid })),
          ...biorxiv.map(a => ({ ...a, source: 'biorxiv' as const, id: a.doi })),
          ...openalex.map(a => ({ ...a, source: 'openalex' as const, id: a.id })),
        ];
    }
  })();

  return (
    <div className="glass-panel p-5 space-y-4" data-testid="literature-panel">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-extrabold text-white tracking-tight font-outfit">
            Scientific Literature
          </h2>
          <span className="text-3xs font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
            {pubmed.length + biorxiv.length + openalex.length} Publications
          </span>
        </div>
        <p className="text-3xs text-slate-400 font-mono mt-0.5">
          Synthesis for query: "{literatureData.query}"
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-px overflow-x-auto custom-scrollbar">
        {([
          { id: 'ALL', label: `All (${pubmed.length + biorxiv.length + openalex.length})` },
          { id: 'PUBMED', label: `PubMed (${pubmed.length})` },
          { id: 'BIORXIV', label: `bioRxiv (${biorxiv.length})` },
          { id: 'OPENALEX', label: `OpenAlex (${openalex.length})` },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold tracking-tight border-b-2 transition-all mr-4 relative -bottom-px shrink-0 ${
                isActive
                  ? 'border-accent-blue text-white font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
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
          <div className="p-8 text-center text-xs text-slate-500 italic border border-dashed border-white/5 rounded-xl">
            No publication articles found for this tab filter.
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
