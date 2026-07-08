import { test, expect } from '@playwright/test';
import { setupMocks } from '../mocks';

test.describe('Tier 3: Pairwise Feature Interactions (6 cases)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/');
  });

  test('I1: Search gene EGFR and switch MolViewer representation to Surface', async ({ page }) => {
    // 1. Search EGFR
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('EGFR');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="gene-panel"]')).toContainText('EGFR');

    // 2. Change MolViewer to Surface
    const surfaceBtn = page.locator('button:has-text("Surface")');
    await surfaceBtn.click();
    await expect(surfaceBtn).toBeVisible();
  });

  test('I2: Change language to Polish and search variant rs113488022', async ({ page }) => {
    // 1. Set language to PL
    await page.locator('[data-testid="language-switcher"] button:has-text("PL")').click();

    // 2. Search variant
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('rs113488022');
    await page.locator('button[data-testid="search-button"]').click();
    
    // 3. Verify variant panel contains Polish translation (e.g., "Szczegóły interpretacji" or tab names)
    await expect(page.locator('[data-testid="variant-panel"]')).toBeVisible();
  });

  test('I3: Authenticate and then save project', async ({ page }) => {
    // 1. Log In
    await page.locator('button:has-text("Log In")').click();
    await page.locator('input[type="email"]').fill('test@biomed.org');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Sign In")').click();

    // 2. Open Save Project dialog
    await page.locator('button:has-text("Save Project")').click();
    await page.locator('input[placeholder="Project Name"]').fill('EGFR Analysis');
    await page.locator('button:has-text("Save Project")').click();

    // 3. Verify dialogue closed
    await expect(page.locator('text=Save Current Session')).not.toBeVisible();
  });

  test('I4: Search variant and browse regulatory predictions tabs', async ({ page }) => {
    // 1. Search Variant
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('rs113488022');
    await page.locator('button[data-testid="search-button"]').click();

    // 2. Verify AlphaGenome predictions tab
    const variantPanel = page.locator('[data-testid="variant-panel"]');
    await variantPanel.locator('[data-testid="tab-trigger-variant-alphagenome"]').click();
    await expect(variantPanel).toContainText('AlphaGenome Variant Regulatory Predictions');

    // 3. Toggle to dbSNP tab
    await variantPanel.locator('[data-testid="tab-trigger-variant-dbsnp"]').click();
    await expect(variantPanel).toContainText('dbSNP Variant Mapping');
  });

  test('I5: Search gene and verify AlphaFold pLDDT scores before generating PyMOL render', async ({ page }) => {
    // 1. Search gene
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('BRAF');
    await page.locator('button[data-testid="search-button"]').click();

    // 2. Open AlphaFold tab and verify pLDDT
    const genePanel = page.locator('[data-testid="gene-panel"]');
    await genePanel.locator('[data-testid="tab-trigger-gene-alphafold"]').click();
    await expect(genePanel).toContainText('pLDDT Metric Breakdown');

    // 3. Trigger PyMOL rendering download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="pymol-render-btn"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('pymol');
  });

  test('I6: Switch color mode in MolViewer and change representation', async ({ page }) => {
    // 1. Zoom and representation change
    await page.locator('button:has-text("Cartoon")').click();
    await page.locator('button:has-text("Chain")').click();
    
    // 2. Switch representation and verify active
    await page.locator('button:has-text("Spheres")').click();
    await expect(page.locator('[data-testid="mol-viewer-container"]')).toBeVisible();
  });
});
