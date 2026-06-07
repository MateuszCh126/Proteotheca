import React, { useState } from 'react';
import { GtexEQTL } from '../../types/variant';
import { useI18n } from '../../context/I18nContext';

interface GtexHeatmapProps {
  eqtls: GtexEQTL[];
}

export const GtexHeatmap: React.FC<GtexHeatmapProps> = ({ eqtls }) => {
  const { t } = useI18n();
  const [hoveredCell, setHoveredCell] = useState<GtexEQTL | null>(null);

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
        <div className="flex flex-wrap items-center gap-4 text-3xs uppercase tracking-wider font-bold">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-rose-500 rounded-sm" />
            <span className="text-slate-300">{t('variant.upRegulated')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-cyan-500 rounded-sm" />
            <span className="text-slate-300">{t('variant.downRegulated')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 border border-dashed border-white/20 bg-stripes-overlay rounded-sm" />
            <span className="text-slate-400">{t('variant.nonSignificant')}</span>
          </div>
        </div>
      </div>

      {/* Responsive Grid Wrapper */}
      <div className="overflow-x-auto w-full rounded-lg border border-white/10 bg-slate-950/40 p-4">
        <div 
          className="grid gap-1 min-w-[500px]"
          style={{ 
            gridTemplateColumns: `180px repeat(${uniqueGenes.length}, minmax(80px, 1fr))` 
          }}
        >
          {/* Header Row */}
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider py-1 select-none">{t('variant.tissue')}</div>
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
                  className="text-3xs font-semibold text-slate-300 truncate py-1 pr-2 align-middle self-center font-outfit select-none" 
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
                  const cellTestId = `gtex-cell-${gene.toLowerCase()}-${tissue.replace(/\s+/g, '-').toLowerCase()}`;

                  return (
                    <div
                      key={`${tissue}-${gene}`}
                      data-testid={cellTestId}
                      style={{ backgroundColor: styles.backgroundColor, border: styles.border }}
                      className={`h-8 rounded relative cursor-crosshair transition-all duration-200 hover:scale-105 hover:z-10 flex items-center justify-center ${
                        !styles.isSignificant ? 'bg-stripes-overlay' : ''
                      }`}
                      onMouseEnter={() => setHoveredCell(cellData)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {cellData.nes !== 0 && (
                        <div 
                          className="w-1.5 h-1.5 rounded-full bg-white opacity-60" 
                          style={{ transform: `scale(${Math.min(2.5, Math.max(0.6, Math.abs(cellData.nes) * 2))})` }}
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
              <span className="text-3xs text-slate-400 uppercase tracking-wider block mt-0.5">
                {t('variant.targetGene')} <strong className="text-slate-200">{hoveredCell.gene_symbol}</strong>
              </span>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <span className="text-3xs text-slate-400 block mb-0.5">{t('variant.normalizedEffectSize')}</span>
                <span className={`font-mono font-bold ${hoveredCell.nes >= 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {hoveredCell.nes > 0 ? '+' : ''}{hoveredCell.nes.toFixed(4)}
                </span>
              </div>
              <div className="text-right border-l border-white/10 pl-4">
                <span className="text-3xs text-slate-400 block mb-0.5">{t('variant.significancePValue')}</span>
                <span className={`font-mono font-bold ${hoveredCell.p_value < 0.05 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {hoveredCell.p_value.toExponential(3)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <span className="text-slate-400 italic font-outfit">{t('variant.hoverHeatmap')}</span>
        )}
      </div>
    </div>
  );
};
export default GtexHeatmap;
