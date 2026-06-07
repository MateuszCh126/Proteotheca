import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar/SearchBar';
import GenePanel from './components/GenePanel/GenePanel';
import VariantPanel from './components/VariantPanel/VariantPanel';
import TherapeuticPanel from './components/TherapeuticPanel/TherapeuticPanel';
import LiteraturePanel from './components/LiteraturePanel/LiteraturePanel';
import MolViewer from './components/MolViewer/MolViewer';
import StringNetwork from './components/StringNetwork/StringNetwork';
import AuthDialog from './components/Auth/AuthDialog';
import UserMenu from './components/Auth/UserMenu';
import LanguageSwitcher from './components/LanguageSwitcher/LanguageSwitcher';
import SaveProjectDialog from './components/Projects/SaveProjectDialog';
import SavedProjectsPanel from './components/Projects/SavedProjectsPanel';
import { mockGenes, mockVariants, mockDiseases, mockLiterature } from './api/mockData';
import { Activity, Database, FolderOpen, LogIn, Save, UserPlus } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useI18n } from './context/I18nContext';
import type { EntityType } from './api/projects';
import type { MolViewerColorMode, MolViewerRepresentation } from './components/MolViewer/MolViewer';

const isLayoutTab = (value: unknown): value is 'visuals' | 'data' => value === 'visuals' || value === 'data';
const isMolViewerRepresentation = (value: unknown): value is MolViewerRepresentation =>
  value === 'cartoon' || value === 'surface' || value === 'spheres';
const isMolViewerColorMode = (value: unknown): value is MolViewerColorMode =>
  value === 'plddt' || value === 'chain' || value === 'hydrophobicity';

