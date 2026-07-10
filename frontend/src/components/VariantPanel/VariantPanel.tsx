import React, { useState } from 'react';
import { VariantData } from '../../types/variant';
import ClinVarCard from './ClinVarCard';
import AlleleFreqChart from './AlleleFreqChart';
import GtexHeatmap from './GtexHeatmap';
import { GitBranch, Activity, Eye, Tag } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface VariantPanelProps {
  variantData: VariantData | null;
  isLoading: boolean;
}

export const VariantPanel: React.FC<VariantPanelProps> = ({ variantData, isLoading }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'clinvar' | 'gnomad' | 'gtex' | 'alphagenome' | 'dbsnp' | 'ucsc' | 'unibind' | 'jaspar'>('clinvar');

  if (isLoading) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px]" data-testid="variant-panel">
        <div className="w-8 h-8 border-4 border-accent-violet border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-mono text-accent-violet">{t('variant.fetching')}</span>
      </div>
    );
  }

  if (!variantData) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px] text-center" data-testid="variant-panel">
        <div className="p-3 bg-wash rounded-full text-ink-2 mb-3">
          <GitBranch className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-ink mb-1 font-sans">{t('variant.noVariant')}</h3>
        <p className="text-xs text-ink-2 max-w-xs leading-relaxed">
          {t('variant.noVariantDescription', { example: 'rs113488022' })}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 space-y-4" data-testid="variant-panel">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-extrabold text-ink tracking-tight font-sans">
            {variantData.variant_id}
          </h2>
          <span className="text-3xs font-mono bg-wash text-ink-2 px-1.5 py-0.5 rounded border border-line">
            {t('entity.variant')}
          </span>
        </div>
        <p className="text-3xs text-ink-2 font-mono mt-0.5">
          {t('variant.clinvarPathogenicity', { value: variantData.clinvar.pathogenicity })}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-line pb-px gap-1">
        {(['clinvar', 'gnomad', 'gtex', 'alphagenome', 'dbsnp', 'ucsc', 'unibind', 'jaspar'] as const).map((tab) => {
          const isActive = activeTab === tab;
          let label = '';
          if (tab === 'clinvar') label = t('variant.clinvar');
          if (tab === 'gnomad') label = t('variant.gnomadFrequency');
          if (tab === 'gtex') label = t('variant.gtexEqtls');
          if (tab === 'alphagenome') label = t('variant.alphagenome');
          if (tab === 'dbsnp') label = t('variant.dbsnp');
          if (tab === 'ucsc') label = t('variant.ucsc');
          if (tab === 'unibind') label = t('variant.unibind');
          if (tab === 'jaspar') label = t('variant.jaspar');

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-trigger-variant-${tab}`}
              className={`px-2 py-1 text-3xs font-semibold tracking-tight border-b-2 transition-all mr-2 relative -bottom-px ${
                isActive
                  ? 'border-accent-violet text-ink font-bold'
                  : 'border-transparent text-ink-2 hover:text-ink'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[220px]">
        {activeTab === 'clinvar' && (
          <ClinVarCard clinvar={variantData.clinvar} />
        )}

        {activeTab === 'gnomad' && (
          <AlleleFreqChart data={variantData.gnomad} />
        )}

        {activeTab === 'gtex' && (
          <GtexHeatmap eqtls={variantData.gtex.eqtls} />
        )}

        {activeTab === 'alphagenome' && (
          <div className="space-y-3">
            <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
              AlphaGenome Variant Regulatory Predictions
            </span>
            {variantData.alphagenome ? (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {variantData.alphagenome.predictions.map((pred, idx) => (
                  <div key={idx} className="p-2.5 bg-wash rounded-xl border border-line flex justify-between items-center text-2xs hover:border-line transition-all">
                    <div>
                      <span className="font-bold text-ink block">{pred.biosample_name}</span>
                      <span className="text-3xs font-mono text-ink-3">Output: {pred.output_type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-3xs text-ink-2 block mb-0.5">Quantile Score</span>
                      <span className="font-mono text-ink-2 font-bold">{(pred.quantile_score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-ink-3 italic">No AlphaGenome predictions loaded.</div>
            )}
          </div>
        )}

        {activeTab === 'dbsnp' && (
          <div className="space-y-3">
            <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
              dbSNP Variant Mapping
            </span>
            {variantData.dbsnp ? (
              <div className="p-3.5 bg-wash rounded-xl border border-line space-y-2.5 text-2xs">
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2 bg-wash rounded">
                    <span className="text-ink-3 block text-3xs">rsID</span>
                    <span className="text-ink font-bold">{variantData.dbsnp.rsid}</span>
                  </div>
                  <div className="p-2 bg-wash rounded">
                    <span className="text-ink-3 block text-3xs">Chromosome</span>
                    <span className="text-ink font-bold">{variantData.dbsnp.chromosome}</span>
                  </div>
                  <div className="p-2 bg-wash rounded">
                    <span className="text-ink-3 block text-3xs">Position (GRCh38)</span>
                    <span className="text-ink font-bold">{variantData.dbsnp.position}</span>
                  </div>
                  <div className="p-2 bg-wash rounded">
                    <span className="text-ink-3 block text-3xs">Allele Change</span>
                    <span className="text-ink font-bold text-ink">{variantData.dbsnp.ref} &gt; {variantData.dbsnp.alt}</span>
                  </div>
                </div>
                <div className="p-2 bg-wash rounded flex justify-between items-center">
                  <span className="text-ink-3 text-3xs font-mono">Associated Gene</span>
                  <span className="font-bold text-ink bg-wash border border-line px-1.5 py-0.5 rounded text-3xs font-mono">{variantData.dbsnp.gene}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-ink-3 italic">No dbSNP mapping loaded.</div>
            )}
          </div>
        )}

        {activeTab === 'ucsc' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
                UCSC Conservation & TFBS Overlaps
              </span>
              {variantData.ucsc && (
                <span className="text-3xs font-mono bg-wash text-ink-2 px-1.5 py-0.5 rounded border border-line">
                  {variantData.ucsc.coordinate}
                </span>
              )}
            </div>
            {variantData.ucsc ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
                  <div className="p-2.5 bg-wash rounded-xl border border-line flex justify-between">
                    <span className="text-ink-3">phyloP Score:</span>
                    <span className="font-bold text-ink-2">{variantData.ucsc.phylop.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 bg-wash rounded-xl border border-line flex justify-between">
                    <span className="text-ink-3">phastCons:</span>
                    <span className="font-bold text-ink-2">{variantData.ucsc.phastcons.toFixed(3)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-3xs text-ink-2 block mb-0.5">Overlapping Transcription Factor Bindings</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {variantData.ucsc.tfbs_overlaps.map((tfbs, idx) => (
                      <div key={idx} className="p-2 bg-wash rounded border border-line flex justify-between items-center text-2xs font-mono">
                        <span className="font-bold text-ink">{tfbs.tf_name}</span>
                        <span className="text-ink-2">Score: {tfbs.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-ink-3 italic">No UCSC conservation data loaded.</div>
            )}
          </div>
        )}

        {activeTab === 'unibind' && (
          <div className="space-y-3">
            <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
              UniBind Validated TF-DNA Interactions
            </span>
            {variantData.unibind ? (
              <div className="space-y-2">
                <div className="p-2 bg-wash rounded border border-line text-2xs flex justify-between items-center">
                  <span className="text-ink-3">Transcription Factor:</span>
                  <span className="font-bold text-ink bg-wash border border-line px-1.5 py-0.5 rounded font-mono text-3xs">{variantData.unibind.tf_name}</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  {variantData.unibind.datasets.map(ds => (
                    <div key={ds.dataset_id} className="p-2 bg-wash rounded border border-line flex justify-between items-center text-2xs font-mono">
                      <div>
                        <span className="text-ink block font-bold">{ds.dataset_id}</span>
                        <span className="text-3xs text-ink-3">Species: {ds.species} | Cell: {ds.cell_line}</span>
                      </div>
                      <span className="text-ink-2 font-bold">Binding Sites: {ds.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-ink-3 italic">No UniBind datasets available.</div>
            )}
          </div>
        )}

        {activeTab === 'jaspar' && (
          <div className="space-y-3">
            <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
              JASPAR Motif Matrices
            </span>
            {variantData.jaspar ? (
              <div className="space-y-2">
                {variantData.jaspar.profiles.map(prof => (
                  <div key={prof.matrix_id} className="p-3 bg-wash rounded-xl border border-line space-y-2">
                    <div className="flex justify-between items-center text-2xs font-mono">
                      <span className="font-bold text-ink">{prof.name}</span>
                      <span className="text-3xs text-ink-2 bg-wash border border-line px-1.5 py-0.5 rounded">{prof.matrix_id}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-3xs font-mono text-ink-2">
                        <thead>
                          <tr className="border-b border-line text-ink-3">
                            <th className="text-left py-1 pr-2">Base</th>
                            {prof.pfm.A.map((_, i) => <th key={i} className="text-right py-1">Pos {i+1}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-left font-bold text-benign">A</td>
                            {prof.pfm.A.map((val, i) => <td key={i} className="text-right">{val}</td>)}
                          </tr>
                          <tr>
                            <td className="text-left font-bold text-plddt-1">C</td>
                            {prof.pfm.C.map((val, i) => <td key={i} className="text-right">{val}</td>)}
                          </tr>
                          <tr>
                            <td className="text-left font-bold text-plddt-3">G</td>
                            {prof.pfm.G.map((val, i) => <td key={i} className="text-right">{val}</td>)}
                          </tr>
                          <tr>
                            <td className="text-left font-bold text-path">T</td>
                            {prof.pfm.T.map((val, i) => <td key={i} className="text-right">{val}</td>)}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-ink-3 italic">No JASPAR matrix loaded.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default VariantPanel;
