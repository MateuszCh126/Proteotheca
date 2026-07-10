import React, { useState, useEffect, useRef } from 'react';
import { Network, Play, RefreshCw, ZoomIn, ZoomOut, Search } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface StringNetworkProps {
  geneSymbol?: string;
}

interface Node {
  id: string;
  size: number;
  color: string;
  role: string;
}

interface PhysicsNode extends Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Link {
  source: string;
  target: string;
  score: number;
}

export const StringNetwork: React.FC<StringNetworkProps> = ({ geneSymbol = 'BRAF' }) => {
  const { t } = useI18n();
  const [isActive, setIsActive] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<PhysicsNode | null>(null);
  const [nodesState, setNodesState] = useState<PhysicsNode[]>([]);
  const [zoom, setZoom] = useState(1);

  const svgRef = useRef<SVGSVGElement>(null);
  const draggedNodeRef = useRef<string | null>(null);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Define nodes and links dynamically based on the current query gene
  const rawNodes: Node[] = [
    { id: geneSymbol, size: 22, color: 'hsl(222, 20%, 12%)', role: t('string.queryTarget') },
    { id: 'KRAS', size: 14, color: 'hsl(220, 9%, 48%)', role: t('string.upstreamRegulator') },
    { id: 'NRAS', size: 14, color: 'hsl(220, 9%, 48%)', role: t('string.upstreamRegulator') },
    { id: 'MAP2K1', size: 16, color: 'hsl(220, 8%, 66%)', role: t('string.downstreamEffector') },
    { id: 'MAPK1', size: 14, color: 'hsl(220, 8%, 66%)', role: t('string.downstreamKinase') },
    { id: 'EGFR', size: 16, color: 'hsl(152, 45%, 40%)', role: t('string.receptorTyrosineKinase') }
  ].filter((n, idx, self) => self.findIndex(other => other.id === n.id) === idx);

  const links: Link[] = [
    { source: geneSymbol, target: 'KRAS', score: 0.98 },
    { source: geneSymbol, target: 'NRAS', score: 0.95 },
    { source: geneSymbol, target: 'MAP2K1', score: 0.99 },
    { source: 'MAP2K1', target: 'MAPK1', score: 0.99 },
    { source: 'KRAS', target: 'EGFR', score: 0.88 },
    { source: geneSymbol, target: 'EGFR', score: 0.76 }
  ].filter(l => l.source !== l.target && rawNodes.some(n => n.id === l.source) && rawNodes.some(n => n.id === l.target));

  // Initialize node positions
  useEffect(() => {
    if (!isActive) return;

    const initialNodes: PhysicsNode[] = rawNodes.map((n, idx) => {
      // Position them in a circle around the center
      const angle = (idx / rawNodes.length) * 2 * Math.PI;
      const r = n.id === geneSymbol ? 0 : 110;
      return {
        ...n,
        x: 200 + r * Math.cos(angle),
        y: 200 + r * Math.sin(angle),
        vx: 0,
        vy: 0,
      };
    });

    setNodesState(initialNodes);
  }, [isActive, geneSymbol]);

  // Global mouse release handler
  useEffect(() => {
    const handleMouseUpGlobal = () => {
      draggedNodeRef.current = null;
    };
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
  }, []);

  // Physics animation loop
  useEffect(() => {
    if (!isActive || nodesState.length === 0) return;

    let animFrameId: number;
    let currentNodes = [...nodesState];

    const tick = () => {
      const width = 400;
      const height = 400;
      const kRepulsion = 1400;
      const kAttraction = 0.045;
      const lDesired = 95;
      const gravity = 0.015;
      const friction = 0.86;

      // 1. Repulsion between all node pairs
      for (let i = 0; i < currentNodes.length; i++) {
        const u = currentNodes[i];
        for (let j = i + 1; j < currentNodes.length; j++) {
          const v = currentNodes[j];
          const dx = u.x - v.x;
          const dy = u.y - v.y;
          const distSq = dx * dx + dy * dy + 0.01;
          const dist = Math.sqrt(distSq);

          const force = kRepulsion / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          u.vx += fx;
          u.vy += fy;
          v.vx -= fx;
          v.vy -= fy;
        }
      }

      // 2. Attraction along connected links
      for (const link of links) {
        const u = currentNodes.find(n => n.id === link.source);
        const v = currentNodes.find(n => n.id === link.target);
        if (!u || !v) continue;

        const dx = u.x - v.x;
        const dy = u.y - v.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const delta = dist - lDesired;

        const force = kAttraction * delta * link.score;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        u.vx -= fx;
        u.vy -= fy;
        v.vx += fx;
        v.vy += fy;
      }

      // 3. Apply friction and update coordinates
      const mousePos = mousePosRef.current;
      const draggedNodeId = draggedNodeRef.current;

      currentNodes = currentNodes.map(node => {
        if (node.id === draggedNodeId && mousePos) {
          // Locked to dragged mouse
          return {
            ...node,
            x: mousePos.x,
            y: mousePos.y,
            vx: 0,
            vy: 0,
          };
        }

        let vx = node.vx * friction;
        let vy = node.vy * friction;

        // Apply gravity to center (200, 200)
        vx += (200 - node.x) * gravity;
        vy += (200 - node.y) * gravity;

        let x = node.x + vx;
        let y = node.y + vy;

        // Keep inside bounds
        const margin = node.size + 15;
        if (x < margin) { x = margin; vx = 0; }
        if (x > width - margin) { x = width - margin; vx = 0; }
        if (y < margin) { y = margin; vy = 0; }
        if (y > height - margin) { y = height - margin; vy = 0; }

        return {
          ...node,
          x,
          y,
          vx,
          vy,
        };
      });

      setNodesState(currentNodes);
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [isActive, nodesState.length]);

  const handleActivate = () => {
    setIsActive(true);
    setZoom(1);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 400;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    mousePosRef.current = { x, y };
  };

  const handleMouseDown = (nodeId: string) => {
    draggedNodeRef.current = nodeId;
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    const input = document.querySelector('input[data-testid="search-input"]') as HTMLInputElement;
    if (input) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, nodeId);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        input.value = nodeId;
      }
      setTimeout(() => {
        const btn = document.querySelector('button[data-testid="search-button"]') as HTMLButtonElement;
        btn?.click();
      }, 50);
    }
  };

  const getPosition = (id: string) => {
    const node = nodesState.find(n => n.id === id);
    return node ? { x: node.x, y: node.y } : { x: 200, y: 200 };
  };

  return (
    <div
      className="relative w-full h-[400px] border border-line rounded-2xl bg-surface/35 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden group"
      data-testid="string-network-container"
    >
      {isActive && nodesState.length > 0 ? (
        <div className="w-full h-full relative z-0">
          <svg
            ref={svgRef}
            onMouseMove={handleMouseMove}
            className="w-full h-full select-none"
            viewBox="0 0 400 400"
          >
            {/* Transform Group for Zoom & Pan */}
            <g transform={`translate(${200 * (1 - zoom)}, ${200 * (1 - zoom)}) scale(${zoom})`}>
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
                    stroke="rgba(120, 128, 140, 0.35)"
                    strokeWidth={link.score * 3.5}
                    className="transition-all"
                  />
                );
              })}

              {/* Draw Nodes */}
              {nodesState.map((node) => {
                const isQuery = node.id === geneSymbol;
                const isHovered = hoveredNode?.id === node.id;
                return (
                  <g
                    key={node.id}
                    className="cursor-pointer transition-all duration-75"
                    onMouseDown={() => handleMouseDown(node.id)}
                    onDoubleClick={() => handleNodeDoubleClick(node.id)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.size + (isHovered ? 2 : 0)}
                      fill={node.color}
                      stroke={isQuery ? 'white' : 'rgba(20,24,34,0.5)'}
                      strokeWidth={isQuery ? 2.5 : 1}
                      className="transition-all filter drop-shadow-[0_0_8px_rgba(20,24,34,0.12)]"
                    />
                    <text
                      x={node.x}
                      y={node.y - node.size - 6}
                      textAnchor="middle"
                      fill="white"
                      className="text-3xs font-extrabold tracking-tight font-sans select-none pointer-events-none drop-shadow"
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Legend and Hover Card */}
          <div className="absolute top-4 left-4 p-2 bg-surface/80 border border-line rounded-lg text-3xs font-sans space-y-1 shadow-md max-w-xs pointer-events-none">
            <span className="font-bold text-ink block">{t('string.title')}</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-ink" />
              <span className="text-ink-2">{t('string.queryTarget')}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-ink-2">{t('string.regulatorsEffectors')}</span>
            </div>
          </div>

          {hoveredNode && (
            <div className="absolute bottom-4 right-4 p-2.5 bg-surface/90 border border-line rounded-xl text-3xs font-sans shadow-2xl max-w-xs pointer-events-none animate-fade-in">
              <span className="font-extrabold text-ink block text-xs">{hoveredNode.id}</span>
              <span className="text-ink-2 block mt-0.5">{hoveredNode.role}</span>
              <span className="text-3xs text-ink-3 block font-mono mt-1">
                {t('string.coord', { x: Math.round(hoveredNode.x), y: Math.round(hoveredNode.y) })}
              </span>
              <span className="text-3xs text-ink block font-medium mt-1">
                Double click to query this gene
              </span>
            </div>
          )}

          {/* Floating Controls */}
          <div className="absolute bottom-4 left-4 flex space-x-1 bg-surface/60 border border-line p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity">
            <button
              onClick={() => setZoom(z => Math.min(z * 1.25, 3))}
              className="p-1 hover:bg-wash rounded text-ink-2"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z / 1.25, 0.5))}
              className="p-1 hover:bg-wash rounded text-ink-2"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setZoom(1); }}
              className="p-1 hover:bg-wash rounded text-ink-2"
              title="Reset Zoom"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleActivate}
          className="absolute inset-0 bg-surface/85 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group-hover:bg-surface/70 z-20"
        >
          <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-ink mb-3 animate-pulse">
            <Network className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-ink font-sans">{t('string.activateGraph')}</span>
          <span className="text-xs text-ink-2 mt-1 font-mono">{t('string.loadingTargetsFor', { gene: geneSymbol })}</span>
          <span className="text-3xs text-ink-3 mt-2 font-sans text-center max-w-xs leading-normal">
            {t('string.description')}
          </span>
        </div>
      )}
    </div>
  );
};

export default StringNetwork;
