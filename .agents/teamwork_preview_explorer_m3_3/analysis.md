# BioMed Explorer: Frontend Visualization & Layout Strategy Proposal

This document outlines the detailed layout grid integration, responsive visualization strategies, and specific component designs for the **Variant Impact Panel** (ClinVar, gnomAD, GTEx) and the **openFDA Adverse Event Charts**, as part of the React (TypeScript + Vite) premium dark glassmorphic dashboard interface.

---

## 1. Executive Summary

To deliver a premium research portal that meets the needs of med-tech developers, clinicians, and bio-engineers:
* **gnomAD Allele Frequency**: Visualized using a dual approach—a prominent logarithmic radial gauge for the overall global allele frequency, paired with a horizontal bar chart displaying population breakdowns. Frequencies are formatted in scientific notation and percentages.
* **GTEx Expression Heatmap**: Implemented as a CSS Grid or custom SVG layout. It leverages a diverging HSL color scheme to clearly distinguish gene expression up-regulation (red/orange) from down-regulation (blue/cyan), mapping statistical significance ($p$-value) to visual opacity and applying geometric patterns for non-significant ($p > 0.05$) associations.
* **openFDA Adverse Event Charts**: Visualized using a horizontal Recharts bar chart for reaction terms (grouped by frequency) and paired donut charts for demographic breakdowns.
* **Responsive Layout Grid & Integration**: Built on a Tailwind CSS 12-column grid. It places Mol* WebGL viewer and STRING interaction networks at the visual center, utilizing fade-in/slide-up animations (Framer Motion) and active canvas-resize listeners. To optimize performance, interactive WebGL canvases are initialized on-demand via user interaction overlays on tablet and mobile viewports.
* **E2E Testability**: Enriched with specific `data-testid` hooks for all interactive elements, cells, tooltips, and canvas states to support Playwright automated verification.

---

## 2. gnomAD Population Allele Frequency Visualization

Population genetics data from gnomAD requires immediate clarity regarding whether a variant is common, rare, or ultra-rare, alongside population-specific variations.

### 2.1 UI/UX Concept
1. **Global Frequency Gauge**: A radial ring progress display at the top of the card showing the overall global allele frequency ($AF_{global}$).
   * **Scale**: Since allele frequencies range across several orders of magnitude (e.g., $10^{-6}$ for ultra-rare to $0.5$ for common variants), we map the dial using a **logarithmic scale** (e.g., base 10 mapping from $10^{-6}$ to $1$) to ensure visibility.
   * **Color Encoding**:
     * **Ultra-rare** ($AF < 0.0001$ / $< 0.01\%$): Bright Cyan (`hsl(190, 90%, 50%)`)
     * **Rare** ($0.0001 \le AF < 0.01$ / $0.01\% - 1\%$): Green (`hsl(140, 80%, 45%)`)
     * **Common** ($AF \ge 0.01$ / $\ge 1\%$): Warm Amber/Red (`hsl(25, 90%, 55%)`)
2. **Population Breakdown Bar Chart**: A horizontal bar chart depicting allele frequencies across diverse ancestry groups.
   * **Axis Configuration**: Horizontal layout (Y-axis for populations, X-axis for frequencies) to accommodate long label lengths (e.g., "Latino/Admixed American", "European (non-Finnish)").

### 2.2 Recharts Component Specifications

#### 2.2.1 Data Mapping Interface
```typescript
interface PopulationFrequency {
  pop: string;      // Population name (e.g. "East Asian")
  freq: number;     // Allele frequency value (between 0 and 1)
}

interface GnomadData {
  allele_frequency: number;
  homozygote_count: number;
  populations: PopulationFrequency[];
}

interface AlleleFreqChartProps {
  data: GnomadData;
  isLoading?: boolean;
}
```

#### 2.2.2 Global Frequency Radial Gauge
To represent $AF_{global}$ logarithmically:
$$\text{Value} = \max\left(0, \frac{\log_{10}(AF_{global}) - \log_{10}(10^{-6})}{\log_{10}(1) - \log_{10}(10^{-6})}\right) = \max\left(0, \frac{\log_{10}(AF_{global}) + 6}{6}\right)$$

