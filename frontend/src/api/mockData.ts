import { GeneData } from '../types/gene';
import { VariantData } from '../types/variant';
import { DiseaseData } from '../types/disease';
import { LiteratureData } from '../types/literature';

// ==========================================
// MOCK GENE DATA
// ==========================================
export const mockGenes: Record<string, GeneData> = {
  BRAF: {
    symbol: "BRAF",
    ensembl: {
      gene_id: "ENSG00000157764",
      transcripts: [
        { transcript_id: "ENST00000644969", length: 2500 },
        { transcript_id: "ENST00000496384", length: 890 },
        { transcript_id: "ENST00000399343", length: 2433 }
      ]
    },
    uniprot: {
      accession: "P15056",
      name: "BRAF_HUMAN",
      sequence: "MAALSGGGGGGAEPGQALFNGDMEPEAGAGAGAAASSAADPAIPEEVWNIKQMIKLTQEHIEALLDKFGGEHNPPSIYLDAYEEYTSKLDALQQREQQLLESLGNGTDFSVSSSASMDTVTSSSSSSLSVLPSSLSVFQNPTDVARSNPKSPQKPIVRVFLPNKQRTVVPARCGVTVRDSLKKALMMRGLIPECCAVYRIQDGEKKPIGWDTDISWLTGEELHVEVLENVPLTTHNFVRKTFFTLAFCDFCRKLLFQGFRCQTCGYKFHQRCSTEVPLMCVNYDQLDLLFVSKFFEHHPIPQEEASLAETALTSGSSPSAPASDSIGPQILTSPSPSKSIPIPQPFRPADEDHRNQFGQRDRSSSAPNVHINTIEPVNIDDLIRDQGFRGDGGSTTGLSATPPASLPGSLTNVKALQKSPGPQRERKSSSSSEdrnrmktlgrrdssddweipdgqitvgqrigsgsfgtvykgkwhgdvavkmlnvtaptpqqlqafknevgvlrktrhvnillfmgystkpqlaivtwcegsslyhhlhiietkfemiklidiarqtaqgmdylhaksiihrdlksnniflhedltvkigdfglatvksrwsgshqfeqlsgsilwmapevirmqdknpysfqsdvyafgivlyelmtgqlpysninnrdqiifmvgrgylspdlskvrsncpkamkrlmaeclkkkrderplfpqilasieLLARSLaKIHRSASEPSLNTAGFQTEDFSLYACASPKTPIQAGGYGAFPVH"
    },
    opentargets: {
      target_id: "ENSG00000157764",
      associations: [
        { disease_id: "EFO_0000616", disease_name: "Melanoma", score: 0.95 },
        { disease_id: "EFO_0000311", disease_name: "Colorectal Cancer", score: 0.82 },
        { disease_id: "EFO_0000305", disease_name: "Thyroid Carcinoma", score: 0.78 }
      ]
    },
    alphafold: {
      uniprot_id: "P15056",
      entryId: "AF-P15056-F1",
      pdbUrl: "https://alphafold.ebi.ac.uk/files/AF-P15056-F1-model_v4.pdb",
      plddt_summary: {
        very_high: 68.5,
        confident: 18.3,
        low: 8.2,
        very_low: 5.0
      }
    },
    hpa: {
      symbol: "BRAF",
      expression: [
        { tissue: "Cerebellum", level: "Medium", reliability: "Approved" },
        { tissue: "Cortex", level: "High", reliability: "Approved" },
        { tissue: "Testis", level: "High", reliability: "Supported" }
      ],
      localization: ["Cytoplasm", "Nucleus"]
    },
    interpro: {
      uniprot_id: "P15056",
      domains: [
        { accession: "IPR001367", name: "Protein kinase domain", start: 457, end: 717 },
        { accession: "IPR000980", name: "Serine/threonine-protein kinase, active site", start: 574, end: 586 }
      ]
    },
    ncbi_seq: {
      accession: "NM_004333.6",
      fasta: `>NM_004333.6 Homo sapiens B-Raf proto-oncogene, serine/threonine kinase (BRAF), mRNA
CGCCTCCCTTCCCCCTCCCCGCCCGACAGCGGCGGCGGCTCAGCGGCTCGGCTCTCGGGGGCGGCGGGCG
GCGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGG
GGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCG
GGCGGCTGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGC`
    },
    quickgo: {
      uniprot_id: "P15056",
      annotations: [
        { go_id: "GO:0004702", go_name: "MAP kinase kinase kinase activity", evidence_code: "IDA" },
        { go_id: "GO:0007243", go_name: "protein intracellular signaling cascade", evidence_code: "IEA" }
      ]
    },
    reactome: {
      uniprot_id: "P15056",
      pathways: [
        { dbId: 5673001, displayName: "RAF/MAP kinase cascade", stId: "R-HSA-5673001" },
        { dbId: 1989781, displayName: "Signaling by BRAF", stId: "R-HSA-1989781" }
      ]
    }
  },
  EGFR: {
    symbol: "EGFR",
    ensembl: {
      gene_id: "ENSG00000146648",
      transcripts: [
        { transcript_id: "ENST00000275493", length: 3816 },
        { transcript_id: "ENST00000455084", length: 1210 }
      ]
    },
    uniprot: {
      accession: "P00533",
      name: "EGFR_HUMAN",
      sequence: "MRPSGTAGAALLALLAALCPASRALEEKKVCQGTSNKLTQLGTFEDHFLSLQRMFNNCEVVLGNLEITYVQRNYDLSFLKTIQEVAGYVLIALNTVERIPLENLQIIRGNMYYENSYALAVLSNYDANKTGLKELPMRNLQEILHGAVRFSNNPALCNVESIQWRDIVSSDFLSMSMDFQNHLGSCQKCDPSCPNGSCWGAGEENCQKLTKIICAQQCSGRCRGKSPSDCCHNQCAAGCTGPRESDCLVCRKFRDEATCKDTCPPLMLYNPTTYQMDVNPEGKYSFGATCVKKCPRNYVVTDHGSCVRACGADSYEMEEDGVRKCKKCEGPCRKVCNGIGIGEFKDSLSINATNIKHFKNCTSISGDLHILPVAFRGDSFTHTPPLDPQELDILKTVKEITGFLLIQAWPENRTDLHAFENLEIIRGRTKQHGQFSLAVVSLNITSLGLRSLKEISDGDVIISGNKNLCYANTINWKKLFGTSGQKTKIISNRGENSCKATGQVCHALCSPEGCWGPEPRDCVSCRNVSRGRECVDKCNLLEGEPREFVENSECIQCHPECLPQAMNITCTGRGPDNCIQCAHYIDGPHCVKTCPAGVMGENNTLVWKYADAGHVCHLCHPNCTYGCTGPGLEGCPTNGPKIPSIATGMVGALLLLLVVALGIGLFMRRRHIVRKRTLRRLLQERELVEPLTPSGEAPNQALLRILKETEFKKIKVLGSGAFGTVYKGLWIPEGEKVKIPVAIKELREATSPKANKEILDEAYVMASVDNPHVCRLLGICLTSTVQLITQLMPFGCLLDYVREHKDNIGSQYLLNWCVQIAKGMNYLEDRRLVHRDLAARNVLVKTPQHVKITDFGLAKLLGAEEKEYHAEGGKVPIKWMALESILHRIYTHQSDVWSYGVTVWELMTFGSKPYDGIPASEISSILEKGERLPQPPICTIDVYMIMVKCWMIDADSRPKFRELIIEFSKMARDPQRYLVIQGDERMHLPSPTDSNFYRALMDEEDMDDVVDADEYLIPQQGFFSSPSTSRTPLLSSLSATSNNSTVACIDRNGLQSCPIKEDSFLQRYSSSDPTGALTEDSIDDTFLPVPEYINQSVPKRPAGSVQNPVYHNQPLNPAPSRDPHYQDPHSTAVGNPEYLNTVQPTCVNSTFDSPAHWAQKGSHQISLDNPDYQQDFFPKEAKPNGIFKGSTAENAEYLRVAPQSSEFIGA"
    },
    opentargets: {
      target_id: "ENSG00000146648",
      associations: [
        { disease_id: "EFO_0000571", disease_name: "Lung Cancer", score: 0.92 },
        { disease_id: "EFO_0000311", disease_name: "Colorectal Cancer", score: 0.76 },
        { disease_id: "EFO_0000174", disease_name: "Glioblastoma Multiforme", score: 0.88 }
      ]
    },
    alphafold: {
      uniprot_id: "P00533",
      entryId: "AF-P00533-F1",
      pdbUrl: "https://alphafold.ebi.ac.uk/files/AF-P00533-F1-model_v4.pdb",
      plddt_summary: {
        very_high: 80.2,
        confident: 12.1,
        low: 5.4,
        very_low: 2.3
      }
    },
    hpa: {
      symbol: "EGFR",
      expression: [
        { tissue: "Cortex", level: "Medium", reliability: "Approved" },
        { tissue: "Placenta", level: "High", reliability: "Approved" }
      ],
      localization: ["Plasma membrane", "Cytoplasm"]
    },
    interpro: {
      uniprot_id: "P00533",
      domains: [
        { accession: "IPR001367", name: "Protein kinase domain", start: 712, end: 968 },
        { accession: "IPR003103", name: "Receptor L-domain", start: 57, end: 168 }
      ]
    },
    ncbi_seq: {
      accession: "NM_005228.5",
      fasta: `>NM_005228.5 Homo sapiens epidermal growth factor receptor (EGFR), transcript variant 1, mRNA
CCCCGGCGCAGCGCGGCCGCAGCAGCCTCCGCCCCCCGCACGGCGTGAGCGGGGCGTGACCGAGGGCGCG
CGCGGCGCGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGG
GGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCG
GGCGGCTGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGGCGGGGC`
    },
    quickgo: {
      uniprot_id: "P00533",
      annotations: [
        { go_id: "GO:0004714", go_name: "transmembrane receptor protein tyrosine kinase activity", evidence_code: "IDA" },
        { go_id: "GO:0007173", go_name: "epidermal growth factor receptor signaling pathway", evidence_code: "IMP" }
      ]
    },
    reactome: {
      uniprot_id: "P00533",
      pathways: [
        { dbId: 177929, displayName: "Signaling by EGFR", stId: "R-HSA-177929" },
        { dbId: 1250296, displayName: "SHC1 events in EGFR signaling", stId: "R-HSA-1250296" }
      ]
    }
  },
  TP53: {
    symbol: "TP53",
    ensembl: {
      gene_id: "ENSG00000141510",
      transcripts: [
        { transcript_id: "ENST00000269305", length: 2588 },
        { transcript_id: "ENST00000445888", length: 1450 }
      ]
    },
    uniprot: {
      accession: "P04637",
      name: "P53_HUMAN",
      sequence: "MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYQGSYGFRLGFLHSGTAKSVTCTYSPALNKMFCQLAKTCPVQLWVDSTPPPGTRVRAMAIYKQSQHMTEVVRRCPHHERCSDSDGLAPPQHLIRVEGNLRVEYLDDRNTFRHSVVVPYEPPEVGSDCTTIHYNYMCNSSCMGGMNRRPILTIITLEDSSGNLLGRNSFEVRVCACPGRDRRTEEENLRKKGEPHHELPPGSTKRALPNNTSSSPQPKKKPLDGEYFTLKIRGRERFEMFRELNEALELKDAQAGKEPGGSRAHSSHLKSKKGQSTSRHKKLMFKTEGPDSD"
    },
    opentargets: {
      target_id: "ENSG00000141510",
      associations: [
        { disease_id: "EFO_0000311", disease_name: "Colorectal Cancer", score: 0.85 },
        { disease_id: "EFO_0000571", disease_name: "Lung Cancer", score: 0.79 },
        { disease_id: "EFO_0000305", disease_name: "Thyroid Carcinoma", score: 0.61 }
      ]
    },
    alphafold: {
      uniprot_id: "P04637",
      entryId: "AF-P04637-F1",
      pdbUrl: "https://alphafold.ebi.ac.uk/files/AF-P04637-F1-model_v4.pdb",
      plddt_summary: {
        very_high: 42.1,
        confident: 25.4,
        low: 18.2,
        very_low: 14.3
      }
    },
    hpa: {
      symbol: "TP53",
      expression: [
        { tissue: "Lymph node", level: "High", reliability: "Approved" },
        { tissue: "Spleen", level: "High", reliability: "Approved" }
      ],
      localization: ["Nucleus"]
    },
    interpro: {
      uniprot_id: "P04637",
      domains: [
        { accession: "IPR002117", name: "p53 DNA-binding domain", start: 95, end: 289 },
        { accession: "IPR008967", name: "p53 tetramerisation domain", start: 325, end: 356 }
      ]
    },
    ncbi_seq: {
      accession: "NM_000546.6",
      fasta: `>NM_000546.6 Homo sapiens tumor protein p53 (TP53), transcript variant 1, mRNA
GATGGGATTGGGGTTTTCCCCTCCCATGTGCTCAAGACTGGCGCTAAAAGTATGGCCATCGTGGGCTTTG
TAAATATAAATATGTAAATATGGTTTTACCATGGTTTTACCATGGTTTTACCATGGTTTTACCATGGTTT
TACCATGGTTTTACCATGGTTTTACCATGGTTTTACCATGGTTTTACCATGGTTTTACCATGGTTTTACC
ATGGTTTTACCATGGTTTTACCATGGTTTTACCATGGTTTTACCATGGTTTTACCATGGTTTTACCATGG`
    },
    quickgo: {
      uniprot_id: "P04637",
      annotations: [
        { go_id: "GO:0003700", go_name: "DNA-binding transcription factor activity", evidence_code: "IDA" },
        { go_id: "GO:0006915", go_name: "apoptotic process", evidence_code: "IMP" }
      ]
    },
    reactome: {
      uniprot_id: "P04637",
      pathways: [
        { dbId: 5633007, displayName: "Regulation of TP53 Activity", stId: "R-HSA-5633007" },
        { dbId: 111471, displayName: "Transcription of cell cycle genes by p53", stId: "R-HSA-111471" }
      ]
    }
  }
};

