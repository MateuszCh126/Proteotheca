import { test, expect } from '@playwright/test';
import { setupMocks } from '../mocks';

test.describe('BioMed Explorer Frontend E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept all API calls and fulfill them with E2E mocks
    await setupMocks(page);
    await page.goto('/');
  });

  test('should render header and active session defaults', async ({ page }) => {
    // 1. Verify header is present and contains correct text
    const headerTitle = page.locator('header h1');
    await expect(headerTitle).toContainText('BioMed Explorer');

    // 2. Verify default gene (BRAF) is loaded on mount
    const genePanel = page.locator('[data-testid="gene-panel"]');
    await expect(genePanel.locator('h2')).toContainText('BRAF');
    await expect(genePanel).toContainText('Ensembl: ENSG00000157764');

    // 3. Verify default variant (rs113488022) is loaded on mount
    const variantPanel = page.locator('[data-testid="variant-panel"]');
    await expect(variantPanel.locator('h2')).toContainText('rs113488022');
    await expect(variantPanel).toContainText('ClinVar Pathogenicity: Pathogenic');

    // 4. Verify default disease (Melanoma) is loaded on mount
    const therapeuticPanel = page.locator('[data-testid="therapeutic-panel"]');
    await expect(therapeuticPanel.locator('h2')).toContainText('Melanoma');
    await expect(therapeuticPanel).toContainText('Active clinical trials: 142 entries');
  });

  test('should search for other entities successfully', async ({ page }) => {
    // Find search input and search button
    const searchInput = page.locator('input[data-testid="search-input"]');
    const searchButton = page.locator('button[data-testid="search-button"]');

    // 1. Search for EGFR (Gene)
    await searchInput.fill('EGFR');
    await searchButton.click();

    // Verify GenePanel updates to EGFR
    const genePanel = page.locator('[data-testid="gene-panel"]');
    await expect(genePanel.locator('h2')).toContainText('EGFR');
    await expect(genePanel).toContainText('Ensembl: ENSG00000146648');

    // 2. Search for Lung Cancer (Disease)
    await searchInput.fill('Lung Cancer');
    await searchButton.click();

    // Verify TherapeuticPanel updates
    const therapeuticPanel = page.locator('[data-testid="therapeutic-panel"]');
    await expect(therapeuticPanel.locator('h2')).toContainText('Lung Cancer');
  });

  test('should toggle and display all 30 database/tool panels correctly', async ({ page }) => {
    const genePanel = page.locator('[data-testid="gene-panel"]');
    const variantPanel = page.locator('[data-testid="variant-panel"]');
    const therapeuticPanel = page.locator('[data-testid="therapeutic-panel"]');
    const litPanel = page.locator('[data-testid="literature-panel"]');

    // --- GENE PANEL TABS ---
    // Transcripts tab
    await genePanel.locator('[data-testid="tab-trigger-gene-transcripts"]').click();
    await expect(genePanel.locator('table')).toBeVisible();

    // UniProt tab
    await genePanel.locator('[data-testid="tab-trigger-gene-uniprot"]').click();
    await expect(genePanel).toContainText('Accession');
    await expect(genePanel).toContainText('P15056');

    // OpenTargets associations tab
    await genePanel.locator('[data-testid="tab-trigger-gene-opentargets"]').click();
    await expect(genePanel.locator('[data-testid="opentargets-association-row"]').first()).toBeVisible();

    // AlphaFold tab
    await genePanel.locator('[data-testid="tab-trigger-gene-alphafold"]').click();
    await expect(genePanel).toContainText('pLDDT Metric Breakdown');

    // HPA (Human Protein Atlas) tab
    await genePanel.locator('[data-testid="tab-trigger-gene-hpa"]').click();
    await expect(genePanel).toContainText('Subcellular Localization');

    // InterPro tab
    await genePanel.locator('[data-testid="tab-trigger-gene-interpro"]').click();
    await expect(genePanel).toContainText('InterPro Functional Domains');

    // NCBI Sequence tab
    await genePanel.locator('[data-testid="tab-trigger-gene-ncbi"]').click();
    await expect(genePanel).toContainText('NCBI Sequence Fetch (RefSeq)');
    await expect(genePanel.locator('textarea')).toBeVisible();

    // QuickGO tab
    await genePanel.locator('[data-testid="tab-trigger-gene-quickgo"]').click();
    await expect(genePanel).toContainText('QuickGO Ontology Annotation Mappings');

    // Reactome tab
    await genePanel.locator('[data-testid="tab-trigger-gene-reactome"]').click();
    await expect(genePanel).toContainText('Reactome Pathways Hierarchy Mappings');


    // --- VARIANT PANEL TABS ---
    // ClinVar tab
    await variantPanel.locator('[data-testid="tab-trigger-variant-clinvar"]').click();
    await expect(variantPanel).toContainText('Interpretation details');

    // gnomAD tab
    await variantPanel.locator('[data-testid="tab-trigger-variant-gnomad"]').click();
    await expect(variantPanel).toContainText('gnomAD Ancestry Frequency Breakdown');

    // GTEx tab
    await variantPanel.locator('[data-testid="tab-trigger-variant-gtex"]').click();
    await expect(variantPanel).toContainText('Hover over a heatmap cell');

    // AlphaGenome tab
    await variantPanel.locator('[data-testid="tab-trigger-variant-alphagenome"]').click();
    await expect(variantPanel).toContainText('AlphaGenome Variant Regulatory Predictions');

    // dbSNP tab
    await variantPanel.locator('[data-testid="tab-trigger-variant-dbsnp"]').click();
    await expect(variantPanel).toContainText('dbSNP Variant Mapping');

    // UCSC tab
    await variantPanel.locator('[data-testid="tab-trigger-variant-ucsc"]').click();
    await expect(variantPanel).toContainText('phyloP Score:');

    // UniBind tab
    await variantPanel.locator('[data-testid="tab-trigger-variant-unibind"]').click();
    await expect(variantPanel).toContainText('UniBind Validated TF-DNA Interactions');

    // JASPAR tab
    await variantPanel.locator('[data-testid="tab-trigger-variant-jaspar"]').click();
    await expect(variantPanel).toContainText('JASPAR Motif Matrices');


    // --- THERAPEUTIC PANEL TABS ---
    // Associated Genes tab
    await therapeuticPanel.locator('[data-testid="tab-trigger-therapeutic-genes"]').click();
    await expect(therapeuticPanel.locator('[data-testid="disease-associated-gene-row"]').first()).toBeVisible();

    // ChEMBL Drugs tab
    await therapeuticPanel.locator('[data-testid="tab-trigger-therapeutic-drugs"]').click();
    await expect(therapeuticPanel.locator('[data-testid="chembl-drug-card"]').first()).toBeVisible();

    // Clinical Trials tab
    await therapeuticPanel.locator('[data-testid="tab-trigger-therapeutic-trials"]').click();
    await expect(therapeuticPanel).toContainText('ClinicalTrials.gov Registry');

    // openFDA tab
    await therapeuticPanel.locator('[data-testid="tab-trigger-therapeutic-fda"]').click();
    await expect(therapeuticPanel).toContainText('FDA ADE Symptom Frequency');

    // PubChem tab
    await therapeuticPanel.locator('[data-testid="tab-trigger-therapeutic-pubchem"]').click();
    await expect(therapeuticPanel).toContainText('PubChem Compound Chemical Structure Details');

    // OLS tab
    await therapeuticPanel.locator('[data-testid="tab-trigger-therapeutic-ols"]').click();
    await expect(therapeuticPanel).toContainText('EMBL-EBI Ontology Lookup Service Hierarchy');

    // ENCODE tab
    await therapeuticPanel.locator('[data-testid="tab-trigger-therapeutic-encode"]').click();
    await expect(therapeuticPanel).toContainText('ENCODE Registry of cis-Regulatory Elements');


    // --- LITERATURE PANEL ---
    await expect(litPanel).toContainText('Scientific Literature');
    // PubMed filter
    await litPanel.locator('button:has-text("PubMed")').click();
    await expect(litPanel.locator('[data-testid="publication-card"]').first()).toBeVisible();
  });

  test('should execute sequence/structure search in Analysis Tools tab', async ({ page }) => {
    const genePanel = page.locator('[data-testid="gene-panel"]');
    await genePanel.locator('[data-testid="tab-trigger-gene-analysis"]').click();

    const analysisPanel = page.locator('[data-testid="analysis-tools-panel"]');
    await expect(analysisPanel).toBeVisible();

    // 1. BLAST / MMseqs2
    await analysisPanel.locator('text=BLAST / MMseqs2').click();
    await analysisPanel.locator('button:has-text("Run Alignment")').click();
    // Wait for simulated progress
    await expect(analysisPanel.locator('text=Alignment Complete')).toBeVisible({ timeout: 5000 });
    await expect(analysisPanel).toContainText('Top Database Sequence Hits');

    // 2. Clustal Omega MSA
    await analysisPanel.locator('text=Clustal Omega MSA').click();
    await analysisPanel.locator('button:has-text("Run Alignment")').click();
    await expect(analysisPanel.locator('text=Alignment Complete')).toBeVisible({ timeout: 5000 });
    await expect(analysisPanel).toContainText('Multiple Sequence Alignment Grid');

    // 3. Foldseek
    await analysisPanel.locator('text=Foldseek 3D Search').click();
    await analysisPanel.locator('button:has-text("Run Alignment")').click();
    await expect(analysisPanel.locator('text=Alignment Complete')).toBeVisible({ timeout: 5000 });
    await expect(analysisPanel).toContainText('Top Structural Structural Analogues');
  });

  test('should render and interact with MolViewer and StringNetwork', async ({ page }) => {
    // 1. Verify MolViewer renders controls
    const molViewer = page.locator('[data-testid="mol-viewer-container"]');
    await expect(molViewer).toBeVisible();
    await expect(molViewer.locator('button[title="Zoom In"]')).toBeVisible();

    // 2. Verify StringNetwork activate screen and active state
    const stringNetwork = page.locator('[data-testid="string-network-container"]');
    await expect(stringNetwork).toBeVisible();
    await expect(stringNetwork.locator('text=Activate STRING Interaction Graph')).toBeVisible();

    // Click to activate the force-directed graph
    await stringNetwork.click();
    await expect(stringNetwork.locator('svg.select-none')).toBeVisible();
    await expect(stringNetwork.locator('circle').first()).toBeVisible();
  });

  test('should toggle Polish translation language successfully', async ({ page }) => {
    // Locate language switcher and toggle to Polish
    const switcher = page.locator('[data-testid="language-switcher"]');
    const plButton = switcher.locator('button:has-text("PL")');
    await plButton.click();

    // Verify key titles/buttons are now in Polish
    const genePanel = page.locator('[data-testid="gene-panel"]');
    // Tab "Transcripts" should translate to "Transkrypty"
    await expect(genePanel.locator('[data-testid="tab-trigger-gene-transcripts"]')).toHaveText('Transkrypty');

    // Language switcher should have PL active
    await expect(plButton).toHaveAttribute('aria-pressed', 'true');
  });
});