export const App: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [loadedGene, setLoadedGene] = useState<any>(null);
  const [loadedVariant, setLoadedVariant] = useState<any>(null);
  const [loadedDisease, setLoadedDisease] = useState<any>(null);
  const [loadedLiterature, setLoadedLiterature] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authDialogMode, setAuthDialogMode] = useState<'login' | 'register' | null>(null);
  const [showSaveProject, setShowSaveProject] = useState(false);
  const [showSavedProjects, setShowSavedProjects] = useState(false);

  // Layout Tab selection for small/standard screens
  const [layoutTab, setLayoutTab] = useState<'visuals' | 'data'>('visuals');
  const [molRepresentation, setMolRepresentation] = useState<MolViewerRepresentation>('cartoon');
  const [molColorMode, setMolColorMode] = useState<MolViewerColorMode>('plddt');

  // Pre-load default state for demonstration and testing (BRAF V600E / Melanoma discovery)
  useEffect(() => {
    setLoadedGene(mockGenes.BRAF);
    setLoadedVariant(mockVariants.rs113488022);
    setLoadedDisease(mockDiseases.Melanoma);
    setLoadedLiterature(mockLiterature.BRAF);
  }, []);

  const currentProjectState = {
    gene: loadedGene,
    variant: loadedVariant,
    disease: loadedDisease,
    literature: loadedLiterature,
    layoutTab,
    molViewer: {
      representation: molRepresentation,
      colorMode: molColorMode,
    },
  };

  const handleLoadProjectState = (state: Record<string, unknown>) => {
    const molViewerState =
      state.molViewer && typeof state.molViewer === 'object' ? (state.molViewer as Record<string, unknown>) : null;

    setLoadedGene(state.gene ?? null);
    setLoadedVariant(state.variant ?? null);
    setLoadedDisease(state.disease ?? null);
    setLoadedLiterature(state.literature ?? null);
    if (isLayoutTab(state.layoutTab)) {
      setLayoutTab(state.layoutTab);
    }
    if (molViewerState && isMolViewerRepresentation(molViewerState.representation)) {
      setMolRepresentation(molViewerState.representation);
    }
    if (molViewerState && isMolViewerColorMode(molViewerState.colorMode)) {
      setMolColorMode(molViewerState.colorMode);
    }
    setError(null);
  };

  const activeQuery =
    loadedVariant?.variant_id || loadedGene?.symbol || loadedDisease?.disease_name || t('projects.sessionFallback');
  const activeEntityType: EntityType = loadedVariant ? 'variant' : loadedGene ? 'gene' : loadedDisease ? 'disease' : 'mixed';
  const activeTitle = t('projects.defaultTitle', { query: activeQuery });

  const handleSearch = async (query: string, type: 'gene' | 'variant' | 'disease' | 'unknown') => {
    setIsLoading(true);
    setError(null);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const upperQuery = query.toUpperCase();
    const lowerQuery = query.toLowerCase();

    if (type === 'gene') {
      const gene = mockGenes[upperQuery];
      if (!gene) {
        setError(t('search.errorGeneNotFound', { query }));
        setIsLoading(false);
        return;
      }
      setLoadedGene(gene);
      setLoadedVariant(null); // Clear variant impact
      
      const lit = mockLiterature[upperQuery] || { query: upperQuery, pubmed: [], biorxiv: [], openalex: [] };
      setLoadedLiterature(lit);
      
      if (gene.opentargets.associations.length > 0) {
        const topAssoc = gene.opentargets.associations[0];
        const disease = mockDiseases[topAssoc.disease_name];
        if (disease) {
          setLoadedDisease(disease);
        }
      }
    } else if (type === 'variant') {
      const variant = mockVariants[lowerQuery];
      if (!variant) {
        setError(t('search.errorVariantNotFound', { query }));
        setIsLoading(false);
        return;
      }
      setLoadedVariant(variant);
      
      const primaryEqtl = variant.gtex.eqtls.find(e => e.gene_symbol);
      if (primaryEqtl) {
        const targetGene = mockGenes[primaryEqtl.gene_symbol];
        if (targetGene) {
          setLoadedGene(targetGene);
          
          const lit = mockLiterature[primaryEqtl.gene_symbol];
          if (lit) setLoadedLiterature(lit);
          
          if (targetGene.opentargets.associations.length > 0) {
            const topAssoc = targetGene.opentargets.associations[0];
            const disease = mockDiseases[topAssoc.disease_name];
            if (disease) setLoadedDisease(disease);
          }
        }
      }
    } else if (type === 'disease') {
      const key = Object.keys(mockDiseases).find(
        k => k.toLowerCase() === lowerQuery
      );
      const disease = key ? mockDiseases[key] : null;
      if (!disease) {
        setError(t('search.errorDiseaseNotFound', { query }));
        setIsLoading(false);
        return;
      }
      setLoadedDisease(disease);
      setLoadedVariant(null); // Clear variant impact
      
      const lit = mockLiterature[disease.disease_name] || {
        query: disease.disease_name,
        pubmed: [
          {
            pmid: "99001122",
            title: `Advanced Genomic Investigation in ${disease.disease_name}`,
            authors: "Explorer Group, BioMed Institute",
            journal: "Journal of Precision Medicine",
            pub_date: "2023-05-18",
            abstract: `Abstract detailing the latest drug developments and molecular pathways for ${disease.disease_name}.`,
            doi: `10.1234/jpm.2023.${disease.disease_name.toLowerCase().replace(/\s+/g, '-')}`
          }
        ],
        biorxiv: [],
        openalex: []
      };
      setLoadedLiterature(lit);
      
      if (disease.opentargets.associated_genes.length > 0) {
        const topGeneSymbol = disease.opentargets.associated_genes[0].symbol;
        const gene = mockGenes[topGeneSymbol];
        if (gene) {
          setLoadedGene(gene);
        }
      }
    } else {
      setError(t('search.errorUnknown'));
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden selection:bg-cyan-500/30 relative">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 -z-10 pointer-events-none" />

      {/* Header bar */}
      <header className="h-16 border-b border-white/5 backdrop-blur-md bg-slate-950/40 sticky top-0 z-50 flex items-center px-6 justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-lg text-slate-950">
            <Activity className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold font-outfit tracking-tight flex items-center space-x-2">
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">BioMed Explorer</span>
            <span className="text-3xs bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">v1.0</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <span className="hidden items-center space-x-1.5 rounded-full border border-white/5 bg-white/5 px-2.5 py-1 font-mono text-2xs text-slate-400 sm:flex">
            <Database className="w-3 h-3 text-cyan-400" />
            <span>{t('nav.aggregateMode')}</span>
          </span>
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAuthDialogMode('login')}
                aria-label={t('nav.signIn')}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('nav.signIn')}</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthDialogMode('register')}
                aria-label={t('nav.register')}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-400 px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-300"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('nav.register')}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Top search controls bar */}
      <section className="max-w-[1920px] mx-auto px-4 md:px-6 pt-5">
        <div className="glass-panel p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="w-full md:max-w-xl">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} error={error} />
          </div>
          {user && (
            <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
              <button
                type="button"
                onClick={() => setShowSavedProjects(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10 sm:flex-none"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                {t('projects.savedProjects')}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveProject(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cyan-400 px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 sm:flex-none"
              >
                <Save className="h-3.5 w-3.5" />
                {t('projects.saveProject')}
              </button>
            </div>
          )}
          <div className="text-right hidden md:block">
            <span className="text-3xs uppercase tracking-widest text-slate-500 font-bold block">{t('nav.activeSessionTarget')}</span>
            <span className="text-xs font-bold text-white font-outfit mt-0.5 block">
              {loadedGene ? `${loadedGene.symbol}` : t('nav.none')} {loadedVariant ? `| ${loadedVariant.variant_id}` : ''} {loadedDisease ? `| ${loadedDisease.disease_name}` : ''}
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="p-4 md:p-6 max-w-[1920px] mx-auto">
        {/* Layout Tabs for Standard Desktop / Tablet Viewports */}
        <div className="flex xl:hidden mb-4 bg-white/5 p-1 rounded-xl border border-white/5 max-w-sm">
          <button
            onClick={() => setLayoutTab('visuals')}
            data-testid="tab-trigger-layout-visuals"
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              layoutTab === 'visuals' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('layout.visuals')}
          </button>
          <button
            onClick={() => setLayoutTab('data')}
            data-testid="tab-trigger-layout-data"
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              layoutTab === 'data' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('layout.data')}
          </button>
        </div>

        {/* 12-Column Responsive Matrix */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* LEFT SIDEBAR: Search Details & Literature (Columns 1-3) */}
          <div className="xl:col-span-3 flex flex-col space-y-5">
            <GenePanel geneData={loadedGene} isLoading={isLoading} />
            <LiteraturePanel literatureData={loadedLiterature} isLoading={isLoading} />
          </div>

          {/* CENTER PANEL: Interactive 3D Visualizer & STRING network graph (Columns 4-9 on XL) */}
          <div className={`xl:col-span-6 flex flex-col space-y-5 ${layoutTab === 'visuals' ? 'block' : 'hidden xl:flex'}`}>
            <div className="space-y-2">
              <span className="text-3xs uppercase tracking-widest text-slate-400 font-bold block pl-1">
                {t('panel.molecularViewer')}
              </span>
              <MolViewer
                pdbId={loadedGene?.symbol === 'EGFR' ? '1M17' : loadedGene?.symbol === 'TP53' ? '1AIE' : '1UWH'}
                representation={molRepresentation}
                colorMode={molColorMode}
                onRepresentationChange={setMolRepresentation}
                onColorModeChange={setMolColorMode}
              />
            </div>

            <div className="space-y-2">
              <span className="text-3xs uppercase tracking-widest text-slate-400 font-bold block pl-1">
                {t('panel.stringNetwork')}
              </span>
              <StringNetwork geneSymbol={loadedGene?.symbol || 'BRAF'} />
            </div>
          </div>

          {/* RIGHT SIDEBAR: Variant Impact & Therapeutics (Columns 10-12 on XL) */}
          <div className={`xl:col-span-3 flex flex-col space-y-5 ${layoutTab === 'data' ? 'block' : 'hidden xl:flex'}`}>
            <VariantPanel variantData={loadedVariant} isLoading={isLoading} />
            <TherapeuticPanel diseaseData={loadedDisease} isLoading={isLoading} />
          </div>
        </div>
      </main>

      {authDialogMode && <AuthDialog mode={authDialogMode} onClose={() => setAuthDialogMode(null)} />}
      {showSaveProject && (
        <SaveProjectDialog
          state={currentProjectState}
          defaultTitle={activeTitle}
          entityType={activeEntityType}
          query={activeQuery}
          onClose={() => setShowSaveProject(false)}
          onSaved={() => setShowSavedProjects(true)}
        />
      )}
      <SavedProjectsPanel
        open={showSavedProjects}
        onClose={() => setShowSavedProjects(false)}
        onLoad={handleLoadProjectState}
      />
    </div>
  );
};
export default App;