// ==========================================
// MOCK VARIANT DATA
// ==========================================
export const mockVariants: Record<string, VariantData> = {
  rs113488022: {
    variant_id: "rs113488022",
    clinvar: {
      pathogenicity: "Pathogenic",
      significance: "Somatic variation associated with Vemurafenib/Dabrafenib response, cancer susceptibility",
      review_status: "criteria provided, single submitter"
    },
    gnomad: {
      allele_frequency: 0.0012,
      homozygote_count: 0,
      populations: [
        { pop: "European (Non-Finnish)", freq: 0.0021 },
        { pop: "African/African-American", freq: 0.0001 },
        { pop: "East Asian", freq: 0.0003 },
        { pop: "Latino/Admixed American", freq: 0.0008 },
        { pop: "South Asian", freq: 0.0002 },
        { pop: "Ashkenazi Jewish", freq: 0.0005 }
      ]
    },
    gtex: {
      eqtls: [
        { tissue: "Skin - Sun Exposed (Lower leg)", gene_symbol: "BRAF", p_value: 1.2e-8, nes: 0.45 },
        { tissue: "Skin - Not Sun Exposed (Suprapubic)", gene_symbol: "BRAF", p_value: 3.4e-7, nes: 0.38 },
        { tissue: "Thyroid", gene_symbol: "BRAF", p_value: 1.5e-5, nes: 0.22 },
        { tissue: "Whole Blood", gene_symbol: "BRAF", p_value: 0.12, nes: 0.05 },
        { tissue: "Muscle - Skeletal", gene_symbol: "BRAF", p_value: 0.45, nes: -0.02 },
        { tissue: "Colon - Transverse", gene_symbol: "BRAF", p_value: 0.004, nes: -0.18 }
      ]
    },
    alphagenome: {
      variant_id: "rs113488022",
      predictions: [
        { biosample_name: "Skin - Sun Exposed (Lower leg)", output_type: "DNASE", quantile_score: 0.98, raw_score: 2.45 },
        { biosample_name: "Melanoma cell line", output_type: "H3K27ac", quantile_score: 0.94, raw_score: 1.88 }
      ]
    },
    dbsnp: {
      rsid: "rs113488022",
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
        { tf_name: "JUN", score: 850 },
        { tf_name: "FOS", score: 620 }
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
  },
  rs121434568: {
    variant_id: "rs121434568",
    clinvar: {
      pathogenicity: "Pathogenic",
      significance: "Somatic variant conferring EGFR L858R mutation; drives tyrosine kinase inhibitor sensitivity",
      review_status: "criteria provided, multiple submitters, no conflicts"
    },
    gnomad: {
      allele_frequency: 0.0008,
      homozygote_count: 0,
      populations: [
        { pop: "European (Non-Finnish)", freq: 0.0002 },
        { pop: "African/African-American", freq: 0.00005 },
        { pop: "East Asian", freq: 0.0035 },
        { pop: "Latino/Admixed American", freq: 0.0006 }
      ]
    },
    gtex: {
      eqtls: [
        { tissue: "Lung", gene_symbol: "EGFR", p_value: 4.5e-11, nes: 0.58 },
        { tissue: "Whole Blood", gene_symbol: "EGFR", p_value: 0.35, nes: 0.01 },
        { tissue: "Esophagus - Mucosa", gene_symbol: "EGFR", p_value: 2.1e-6, nes: 0.33 },
        { tissue: "Colon - Sigmoid", gene_symbol: "EGFR", p_value: 1.2e-3, nes: -0.21 }
      ]
    },
    alphagenome: {
      variant_id: "rs121434568",
      predictions: [
        { biosample_name: "Lung tissue", output_type: "DNASE", quantile_score: 0.99, raw_score: 3.12 },
        { biosample_name: "Lung adenocarcinoma", output_type: "H3K4me3", quantile_score: 0.97, raw_score: 2.85 }
      ]
    },
    dbsnp: {
      rsid: "rs121434568",
      chromosome: "chr7",
      position: 55191822,
      ref: "T",
      alt: "G",
      gene: "EGFR"
    },
    ucsc: {
      coordinate: "chr7:55191822",
      phylop: 6.45,
      phastcons: 0.995,
      tfbs_overlaps: [
        { tf_name: "E2F1", score: 780 },
        { tf_name: "MYC", score: 540 }
      ]
    },
    unibind: {
      tf_name: "E2F1",
      datasets: [
        { dataset_id: "ENCSR000EHU", species: "Homo sapiens", cell_line: "HeLa-S3", count: 95 }
      ]
    },
    jaspar: {
      symbol: "E2F1",
      profiles: [
        {
          matrix_id: "MA0024.1",
          name: "E2F1",
          pfm: {
            A: [5, 10, 50, 80, 5, 20, 10],
            C: [80, 80, 5, 5, 90, 10, 20],
            G: [5, 5, 40, 5, 0, 60, 60],
            T: [10, 5, 5, 10, 5, 10, 10]
          }
        }
      ]
    }
  }
};

// ==========================================
// MOCK DISEASE DATA
// ==========================================
export const mockDiseases: Record<string, DiseaseData> = {
  Melanoma: {
    disease_name: "Melanoma",
    opentargets: {
      associated_genes: [
        { symbol: "BRAF", score: 0.95 },
        { symbol: "NRAS", score: 0.88 },
        { symbol: "CDKN2A", score: 0.81 },
        { symbol: "KIT", score: 0.65 }
      ]
    },
    chembl: {
      active_compounds: [
        { chembl_id: "CHEMBL2103830", name: "DABRAFENIB", ic50_nm: 0.8 },
        { chembl_id: "CHEMBL1229594", name: "VEMURAFENIB", ic50_nm: 1.2 },
        { chembl_id: "CHEMBL2107827", name: "TRAMETINIB", ic50_nm: 0.92 },
        { chembl_id: "CHEMBL3545062", name: "COBIMETINIB", ic50_nm: 4.5 },
        { chembl_id: "CHEMBL4297123", name: "ENCORAFENIB", ic50_nm: 0.35 }
      ]
    },
    clinical_trials: {
      trial_count: 142,
      trials: [
        { nct_id: "NCT01227889", title: "Study of Dabrafenib in Patients With BRAF Mutation-Positive Melanoma", status: "COMPLETED" },
        { nct_id: "NCT02224781", title: "Dabrafenib Plus Trametinib in BRAF V600 mutant Melanoma Brain Metastases", status: "COMPLETED" },
        { nct_id: "NCT04516395", title: "A Study of Pembrolizumab with Dabrafenib and Trametinib in Advanced Melanoma", status: "RECRUITING" },
        { nct_id: "NCT03820986", title: "Encorafenib and Binimetinib in Patients With BRAF V600E Mutant Melanoma", status: "ACTIVE_NOT_RECRUITING" },
        { nct_id: "NCT05001243", title: "A Trial of Adjuvant Targeted Therapy in BRAF-mutant Stage II Melanoma", status: "RECRUITING" }
      ]
    },
    openfda: {
      active_substance: "DABRAFENIB",
      total_reports: 18520,
      events: [
        { term: "Pyrexia", count: 4210 },
        { term: "Fatigue", count: 3120 },
        { term: "Hyperkeratosis", count: 2850 },
        { term: "Headache", count: 2450 },
        { term: "Nausea", count: 2100 },
        { term: "Diarrhoea", count: 1850 },
        { term: "Arthralgia", count: 1750 },
        { term: "Alopecia", count: 1420 },
        { term: "Rash", count: 1200 },
        { term: "Papilloma skin", count: 880 }
      ],
      sex_breakdown: [
        { name: "Male", value: 9850 },
        { name: "Female", value: 8430 },
        { name: "Unknown", value: 240 }
      ],
      age_breakdown: [
        { name: "18-44 years", value: 2450 },
        { name: "45-64 years", value: 7120 },
        { name: "65-74 years", value: 5850 },
        { name: "75+ years", value: 3100 }
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
      label: "melanoma",
      description: ["A hyperplastic disease characterized by a malignant tumor originating from melanocytes."],
      path: ["disease", "neoplasm", "cancer", "skin cancer", "melanoma"]
    },
    encode: {
      ccres: [
        { accession: "EH38E2777123", chrom: "chr7", start: 140753000, len: 350, pct: "pELS" }
      ]
    }
  },
  "Lung Cancer": {
    disease_name: "Lung Cancer",
    opentargets: {
      associated_genes: [
        { symbol: "EGFR", score: 0.92 },
        { symbol: "KRAS", score: 0.87 },
        { symbol: "ALK", score: 0.84 },
        { symbol: "TP53", score: 0.79 }
      ]
    },
    chembl: {
      active_compounds: [
        { chembl_id: "CHEMBL28357", name: "GEFITINIB", ic50_nm: 3.2 },
        { chembl_id: "CHEMBL1489", name: "ERLOTINIB", ic50_nm: 2.1 },
        { chembl_id: "CHEMBL3137343", name: "OSIMERTINIB", ic50_nm: 0.6 },
        { chembl_id: "CHEMBL3813872", name: "ALECTINIB", ic50_nm: 1.8 }
      ]
    },
    clinical_trials: {
      trial_count: 285,
      trials: [
        { nct_id: "NCT02296138", title: "Osimertinib Versus Gefitinib/Erlotinib in EGFR Mutation-Positive Lung Cancer", status: "COMPLETED" },
        { nct_id: "NCT03521154", title: "Study of Osimertinib in EGFR-Mutant Non-Small Cell Lung Cancer", status: "ACTIVE_NOT_RECRUITING" },
        { nct_id: "NCT04762459", title: "Combination EGFR Inhibitors in Metastasized Lung Adenocarcinoma", status: "RECRUITING" }
      ]
    },
    openfda: {
      active_substance: "OSIMERTINIB",
      total_reports: 12450,
      events: [
        { term: "Diarrhoea", count: 3510 },
        { term: "Dry skin", count: 2890 },
        { term: "Nail toxicity", count: 2450 },
        { term: "Rash", count: 2120 },
        { term: "Fatigue", count: 1850 },
        { term: "Cough", count: 1450 },
        { term: "Stomatitis", count: 1300 },
        { term: "Pruritus", count: 1100 },
        { term: "Paronychia", count: 980 },
        { term: "Interstit. lung disease", count: 320 }
      ],
      sex_breakdown: [
        { name: "Female", value: 7120 },
        { name: "Male", value: 5100 },
        { name: "Unknown", value: 230 }
      ],
      age_breakdown: [
        { name: "18-44 years", value: 1200 },
        { name: "45-64 years", value: 4320 },
        { name: "65-74 years", value: 4850 },
        { name: "75+ years", value: 2080 }
      ]
    },
    pubchem: {
      cid: 71496896,
      name: "OSIMERTINIB",
      formula: "C28H33N7O2",
      smiles: "CN1CCN(CC1)C2=CC(=C(C=C2)NC3=NC=CC(=N3)C4=CN(C5=CC=CC=C54)C)NC(=O)C=C",
      weight: 499.6
    },
    ols: {
      obo_id: "DOID:1324",
      label: "lung cancer",
      description: ["An organ system cancer that starts in the lungs and is characterized by uncontrolled cell growth."],
      path: ["disease", "neoplasm", "cancer", "thoracic cancer", "lung cancer"]
    },
    encode: {
      ccres: [
        { accession: "EH38E2777124", chrom: "chr7", start: 55191000, len: 400, pct: "PLS" }
      ]
    }
  },
  "Colorectal Cancer": {
    disease_name: "Colorectal Cancer",
    opentargets: {
      associated_genes: [
        { symbol: "TP53", score: 0.85 },
        { symbol: "KRAS", score: 0.81 },
        { symbol: "BRAF", score: 0.82 },
        { symbol: "APC", score: 0.94 }
      ]
    },
    chembl: {
      active_compounds: [
        { chembl_id: "CHEMBL1201584", name: "CETUXIMAB", ic50_nm: 12.0 },
        { chembl_id: "CHEMBL1201831", name: "PANITUMUMAB", ic50_nm: 15.4 },
        { chembl_id: "CHEMBL1743082", name: "REGORAFENIB", ic50_nm: 25.0 }
      ]
    },
    clinical_trials: {
      trial_count: 198,
      trials: [
        { nct_id: "NCT01538303", title: "Cetuximab Plus Chemotherapy in KRAS Wild-Type Colorectal Cancer", status: "COMPLETED" },
        { nct_id: "NCT03115996", title: "Encorafenib and Cetuximab in BRAF V600E Colorectal Cancer", status: "RECRUITING" }
      ]
    },
    openfda: {
      active_substance: "CETUXIMAB",
      total_reports: 14120,
      events: [
        { term: "Acneiform dermatitis", count: 4120 },
        { term: "Fatigue", count: 2890 },
        { term: "Diarrhoea", count: 2150 },
        { term: "Hypomagnesemia", count: 1850 },
        { term: "Nausea", count: 1720 },
        { term: "Infusion reaction", count: 1200 },
        { term: "Dyspnoea", count: 1100 },
        { term: "Rash", count: 950 }
      ],
      sex_breakdown: [
        { name: "Male", value: 7850 },
        { name: "Female", value: 6120 },
        { name: "Unknown", value: 150 }
      ],
      age_breakdown: [
        { name: "18-44 years", value: 1350 },
        { name: "45-64 years", value: 5890 },
        { name: "65-74 years", value: 4950 },
        { name: "75+ years", value: 1930 }
      ]
    },
    pubchem: {
      cid: 118704207,
      name: "REGORAFENIB",
      formula: "C21H15ClF4N4O3",
      smiles: "CNC(=O)C1=NC=CC(=C1)OC2=CC(=C(C=C2)NC(=O)NC3=CC(=C(C=C3F)Cl)C(F)(F)F)F",
      weight: 482.8
    },
    ols: {
      obo_id: "DOID:9256",
      label: "colorectal cancer",
      description: ["A colorectal neoplasm characterized by a malignant tumor in the colon or rectum."],
      path: ["disease", "neoplasm", "cancer", "gastrointestinal cancer", "colorectal cancer"]
    },
    encode: {
      ccres: [
        { accession: "EH38E2777125", chrom: "chr17", start: 7673000, len: 280, pct: "dELS" }
      ]
    }
  }
};

// ==========================================
// MOCK LITERATURE DATA
// ==========================================
export const mockLiterature: Record<string, LiteratureData> = {
  BRAF: {
    query: "BRAF",
    pubmed: [
      {
        pmid: "31234567",
        title: "Mechanisms of Resistance to BRAF Inhibitors in Melanoma",
        authors: "Smith J, Doe A, Patel M",
        journal: "Nature Reviews Cancer",
        pub_date: "2020-05-12",
        abstract: "In patients with BRAF V600 mutations, resistance to targeted BRAF inhibitors occurs frequently via reactivating the MAPK pathway. We explore genomic alterations and feedback loops that limit overall clinical efficacy. Combining BRAF and MEK inhibitors delays but does not eliminate resistance.",
        doi: "10.1038/nrc.2020.12"
      },
      {
        pmid: "32456789",
        title: "Targeted Therapy in BRAF-Mutant Colorectal Cancer",
        authors: "Kopp W, Vande W, Taylor S",
        journal: "Journal of Clinical Oncology",
        pub_date: "2021-08-25",
        abstract: "Colorectal cancers harboring the BRAF V600E mutation display high resistance to standard EGFR and BRAF monotherapies. We evaluate triple combinations blocking BRAF, EGFR, and MEK, demonstrating improved progression-free survival over standard chemotherapy.",
        doi: "10.1200/JCO.2021.39.4568"
      }
    ],
    biorxiv: [
      {
        doi: "10.1101/2021.01.01.123456",
        title: "Single-cell Transcriptomics Reveals Adaptive Rewiring Under BRAF Inhibition",
        authors: "Johnson R, Lee K, Zhao X",
        pub_date: "2021-01-02",
        abstract: "Applying single-cell RNA sequencing to BRAF-mutated melanoma cells under Vemurafenib treatment demonstrates rapid upregulation of neural crest stem cell markers. This transcriptionally plastic population drives transient drug tolerance before genetic resistance emerges."
      }
    ],
    openalex: [
      {
        id: "https://openalex.org/W3012345678",
        title: "A Global Registry Study on BRAF Alterations in Rare Tumors",
        authors: "Gomez L, Kim S, Dupont L",
        pub_date: "2019-11-20",
        abstract: "We analyze BRAF V600E and non-V600E mutations across non-small cell lung cancer, anaplastic thyroid cancer, and cholangiocarcinoma. High response rates to Dabrafenib combination therapies suggest tissue-agnostic utility for BRAF inhibitors.",
        doi: "10.1158/2159-8290.CD-19-0345"
      }
    ],
    arxiv: [
      {
        id: "2005.12345",
        title: "Deep Learning Approaches for Modeling BRAF Kinase Conformation Transitions",
        authors: "Wang X, Zhang Y",
        pub_date: "2020-05-18",
        abstract: "We model active and inactive states of BRAF kinase using molecular dynamics and deep neural networks to identify transient pocket bindings."
      }
    ],
    europepmc: [
      {
        pmcid: "PMC7891234",
        title: "Targeting BRAF Mutant Cancers: A Comprehensive Clinical Update",
        authors: "Green L, Brown T",
        journal: "European Journal of Cancer",
        pub_date: "2021-03-15",
        abstract: "This review covers recent clinical trial approvals for Encorafenib, Dabrafenib, and next-generation BRAF inhibitors, detailing adverse event profiles and survival endpoints."
      }
    ]
  },
  EGFR: {
    query: "EGFR",
    pubmed: [
      {
        pmid: "29876543",
        title: "Osimertinib in Untreated EGFR-Mutated Advanced Non-Small-Cell Lung Cancer",
        authors: "Soria J, Ohe Y, Vansteenkiste J",
        journal: "New England Journal of Medicine",
        pub_date: "2018-01-11",
        abstract: "In this phase 3 trial, osimertinib showed efficacy superior to that of standard EGFR-TKIs (gefitinib or erlotinib) as first-line therapy in patients with EGFR mutation-positive advanced NSCLC, with a similar safety profile and lower rates of serious adverse events.",
        doi: "10.1056/NEJMoa1713137"
      }
    ],
    biorxiv: [
      {
        doi: "10.1101/2022.04.15.488421",
        title: "Adaptive genomic evolution in EGFR-mutant lung adenocarcinomas under targeted selective pressure",
        authors: "Bose S, Carter H, Swanton C",
        pub_date: "2022-04-16",
        abstract: "We trace clonal dynamics in EGFR mutant lung cancers during Gefitinib therapy, identifying diverse resistance pathways including MET amplification and secondary T790M mutations. Clonal heterogeneity at baseline predicts early progression."
      }
    ],
    openalex: [
      {
        id: "https://openalex.org/W4012345678",
        title: "Structure-function Relationships of EGFR Kinase Domain Mutations",
        authors: "Zhang Y, Kuriyan J",
        pub_date: "2019-03-05",
        abstract: "EGFR activating mutations in the kinase domain, including L858R and exon 19 deletions, alter the asymmetric dimer interface, leading to ligand-independent activation. We present structural insights explaining differential inhibitor sensitivity.",
        doi: "10.1016/j.cell.2019.02.011"
      }
    ],
    arxiv: [
      {
        id: "1903.09876",
        title: "Machine Learning Predicts EGFR Kinase Domain Mutation Resistance to Osimertinib",
        authors: "Li M, Liu J",
        pub_date: "2019-03-12",
        abstract: "We apply structural classification algorithms to a panel of 45 EGFR secondary mutations, predicting resistance profiles to osimertinib with high accuracy."
      }
    ],
    europepmc: [
      {
        pmcid: "PMC6203987",
        title: "EGFR Mutations in Non-Small-Cell Lung Cancer: Analysis of Clinical Trial Data",
        authors: "White K, Miller R",
        journal: "Lancet Oncology",
        pub_date: "2018-09-01",
        abstract: "A pooled analysis of major trials comparing tyrosine kinase inhibitors in EGFR-mutated NSCLC, focusing on progression-free survival and secondary mutation profiles."
      }
    ]
  },
  TP53: {
    query: "TP53",
    pubmed: [
      {
        pmid: "28456123",
        title: "The TP53 Pathway in Human Cancer",
        authors: "Kastan M, Lane D, Vogelstein B",
        journal: "Cold Spring Harbor Perspectives in Biology",
        pub_date: "2016-09-01",
        abstract: "The TP53 gene encoding the p53 tumor suppressor is mutated in over 50% of human cancers. We review downstream transcriptional targets controlling cell cycle arrest, senescence, and apoptosis, and discuss ongoing attempts to pharmacologically rescue mutant p53 conformation.",
        doi: "10.1101/cshperspect.a026112"
      }
    ],
    biorxiv: [
      {
        doi: "10.1101/2023.01.12.523812",
        title: "Deep mutational scanning of the p53 DNA-binding domain reveals structural determinants of transcriptional activity",
        authors: "Fowler D, Fields S, Laurent A",
        pub_date: "2023-01-14",
        abstract: "Mutational profiling of all single amino acid changes in the p53 DNA-binding domain details structural hot-spots vulnerable to loss-of-function. We correlate transcriptional activity scores with clinical hotspot mutations across cancer cohorts."
      }
    ],
    openalex: [
      {
        id: "https://openalex.org/W5012345678",
        title: "p53 Isoforms: An Oncological Perspective",
        authors: "Bourdon J, Khoury M",
        pub_date: "2020-04-12",
        abstract: "Alternatively spliced isoforms of p53 modulate the canonical tumor suppressor activity. Expression patterns of p53 beta/gamma correlate with clinical prognosis in breast cancer and leukemia.",
        doi: "10.1038/s41416-020-0822-z"
      }
    ],
    arxiv: [
      {
        id: "2301.05432",
        title: "Geometric Deep Learning for Predicting p53 Mutant Rescuing Small Molecules",
        authors: "Al-Rashed M, Smith R",
        pub_date: "2023-01-20",
        abstract: "Using geometric graph neural networks on the p53 DNA-binding domain, we identify novel chemical scaffolds capable of stabilizing mutant p53 in a transcriptionally active conformation."
      }
    ],
    europepmc: [
      {
        pmcid: "PMC8109876",
        title: "TP53 in Cancer: Clinical Significance, Prognostic Value, and Therapeutic Opportunities",
        authors: "Taylor A, Johnson D",
        journal: "Clinical Cancer Research",
        pub_date: "2021-02-01",
        abstract: "A review of the prognostic role of TP53 mutations across solid tumors and hematological malignancies, with a focus on targetable pathways and APR-246 clinical progress."
      }
    ]
  }
};
