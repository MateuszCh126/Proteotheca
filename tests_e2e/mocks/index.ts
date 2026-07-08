import { Page, BrowserContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Import JSON files
import genes from './data/genes.json';
import variants from './data/variants.json';
import diseases from './data/diseases.json';
import literature from './data/literature.json';

const MOCK_PNG_PATH = path.join(__dirname, 'assets', 'mock_pymol_render.png');

function getFallbackGene(symbol: string) {
  const symbolUpper = symbol.toUpperCase();
  return {
    symbol: symbolUpper,
    ensembl: {
      gene_id: `ENSG_${symbolUpper}_MOCK`,
      transcripts: [
        { transcript_id: `ENST_${symbolUpper}_MOCK1`, length: 2500 },
        { transcript_id: `ENST_${symbolUpper}_MOCK2`, length: 890 }
      ]
    },
    uniprot: {
      accession: `P_${symbolUpper}_MOCK`,
      name: `${symbolUpper}_HUMAN`,
      sequence: "MAALSGGGGGGAEPGQALFNGDMEPEAGAGAGAAASSAADPAIPEEVWNIKQMIKLTQEHIEALLDKFGGE"
    },
    opentargets: {
      target_id: `ENSG_${symbolUpper}_MOCK`,
      associations: [
        { disease_id: "EFO_0000616", disease_name: "Melanoma", score: 0.95 },
        { disease_id: "EFO_0000571", disease_name: "Lung Cancer", score: 0.92 }
      ]
    },
    alphafold: {
      uniprot_id: `P_${symbolUpper}_MOCK`,
      entryId: `AF-${symbolUpper}-F1`,
      pdbUrl: `https://alphafold.ebi.ac.uk/files/AF-${symbolUpper}-F1-model_v4.pdb`,
      plddt_summary: {
        very_high: 68.5,
        confident: 18.3,
        low: 8.2,
        very_low: 5.0
      }
    },
    hpa: {
      symbol: symbolUpper,
      expression: [
        { tissue: "Cerebellum", level: "Medium", reliability: "Approved" },
        { tissue: "Cortex", level: "High", reliability: "Approved" }
      ],
      localization: ["Cytoplasm", "Nucleus"]
    },
    interpro: {
      uniprot_id: `P_${symbolUpper}_MOCK`,
      domains: [
        { accession: "IPR001367", name: "Mock Domain", start: 457, end: 717 }
      ]
    },
    ncbi_seq: {
      accession: `NM_${symbolUpper}_MOCK`,
      fasta: `>NM_${symbolUpper}_MOCK Homo sapiens mock mRNA\nCGCCTCCCTTCCCCCTCCCCGCCCGACAGCGGCGGCGGCTCAGCGGCTCGGCTCTCGGGGGCGGCGGGCG`
    },
    quickgo: {
      uniprot_id: `P_${symbolUpper}_MOCK`,
      annotations: [
        { go_id: "GO:0007243", go_name: "protein intracellular signaling cascade", evidence_code: "IEA" }
      ]
    },
    reactome: {
      uniprot_id: `P_${symbolUpper}_MOCK`,
      pathways: [
        { dbId: 5673001, displayName: "Mock Pathway Cascade", stId: "R-HSA-5673001" }
      ]
    }
  };
}

function getFallbackVariant(variantId: string) {
  return {
    variant_id: variantId,
    clinvar: {
      pathogenicity: "Pathogenic",
      significance: "Somatic variation associated with drug response, cancer susceptibility",
      review_status: "criteria provided, single submitter"
    },
    gnomad: {
      allele_frequency: 0.0012,
      homozygote_count: 0,
      populations: [
        { pop: "European (Non-Finnish)", freq: 0.0021 },
        { pop: "African/African-American", freq: 0.0001 }
      ]
    },
    gtex: {
      eqtls: [
        { tissue: "Skin - Sun Exposed (Lower leg)", gene_symbol: "BRAF", p_value: 1.2e-8, nes: 0.45 }
      ]
    },
    alphagenome: {
      variant_id: variantId,
      predictions: [
        { biosample_name: "Skin - Sun Exposed (Lower leg)", output_type: "DNASE", quantile_score: 0.98, raw_score: 2.45 }
      ]
    },
    dbsnp: {
      rsid: variantId.startsWith("rs") ? variantId : "rs113488022",
      chromosome: "chr7",
      position: 140753336,
      ref: "A",
      alt: "T",
      gene: "BRAF"
    },
    ucsc: {
      coordinate: "chr7:140753336",
      phylop: 7.23,
      phastcons: 0.999,
      tfbs_overlaps: [
        { tf_name: "JUN", score: 850 }
      ]
    },
    unibind: {
      tf_name: "JUN",
      datasets: [
        { dataset_id: "ENCSR000EGM", species: "Homo sapiens", cell_line: "K562", count: 120 }
      ]
    },
    jaspar: {
      symbol: "JUN",
      profiles: [
        {
          matrix_id: "MA0488.1",
          name: "JUN",
          pfm: {
            A: [10, 20, 5, 80, 5, 5, 10],
            C: [20, 10, 80, 5, 5, 5, 20],
            G: [50, 60, 5, 5, 80, 80, 10],
            T: [20, 10, 10, 10, 10, 10, 60]
          }
        }
      ]
    }
  };
}

function getFallbackDisease(diseaseName: string) {
  return {
    disease_name: diseaseName,
    opentargets: {
      associated_genes: [
        { symbol: "BRAF", score: 0.95 },
        { symbol: "EGFR", score: 0.92 }
      ]
    },
    chembl: {
      active_compounds: [
        { chembl_id: "CHEMBL2103830", name: "DABRAFENIB", ic50_nm: 0.8 },
        { chembl_id: "CHEMBL28357", name: "GEFITINIB", ic50_nm: 3.2 }
      ]
    },
    clinical_trials: {
      trial_count: 142,
      trials: [
        { nct_id: "NCT01227889", title: `Study in patients with ${diseaseName}`, status: "COMPLETED" }
      ]
    },
    openfda: {
      active_substance: "DABRAFENIB",
      total_reports: 18520,
      events: [
        { term: "Pyrexia", count: 4210 },
        { term: "Fatigue", count: 3120 }
      ],
      sex_breakdown: [
        { name: "Male", value: 9850 },
        { name: "Female", value: 8430 },
        { name: "Unknown", value: 240 }
      ],
      age_breakdown: [
        { name: "18-44 years", value: 2450 },
        { name: "45-64 years", value: 7120 }
      ]
    },
    pubchem: {
      cid: 501254,
      name: "DABRAFENIB",
      formula: "C23H20F3N8O2S2",
      smiles: "CC(C)(C)c1nc(s1)-c2cc(cc(c2F)S(=O)(=O)Nc3c(F)cccc3F)n4cnc5c4cc(cn5)C",
      weight: 519.6
    },
    ols: {
      obo_id: "DOID:1909",
      label: diseaseName.toLowerCase(),
      description: [`Mock description for ${diseaseName}`],
      path: ["disease", diseaseName.toLowerCase()]
    },
    encode: {
      ccres: [
        { accession: "EH38E2777123", chrom: "chr7", start: 140753000, len: 350, pct: "pELS" }
      ]
    }
  };
}

export async function setupMocks(pageOrContext: Page | BrowserContext) {
  // 1. Gene Endpoint Mock
  await pageOrContext.route('**/api/genes/*', async (route) => {
    const url = route.request().url();
    const symbol = url.substring(url.lastIndexOf('/') + 1).toUpperCase();
    
    if (symbol === 'INVALID_GENE' || symbol.includes('INVALID') || symbol.length > 20 || /[^A-Z0-9-]/.test(symbol)) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: `Gene symbol "${symbol}" not found in database.` }),
      });
      return;
    }

    const staticGeneData = (genes as Record<string, any>)[symbol];
    const fallbackGene = getFallbackGene(symbol);
    const geneData = staticGeneData ? { ...fallbackGene, ...staticGeneData } : fallbackGene;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(geneData),
    });
  });

  // 2. Variant Endpoint Mock
  await pageOrContext.route('**/api/variants/*', async (route) => {
    const url = route.request().url();
    const rawVariantId = url.substring(url.lastIndexOf('/') + 1);
    const variantId = decodeURIComponent(rawVariantId);
    
    let cleanId = variantId.strip ? variantId.strip() : variantId.trim();
    
    // Map coordinate to rsID if needed
    if (cleanId === '7-140753336-T-A') {
      cleanId = 'rs113488022';
    }

    const isRsid = /^rs\d+$/i.test(cleanId);
    const isCoord = /^(?:chr)?(\d+|X|Y)[:\-_](\d+)[:\-_]([ACGT\-]+)[:\-_]([ACGT\-]+)$/i.test(cleanId);
    const isAnyCoord = /^(?:chr)?(\d+|[a-zA-Z]+)[:\-_](\d+)[:\-_]([a-zA-Z\-]+)[:\-_]([a-zA-Z\-]+)$/i.test(cleanId);
    
    if (cleanId.includes('INVALID') || cleanId.toLowerCase() === 'rsinvalid') {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: "Invalid variant_id format. Must be rsID or coordinates." }),
      });
      return;
    }
    
    if (!isRsid && !isCoord && !isAnyCoord) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: "Invalid variant_id format. Must be rsID or coordinates." }),
      });
      return;
    }
    
    // Check for invalid chromosome/alleles in coordinates
    if (isAnyCoord && !isCoord) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: `Variant '${variantId}' not found in database.` }),
      });
      return;
    }

    // Check invalid chromosome number
    if (isCoord) {
      const match = cleanId.match(/^(?:chr)?(\d+|X|Y)/i);
      if (match) {
        const chrom = match[1].toUpperCase();
        const num = parseInt(chrom);
        if (!isNaN(num) && (num < 1 || num > 22)) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ detail: `Variant '${variantId}' not found in database.` }),
          });
          return;
        }
      }
    }

    const staticVariantData = (variants as Record<string, any>)[cleanId];
    const fallbackVariant = getFallbackVariant(cleanId);
    const variantData = staticVariantData ? { ...fallbackVariant, ...staticVariantData } : fallbackVariant;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(variantData),
    });
  });

  // 3. Disease Endpoint Mock
  await pageOrContext.route('**/api/diseases/*', async (route) => {
    const url = route.request().url();
    const rawDisease = url.substring(url.lastIndexOf('/') + 1);
    const diseaseName = decodeURIComponent(rawDisease);
    
    const isInvalid = diseaseName.toUpperCase().includes('INVALID') || /\d/.test(diseaseName) || diseaseName.includes('#') || diseaseName.includes('$');
    if (isInvalid) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: `Disease '${diseaseName}' not found in database.` }),
      });
      return;
    }

    // Perform case-insensitive match for keys
    const matchKey = Object.keys(diseases).find(
      key => key.toLowerCase() === diseaseName.toLowerCase()
    );
    
    const staticDiseaseData = matchKey ? (diseases as Record<string, any>)[matchKey] : null;
    const fallbackDisease = getFallbackDisease(diseaseName);
    const diseaseData = staticDiseaseData ? { ...fallbackDisease, ...staticDiseaseData } : fallbackDisease;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(diseaseData),
    });
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

  // 6. External PDB downloads (RCSB PDB)
  await pageOrContext.route(/.*files\.rcsb\.org.*/, async (route) => {
    const mockPdb = `HEADER    TEST PROTEIN
ATOM      1  N   ALA A   1      11.104   6.131  -1.004  1.00 20.00           N
ATOM      2  CA  ALA A   1      11.639   6.071   0.371  1.00 20.00           C
ATOM      3  C   ALA A   1      10.793   5.048   1.127  1.00 20.00           C
ATOM      4  O   ALA A   1      10.835   4.962   2.355  1.00 20.00           O
ATOM      5  CB  ALA A   1      11.665   7.458   0.988  1.00 20.00           C
TER
END`;
    await route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: mockPdb,
    });
  });

  // 7. External AlphaFold downloads (EBI AlphaFold DB)
  await pageOrContext.route(/.*alphafold\.ebi\.ac\.uk.*/, async (route) => {
    const mockPdb = `HEADER    TEST PROTEIN
ATOM      1  N   ALA A   1      11.104   6.131  -1.004  1.00 20.00           N
ATOM      2  CA  ALA A   1      11.639   6.071   0.371  1.00 20.00           C
ATOM      3  C   ALA A   1      10.793   5.048   1.127  1.00 20.00           C
ATOM      4  O   ALA A   1      10.835   4.962   2.355  1.00 20.00           O
ATOM      5  CB  ALA A   1      11.665   7.458   0.988  1.00 20.00           C
TER
END`;
    await route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: mockPdb,
    });
  });

  // 8. External NCBI E-utilities
  await pageOrContext.route(/.*ncbi\.nlm\.nih\.gov.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ esearchresult: { idlist: ["12345"] } }),
    });
  });

  // 9. External Ensembl REST
  await pageOrContext.route(/.*rest\.ensembl\.org.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ mappings: [{ assembly_name: "GRCh38", seq_region_name: "7", start: 140753336, allele_string: "T/A" }] }),
    });
  });

  // 10. Authentication Endpoints Mock
  let currentUser: any = null;

  await pageOrContext.route('**/api/auth/me', async (route) => {
    if (currentUser) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentUser),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: "Not authenticated" }),
      });
    }
  });

  await pageOrContext.route('**/api/auth/login', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const body = JSON.parse(route.request().postData() || '{}');
    currentUser = {
      id: "mock-user-123",
      email: body.email || "test@biomed.org",
      first_name: "Test",
      last_name: "Researcher",
      role: "researcher",
      created_at: "2023-01-01T00:00:00Z",
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: currentUser }),
    });
  });

  await pageOrContext.route('**/api/auth/register', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const body = JSON.parse(route.request().postData() || '{}');
    currentUser = {
      id: "mock-user-123",
      email: body.email || "test@biomed.org",
      first_name: body.first_name || "Test",
      last_name: body.last_name || "Researcher",
      role: "researcher",
      created_at: "2023-01-01T00:00:00Z",
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: currentUser }),
    });
  });

  await pageOrContext.route('**/api/auth/logout', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    currentUser = null;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: "Logged out successfully" }),
    });
  });

  // 11. Projects Endpoints Mock
  const savedProjects: any[] = [];

  await pageOrContext.route('**/api/projects', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(savedProjects),
      });
    } else if (method === 'POST') {
      const payload = JSON.parse(route.request().postData() || '{}');
      const newProject = {
        id: `mock-project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: payload.title || "Untitled Project",
        description: payload.description || null,
        entity_type: payload.entity_type || "mixed",
        query: payload.query || "",
        tags: payload.tags || [],
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        latest_snapshot: payload.state ? {
          id: `mock-snapshot-${Date.now()}`,
          project_id: `mock-project-${Date.now()}`,
          name: payload.title || null,
          state: payload.state,
          created_at: new Date().toISOString(),
        } : null,
      };
      savedProjects.push(newProject);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(newProject),
      });
    } else {
      await route.fallback();
    }
  });

  await pageOrContext.route(/\/api\/projects\/.*/, async (route) => {
    const url = route.request().url();
    const projectId = url.substring(url.lastIndexOf('/') + 1);
    const method = route.request().method();

    if (method === 'GET') {
      const project = savedProjects.find(p => p.id === projectId);
      if (project) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(project),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: "Project not found" }),
        });
      }
    } else if (method === 'DELETE') {
      const projectIndex = savedProjects.findIndex(p => p.id === projectId);
      if (projectIndex !== -1) {
        savedProjects.splice(projectIndex, 1);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: "Project archived" }),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: "Project not found" }),
        });
      }
    } else {
      await route.fallback();
    }
  });
}
