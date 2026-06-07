import React, { useState } from 'react';
import { Atom, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

export type MolViewerRepresentation = 'cartoon' | 'surface' | 'spheres';
export type MolViewerColorMode = 'plddt' | 'chain' | 'hydrophobicity';

interface MolViewerProps {
  pdbId?: string;
  representation?: MolViewerRepresentation;
  colorMode?: MolViewerColorMode;
  onRepresentationChange?: (representation: MolViewerRepresentation) => void;
  onColorModeChange?: (colorMode: MolViewerColorMode) => void;
}

export const MolViewer: React.FC<MolViewerProps> = ({
  pdbId = '1UWH',
  representation: controlledRepresentation,
  colorMode: controlledColorMode,
  onRepresentationChange,
  onColorModeChange,
}) => {
  const [internalRepresentation, setInternalRepresentation] = useState<MolViewerRepresentation>('cartoon');
  const [internalColorMode, setInternalColorMode] = useState<MolViewerColorMode>('plddt');
  const representation = controlledRepresentation ?? internalRepresentation;
  const colorMode = controlledColorMode ?? internalColorMode;

  const handleRepresentationChange = (nextRepresentation: MolViewerRepresentation) => {
    setInternalRepresentation(nextRepresentation);
    onRepresentationChange?.(nextRepresentation);
  };

  const handleColorModeChange = (nextColorMode: MolViewerColorMode) => {
    setInternalColorMode(nextColorMode);
    onColorModeChange?.(nextColorMode);
  };

  return (
    <div
      className="group relative flex h-[400px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-inner backdrop-blur-md"
      data-testid="mol-viewer-container"
    >
      <div className="pointer-events-none absolute inset-0 z-0 select-none">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(34,211,238,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.35)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between gap-3 text-3xs font-bold uppercase tracking-[0.18em] text-slate-400">
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">
          PDB {pdbId}
        </span>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-200">
          Preview ready
        </span>
      </div>

      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 block text-3xs font-bold uppercase tracking-[0.28em] text-cyan-300">
          Structure Preview Ready
        </span>
        <div className="relative mx-auto mb-5 h-32 w-32">
          <div className="absolute inset-0 rounded-full border border-cyan-400/20 bg-cyan-400/5 shadow-[0_0_55px_rgba(34,211,238,0.18)]" />
          <div className="absolute left-7 top-9 h-px w-20 rotate-[28deg] bg-cyan-300/30" />
          <div className="absolute left-7 top-[70px] h-px w-20 -rotate-[24deg] bg-violet-300/25" />
          <div className="absolute left-14 top-6 h-20 w-px rotate-[12deg] bg-emerald-300/25" />
          <span className="absolute left-5 top-8 h-6 w-6 rounded-full border border-cyan-300/70 bg-cyan-300/20 shadow-[0_0_18px_rgba(34,211,238,0.35)]" />
          <span className="absolute right-4 top-14 h-5 w-5 rounded-full border border-violet-300/70 bg-violet-300/20 shadow-[0_0_18px_rgba(167,139,250,0.3)]" />
          <span className="absolute bottom-8 left-10 h-4 w-4 rounded-full border border-emerald-300/70 bg-emerald-300/20" />
          <span className="absolute right-9 top-7 h-3 w-3 rounded-full bg-cyan-200/70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Atom className="h-10 w-10 text-cyan-200/70" />
          </div>
        </div>
        <h4 className="font-outfit text-sm font-extrabold uppercase text-white">
          Structure {pdbId} ({representation})
        </h4>
        <p className="mt-1 font-mono text-3xs text-slate-500">
          Coloring: {colorMode} | Ligand-ready model preview
        </p>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-2 shadow-lg backdrop-blur-md">
        <div className="flex space-x-1">
          <button className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10" title="Zoom In">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10" title="Zoom Out">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10" title="Recenter">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <span className="h-5 w-px self-center bg-white/10" />

        <div className="flex items-center space-x-1.5">
          {(['cartoon', 'surface', 'spheres'] as const).map((rep) => (
            <button
              key={rep}
              onClick={() => handleRepresentationChange(rep)}
              className={`rounded border px-2 py-0.5 text-3xs font-extrabold uppercase transition-all ${
                representation === rep
                  ? 'border-cyan-500/30 bg-cyan-500/20 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {rep}
            </button>
          ))}
        </div>

        <span className="h-5 w-px self-center bg-white/10" />

        <div className="flex items-center space-x-1.5">
          {(['plddt', 'chain'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleColorModeChange(mode)}
              className={`rounded border px-2 py-0.5 text-3xs font-extrabold uppercase transition-all ${
                colorMode === mode
                  ? 'border-cyan-500/30 bg-cyan-500/20 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MolViewer;