```tsx
import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export const GlobalFreqGauge: React.FC<{ frequency: number }> = ({ frequency }) => {
  // Map frequency to scale 0 - 100
  const logVal = Math.max(0, ((Math.log10(frequency || 1e-6) + 6) / 6) * 100);
  
  // Determine color based on frequency threshold
  let color = 'var(--color-cyan)'; // Default ultra-rare
  if (frequency >= 0.01) {
    color = 'var(--color-amber)';  // Common
  } else if (frequency >= 0.0001) {
    color = 'var(--color-green)';  // Rare
  }

  const chartData = [{ name: 'Global AF', value: logVal, fill: color }];

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-36" data-testid="global-af-gauge">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="75%" 
          outerRadius="100%" 
          barSize={10} 
          data={chartData} 
          startAngle={180} 
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background clockWise dataKey="value" cornerRadius={5} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/6 text-center">
        <span className="text-xs text-slate-400 font-medium block">Global AF</span>
        <span className="text-xl font-bold tracking-tight text-white block font-outfit" data-testid="global-af-value">
          {frequency.toExponential(3)}
        </span>
        <span className="text-2xs text-slate-500 font-mono">
          ({(frequency * 100).toFixed(4)}%)
        </span>
      </div>
    </div>
  );
};
```

#### 2.2.3 Population Frequency Bar Chart
```tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const PopulationBarChart: React.FC<{ populations: PopulationFrequency[] }> = ({ populations }) => {
  // Sort populations by frequency descending for visual organization
  const sortedData = [...populations].sort((a, b) => b.freq - a.freq);

  const formatTick = (tick: number) => {
    if (tick === 0) return '0';
    return tick.toExponential(1);
  };

  const getBarColor = (freq: number) => {
    if (freq >= 0.01) return 'hsl(25, 90%, 55%)';      // Common
    if (freq >= 0.0001) return 'hsl(140, 80%, 45%)';    // Rare
    return 'hsl(190, 90%, 50%)';                       // Ultra-rare
  };

  return (
    <div className="w-full h-64" data-testid="gnomad-pop-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
        >
          <XAxis 
            type="number" 
            tickFormatter={formatTick} 
            stroke="hsl(220, 15%, 60%)"
            tick={{ fill: 'hsl(220, 10%, 75%)', fontSize: 10, fontFamily: 'monospace' }}
            domain={[0, 'dataMax']}
          />
          <YAxis 
            dataKey="pop" 
            type="category" 
            stroke="hsl(220, 15%, 60%)"
            tick={{ fill: 'hsl(220, 10%, 85%)', fontSize: 11, fontFamily: 'var(--font-outfit)' }}
            width={90}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as PopulationFrequency;
                return (
                  <div className="glass-panel p-2.5 rounded-lg border border-white/10 shadow-xl bg-slate-950/80 backdrop-blur-md text-xs">
                    <p className="font-bold text-white mb-1 font-outfit">{item.pop}</p>
                    <p className="text-slate-300">
                      Freq: <span className="font-mono text-cyan-400">{item.freq.toExponential(4)}</span>
                    </p>
                    <p className="text-slate-400 text-2xs mt-0.5">
                      Percentage: {(item.freq * 100).toFixed(5)}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="freq" radius={[0, 4, 4, 0]} maxBarSize={16}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.freq)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
```

---

## 3. GTEx Expression Heatmap Design

An Expression Quantitative Trait Locus (eQTL) indicates how a genetic variant correlates with a change in gene expression within specific tissues. Visualizing both the **direction of effect** (Normalized Effect Size, or NES) and the **statistical significance** (p-value) is required.

### 3.1 Diverging HSL Color Scheme & Mathematical Mapping
To make the heatmap intuitive:
1. **Direction of Expression (NES)**:
   * **Positive NES** ($NES > 0$): Represents up-regulation. Maps to orange/red hues (`hsl(15, 80%, L%)`).
   * **Negative NES** ($NES < 0$): Represents down-regulation. Maps to cyan/blue hues (`hsl(200, 85%, L%)`).
   * **Near Zero NES** ($NES \approx 0$): Neutral gray/slate.
