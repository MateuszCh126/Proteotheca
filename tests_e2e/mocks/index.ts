import { Page, BrowserContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Import JSON files
import genes from './data/genes.json';
import variants from './data/variants.json';
import diseases from './data/diseases.json';
import literature from './data/literature.json';

const MOCK_PNG_PATH = path.join(__dirname, 'assets', 'mock_pymol_render.png');

export async function setupMocks(pageOrContext: Page | BrowserContext) {
  // 1. Gene Endpoint Mock
  await pageOrContext.route('**/api/genes/*', async (route) => {
    const url = route.request().url();
    const symbol = url.substring(url.lastIndexOf('/') + 1).toUpperCase();
    
    const geneData = (genes as Record<string, any>)[symbol];
    if (geneData !== undefined && geneData !== null) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(geneData),
      });
    } else {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: `Gene symbol '${symbol}' not found in database.` }),
      });
    }
  });

  // 2. Variant Endpoint Mock
  await pageOrContext.route('**/api/variants/*', async (route) => {
    const url = route.request().url();
    const variantId = url.substring(url.lastIndexOf('/') + 1);
    
    const variantData = (variants as Record<string, any>)[variantId];
    if (variantData !== undefined && variantData !== null) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(variantData),
      });
    } else {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: `Variant '${variantId}' not found in database.` }),
      });
    }
  });

  // 3. Disease Endpoint Mock
  await pageOrContext.route('**/api/diseases/*', async (route) => {
    const url = route.request().url();
    const rawDisease = url.substring(url.lastIndexOf('/') + 1);
    const diseaseName = decodeURIComponent(rawDisease);
    
    // Perform case-insensitive match for keys
    const matchKey = Object.keys(diseases).find(
      key => key.toLowerCase() === diseaseName.toLowerCase()
    );
    
    const diseaseData = matchKey ? (diseases as Record<string, any>)[matchKey] : null;
    if (diseaseData !== null) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(diseaseData),
      });
    } else {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: `Disease '${diseaseName}' not found in database.` }),
      });
    }
  });

  // 4. Literature Endpoint Mock
  await pageOrContext.route('**/api/literature*', async (route) => {
    const url = new URL(route.request().url());
    let query = url.searchParams.get('query');
    
    if (!query) {
      const parts = url.pathname.split('/');
      query = parts[parts.length - 1];
    }
    
    const decodedQuery = query ? decodeURIComponent(query).toUpperCase() : '';
    const litData = (literature as Record<string, any>)[decodedQuery];
    
    if (litData !== undefined && litData !== null) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(litData),
      });
    } else {
      if (decodedQuery === 'INVALID_GENE' || decodedQuery === 'INVALID_VARIANT' || decodedQuery === 'INVALID_DISEASE' || decodedQuery.includes('INVALID')) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: `Literature query for '${query}' returned no results.` }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: query || '',
            pubmed: [
              {
                pmid: "99887766",
                title: `Clinical Relevance of Alterations in ${query}`,
                authors: "BioMed Collab A, BioMed Collab B",
                journal: "Journal of Medical Research",
                pub_date: "2023-01-15",
                abstract: `This study outlines the therapeutic and clinical impacts of alterations in ${query} across diverse patient populations. We characterize regulatory mechanisms and potential targets.`,
                doi: `10.1234/jmr.2023.${(query || '').toLowerCase()}`
              }
            ],
            biorxiv: [],
            openalex: []
          }),
        });
      }
    }
  });

  // 5. PyMOL Rendering Mock
  await pageOrContext.route('**/api/pymol/render', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    
    try {
      if (fs.existsSync(MOCK_PNG_PATH)) {
        const pngBuffer = fs.readFileSync(MOCK_PNG_PATH);
        await route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: pngBuffer,
        });
      } else {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: "Mock PyMOL render image not found on disk." }),
        });
      }
    } catch (err: any) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: `Failed to load mock PyMOL image: ${err.message}` }),
      });
    }
  });
}
