import React, { useState, useEffect } from 'react';
import { GeneData } from '../../types/gene';
import TranscriptsTable from './TranscriptsTable';
import UniProtDetails from './UniProtDetails';
import { Dna, Activity, Link2, ExternalLink } from 'lucide-react';

interface GenePanelProps {
  geneData: GeneData | null;
  isLoading: boolean;
}

export const GenePanel: React.FC<GenePanelProps> = ({ geneData, isLoading }) => {
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transcripts' | 'uniprot' | 'opentargets'>('transcripts');

  useEffect(() => {
    if (geneData && geneData.ensembl.transcripts.length > 0) {
      setSelectedTranscriptId(geneData.ensembl.transcripts[0].transcript_id);
    } else {
      setSelectedTranscriptId(null);
    }
  }, [geneData]);

  if (isLoading) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px]" data-testid="gene-panel">
        <div className="w-8 h-8 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-mono text-accent-cyan">FETCHING GENE DATA...</span>
      </div>
    );
  }

  if (!geneData) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px] text-center" data-testid="gene-panel">
        <div className="p-3 bg-white/5 rounded-full text-slate-400 mb-3">
          <Dna className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1 font-outfit">No Gene Target Loaded</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Search for a gene symbol (e.g. <strong className="text-cyan-400">BRAF</strong>) or genetic variant to load target pathways.
        </p>
      </div>
    );
  }

  const selectedTranscript = geneData.ensembl.transcripts.find(
    t => t.transcript_id === selectedTranscriptId
  );

  return (
    <div className="glass-panel p-5 space-y-4" data-testid="gene-panel">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight font-outfit">
              {geneData.symbol}
            </h2>
            <span className="text-3xs font-mono bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
              Gene
            </span>
          </div>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">
            Ensembl: {geneData.ensembl.gene_id}
          </p>
        </div>
        <a
          href={`https://platform.opentargets.org/target/${geneData.ensembl.gene_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-cyan-400 transition-colors p-1"
          title="Open Targets Platform"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-px">
        {(['transcripts', 'uniprot', 'opentargets'] as const).map((tab) => {
          const isActive = activeTab === tab;
          let label = '';
          if (tab === 'transcripts') label = 'Transcripts';
          if (tab === 'uniprot') label = 'UniProt';
          if (tab === 'opentargets') label = 'Associations';

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-trigger-gene-${tab}`}
              className={`px-3 py-1.5 text-xs font-semibold tracking-tight border-b-2 transition-all mr-4 relative -bottom-px ${
                isActive
                  ? 'border-cyan-400 text-white font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[160px] flex flex-col justify-between">
        {activeTab === 'transcripts' && (
          <div className="space-y-3">
            <TranscriptsTable
              transcripts={geneData.ensembl.transcripts}
              selectedTranscriptId={selectedTranscriptId}
              onSelectTranscript={setSelectedTranscriptId}
            />
            {selectedTranscript && (
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-2xs text-slate-400 flex items-center justify-between">
                <span>Selected length:</span>
                <span className="font-mono text-cyan-400 font-bold">{selectedTranscript.length} bp</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'uniprot' && (
          <UniProtDetails uniprot={geneData.uniprot} />
        )}

        {activeTab === 'opentargets' && (
          <div className="space-y-2.5">
            <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block">
              Open Targets Disease Associations
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {geneData.opentargets.associations.map((assoc) => (
                <div
                  key={assoc.disease_id}
                  data-testid="opentargets-association-row"
                  className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between text-xs hover:border-cyan-500/20 transition-all"
                >
                  <div>
                    <span className="font-bold text-white block font-outfit">{assoc.disease_name}</span>
                    <span className="text-3xs font-mono text-slate-500">{assoc.disease_id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xs text-slate-400 block mb-0.5">Score</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-cyan-400">{assoc.score.toFixed(2)}</span>
                      <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${assoc.score * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default GenePanel;