2. **Significance ($p$-value)**:
   * Represented by **saturation and lightness** (opacity or depth).
   * Map $p$-value to $-\log_{10}(p)$ to capture the logarithmic significance.
   * Formulate the significance score $S$:
     $$S = \max\left(0, -\log_{10}(p\text{-value}) - 1.3\right)$$
     (Note: $1.3$ corresponds to $p = 0.05$. Thus, non-significant $p$-values scale to $S = 0$).
   * Calculate cell opacity $\alpha$ using $S$:
     $$\alpha = \max\left(0.1, \min\left(1.0, \frac{S}{8}\right)\right)$$
     (assuming $p = 10^{-9.3}$ achieves full opacity $\alpha = 1.0$).

### 3.2 Non-Significant Visual Overlay
For cells where $p \ge 0.05$ (non-significant), we apply a **hatching pattern overlay** (diagonal lines) using SVG patterns, or set the cell borders to dashed and lower opacity. This indicates that while an effect size was calculated, it is not statistically significant.

### 3.3 CSS Grid-Based Responsive Heatmap Implementation
Using a pure CSS grid with flex containers is highly responsive, lightweight, and renders beautifully on mobile devices (by enabling horizontal scroll for wide grids or wrapping tissues dynamically).

```tsx
import React, { useState } from 'react';

interface EqtlData {
  tissue: string;
  gene_symbol: string;
  p_value: number;
  nes: number; // Positive = up-regulated, Negative = down-regulated
}

interface GtexHeatmapProps {
  eqtls: EqtlData[];
}

export const GtexHeatmap: React.FC<GtexHeatmapProps> = ({ eqtls }) => {
  const [hoveredCell, setHoveredCell] = useState<EqtlData | null>(null);

  // Group tissues and genes to form grid axes
  const uniqueTissues = Array.from(new Set(eqtls.map((e) => e.tissue))).sort();
  const uniqueGenes = Array.from(new Set(eqtls.map((e) => e.gene_symbol))).sort();

  const getCellStyles = (nes: number, pVal: number) => {
    const isSignificant = pVal < 0.05;
    const logP = -Math.log10(pVal);
    const score = Math.max(0, logP - 1.3);
    const opacity = isSignificant ? Math.max(0.2, Math.min(1.0, score / 6)) : 0.15;
    
    // Choose hue based on direction of NES
    const hue = nes > 0 ? 15 : 200; // 15 = Orange/Red, 200 = Cyan/Blue
    const saturation = isSignificant ? '80%' : '15%';
    const lightness = isSignificant ? '45%' : '60%';

    return {
      backgroundColor: `hsla(${hue}, ${saturation}, ${lightness}, ${opacity})`,
      border: isSignificant ? '1px solid rgba(255,255,255,0.15)' : '1px dashed rgba(255,255,255,0.05)',
      isSignificant,
    };
  };

  return (
    <div className="w-full flex flex-col space-y-4" data-testid="gtex-heatmap-container">
      {/* Title & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white/5 rounded-lg border border-white/5">
        <div className="flex items-center space-x-6 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-red-500 rounded-sm" />
            <span className="text-slate-300">Up-regulated (NES &gt; 0)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-cyan-500 rounded-sm" />
            <span className="text-slate-300">Down-regulated (NES &lt; 0)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 border border-dashed border-white/20 bg-white/10 rounded-sm" />
            <span className="text-slate-400">Non-significant (p &ge; 0.05)</span>
          </div>
        </div>
      </div>

      {/* Responsive Grid Wrapper */}
      <div className="overflow-x-auto w-full rounded-lg border border-white/10 bg-slate-950/40 p-4">
        <div 
          className="grid gap-1 min-w-[600px]"
          style={{ 
            gridTemplateColumns: `180px repeat(${uniqueGenes.length}, minmax(80px, 1fr))` 
          }}
        >
          {/* Header Row */}
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider py-1 select-none">Tissue</div>
          {uniqueGenes.map((gene) => (
            <div 
              key={gene} 
              className="text-xs font-bold text-white text-center uppercase tracking-wider py-1 border-b border-white/10 font-outfit"
            >
              {gene}
            </div>
          ))}

          {/* Grid Content */}
          {uniqueTissues.map((tissue) => {
            return (
              <React.Fragment key={tissue}>
                {/* Y-Axis Label */}
                <div 
                  className="text-2xs font-medium text-slate-300 truncate py-1 pr-2 align-middle self-center font-outfit" 
                  title={tissue}
                >
                  {tissue}
                </div>

                {/* Grid Cells */}
                {uniqueGenes.map((gene) => {
                  const cellData = eqtls.find((e) => e.tissue === tissue && e.gene_symbol === gene) || {
                    tissue,
                    gene_symbol: gene,
                    p_value: 1,
                    nes: 0,
                  };
                  const styles = getCellStyles(cellData.nes, cellData.p_value);

                  return (
                    <div
                      key={`${tissue}-${gene}`}
                      data-testid={`gtex-cell-${gene}-${tissue.replace(/\s+/g, '-').toLowerCase()}`}
                      style={{ backgroundColor: styles.backgroundColor, border: styles.border }}
                      className={`h-8 rounded relative cursor-crosshair transition-all duration-200 hover:scale-105 hover:z-10 flex items-center justify-center ${
                        !styles.isSignificant ? 'bg-stripes-overlay' : ''
                      }`}
                      onMouseEnter={() => setHoveredCell(cellData)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {/* Effect Size Indicator Dot */}
                      {cellData.nes !== 0 && (
                        <div 
                          className="w-1.5 h-1.5 rounded-full bg-white opacity-60" 
                          style={{ transform: `scale(${Math.min(2, Math.abs(cellData.nes) * 2)})` }}
                        />
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Tooltip Overlay / Status Bar */}
      <div 
        className="h-16 p-3 rounded-lg border border-white/10 bg-slate-900/60 backdrop-blur-md flex items-center justify-between text-xs transition-opacity duration-200"
        style={{ opacity: hoveredCell ? 1 : 0.5 }}
      >
        {hoveredCell ? (
          <>
            <div>
              <span className="font-bold text-white block font-outfit">{hoveredCell.tissue}</span>
              <span className="text-slate-400 text-2xs uppercase tracking-wider block">
                Target Gene: <strong className="text-slate-200">{hoveredCell.gene_symbol}</strong>
              </span>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <span className="text-slate-400 block text-2xs">Normalized Effect Size (NES)</span>
                <span className={`font-mono font-bold ${hoveredCell.nes >= 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                  {hoveredCell.nes > 0 ? '+' : ''}{hoveredCell.nes.toFixed(4)}
                </span>
              </div>
              <div className="text-right border-l border-white/10 pl-4">
                <span className="text-slate-400 block text-2xs">Significance (p-value)</span>
                <span className={`font-mono font-bold ${hoveredCell.p_value < 0.05 ? 'text-green-400' : 'text-amber-400'}`}>
                  {hoveredCell.p_value.toExponential(3)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <span className="text-slate-400 italic">Hover over a cell to examine eQTL metrics.</span>
        )}
      </div>
    </div>
  );
};
```

*Note on Hatching*: The CSS class `.bg-stripes-overlay` can be implemented using a simple background CSS rule inside `index.css`:
```css
.bg-stripes-overlay {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(255, 255, 255, 0.05) 4px,
    rgba(255, 255, 255, 0.05) 8px
  );
}
```

---

## 4. openFDA Adverse Event Charts

The Therapeutic Panel requires data-rich visualizations displaying Adverse Drug Events (ADEs) pulled from the openFDA API for a queried compound.

### 4.1 UI/UX Layout
The openFDA component is split into two visual sections:
1. **Adverse Event Term Frequency Chart**: A horizontal bar chart of the top 10-15 adverse events.
2. **Patient Demographics Breakdown**: Dual side-by-side donut charts illustrating Sex and Age distributions.

### 4.2 Recharts Component Specifications

#### 4.2.1 Data Mapping Interface
```typescript
interface AdverseEventTerm {
  term: string;     // Event symptom name (e.g. "Fatigue", "Neutropenia")
  count: number;    // Number of FDA reports
}

