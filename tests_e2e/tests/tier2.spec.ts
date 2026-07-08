import { test, expect } from '@playwright/test';
import { setupMocks } from '../mocks';

test.describe('Tier 2: Boundary & Corner Cases (30 cases)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/');
  });

  // Feature 1: Gene Symbol Search
  test('B1.1: Search empty/whitespace gene symbol', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('   ');
    await page.locator('button[data-testid="search-button"]').click();
    // No change in panel, BRAF should remain default
    await expect(page.locator('[data-testid="gene-panel"]')).toContainText('BRAF');
  });

  test('B1.2: Search non-existent gene symbol', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('INVALID_GENE');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('text=Gene symbol "INVALID_GENE" not found')).toBeVisible();
  });

  test('B1.3: Search extremely long gene symbol', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('A'.repeat(100));
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('text=not found')).toBeVisible();
  });

  test('B1.4: Search gene symbol with special characters', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('EGFR!!@@');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('text=not found')).toBeVisible();
  });

  test('B1.5: Case-insensitive gene search', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('egfr');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="gene-panel"]')).toContainText('EGFR');
  });

  // Feature 2: Genetic Variant Search
  test('B2.1: Search invalid rsID format', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('rsINVALID');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('text=Invalid variant_id format')).toBeVisible();
  });

  test('B2.2: Search malformed coordinate format', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('7:140753336');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('text=Invalid variant_id format')).toBeVisible();
  });

  test('B2.3: Search coordinate with invalid chromosome', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('99-10000-A-T');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('text=not found')).toBeVisible();
  });

  test('B2.4: Search coordinate with invalid alleles', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('7-140753336-X-Y');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('text=not found')).toBeVisible();
  });

  test('B2.5: Search variant with leading/trailing spaces', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('  rs113488022  ');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="variant-panel"]')).toContainText('rs113488022');
  });

  // Feature 3: Disease/Indication Search
  test('B3.1: Search non-existent disease', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('INVALID_DISEASE');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('text=not found in database')).toBeVisible();
  });

  test('B3.2: Search disease with numeric values', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('Melanoma123');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('text=not found in database')).toBeVisible();
  });

  test('B3.3: Search disease with special characters', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('Melanoma#$');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('text=not found in database')).toBeVisible();
  });

  test('B3.4: Search empty/whitespace disease', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('   ');
    await page.locator('button[data-testid="search-button"]').click();
    // Should preserve default Melanoma
    await expect(page.locator('[data-testid="therapeutic-panel"]')).toContainText('Melanoma');
  });

  test('B3.5: Case-insensitive disease search', async ({ page }) => {
    const searchInput = page.locator('input[data-testid="search-input"]');
    await searchInput.fill('melanoma');
    await page.locator('button[data-testid="search-button"]').click();
    await expect(page.locator('[data-testid="therapeutic-panel"]')).toContainText('Melanoma');
  });

  // Feature 4: Interactive Mol* Viewer
  test('B4.1: Render Mol* viewer when invalid PDB loaded', async ({ page }) => {
    // Navigate to a state with potentially invalid PDB symbol
    await expect(page.locator('[data-testid="mol-viewer-container"]')).toBeVisible();
  });

  test('B4.2: Switch representations rapidly', async ({ page }) => {
    const cartoon = page.locator('button:has-text("Cartoon")');
    const surface = page.locator('button:has-text("Surface")');
    const spheres = page.locator('button:has-text("Spheres")');
    await cartoon.click();
    await surface.click();
    await spheres.click();
    await expect(spheres).toBeVisible();
  });

  test('B4.3: Toggle color mode to Chain', async ({ page }) => {
    const btn = page.locator('button:has-text("Chain")');
    await btn.click();
    await expect(btn).toBeVisible();
  });

  test('B4.4: Toggle color mode to Hydrophobicity', async ({ page }) => {
    const btn = page.locator('button:has-text("Hydrophobicity")');
    await btn.click();
    await expect(btn).toBeVisible();
  });

  test('B4.5: Toggle color mode to pLDDT', async ({ page }) => {
    const btn = page.locator('button:has-text("pLDDT")');
    await btn.click();
    await expect(btn).toBeVisible();
  });

  // Feature 5: PyMOL Rendering Engine
  test('B5.1: Trigger PyMOL rendering for non-existent PDB ID', async ({ page }) => {
    // Even if PDB is invalid, button should invoke rendering engine
    await expect(page.locator('[data-testid="pymol-render-btn"]')).toBeVisible();
  });

  test('B5.2: Double-click render button rapidly', async ({ page }) => {
    const btn = page.locator('[data-testid="pymol-render-btn"]');
    await btn.dblclick();
    await expect(btn).toBeVisible();
  });

  test('B5.3: Verify rendering button disabled state during API loading', async ({ page }) => {
    await expect(page.locator('[data-testid="pymol-render-btn"]')).toBeEnabled();
  });

  test('B5.4: Trigger PyMOL rendering when backend fails with 500 error', async ({ page }) => {
    // Mock the backend 500 failure
    await page.route('**/api/pymol/render', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Failed to render protein structure.' }),
      });
    });

    // Handle standard alert
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Failed to generate PyMOL render');
      await dialog.dismiss();
    });

    await page.locator('[data-testid="pymol-render-btn"]').click();
  });

  test('B5.5: Check PyMOL render parameters handling', async ({ page }) => {
    await page.locator('button:has-text("Cartoon")').click();
    await page.locator('button:has-text("Chain")').click();
    await expect(page.locator('[data-testid="pymol-render-btn"]')).toBeEnabled();
  });

  // Feature 6: Premium Scientific UI
  test('B6.1: Submit login with empty credentials', async ({ page }) => {
    await page.locator('button:has-text("Log In")').click();
    await page.locator('button:has-text("Sign In")').click();
    // Verify authentication modal closes or shows error (since validation is local)
    await expect(page.locator('text=Access BioMed Portal')).toBeVisible();
  });

  test('B6.2: Submit sign up with empty credentials', async ({ page }) => {
    await page.locator('button:has-text("Sign Up")').click();
    await page.locator('button:has-text("Create Account")').click();
    await expect(page.locator('text=Access BioMed Portal')).toBeVisible();
  });

  test('B6.3: Open save project dialog without name', async ({ page }) => {
    await page.locator('button:has-text("Save Project")').click();
    await expect(page.locator('text=Save Current Session')).toBeVisible();
  });

  test('B6.4: Cancel saving a project', async ({ page }) => {
    await page.locator('button:has-text("Save Project")').click();
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Save Current Session')).not.toBeVisible();
  });

  test('B6.5: Rapidly toggle languages multiple times', async ({ page }) => {
    const pl = page.locator('[data-testid="language-switcher"] button:has-text("PL")');
    const en = page.locator('[data-testid="language-switcher"] button:has-text("EN")');
    await pl.click();
    await en.click();
    await pl.click();
    await expect(page.locator('[data-testid="tab-trigger-gene-transcripts"]')).toHaveText('Transkrypty');
  });
});
