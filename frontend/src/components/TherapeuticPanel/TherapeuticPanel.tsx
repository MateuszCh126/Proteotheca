import React, { useState } from 'react';
import { DiseaseData } from '../../types/disease';
import ChemblDrugsTable from './ChemblDrugsTable';
import ClinicalTrialsList from './ClinicalTrialsList';
import OpenfdaAdverseEvents from './OpenfdaAdverseEvents';
import { Pill, AlertTriangle } from 'lucide-react';

interface TherapeuticPanelProps {
  diseaseData: DiseaseData | null;
  isLoading: boolean;
}

export const TherapeuticPanel: React.FC<TherapeuticPanelProps> = ({ diseaseData, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'drugs' | 'trials' | 'fda'>('drugs');

  if (isLoading) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px]" data-testid="therapeutic-panel">
        <div className="w-8 h-8 border-4 border-accent-success border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-mono text-accent-success">FETCHING THERAPEUTIC DATA...</span>
      </div>
    );
  }

  if (!diseaseData) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px] text-center" data-testid="therapeutic-panel">
        <div className="p-3 bg-white/5 rounded-full text-slate-400 mb-3">
          <Pill className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1 font-outfit">No Disease Indication Loaded</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Search for a disease name (e.g. <strong className="text-emerald-400">Melanoma</strong>) or load it by selecting an associated target gene/variant.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 space-y-4" data-testid="therapeutic-panel">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-extrabold text-white tracking-tight font-outfit">
            {diseaseData.disease_name}
          </h2>
          <span className="text-3xs font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
            Disease
          </span>
        </div>
        <p className="text-3xs text-slate-400 font-mono mt-0.5">
          Active clinical trials: {diseaseData.clinical_trials.trial_count} entries
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-px">
        {(['drugs', 'trials', 'fda'] as const).map((tab) => {
          const isActive = activeTab === tab;
          let label = '';
          if (tab === 'drugs') label = 'ChEMBL Drugs';
          if (tab === 'trials') label = 'Clinical Trials';
          if (tab === 'fda') label = 'FDA Adverse Events';

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-trigger-therapeutic-${tab}`}
              className={`px-3 py-1.5 text-xs font-semibold tracking-tight border-b-2 transition-all mr-4 relative -bottom-px ${
                isActive
                  ? 'border-accent-success text-white font-bold'
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
        {activeTab === 'drugs' && (
          <ChemblDrugsTable compounds={diseaseData.chembl.active_compounds} />
        )}

        {activeTab === 'trials' && (
          <ClinicalTrialsList trials={diseaseData.clinical_trials.trials} />
        )}

        {activeTab === 'fda' && (
          <OpenfdaAdverseEvents data={diseaseData.openfda} />
        )}
      </div>
    </div>
  );
};
export default TherapeuticPanel;
