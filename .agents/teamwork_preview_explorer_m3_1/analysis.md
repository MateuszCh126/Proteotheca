# BioMed Explorer — Frontend UI/UX Setup & Styling Analysis

This report outlines the recommended setup plan for the frontend React (Vite + TypeScript) application of the BioMed Explorer project. It covers package dependencies, Vite configuration (including proxy settings for backend integration), Tailwind CSS / custom glassmorphic styling, font setup, and a detailed file structure.

---

## 1. Recommended Dependencies to Install

To construct a high-performance, modular, and visually stunning interactive scientific dashboard, we recommend the following dependency stack:

### 1.1 Core Dependencies (`dependencies` in `package.json`)
*   **`react` & `react-dom`** (v18.x or v19.x): Core application rendering.
*   **`lucide-react`**: Vector-based, lightweight scientific and UI iconography.
*   **`recharts`**: Highly customizable, responsive SVG chart library, suitable for variant allele frequencies, GTEx tissue expressions, and openFDA adverse event statistics.
*   **`molstar`**: The industry standard for WebGL molecular visualization in genomics/structural biology. This will be used in Milestone 4 for loading and rendering PDB and AlphaFold structures.
*   **`clsx` & `tailwind-merge`**: Utility packages to combine and clean dynamic class strings in Tailwind CSS (crucial for responsive design and conditional state glows/transitions).

### 1.2 Development Dependencies (`devDependencies` in `package.json`)
*   **`vite`**: Rapid compilation and hot-reloading development environment.
*   **`@vitejs/plugin-react`**: Official Vite plugin for React JSX/TSX support.
*   **`typescript`**: Strict typing framework to ensure safety and contract alignment with the backend REST endpoints.
*   **`tailwindcss`**, `postcss`, `autoprefixer`: Modern utility-first CSS processor and layout styling pipeline.
*   **`@types/react`**, `@types/react-dom`, `@types/node`: TypeScript type definitions.

### 1.3 Recommended `package.json` Specification

```json
{
  "name": "biomed-explorer-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^0.400.0",
    "molstar": "^4.4.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.9",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.2.2",
    "vite": "^5.3.1"
  }
}
```

---

## 2. Proposed Design Rules for Premium Dark Glassmorphic Theme

To deliver an elite, medical-grade scientific dashboard, the UI should use **glassmorphism** overlaid on top of a dark space/neon background. Glassmorphism relies on the illusion of frosted glass sheets floating over a dynamic background.

### 2.1 HSL Design Tokens

Using CSS variables defined in HSL format allows for native alpha-channel manipulation (`hsla(var(--name), opacity)`), which is essential for glassmorphic elements.

| Design Token | Role | HSL Value | Hex |
|---|---|---|---|
| `--bg-base` | Deep Space Background | `240, 15%, 4%` | `#08080c` |
| `--bg-panel` | Panel Glass Backing | `240, 10%, 8%` | `#0e0e14` |
| `--border-glass` | Frosted Border | `0, 0%, 100%` (at 8% alpha) | `#ffffff` |
| `--text-primary` | Main Text & Headers | `0, 0%, 98%` | `#fcfcfc` |
| `--text-secondary`| Labels, Captions | `240, 5%, 70%` | `#aeaebe` |
| `--text-muted` | Understated text | `240, 5%, 50%` | `#7e7e8e` |
| `--accent-cyan` | Bio-Cyan (Gene panels, viewer) | `180, 80%, 45%` | `#17dede` |
| `--accent-blue` | Indigo Blue (Pathways, STRING) | `225, 75%, 55%` | `#3c6cf4` |
| `--accent-violet` | Violet (Variants, eQTLs) | `280, 70%, 55%` | `#a33cf4` |
| `--accent-warning`| Pathogenic Indicator (ClinVar) | `15, 85%, 55%` | `#f4581c` |
| `--accent-success`| Benign Indicator / Approved Drug| `142, 70%, 45%` | `#22c55e` |

### 2.2 Glassmorphic Styling Principles

