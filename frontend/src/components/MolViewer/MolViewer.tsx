import React, { useState, useEffect } from 'react';
import { Play, ZoomIn, ZoomOut, Maximize2, Compass, Layers, Loader2 } from 'lucide-react';

interface MolViewerProps {
  pdbId?: string;
}

export const MolViewer: React.FC<MolViewerProps> = ({ pdbId = '1UWH' }) => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [representation, setRepresentation] = useState<'cartoon' | 'surface' | 'spheres'>('cartoon');
  const [colorMode, setColorMode] = useState<'plddt' | 'chain' | 'hydrophobicity'>('plddt');

  useEffect(() => {
    // Reset active state when pdbId changes to ensure user activates it deliberately
    setIsActive(false);
    setIsLoading(false);
  }, [pdbId]);

  const handleActivate = () => {
    setIsActive(true);
    setIsLoading(true);
    // Simulate WebGL init and PDB load delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  };

  return (
    <div 
      className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-inner group flex flex-col items-center justify-center"
      data-testid="mol-viewer-container"
    >
      {/* 3D WebGL Canvas Placeholder Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none select-none z-0">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500 via-transparent to-transparent" />
        {isActive && !isLoading ? (
          <div className="space-y-2 text-center">
            <span className="text-4xs font-mono uppercase tracking-widest text-cyan-400 block animate-pulse">
              [WebGL Render Active]
            </span>
            <div className="w-24 h-24 mx-auto border-2 border-dashed border-cyan-500/20 rounded-full flex items-center justify-center animate-spin duration-10000">
              <Compass className="w-8 h-8 text-cyan-500/30" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase font-outfit">
              Structure {pdbId} ({representation})
            </h4>
            <p className="text-3xs font-mono text-slate-500">
              Coloring: {colorMode} • Resolution: 2.1 Å
            </p>
          </div>
        ) : null}
      </div>

      {/* Activation Guard Overlay */}
      {!isActive && (
        <div 
          onClick={handleActivate}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group-hover:bg-slate-950/70 z-20"
          data-testid="mol-viewer-activation-guard"
        >
          <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3 animate-pulse">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
          <span className="text-sm font-bold text-white font-outfit">Activate 3D Mol* Viewer</span>
          <span className="text-xs text-slate-400 mt-1 font-mono">PDB: {pdbId}</span>
          <span className="text-3xs text-slate-500 mt-2 font-outfit text-center max-w-xs leading-normal">
            Clicking locks touch scroll gestures and loads WebGL graphics context.
          </span>
        </div>
      )}

      {/* Loading Overlay */}
      {isActive && isLoading && (
        <div 
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-30" 
          data-testid="mol-viewer-loading"
        >
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-3" />
          <span className="text-xs font-mono text-cyan-400 tracking-wider">LOADING PDB STRUCTURE...</span>
          <span className="text-3xs text-slate-500 mt-1 font-mono">Connecting to PDB REST API</span>
        </div>
      )}

      {/* Floating Control Pad Overlay */}
      {isActive && !isLoading && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-slate-950/70 backdrop-blur-md border border-white/10 p-2 rounded-xl shadow-lg z-10 animate-fade-in">
          {/* Zoom controls */}
          <div className="flex space-x-1">
            <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors" title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors" title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors" title="Recenter">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="w-px h-5 bg-white/10 self-center" />

          {/* Representation Selector */}
          <div className="flex items-center space-x-1.5">
            {(['cartoon', 'surface', 'spheres'] as const).map((rep) => (
              <button
                key={rep}
                onClick={() => setRepresentation(rep)}
                className={`px-2 py-0.5 rounded text-3xs font-extrabold uppercase transition-all ${
                  representation === rep
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {rep}
              </button>
            ))}
          </div>

          <span className="w-px h-5 bg-white/10 self-center" />

          {/* Coloring Selection */}
          <div className="flex items-center space-x-1.5">
            {(['plddt', 'chain'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setColorMode(mode)}
                className={`px-2 py-0.5 rounded text-3xs font-extrabold uppercase transition-all ${
                  colorMode === mode
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default MolViewer;
