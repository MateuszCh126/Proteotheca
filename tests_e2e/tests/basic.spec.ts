import { test, expect } from '@playwright/test';
import { setupMocks } from '../mocks';

test.describe('Sanity Check', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test('should boot playwright and render basic content', async ({ page }) => {
    await page.setContent('<html><body><div id="root"><h1>BioMed Explorer Mock</h1></div></body></html>');
    const header = page.locator('h1');
    await expect(header).toHaveText('BioMed Explorer Mock');
  });
});
