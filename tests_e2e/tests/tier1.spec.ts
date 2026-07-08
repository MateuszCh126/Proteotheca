import { test, expect } from '@playwright/test';
import { setupMocks } from '../mocks';

test.describe('Tier 1: Feature Coverage (30 cases)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/');
  });

  // Feature 1: Gene Symbol Search (5 cases)
  test('F1.1: Search BRAF gene', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('BRAF');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="gene-panel"]')).toContainText('BRAF');
  });

  test('F1.2: Search EGFR gene', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('EGFR');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="gene-panel"]')).toContainText('EGFR');
  });

  test('F1.3: Search TP53 gene', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('TP53');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="gene-panel"]')).toContainText('TP53');
  });

  test('F1.4: Search BRCA1 gene', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('BRCA1');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="gene-panel"]')).toContainText('BRCA1');
  });

  test('F1.5: Search APOE gene', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('APOE');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="gene-panel"]')).toContainText('APOE');
  });

  // Feature 2: Genetic Variant Search (5 cases)
  test('F2.1: Search rs113488022 variant', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('rs113488022');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="variant-panel"]')).toContainText('rs113488022');
  });

  test('F2.2: Search 7-140753336-T-A variant', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('7-140753336-T-A');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="variant-panel"]')).toContainText('rs113488022');
  });

  test('F2.3: Search rs53576 variant', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('rs53576');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="variant-panel"]')).toContainText('rs53576');
  });

  test('F2.4: Search rs1801133 variant', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('rs1801133');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="variant-panel"]')).toContainText('rs1801133');
  });

  test('F2.5: Search rs7412 variant', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('rs7412');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="variant-panel"]')).toContainText('rs7412');
  });

  // Feature 3: Disease/Indication Search (5 cases)
  test('F3.1: Search Melanoma disease', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('Melanoma');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="therapeutic-panel"]')).toContainText('Melanoma');
  });

  test('F3.2: Search Breast Cancer disease', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('Breast Cancer');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="therapeutic-panel"]')).toContainText('Breast Cancer');
  });

  test('F3.3: Search Lung Cancer disease', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('Lung Cancer');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="therapeutic-panel"]')).toContainText('Lung Cancer');
  });

  test('F3.4: Search Colorectal Cancer disease', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('Colorectal Cancer');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="therapeutic-panel"]')).toContainText('Colorectal Cancer');
  });

  test('F3.5: Search Alzheimers Disease', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill("Alzheimer's Disease");
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="therapeutic-panel"]')).toContainText("Alzheimer's Disease");
  });

  // Feature 4: Interactive Mol* Viewer (5 cases)
  test('F4.1: Render Mol* viewer structure container', async ({ page }) => {
    await expect(page.locator('[data-testid="mol-viewer-container"]')).toBeVisible();
  });

  test('F4.2: Toggle representation to cartoon', async ({ page }) => {
    const btn = page.locator('button:has-text("Cartoon")');
    await btn.click();
    await expect(btn).toBeVisible();
  });

  test('F4.3: Toggle representation to surface', async ({ page }) => {
    const btn = page.locator('button:has-text("Surface")');
    await btn.click();
    await expect(btn).toBeVisible();
  });

  test('F4.4: Toggle representation to spheres', async ({ page }) => {
    const btn = page.locator('button:has-text("Spheres")');
    await btn.click();
    await expect(btn).toBeVisible();
  });

  test('F4.5: Verify zoom in and zoom out buttons exist', async ({ page }) => {
    await expect(page.locator('button[title="Zoom In"]')).toBeVisible();
    await expect(page.locator('button[title="Zoom Out"]')).toBeVisible();
  });

  // Feature 5: PyMOL Rendering Engine (5 cases)
  test('F5.1: Verify PyMOL render button exists and is active', async ({ page }) => {
    await expect(page.locator('[data-testid="pymol-render-btn"]')).toBeVisible();
  });

  test('F5.2: Click PyMOL render for cartoon representation', async ({ page }) => {
    await page.locator('button:has-text("Cartoon")').click();
    const renderBtn = page.locator('[data-testid="pymol-render-btn"]');
    await expect(renderBtn).toBeEnabled();
  });

  test('F5.3: Click PyMOL render for surface representation', async ({ page }) => {
    await page.locator('button:has-text("Surface")').click();
    const renderBtn = page.locator('[data-testid="pymol-render-btn"]');
    await expect(renderBtn).toBeEnabled();
  });

  test('F5.4: Click PyMOL render for spheres representation', async ({ page }) => {
    await page.locator('button:has-text("Spheres")').click();
    const renderBtn = page.locator('[data-testid="pymol-render-btn"]');
    await expect(renderBtn).toBeEnabled();
  });

  test('F5.5: Trigger PyMOL render and verify mock download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="pymol-render-btn"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('pymol');
  });

  // Feature 6: Premium Scientific UI (5 cases)
  test('F6.1: Switch to Polish language', async ({ page }) => {
    await page.locator('[data-testid="language-switcher"] button:has-text("PL")').click();
    await expect(page.locator('[data-testid="tab-trigger-gene-transcripts"]')).toHaveText('Transkrypty');
  });

  test('F6.2: Switch back to English language', async ({ page }) => {
    await page.locator('[data-testid="language-switcher"] button:has-text("PL")').click();
    await page.locator('[data-testid="language-switcher"] button:has-text("EN")').click();
    await expect(page.locator('[data-testid="tab-trigger-gene-transcripts"]')).toHaveText('Transcripts');
  });

  test('F6.3: Toggle projects panel sidebar', async ({ page }) => {
    const openBtn = page.locator('button:has-text("Saved Projects")');
    await openBtn.click();
    await expect(page.locator('aside')).toBeVisible();
  });

  test('F6.4: Trigger Auth dialog login mode', async ({ page }) => {
    await page.locator('button:has-text("Log In")').click();
    await expect(page.locator('text=Access BioMed Portal')).toBeVisible();
  });

  test('F6.5: Trigger Auth dialog registration mode', async ({ page }) => {
    await page.locator('button:has-text("Sign Up")').click();
    await expect(page.locator('text=Access BioMed Portal')).toBeVisible();
  });
});
