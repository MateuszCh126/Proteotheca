import React, { useState, useEffect } from 'react';
import { GeneData } from '../../types/gene';
import TranscriptsTable from './TranscriptsTable';
import UniProtDetails from './UniProtDetails';
import { AnalysisTools } from './AnalysisTools';
import { Dna, Activity, Link2, ExternalLink } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface GenePanelProps {
  geneData: GeneData | null;
  isLoading: boolean;
}

export const GenePanel: React.FC<GenePanelProps> = ({ geneData, isLoading }) => {
  const { t } = useI18n();
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transcripts' | 'uniprot' | 'opentargets' | 'alphafold' | 'hpa' | 'interpro' | 'ncbi' | 'quickgo' | 'reactome' | 'analysis'>('transcripts');

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
        <span className="text-xs font-mono text-accent-cyan">{t('gene.fetching')}</span>
      </div>
    );
  }

  if (!geneData) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px] text-center" data-testid="gene-panel">
        <div className="p-3 bg-white/5 rounded-full text-slate-400 mb-3">
          <Dna className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1 font-outfit">{t('gene.noTarget')}</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          {t('gene.noTargetDescription', { example: 'BRAF' })}
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
              {t('entity.gene')}
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
      <div className="flex flex-wrap border-b border-white/5 pb-px gap-1">
        {(['transcripts', 'uniprot', 'opentargets', 'alphafold', 'hpa', 'interpro', 'ncbi', 'quickgo', 'reactome', 'analysis'] as const).map((tab) => {
          const isActive = activeTab === tab;
          let label = '';
          if (tab === 'transcripts') label = t('gene.transcripts');
          if (tab === 'uniprot') label = t('gene.uniprot');
          if (tab === 'opentargets') label = t('gene.associations');
          if (tab === 'alphafold') label = t('gene.alphafold');
          if (tab === 'hpa') label = t('gene.hpa');
          if (tab === 'interpro') label = t('gene.interpro');
          if (tab === 'ncbi') label = t('gene.ncbi');
          if (tab === 'quickgo') label = t('gene.quickgo');
          if (tab === 'reactome') label = t('gene.reactome');
          if (tab === 'analysis') label = t('gene.analysis');

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-trigger-gene-${tab}`}
              className={`px-2 py-1 text-3xs font-semibold tracking-tight border-b-2 transition-all mr-2 relative -bottom-px ${
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
      <div className="min-h-[180px] flex flex-col justify-between">
        {activeTab === 'transcripts' && (
          <div className="space-y-3">
            <TranscriptsTable
              transcripts={geneData.ensembl.transcripts}
              selectedTranscriptId={selectedTranscriptId}
              onSelectTranscript={setSelectedTranscriptId}
            />
            {selectedTranscript && (
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-2xs text-slate-400 flex items-center justify-between">
                <span>{t('gene.selectedLength')}</span>
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
              {t('gene.openTargetsAssociations')}
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
                    <span className="text-3xs text-slate-400 block mb-0.5">{t('common.score')}</span>
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

        {activeTab === 'alphafold' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block">
                AlphaFold Structure Summary
              </span>
              {geneData.alphafold && (
                <span className="text-3xs font-mono bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  {geneData.alphafold.entryId}
                </span>
              )}
            </div>
            {geneData.alphafold ? (
              <div className="space-y-2">
                <p className="text-3xs text-slate-400 font-mono break-all">
                  PDB: <a href={geneData.alphafold.pdbUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">{geneData.alphafold.pdbUrl}</a>
                </p>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                  <span className="text-3xs text-slate-400 font-bold block">pLDDT Metric Breakdown</span>
                  <div className="grid grid-cols-2 gap-2 text-2xs">
                    <div className="flex justify-between p-1 bg-white/5 rounded">
                      <span className="text-slate-500">Very High (&gt;90):</span>
                      <span className="font-mono text-green-400 font-bold">{geneData.alphafold.plddt_summary.very_high}%</span>
                    </div>
                    <div className="flex justify-between p-1 bg-white/5 rounded">
                      <span className="text-slate-500">Confident (70-90):</span>
                      <span className="font-mono text-blue-400 font-bold">{geneData.alphafold.plddt_summary.confident}%</span>
                    </div>
                    <div className="flex justify-between p-1 bg-white/5 rounded">
                      <span className="text-slate-500">Low (50-70):</span>
                      <span className="font-mono text-yellow-400 font-bold">{geneData.alphafold.plddt_summary.low}%</span>
                    </div>
                    <div className="flex justify-between p-1 bg-white/5 rounded">
                      <span className="text-slate-500">Very Low (&lt;50):</span>
                      <span className="font-mono text-red-400 font-bold">{geneData.alphafold.plddt_summary.very_low}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No AlphaFold structure data loaded.</div>
            )}
          </div>
        )}

        {activeTab === 'hpa' && (
          <div className="space-y-3">
            <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block">
              Human Protein Atlas Expression & Subcellular Localization
            </span>
            {geneData.hpa ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-3xs text-slate-550 block font-semibold">Subcellular Localization</span>
                  <div className="flex flex-wrap gap-1.5">
                    {geneData.hpa.localization.map(loc => (
                      <span key={loc} className="text-3xs font-mono bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-3xs text-slate-550 block font-semibold font-mono">Tissue Expression Levels</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {geneData.hpa.expression.map(exp => (
                      <div key={exp.tissue} className="p-2 bg-white/5 rounded border border-white/5 flex justify-between items-center text-2xs">
                        <span className="font-bold text-white">{exp.tissue}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-cyan-400 font-bold">{exp.level}</span>
                          <span className="text-3xs text-slate-500 font-mono">({exp.reliability})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No HPA data available.</div>
            )}
          </div>
        )}

        {activeTab === 'interpro' && (
          <div className="space-y-3">
            <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block">
              InterPro Functional Domains
            </span>
            {geneData.interpro ? (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {geneData.interpro.domains.map(dom => (
                  <div key={dom.accession} className="p-2 bg-white/5 rounded border border-white/5 flex justify-between items-center text-2xs hover:border-cyan-500/10 transition-all">
                    <div>
                      <span className="font-bold text-white block">{dom.name}</span>
                      <span className="text-3xs font-mono text-slate-500">{dom.accession}</span>
                    </div>
                    <span className="font-mono text-slate-400">AA: {dom.start} - {dom.end}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No functional domains annotating this target.</div>
            )}
          </div>
        )}

        {activeTab === 'ncbi' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block">
                NCBI Sequence Fetch (RefSeq)
              </span>
              {geneData.ncbi_seq && (
                <span className="text-2xs font-mono bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  {geneData.ncbi_seq.accession}
                </span>
              )}
            </div>
            {geneData.ncbi_seq ? (
              <div className="space-y-2">
                <textarea
                  readOnly
                  value={geneData.ncbi_seq.fasta}
                  className="w-full h-24 bg-black/40 text-3xs font-mono p-2.5 rounded-lg border border-white/5 text-slate-400 focus:outline-none resize-none"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(geneData.ncbi_seq?.fasta || '');
                    }}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-2xs text-white border border-white/5 transition-all font-bold"
                  >
                    Copy FASTA
                  </button>
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(geneData.ncbi_seq.fasta)}`}
                    download={`${geneData.symbol}_ncbi_seq.fasta`}
                    className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg text-2xs text-cyan-400 border border-cyan-500/20 transition-all font-bold"
                  >
                    Download FASTA
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No RefSeq mapping found.</div>
            )}
          </div>
        )}

        {activeTab === 'quickgo' && (
          <div className="space-y-3">
            <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block">
              QuickGO Ontology Annotation Mappings
            </span>
            {geneData.quickgo ? (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {geneData.quickgo.annotations.map((ann, idx) => (
                  <div key={idx} className="p-2 bg-white/5 rounded border border-white/5 flex justify-between items-center text-2xs">
                    <div>
                      <span className="font-bold text-white block">{ann.go_name}</span>
                      <span className="text-3xs font-mono text-cyan-400">{ann.go_id}</span>
                    </div>
                    <span className="text-3xs font-mono bg-white/5 text-slate-400 px-1 rounded">
                      {ann.evidence_code}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No QuickGO ontologies found.</div>
            )}
          </div>
        )}

        {activeTab === 'reactome' && (
          <div className="space-y-3">
            <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block">
              Reactome Pathways Hierarchy Mappings
            </span>
            {geneData.reactome ? (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {geneData.reactome.pathways.map(path => (
                  <div key={path.dbId} className="p-2.5 bg-white/5 rounded border border-white/5 flex items-center justify-between text-2xs hover:border-cyan-500/20 transition-all">
                    <div>
                      <span className="font-bold text-white block">{path.displayName}</span>
                      <span className="text-3xs font-mono text-slate-500">{path.stId}</span>
                    </div>
                    <a
                      href={`https://reactome.org/content/detail/${path.stId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-cyan-400 p-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No Reactome pathways mapped.</div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <AnalysisTools geneData={geneData} />
        )}
      </div>
    </div>
  );
};
export default GenePanel;
