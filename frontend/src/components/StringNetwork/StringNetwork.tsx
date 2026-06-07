import React, { useState } from 'react';
import { Network, Play, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface StringNetworkProps {
  geneSymbol?: string;
}

interface Node {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  role: string;
}

interface Link {
  source: string;
  target: string;
  score: number;
}

export const StringNetwork: React.FC<StringNetworkProps> = ({ geneSymbol = 'BRAF' }) => {
  const { t } = useI18n();
  const [isActive, setIsActive] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  const nodes: Node[] = [
    { id: geneSymbol, x: 200, y: 180, size: 22, color: 'hsl(180, 80%, 45%)', role: t('string.queryTarget') },
    { id: 'KRAS', x: 100, y: 100, size: 14, color: 'hsl(225, 75%, 55%)', role: t('string.upstreamRegulator') },
    { id: 'NRAS', x: 300, y: 100, size: 14, color: 'hsl(225, 75%, 55%)', role: t('string.upstreamRegulator') },
    { id: 'MAP2K1', x: 200, y: 280, size: 16, color: 'hsl(280, 70%, 55%)', role: t('string.downstreamEffector') },
    { id: 'MAPK1', x: 280, y: 320, size: 14, color: 'hsl(280, 70%, 55%)', role: t('string.downstreamKinase') },
    { id: 'EGFR', x: 80, y: 220, size: 16, color: 'hsl(142, 70%, 45%)', role: t('string.receptorTyrosineKinase') }
  ];

  const links: Link[] = [
    { source: geneSymbol, target: 'KRAS', score: 0.98 },
    { source: geneSymbol, target: 'NRAS', score: 0.95 },
    { source: geneSymbol, target: 'MAP2K1', score: 0.99 },
    { source: 'MAP2K1', target: 'MAPK1', score: 0.99 },
    { source: 'KRAS', target: 'EGFR', score: 0.88 },
    { source: geneSymbol, target: 'EGFR', score: 0.76 }
  ];

  const handleActivate = () => {
    setIsActive(true);
  };

  const getPosition = (id: string) => {
    const node = nodes.find(n => n.id === id);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  return (
    <div 
      className="relative w-full h-[400px] border border-white/10 rounded-2xl bg-slate-950/35 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden group"
      data-testid="string-network-container"
    >
      {/* SVG Canvas */}
      {isActive ? (
        <div className="w-full h-full relative z-0">
          <svg className="w-full h-full select-none" viewBox="0 0 400 400">
            {/* Draw Links */}
            {links.map((link, i) => {
              const start = getPosition(link.source);
              const end = getPosition(link.target);
              return (
                <line
                  key={i}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth={link.score * 3}
                  strokeDasharray="none"
                  className="transition-all"
                />
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const isQuery = node.id === geneSymbol;
              const isHovered = hoveredNode?.id === node.id;
              return (
                <g 
                  key={node.id}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size + (isHovered ? 3 : 0)}
                    fill={node.color}
                    className="transition-all shadow-glass-glow"
                    stroke={isQuery ? 'white' : 'rgba(255,255,255,0.3)'}
                    strokeWidth={isQuery ? 2.5 : 1}
                  />
                  <text
                    x={node.x}
                    y={node.y - node.size - 6}
                    textAnchor="middle"
                    fill="white"
                    className="text-3xs font-extrabold tracking-tight font-outfit select-none pointer-events-none drop-shadow"
                  >
                    {node.id}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend and Hover Card */}
          <div className="absolute top-4 left-4 p-2 bg-slate-950/80 border border-white/10 rounded-lg text-3xs font-outfit space-y-1 shadow-md max-w-xs">
            <span className="font-bold text-white block">{t('string.title')}</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-slate-400">{t('string.queryTarget')}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-slate-400">{t('string.regulatorsEffectors')}</span>
            </div>
          </div>

          {hoveredNode && (
            <div className="absolute bottom-4 right-4 p-2.5 bg-slate-950/90 border border-white/15 rounded-xl text-3xs font-outfit shadow-2xl max-w-xs animate-fade-in">
              <span className="font-extrabold text-white block text-xs">{hoveredNode.id}</span>
              <span className="text-slate-400 block mt-0.5">{hoveredNode.role}</span>
              <span className="text-3xs text-slate-500 block font-mono mt-1">
                {t('string.coord', { x: hoveredNode.x, y: hoveredNode.y })}
              </span>
            </div>
          )}

          {/* Floating Controls */}
          <div className="absolute bottom-4 left-4 flex space-x-1 bg-slate-950/60 border border-white/10 p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity">
            <button className="p-1 hover:bg-white/10 rounded text-slate-300">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 hover:bg-white/10 rounded text-slate-300">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 hover:bg-white/10 rounded text-slate-300" onClick={() => setIsActive(false)}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={handleActivate}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group-hover:bg-slate-950/70 z-20"
        >
          <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-3 animate-pulse">
            <Network className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-white font-outfit">{t('string.activateGraph')}</span>
          <span className="text-xs text-slate-400 mt-1 font-mono">{t('string.loadingTargetsFor', { gene: geneSymbol })}</span>
          <span className="text-3xs text-slate-500 mt-2 font-outfit text-center max-w-xs leading-normal">
            {t('string.description')}
          </span>
        </div>
      )}
    </div>
  );
};
export default StringNetwork;
