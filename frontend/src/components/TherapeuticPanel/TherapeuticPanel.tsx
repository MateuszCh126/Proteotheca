import React, { useState } from 'react';
import { DiseaseData } from '../../types/disease';
import ChemblDrugsTable from './ChemblDrugsTable';
import ClinicalTrialsList from './ClinicalTrialsList';
import OpenfdaAdverseEvents from './OpenfdaAdverseEvents';
import { Pill, AlertTriangle } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface TherapeuticPanelProps {
  diseaseData: DiseaseData | null;
  isLoading: boolean;
}

export const TherapeuticPanel: React.FC<TherapeuticPanelProps> = ({ diseaseData, isLoading }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'genes' | 'drugs' | 'trials' | 'fda' | 'pubchem' | 'ols' | 'encode'>('genes');

  if (isLoading) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px]" data-testid="therapeutic-panel">
        <div className="w-8 h-8 border-4 border-accent-success border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-mono text-accent-success">{t('therapeutic.fetching')}</span>
      </div>
    );
  }

  if (!diseaseData) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px] text-center" data-testid="therapeutic-panel">
        <div className="p-3 bg-wash rounded-full text-ink-2 mb-3">
          <Pill className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-ink mb-1 font-sans">{t('therapeutic.noDisease')}</h3>
        <p className="text-xs text-ink-2 max-w-xs leading-relaxed">
          {t('therapeutic.noDiseaseDescription', { example: 'Melanoma' })}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 space-y-4" data-testid="therapeutic-panel">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-extrabold text-ink tracking-tight font-sans">
            {diseaseData.disease_name}
          </h2>
          <span className="text-3xs font-mono bg-wash text-benign px-1.5 py-0.5 rounded border border-line">
            {t('entity.disease')}
          </span>
        </div>
        <p className="text-3xs text-ink-2 font-mono mt-0.5">
          {t('therapeutic.activeClinicalTrials', { count: diseaseData.clinical_trials.trial_count })}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-line pb-px gap-1">
        {(['genes', 'drugs', 'trials', 'fda', 'pubchem', 'ols', 'encode'] as const).map((tab) => {
          const isActive = activeTab === tab;
          let label = '';
          if (tab === 'genes') label = t('therapeutic.associatedGenes');
          if (tab === 'drugs') label = t('therapeutic.chemblDrugs');
          if (tab === 'trials') label = t('therapeutic.clinicalTrials');
          if (tab === 'fda') label = t('therapeutic.fdaAdverseEvents');
          if (tab === 'pubchem') label = t('therapeutic.pubchem');
          if (tab === 'ols') label = t('therapeutic.ols');
          if (tab === 'encode') label = t('therapeutic.encode');

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-trigger-therapeutic-${tab}`}
              className={`px-2 py-1 text-3xs font-semibold tracking-tight border-b-2 transition-all mr-2 relative -bottom-px ${
                isActive
                  ? 'border-accent-success text-ink font-bold'
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
        {activeTab === 'genes' && (
          <div className="space-y-2.5">
            <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
              Open Targets Disease-Associated Genes
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {diseaseData.opentargets.associated_genes && diseaseData.opentargets.associated_genes.map((assoc) => (
                <div
                  key={assoc.symbol}
                  data-testid="disease-associated-gene-row"
                  className="p-2.5 bg-wash rounded-xl border border-line flex items-center justify-between text-xs hover:border-line transition-all"
                >
                  <div>
                    <span className="font-bold text-ink block font-sans">{assoc.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xs text-ink-3 block mb-0.5">{t('common.score')}</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-benign">{assoc.score.toFixed(2)}</span>
                      <div className="w-12 h-1.5 bg-wash rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${assoc.score * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!diseaseData.opentargets.associated_genes || diseaseData.opentargets.associated_genes.length === 0) && (
                <div className="text-xs text-ink-3 italic">No associated genes found.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'drugs' && (
          <ChemblDrugsTable compounds={diseaseData.chembl.active_compounds} />
        )}

        {activeTab === 'trials' && (
          <ClinicalTrialsList trials={diseaseData.clinical_trials.trials} />
        )}

        {activeTab === 'fda' && (
          <OpenfdaAdverseEvents data={diseaseData.openfda} />
        )}

        {activeTab === 'pubchem' && (
          <div className="space-y-3">
            <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
              PubChem Compound Chemical Structure Details
            </span>
            {diseaseData.pubchem ? (
              <div className="p-3.5 bg-wash rounded-xl border border-line space-y-2.5 text-2xs text-ink-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-ink text-xs">{diseaseData.pubchem.name}</span>
                  <span className="text-3xs font-mono bg-wash text-benign px-1.5 py-0.5 rounded border border-line">
                    CID: {diseaseData.pubchem.cid}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-3xs font-mono">
                  <div className="p-2 bg-wash rounded">
                    <span className="text-ink-3 block">Formula</span>
                    <span className="text-ink font-bold">{diseaseData.pubchem.formula}</span>
                  </div>
                  <div className="p-2 bg-wash rounded">
                    <span className="text-ink-3 block">Molecular Weight</span>
                    <span className="text-ink font-bold">{diseaseData.pubchem.weight} g/mol</span>
                  </div>
                </div>
                <div className="p-2 bg-wash rounded space-y-1">
                  <span className="text-ink-3 block text-3xs font-mono">Canonical SMILES</span>
                  <textarea
                    readOnly
                    value={diseaseData.pubchem.smiles}
                    className="w-full h-12 bg-wash text-3xs font-mono p-1 rounded border border-line text-ink-2 focus:outline-none resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-ink-3 italic">No PubChem compound data available.</div>
            )}
          </div>
        )}

        {activeTab === 'ols' && (
          <div className="space-y-3">
            <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
              EMBL-EBI Ontology Lookup Service Hierarchy
            </span>
            {diseaseData.ols ? (
              <div className="space-y-3 text-2xs">
                <div className="p-3.5 bg-wash rounded-xl border border-line space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-ink capitalize">{diseaseData.ols.label}</span>
                    <span className="text-3xs font-mono bg-wash text-ink-2 px-1.5 py-0.5 rounded border border-line">
                      {diseaseData.ols.obo_id}
                    </span>
                  </div>
                  <p className="text-ink-2 leading-relaxed italic">{diseaseData.ols.description.join(' ')}</p>
                </div>
                {diseaseData.ols.path && diseaseData.ols.path.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-3xs text-ink-3 block font-mono">Ontology Path Hierarchy</span>
                    <div className="flex flex-wrap items-center gap-1.5 text-3xs font-mono">
                      {diseaseData.ols.path.map((node, i) => (
                        <React.Fragment key={node}>
                          {i > 0 && <span className="text-ink-3">&gt;</span>}
                          <span className="bg-wash text-benign px-1.5 py-0.5 rounded border border-line">
                            {node}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-ink-3 italic">No OLS ontology data loaded.</div>
            )}
          </div>
        )}

        {activeTab === 'encode' && (
          <div className="space-y-3">
            <span className="text-3xs uppercase tracking-wider text-ink-2 font-bold block">
              ENCODE Registry of cis-Regulatory Elements (cCREs)
            </span>
            {diseaseData.encode ? (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {diseaseData.encode.ccres.map((ccre) => (
                  <div key={ccre.accession} className="p-2.5 bg-wash rounded-xl border border-line flex justify-between items-center text-2xs font-mono">
                    <div>
                      <span className="text-ink block font-bold">{ccre.accession}</span>
                      <span className="text-3xs text-ink-3">{ccre.chrom}:{ccre.start} (Len: {ccre.len} bp)</span>
                    </div>
                    <span className="text-3xs font-bold bg-wash text-benign border border-line px-1.5 py-0.5 rounded">
                      {ccre.pct}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-ink-3 italic">No ENCODE elements mapped.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default TherapeuticPanel;