1.  **Transparency & Blur**: Glass panels must have an opacity level of `0.45` to `0.6`, coupled with a backdrop-filter blur of `12px` to `16px`.
2.  **Dual Borders**: All glass panels require a thin `1px` border using a semi-transparent color (white at 10% opacity) or a directional border gradient (top/left lighter than bottom/right) to simulate a light reflection.
3.  **Neon Glows**: Interaction nodes, active tabs, and highlighted data elements should emit subtle colored shadows (`box-shadow: 0 0 15px rgba(accent, 0.15)`).
4.  **Base Mesh Background**: Since glassmorphism needs variance underneath to show the blur effect, the dashboard background (`--bg-base`) should incorporate a soft, deep radial gradient and background mesh blobs.

### 2.3 Custom Tailwind Config (`vite.config.ts` & `tailwind.config.js`)

#### 2.3.1 `vite.config.ts` Configuration

This config incorporates path aliases (`@/` mapping to `src/`) and configures a reverse proxy mapping `/api` to the FastAPI backend service (`http://127.0.0.1:8000`), preventing CORS issues during local development and E2E testing.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

#### 2.3.2 `tailwind.config.js` Setup

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--bg-base) / <alpha-value>)',
        panel: 'hsl(var(--bg-panel) / <alpha-value>)',
        accent: {
          cyan: 'hsl(var(--accent-cyan) / <alpha-value>)',
          blue: 'hsl(var(--accent-blue) / <alpha-value>)',
          violet: 'hsl(var(--accent-violet) / <alpha-value>)',
          warning: 'hsl(var(--accent-warning) / <alpha-value>)',
          success: 'hsl(var(--accent-success) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['Inter', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'accent-cyan': '0 0 15px rgba(23, 222, 222, 0.2)',
        'accent-blue': '0 0 15px rgba(60, 108, 244, 0.2)',
        'accent-violet': '0 0 15px rgba(163, 60, 244, 0.2)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, boxShadow: '0 0 10px rgba(23, 222, 222, 0.1)' },
          '50%': { opacity: 1, boxShadow: '0 0 20px rgba(23, 222, 222, 0.4)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
```

#### 2.3.3 Font Integration (`src/index.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-base: 240 15% 4%;
    --bg-panel: 240 10% 8%;
    
    --accent-cyan: 180 80% 45%;
    --accent-blue: 225 75% 55%;
    --accent-violet: 280 70% 55%;
    --accent-warning: 15 85% 55%;
    --accent-success: 142 70% 45%;
    
    color-scheme: dark;
  }

  body {
    @apply bg-background text-[#fcfcfc] font-sans antialiased overflow-x-hidden min-h-screen;
    background-image: 
      radial-gradient(at 0% 0%, hsla(225, 75%, 55%, 0.08) 0, transparent 40%),
      radial-gradient(at 100% 0%, hsla(180, 80%, 45%, 0.08) 0, transparent 40%),
      radial-gradient(at 50% 100%, hsla(280, 70%, 55%, 0.05) 0, transparent 50%);
  }
}

@layer components {
  /* Frosted Glassmorphic Panel Component */
  .glass-panel {
    @apply bg-panel/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass-glow transition-all duration-300;
  }
  
  .glass-panel-hover {
    @apply hover:bg-panel/60 hover:border-white/15 hover:shadow-accent-cyan/10;
  }

  /* Glass Input Element */
  .glass-input {
    @apply bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 
           focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 focus:border-accent-cyan/50
           transition-all duration-200 backdrop-blur-md;
  }

  /* Custom Scrollbar for Scientific Panels */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    @apply bg-white/10 rounded-full hover:bg-white/20 transition-colors;
  }
}
```

---

## 3. Detailed Project Structure Proposal

To maintain modularity and isolation between components, styling, types, custom hooks, and mock services (ready to be swapped with live endpoint requests), we propose the following directory structure:

```
frontend/
├── public/
│   └── favicon.ico              # BioMed Explorer Logo
├── src/
│   ├── api/                     # API client & Mock Adapters
│   │   ├── apiClient.ts         # Axios/Fetch setup pointing to local reverse proxy
│   │   └── mockData.ts          # Robust static mock data conforming to interface contracts
│   ├── components/              # Sub-components of the panels
│   │   ├── SearchBar/
│   │   │   ├── SearchBar.tsx    # Primary Search component
│   │   │   └── SuggestionList.tsx # Autocomplete search suggestions
│   │   ├── GenePanel/
│   │   │   ├── GenePanel.tsx    # Main Panel container
│   │   │   ├── TranscriptsTable.tsx # Ensembl transcript visualization
│   │   │   └── UniProtDetails.tsx # Protein details and sequence viewer
│   │   ├── VariantPanel/
│   │   │   ├── VariantPanel.tsx  # Main Panel container
│   │   │   ├── ClinVarCard.tsx   # Pathogenicity details
│   │   │   ├── AlleleFreqChart.tsx # Recharts Bar/Gauge for gnomAD freq
│   │   │   └── GtexHeatmap.tsx   # eQTL tissue expression visualizations
│   │   ├── TherapeuticPanel/
│   │   │   ├── TherapeuticPanel.tsx # Main Panel container
│   │   │   ├── ChemblDrugsTable.tsx # ChEMBL active compound list
│   │   │   ├── ClinicalTrialsList.tsx # ClinicalTrials.gov active studies
│   │   │   └── OpenfdaAdverseEvents.tsx # Adverse events details
│   │   ├── LiteraturePanel/
│   │   │   ├── LiteraturePanel.tsx  # Main Panel container
│   │   │   └── PublicationCard.tsx # PubMed/bioRxiv card renderer
│   │   ├── MolViewer/
│   │   │   └── MolViewer.tsx    # Mol* structural viewer wrapper (Canvas container)
│   │   └── StringNetwork/
│   │       └── StringNetwork.tsx # STRING Node interaction graph
│   ├── hooks/                   # Custom business logic & data hooks
│   │   ├── useDebounce.ts       # Delay autocomplete search inputs
│   │   ├── useSearch.ts         # Handles autocomplete, query validation & detection
│   │   ├── useGeneData.ts       # Fetches and structures Gene properties
│   │   ├── useVariantData.ts    # Fetches and structures Variant details
│   │   └── useDiseaseData.ts    # Fetches and structures Disease details
│   ├── styles/
│   │   └── index.css            # Base stylesheet, variables, and utility classes
│   ├── types/                   # Type definitions matching backend schema contracts
│   │   ├── gene.ts
│   │   ├── variant.ts
│   │   ├── disease.ts
│   │   └── literature.ts
│   ├── utils/                   # Formatting utilities
│   │   ├── formatters.ts        # Scientific formatters (IC50, p-values, frequencies)
│   │   └── validation.ts        # Search input validators (rsID format checking)
│   ├── App.tsx                  # Main layout container and tab navigator
│   ├── main.tsx                 # React DOM mount orchestrator
│   └── vite-env.d.ts            # Vite TypeScript declarations
├── index.html                   # HTML Entry template ( Outfit/Inter loaded here if desired )
├── package.json                 # Dependency list
├── postcss.config.js            # PostCSS plugin registration
├── tailwind.config.js           # Theme overrides
├── tsconfig.json                # Strict TypeScript configuration
└── vite.config.ts               # Core bundler and reverse proxy settings
```

### 3.1 Key Implementation Details for Testability

To align with the **Opaque-box E2E playbooks** defined in `TEST_INFRA.md`, every key UI element and tab container should explicitly carry a `data-testid` attribute to facilitate easy selector identification:

1.  **SearchBar**:
    *   Input box: `data-testid="search-input"`
    *   Search button: `data-testid="search-button"`
    *   Dropdown container: `data-testid="autocomplete-dropdown"`
    *   Individual suggestion items: `data-testid="autocomplete-item-{type}-{value}"`
2.  **Navigation & Tabs**:
    *   Tab triggers: `data-testid="tab-trigger-{panelName}"` (e.g. `tab-trigger-gene`, `tab-trigger-variant`, `tab-trigger-therapeutic`)
3.  **Visualization Components**:
    *   Mol* Canvas: `data-testid="molstar-canvas-container"`
    *   PyMOL render activator: `data-testid="pymol-render-btn"`
    *   STRING interaction graph: `data-testid="string-network-svg"`
    *   Allele Frequency charts: `data-testid="allele-freq-chart"`
    *   eQTL GTEx heatmaps: `data-testid="gtex-heatmap"`
4.  **Error Displays**:
    *   Global error notifications: `data-testid="error-banner"`

By instituting this directory structure, developers can safely write clean components while E2E test scripts can query data and interaction targets with high consistency.
