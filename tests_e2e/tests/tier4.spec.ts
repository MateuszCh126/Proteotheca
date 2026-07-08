import { test, expect } from '@playwright/test';
import { setupMocks } from '../mocks';

test.describe('Tier 4: Real-World Application Scenarios (5 cases)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/');
  });

  test('S1: Melanoma Target Discovery & Drug Repurposing workflow', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    
    // 1. Search Melanoma
    await searchInput.fill('Melanoma');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="therapeutic-panel"] h2')).toContainText('Melanoma');

    // 2. BRAF Gene should be loaded via top association
    await expect(page.locator('[data-testid="gene-panel"] h2')).toContainText('BRAF');

    // 3. Inspect Mol* Preview and trigger PyMOL rendering
    await expect(page.locator('[data-testid="mol-viewer-container"]')).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="pymol-render-btn"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('pymol');

    // 4. Inspect ChEMBL active drugs in Therapeutic Panel
    const therapeuticPanel = page.locator('[data-testid="therapeutic-panel"]');
    await therapeuticPanel.locator('[data-testid="tab-trigger-therapeutic-drugs"]').click();
    await expect(therapeuticPanel.locator('[data-testid="chembl-drug-card"]').first()).toBeVisible();
  });

  test('S2: Clinician Variant Impact Investigation workflow', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    
    // 1. Search Variant rs113488022
    await searchInput.fill('rs113488022');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="variant-panel"] h2')).toContainText('rs113488022');

    // 2. View GTEx Heatmap
    const variantPanel = page.locator('[data-testid="variant-panel"]');
    await variantPanel.locator('[data-testid="tab-trigger-variant-gtex"]').click();
    await expect(variantPanel).toContainText('Hover over a heatmap cell');

    // 3. Verify ClinVar Pathogenicity
    await variantPanel.locator('[data-testid="tab-trigger-variant-clinvar"]').click();
    await expect(variantPanel).toContainText('ClinVar Pathogenicity: Pathogenic');

    // 4. Verify Literature Panel has scientific references
    const litPanel = page.locator('[data-testid="literature-panel"]');
    await expect(litPanel).toContainText('Scientific Literature');
    await litPanel.locator('button:has-text("PubMed")').click();
    await expect(litPanel.locator('[data-testid="publication-card"]').first()).toBeVisible();
  });

  test('S3: Novel Bio-engineering Target Check workflow', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    
    // 1. Search TP53
    await searchInput.fill('TP53');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="gene-panel"] h2')).toContainText('TP53');

    // 2. View Reactome Pathways Hierarchy
    const genePanel = page.locator('[data-testid="gene-panel"]');
    await genePanel.locator('[data-testid="tab-trigger-gene-reactome"]').click();
    await expect(genePanel).toContainText('Reactome Pathways Hierarchy Mappings');

    // 3. Activate and inspect STRING Interaction Graph
    const stringNetwork = page.locator('[data-testid="string-network-container"]');
    await expect(stringNetwork.locator('text=Activate STRING Interaction Graph')).toBeVisible();
    await stringNetwork.click();
    await expect(stringNetwork.locator('svg.select-none')).toBeVisible();
  });

  test('S4: Breast Cancer Drug Profiling workflow', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    
    // 1. Search Breast Cancer
    await searchInput.fill('Breast Cancer');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="therapeutic-panel"] h2')).toContainText('Breast Cancer');

    // 2. View ChEMBL compounds
    const therapeuticPanel = page.locator('[data-testid="therapeutic-panel"]');
    await therapeuticPanel.locator('[data-testid="tab-trigger-therapeutic-drugs"]').click();
    await expect(therapeuticPanel.locator('[data-testid="chembl-drug-card"]').first()).toBeVisible();

    // 3. View Clinical Trials registry entries
    await therapeuticPanel.locator('[data-testid="tab-trigger-therapeutic-trials"]').click();
    await expect(therapeuticPanel).toContainText('ClinicalTrials.gov Registry');

    // 4. View openFDA Adverse Events symptom breakdown
    await therapeuticPanel.locator('[data-testid="tab-trigger-therapeutic-fda"]').click();
    await expect(therapeuticPanel).toContainText('FDA ADE Symptom Frequency');
  });

  test('S5: Literature Evidence Synthesis workflow', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    
    // 1. Search EGFR
    await searchInput.fill('EGFR');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="gene-panel"] h2')).toContainText('EGFR');

    // 2. Inspect Literature Panel and toggle publications filters
    const litPanel = page.locator('[data-testid="literature-panel"]');
    await expect(litPanel).toContainText('Scientific Literature');
    
    // Filter by bioRxiv
    await litPanel.locator('button:has-text("bioRxiv")').click();
    await expect(litPanel.locator('[data-testid="publication-card"]').first()).toBeVisible();

    // Filter by OpenAlex
    await litPanel.locator('button:has-text("OpenAlex")').click();
    await expect(litPanel.locator('[data-testid="publication-card"]').first()).toBeVisible();
  });
});
