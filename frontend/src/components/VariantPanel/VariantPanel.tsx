import React, { useState } from 'react';
import { VariantData } from '../../types/variant';
import ClinVarCard from './ClinVarCard';
import AlleleFreqChart from './AlleleFreqChart';
import GtexHeatmap from './GtexHeatmap';
import { GitBranch, Activity, Eye, Tag } from 'lucide-react';

interface VariantPanelProps {
  variantData: VariantData | null;
  isLoading: boolean;
}

export const VariantPanel: React.FC<VariantPanelProps> = ({ variantData, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'clinvar' | 'gnomad' | 'gtex'>('clinvar');

  if (isLoading) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px]" data-testid="variant-panel">
        <div className="w-8 h-8 border-4 border-accent-violet border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-mono text-accent-violet">FETCHING VARIANT DATA...</span>
      </div>
    );
  }

  if (!variantData) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px] text-center" data-testid="variant-panel">
        <div className="p-3 bg-white/5 rounded-full text-slate-400 mb-3">
          <GitBranch className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1 font-outfit">No Variant Loaded</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Search for an rsID (e.g. <strong className="text-violet-400">rs113488022</strong>) or chromosomal coordinates to inspect functional impact details.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 space-y-4" data-testid="variant-panel">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-extrabold text-white tracking-tight font-outfit">
            {variantData.variant_id}
          </h2>
          <span className="text-3xs font-mono bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/20">
            Variant
          </span>
        </div>
        <p className="text-3xs text-slate-400 font-mono mt-0.5">
          ClinVar Pathogenicity: {variantData.clinvar.pathogenicity}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-px">
        {(['clinvar', 'gnomad', 'gtex'] as const).map((tab) => {
          const isActive = activeTab === tab;
          let label = '';
          if (tab === 'clinvar') label = 'ClinVar';
          if (tab === 'gnomad') label = 'gnomAD Frequency';
          if (tab === 'gtex') label = 'GTEx eQTLs';

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-trigger-variant-${tab}`}
              className={`px-3 py-1.5 text-xs font-semibold tracking-tight border-b-2 transition-all mr-4 relative -bottom-px ${
                isActive
                  ? 'border-accent-violet text-white font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
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
      </div>
    </div>
  );
};
export default VariantPanel;
