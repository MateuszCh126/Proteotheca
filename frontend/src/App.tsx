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
import { apiJson } from './api/client';
import { ErrorBoundary } from './components/ErrorBoundary';

import { Search, ArrowUpRight } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useI18n } from './context/I18nContext';
import type { EntityType } from './api/projects';
import type { MolViewerColorMode, MolViewerRepresentation } from './components/MolViewer/MolViewer';

const isLayoutTab = (value: unknown): value is 'visuals' | 'data' => value === 'visuals' || value === 'data';
const isMolViewerRepresentation = (value: unknown): value is MolViewerRepresentation =>
  value === 'cartoon' || value === 'surface' || value === 'spheres';
const isMolViewerColorMode = (value: unknown): value is MolViewerColorMode =>
  value === 'plddt' || value === 'chain' || value === 'hydrophobicity';

const pdbForGene = (symbol?: string) => (symbol === 'EGFR' ? '1M17' : symbol === 'TP53' ? '1AIE' : '1UWH');

export const App: React.FC = () => {
  const { user } = useAuth();
  const { t, language, setLanguage } = useI18n();
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
  const [queryInput, setQueryInput] = useState('');

  // Pre-load default state for demonstration and testing (BRAF V600E / Melanoma discovery)
  useEffect(() => {
    const fetchDefaultState = async () => {
      setIsLoading(true);
      try {
        const [gene, variant, disease, literature] = await Promise.all([
          apiJson<any>('/api/genes/BRAF'),
          apiJson<any>('/api/variants/rs113488022'),
          apiJson<any>('/api/diseases/Melanoma'),
          apiJson<any>('/api/literature?query=BRAF'),
        ]);
        setLoadedGene(gene);
        setLoadedVariant(variant);
        setLoadedDisease(disease);
        setLoadedLiterature(literature);
      } catch (err) {
        console.error('Could not reach the data service for the default readout.', err);
        setError('Could not reach the data service. Start the backend, then reload.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDefaultState();
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

    try {
      if (type === 'gene') {
        let gene: any = null;
        try {
          gene = await apiJson<any>(`/api/genes/${encodeURIComponent(query)}`);
        } catch (err: any) {
          setError(err.message || t('search.errorGeneNotFound', { query }));
          setIsLoading(false);
          return;
        }

        setLoadedGene(gene);
        setLoadedVariant(null); // Clear variant impact

        // Fetch literature
        try {
          const lit = await apiJson<any>(`/api/literature?query=${encodeURIComponent(query)}`);
          setLoadedLiterature(lit);
        } catch {
          setLoadedLiterature({ query, pubmed: [], biorxiv: [], openalex: [] });
        }

        // Fetch associated disease if available
        if (gene.opentargets?.associations?.length > 0) {
          const topAssoc = gene.opentargets.associations[0];
          try {
            const disease = await apiJson<any>(`/api/diseases/${encodeURIComponent(topAssoc.disease_name)}`);
            setLoadedDisease(disease);
          } catch {
            setLoadedDisease(null);
          }
        } else {
          setLoadedDisease(null);
        }
      } else if (type === 'variant') {
        let variant: any = null;
        try {
          variant = await apiJson<any>(`/api/variants/${encodeURIComponent(query)}`);
        } catch (err: any) {
          setError(err.message || t('search.errorVariantNotFound', { query }));
          setIsLoading(false);
          return;
        }

        setLoadedVariant(variant);

        const primaryEqtl = variant.gtex?.eqtls?.find((e: any) => e.gene_symbol);
        if (primaryEqtl) {
          let targetGene: any = null;
          try {
            targetGene = await apiJson<any>(`/api/genes/${encodeURIComponent(primaryEqtl.gene_symbol)}`);
            setLoadedGene(targetGene);
          } catch {
            setLoadedGene(null);
          }

          try {
            const lit = await apiJson<any>(`/api/literature?query=${encodeURIComponent(primaryEqtl.gene_symbol)}`);
            setLoadedLiterature(lit);
          } catch {
            setLoadedLiterature({ query: primaryEqtl.gene_symbol, pubmed: [], biorxiv: [], openalex: [] });
          }

          if (targetGene && targetGene.opentargets?.associations?.length > 0) {
            const topAssoc = targetGene.opentargets.associations[0];
            try {
              const disease = await apiJson<any>(`/api/diseases/${encodeURIComponent(topAssoc.disease_name)}`);
              setLoadedDisease(disease);
            } catch {
              setLoadedDisease(null);
            }
          } else {
            setLoadedDisease(null);
          }
        } else {
          setLoadedGene(null);
          setLoadedLiterature(null);
          setLoadedDisease(null);
        }
      } else if (type === 'disease') {
        let disease: any = null;
        try {
          disease = await apiJson<any>(`/api/diseases/${encodeURIComponent(query)}`);
        } catch (err: any) {
          setError(err.message || t('search.errorDiseaseRecognizedButMissing', { query, examples: 'Melanoma, Breast Cancer' }));
          setIsLoading(false);
          return;
        }

        setLoadedDisease(disease);
        setLoadedVariant(null); // Clear variant impact

        try {
          const lit = await apiJson<any>(`/api/literature?query=${encodeURIComponent(query)}`);
          setLoadedLiterature(lit);
        } catch {
          setLoadedLiterature({ query, pubmed: [], biorxiv: [], openalex: [] });
        }

        if (disease.opentargets?.associated_genes?.length > 0) {
          const topGeneSymbol = disease.opentargets.associated_genes[0].symbol;
          try {
            const gene = await apiJson<any>(`/api/genes/${encodeURIComponent(topGeneSymbol)}`);
            setLoadedGene(gene);
          } catch {
            setLoadedGene(null);
          }
        } else {
          setLoadedGene(null);
        }
      } else {
        setError(t('search.errorUnknown'));
      }
    } catch (err: any) {
      setError(err?.message || t('search.errorUnknown'));
    } finally {
      setIsLoading(false);
    }
  };

  const runSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = queryInput.trim();
    if (!q) return;
    const type: 'gene' | 'variant' | 'disease' =
      /^rs\d+/i.test(q) ? 'variant'
      : /cancer|carcinoma|melanoma|leukemia|lymphoma|tumou?r|disease|syndrome|itis$/i.test(q) ? 'disease'
      : 'gene';
    handleSearch(q, type);
  };

  const geneSym: string | undefined = loadedGene?.symbol;
  const variantId: string | undefined = loadedVariant?.variant_id;
  const pathogenicity: string | undefined = loadedVariant?.clinvar?.pathogenicity;
  const isPath = pathogenicity ? /pathogenic/i.test(pathogenicity) : false;
  const diseaseName: string | undefined = loadedDisease?.disease_name;
  const pdbId = pdbForGene(geneSym);
  const trialCount: number | undefined = loadedDisease?.clinical_trials?.trial_count;

  const traceNodes = [
    { k: 'Gene', v: geneSym, m: loadedGene?.ensembl?.gene_id },
    { k: 'Variant', v: variantId, m: pathogenicity, tone: isPath ? 'path' : undefined },
    { k: 'Disease', v: diseaseName, m: trialCount != null ? `${trialCount} trials` : undefined },
    { k: 'Structure', v: `PDB ${pdbId}`, m: 'kinase domain' },
  ].filter((n) => n.v);

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-6">
          <a href="#top" className="group flex items-baseline gap-3">
            <span className="font-serif text-[20px] font-semibold tracking-[-0.02em]">Proteotheca</span>
            <span className="hidden font-mono text-[11px] text-ink-3 sm:inline">32 sources · one readout</span>
          </a>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-[12px]">
              <button type="button" onClick={() => setLanguage('en')} className={language === 'en' ? 'text-ink' : 'text-ink-3 hover:text-ink'}>EN</button>
              <span className="text-ink-3">/</span>
              <button type="button" onClick={() => setLanguage('pl')} className={language === 'pl' ? 'text-ink' : 'text-ink-3 hover:text-ink'}>PL</button>
            </div>
            {user ? (
              <UserMenu />
            ) : (
              <button
                type="button"
                onClick={() => setAuthDialogMode('login')}
                className="rounded-full bg-ink px-4 py-1.5 text-[13px] font-medium text-paper transition-colors hover:bg-ink/85"
              >
                {t('nav.signIn')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-[1080px] px-6 pb-32">
        {/* Search */}
        <form onSubmit={runSearch} className="mx-auto mt-14 flex max-w-[640px] items-center gap-2">
          <div className="flex flex-1 items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 transition-colors focus-within:border-ink/40">
            <Search className="h-4 w-4 text-ink-3" />
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search a gene, a variant (rsID), or a disease"
              spellCheck={false}
              className="w-full bg-transparent font-mono text-[14px] text-ink outline-none placeholder:text-ink-3"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-ink px-6 py-3 text-[14px] font-medium text-paper transition-colors hover:bg-ink/85 disabled:opacity-40"
          >
            {isLoading ? '…' : 'Read'}
          </button>
        </form>
        {error && <p className="mt-3 text-center font-mono text-[12px] text-path">{error}</p>}

        {/* Case abstract */}
        <section className="mx-auto mt-16 max-w-[820px] animate-[fade-in_0.6s_ease]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">Case readout</p>
          <h1 className="mt-4 font-serif text-[clamp(2.4rem,6vw,4rem)] font-medium leading-[1.02] tracking-[-0.02em]">
            {geneSym || '—'}
            {diseaseName && <span className="text-ink-3"> in {diseaseName}</span>}
          </h1>
          <p className="mt-5 max-w-[54ch] text-[17px] leading-relaxed text-ink-2">
            {loadedGene?.uniprot?.name
              ? `${loadedGene.uniprot.name}. `
              : ''}
            A single query, read across genomics, structure, clinical significance and the literature — from{' '}
            {traceNodes.length} of 32 connected sources.
          </p>

          {/* trace */}
          <div className="mt-9 flex flex-wrap items-stretch gap-x-10 gap-y-6 border-t border-line pt-7">
            {traceNodes.map((n) => (
              <div key={n.k} className="min-w-[120px]">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{n.k}</p>
                <p className="mt-1.5 font-serif text-[19px] leading-tight">{n.v}</p>
                {n.m && (
                  <p className={`mt-1 font-mono text-[11px] ${n.tone === 'path' ? 'text-path' : 'text-ink-2'}`}>
                    {n.tone === 'path' && <span className="mr-1">●</span>}
                    {n.m}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Structure hero */}
        <section className="mt-16">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">The structure</p>
              <h2 className="mt-2 font-serif text-[26px] font-medium tracking-[-0.01em]">
                {geneSym} kinase domain
              </h2>
            </div>
            <p className="hidden max-w-[30ch] text-right text-[13px] leading-snug text-ink-2 sm:block">
              Rendered in-browser and coloured by AlphaFold model confidence (pLDDT).
            </p>
          </div>
          <div className="overflow-hidden rounded-[20px] border border-line bg-surface shadow-[0_1px_2px_rgba(20,24,34,0.03),0_16px_40px_rgba(20,24,34,0.06)]">
            <MolViewer
              pdbId={pdbId}
              representation={molRepresentation}
              colorMode={molColorMode}
              onRepresentationChange={setMolRepresentation}
              onColorModeChange={setMolColorMode}
            />
          </div>
        </section>

        {/* Evidence — the full reading across every source */}
        <div className="mt-20 space-y-16">
          {loadedGene && (
            <section>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">Genomics</p>
              <h2 className="mb-6 mt-2 font-serif text-[26px] font-medium tracking-[-0.01em]">The gene</h2>
              <ErrorBoundary label="gene"><GenePanel geneData={loadedGene} isLoading={isLoading} /></ErrorBoundary>
            </section>
          )}

          {loadedVariant && (
            <section>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">Variant impact</p>
              <h2 className="mb-6 mt-2 font-serif text-[26px] font-medium tracking-[-0.01em]">
                {variantId}
                {pathogenicity && <span className={isPath ? 'text-path' : 'text-ink-3'}> — {pathogenicity}</span>}
              </h2>
              <ErrorBoundary label="variant"><VariantPanel variantData={loadedVariant} isLoading={isLoading} /></ErrorBoundary>
            </section>
          )}

          <section>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">Interactions</p>
            <h2 className="mb-6 mt-2 font-serif text-[26px] font-medium tracking-[-0.01em]">Protein network</h2>
            <ErrorBoundary label="network"><StringNetwork geneSymbol={geneSym || 'BRAF'} /></ErrorBoundary>
          </section>

          {loadedDisease && (
            <section>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">Therapeutics</p>
              <h2 className="mb-6 mt-2 font-serif text-[26px] font-medium tracking-[-0.01em]">{diseaseName}</h2>
              <ErrorBoundary label="therapeutics"><TherapeuticPanel diseaseData={loadedDisease} isLoading={isLoading} /></ErrorBoundary>
            </section>
          )}

          {loadedLiterature && (
            <section>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">Evidence</p>
              <h2 className="mb-6 mt-2 font-serif text-[26px] font-medium tracking-[-0.01em]">Literature</h2>
              <ErrorBoundary label="literature"><LiteraturePanel literatureData={loadedLiterature} isLoading={isLoading} /></ErrorBoundary>
            </section>
          )}
        </div>

        {/* Sources thesis */}
        <section className="mx-auto mt-24 max-w-[820px] border-t border-line pt-8">
          <p className="font-mono text-[11px] leading-relaxed text-ink-3">
            Ensembl · UniProt · ClinVar · gnomAD · GTEx · AlphaFold · RCSB PDB · OpenTargets · Reactome ·
            InterPro · ChEMBL · openFDA · ClinicalTrials · PubMed · bioRxiv · EuropePMC · OpenAlex · STRING ·
            dbSNP · UCSC · JASPAR · Human Protein Atlas — <span className="text-ink">read as one.</span>
          </p>
        </section>
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