interface DemographicData {
  name: string;     // e.g. "Male", "Female", "Unknown" or age groups
  value: number;    // Count
}

interface OpenFdaData {
  active_substance: string;
  total_reports: number;
  events: AdverseEventTerm[];
  sex_breakdown: DemographicData[];
  age_breakdown: DemographicData[];
}
```

#### 4.2.2 Event Frequency Chart
```tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const FdaEventsChart: React.FC<{ events: AdverseEventTerm[] }> = ({ events }) => {
  const data = events.slice(0, 10); // Display top 10 event reactions
  
  // Custom orange-red theme
  const getGradientColor = (index: number) => {
    // Red-orange gradient stepping down
    const startHue = 15; // Orange-red
    const lightness = 40 + (index * 2.5); 
    return `hsl(${startHue}, 80%, ${lightness}%)`;
  };

  return (
    <div className="w-full h-80" data-testid="fda-events-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
          <XAxis 
            type="number"
            stroke="hsl(220, 15%, 60%)"
            tick={{ fill: 'hsl(220, 10%, 80%)', fontSize: 10 }}
          />
          <YAxis 
            dataKey="term" 
            type="category" 
            stroke="hsl(220, 15%, 60%)"
            tick={{ fill: 'hsl(220, 10%, 90%)', fontSize: 10, fontFamily: 'var(--font-outfit)' }}
            width={120}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as AdverseEventTerm;
                return (
                  <div className="glass-panel p-2 rounded-lg border border-white/10 bg-slate-950/80 backdrop-blur-md text-xs">
                    <p className="font-bold text-white uppercase font-outfit">{item.term}</p>
                    <p className="text-orange-400 mt-1">
                      Reports: <span className="font-mono">{item.count.toLocaleString()}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={14}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getGradientColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
```

#### 4.2.3 Demographics Donut Chart
```tsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DemographicsChartProps {
  data: DemographicData[];
  title: string;
  palette: string[]; // List of HSL color strings
  testId: string;
}

export const DemographicsDonutChart: React.FC<DemographicsChartProps> = ({ data, title, palette, testId }) => {
  return (
    <div className="flex flex-col items-center w-full h-64" data-testid={testId}>
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-outfit">{title}</h4>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius="55%"
            outerRadius="75%"
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                return (
                  <div className="glass-panel p-2 rounded-lg border border-white/10 bg-slate-950/80 backdrop-blur-md text-xs">
                    <span className="font-semibold text-white font-outfit">{item.name}</span>
                    <span className="text-slate-300 font-mono block mt-0.5">
                      Reports: {Number(item.value).toLocaleString()}
                    </span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle" 
            iconSize={8}
            wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-outfit)', color: 'hsl(220, 10%, 80%)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
```

---

## 5. Dashboard Grid & Layout Strategy

### 5.1 Responsive Column Matrix (Tailwind CSS Grid)
The portal is arranged using a dynamic multi-breakpoint responsive grid layout, maximizing visual real estate for interactive biological data on large viewports while scaling down cleanly for smaller ones.

| Viewport | Tailwind Classes | Layout Strategy |
|---|---|---|
| **Large Desktop** ($\ge 1440\text{px}$) | `grid grid-cols-12 gap-5` | **3-Column Layout**<br>• Columns 1–3: Left Sidebar (Search, Info panels, Literature)<br>• Columns 4–9: Center (Interactive Mol* Viewer + STRING Network Graph)<br>• Columns 10–12: Right Sidebar (Variant Impact + Therapeutics) |
| **Standard Desktop** ($1024\text{px} - 1439\text{px}$) | `grid grid-cols-12 gap-4` | **2-Column Layout**<br>• Columns 1–6: Left Column (Mol* Viewer + STRING Network Graph)<br>• Columns 7–12: Right Column (Tabbed container holding Search, Variant Impact, Therapeutics, Literature) |
| **Tablet & Mobile** ($< 1024\text{px}$) | `flex flex-col space-y-4` | **1-Column Layout**<br>• Top: Collapsible Search panel<br>• Middle: Mol* / STRING placeholders (with touch lock)<br>• Bottom: Vertical scroll of panels (Variant, Therapeutics, Lit) |

```tsx
// Proposed dashboard grid skeleton
export const DashboardGrid: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden selection:bg-cyan-500/30">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 -z-10 pointer-events-none" />
      
      <header className="h-16 border-b border-white/5 backdrop-blur-md bg-slate-950/40 sticky top-0 z-50 flex items-center px-6 justify-between">
        <h1 className="text-lg font-bold font-outfit tracking-tight flex items-center space-x-2">
          <span className="bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">BioMed Explorer</span>
          <span className="text-3xs bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">v1.0-dev</span>
        </h1>
      </header>

      <main className="p-4 md:p-6 max-w-[1920px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: Search & Lit (Desktop Large / Standard) */}
          <div className="lg:col-span-3 flex flex-col space-y-5">
            <SearchBarSection />
            <LiteraturePanelSection />
          </div>

          {/* CENTER COLUMN: The WebGL / Graphic Visual Hub */}
          <div className="lg:col-span-6 flex flex-col space-y-5">
            <InteractiveVisualHub />
          </div>

          {/* RIGHT COLUMN: Variant & Therapeutic Data */}
          <div className="lg:col-span-3 flex flex-col space-y-5">
            <VariantImpactPanelSection />
            <TherapeuticPanelSection />
          </div>
        </div>
      </main>
    </div>
  );
};
```

---

## 6. High-Fidelity WebGL & Graph Placeholders

Highly interactive visual components like the **Mol* 3D Viewer** and the **STRING Node Network Graph** can introduce UI lag, layout shifts, or gesture conflicts (e.g., vertical scroll hijacking) during render. 

### 6.1 Mol* 3D Molecular Viewer Integration
The Mol* WebGL viewer must be containerized to prevent layout shifts.
1. **Aspect-Ratio Pinned Container**: Wrap in an aspect-ratio locked container (`aspect-video` or standard `h-[400px]`) with relative positioning.
2. **Glassmorphic Loading Layer**: Implement a fade-out loading screen overlay that reads coordinates, tracks download progress, and fades out only when Mol* initiates the WebGL context.
3. **Control Overlay UI**: Overlay translucent glassmorphic button pads on top of the WebGL canvas (e.g., in the corners) to control options (Zoom In/Out, Center, Color by pLDDT, Toggle Cartoon vs Surface, and Generate High-Res Render). This keeps UI interactions directly on the canvas context.
4. **Interaction Prevention on Scroll**: Enable scroll zoom only after clicking on the canvas. Place a temporary overlay stating *"Click to interact with 3D model"* that captures events until dismissed, avoiding browser scroll lock.

```tsx
import React, { useState } from 'react';

export const MolViewerPlaceholder: React.FC<{ pdbId?: string }> = ({ pdbId }) => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div 
      className="relative w-full h-[400px] rounded-xl overflow-hidden border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-inner group"
      data-testid="mol-viewer-container"
    >
      {/* Canvas Placement */}
      <div id="molstar-canvas-root" className="w-full h-full" />

      {/* Interactive Overlay Guard for Mobile/Scroll safety */}
      {!isActive && (
        <div 
          onClick={() => { setIsActive(true); setIsLoading(true); }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group-hover:bg-slate-950/70"
          data-testid="mol-viewer-activation-guard"
        >
          <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3 animate-pulse">
            {/* SVG Mouse Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="5" y="2" width="14" height="20" rx="7" strokeWidth="2" />
              <path d="M12 6v4" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white font-outfit">Click to Activate 3D Mol* Viewer</span>
          <span className="text-xs text-slate-400 mt-1">Ready for PDB: {pdbId || '1UWH'}</span>
        </div>
      )}

      {/* Glassmorphic Loader Overlay */}
      {isActive && isLoading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center" data-testid="mol-viewer-loading">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-mono text-cyan-400">LOADING PDB STRUCT...</span>
        </div>
      )}

      {/* Floating Control Pad Overlay */}
      {isActive && (
        <div className="absolute bottom-4 left-4 flex space-x-2 bg-slate-950/60 backdrop-blur-md border border-white/10 p-1.5 rounded-lg shadow-lg z-10 opacity-70 hover:opacity-100 transition-opacity duration-200">
          <button className="p-1 hover:bg-white/10 rounded text-slate-300" title="Zoom In">+</button>
          <button className="p-1 hover:bg-white/10 rounded text-slate-300" title="Zoom Out">-</button>
          <button className="p-1 hover:bg-white/10 rounded text-slate-300" title="Recenter">⛶</button>
          <span className="w-px h-5 bg-white/10 self-center" />
          <button className="px-2 py-0.5 hover:bg-cyan-500/20 hover:text-cyan-300 rounded text-2xs font-semibold uppercase text-slate-300">
            pLDDT
          </button>
        </div>
      )}
    </div>
  );
};
```

### 6.2 STRING Network Graph Integration
A node-link network representation (using React Flow or d3-force SVGs) must remain performant when loading larger interaction clusters.
1. **D3 Simulation Worker**: Place the D3 force calculation inside a Web Worker thread if the node count exceeds 50. This prevents thread blocking of the main React engine.
2. **Pan-Zoom Locking Guard**: Similar to the WebGL viewer, prevent pan/zoom events unless the graph has focus. Standard double-click or mouse-enter can enable pan-zoom, preventing page-level scrolling issues.
3. **Canvas Bounds Boundary Limits**: Cap nodes to the layout viewport size using bounding forces, preventing nodes from flying out of the viewport.
4. **Mini-Map Overlay**: Provide a miniature preview in the bottom-right corner representing the zoom position.

---

## 7. Responsive Layout Transitions & Animations

Using Framer Motion or standard CSS transitions, we ensure that transitions between loading, tab switching, and expanding/collapsing panels feel sleek and fluid, maintaining a high-fidelity glassmorphic aesthetic.

### 7.1 Panel Entrance & State Transitions
Panels should fade in and slide up when loaded or when search parameters update:
```typescript
export const panelFadeInVariant = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: -15, 
    transition: { duration: 0.25 } 
  }
};
```

### 7.2 Tab Switch Underline Animation
To switch between Variant details and Therapeutics panels on standard screens, use Framer Motion's shared layout animation:
```tsx
{tabs.map((tab) => (
  <button
    key={tab.id}
    onClick={() => setActiveTab(tab.id)}
    className="relative px-3 py-1.5 text-sm font-semibold transition-colors duration-200"
  >
    {activeTab === tab.id && (
      <motion.div
        layoutId="activeTabUnderline"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      />
    )}
    <span className={activeTab === tab.id ? 'text-white' : 'text-slate-400'}>{tab.label}</span>
  </button>
))}
```

---

## 8. E2E Testability Hooks (`data-testid` Anchors)

To ensure Playwright and other opaque E2E testing frameworks can inspect components accurately (satisfying requirements in `TEST_INFRA.md`), specific, semantic selectors are embedded into the layout structure:

| Selector Key / Name | Target Element | Purpose / Validation Checked |
|---|---|---|
| `data-testid="global-af-gauge"` | Radial Gauge Container | Asserts gnomAD section has loaded. |
| `data-testid="global-af-value"` | Dial Core Text | Verifies global allele frequency matches exact API value (e.g., $1.20\text{e-}3$). |
| `data-testid="gnomad-pop-chart"` | Recharts Bar Chart Element | Confirms population ancestry visual is rendered. |
| `data-testid="gtex-heatmap-container"`| Heatmap Box Element | Asserts GTEx panel contains active matrix grid. |
| `data-testid="gtex-cell-{gene}-{tissue}"` | Grid Square Cell | Validates cell values, background properties, and checks significance state. *Example: `data-testid="gtex-cell-braf-skin---sun-exposed-(lower-leg)"`* |
| `data-testid="fda-events-chart"` | openFDA Bar Chart | Validates adverse drug event metrics. |
| `data-testid="mol-viewer-container"` | WebGL Outer Box | Checks presence of molecular structure layout. |
| `data-testid="mol-viewer-activation-guard"` | Mouse Overlay Button | E2E clicks to activate full WebGL interactive canvas. |
| `data-testid="mol-viewer-loading"` | Loader Spinner | Verifies viewer is retrieving and rendering PDB data. |
