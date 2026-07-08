import React, { useState, useEffect, useRef } from 'react';
import { Atom, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { Viewer } from 'molstar/lib/apps/viewer/app';
import { PresetStructureRepresentations } from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset';
import 'molstar/build/viewer/molstar.css';
import { API_BASE } from '../../api/client';


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
  const { t } = useI18n();
  const [internalRepresentation, setInternalRepresentation] = useState<MolViewerRepresentation>('cartoon');
  const [internalColorMode, setInternalColorMode] = useState<MolViewerColorMode>('plddt');
  const representation = controlledRepresentation ?? internalRepresentation;
  const colorMode = controlledColorMode ?? internalColorMode;

  const parentRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [isViewerLoading, setIsViewerLoading] = useState(false);

  // Initialize and load structure on pdbId change
  useEffect(() => {
    let active = true;
    let viewerInstance: Viewer | null = null;

    async function init() {
      if (!parentRef.current) return;
      setIsViewerLoading(true);
      try {
        // Clear previous container contents
        parentRef.current.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'w-full h-full relative';
        parentRef.current.appendChild(container);

        viewerInstance = await Viewer.create(container, {
          layoutIsExpanded: false,
          layoutShowControls: false,
          layoutShowRemoteState: false,
          layoutShowSequence: false,
          layoutShowLog: false,
          layoutShowLeftPanel: false,
          viewportShowExpand: false,
          viewportShowControls: false,
          viewportShowSettings: false,
          viewportShowSelectionMode: false,
          viewportShowAnimation: false,
          viewportShowTrajectoryControls: false,
        });

        if (!active) {
          viewerInstance.dispose();
          return;
        }

        viewerRef.current = viewerInstance;

        // Load molecular structure
        if (pdbId) {
          if (pdbId.startsWith('AF-')) {
            await viewerInstance.loadAlphaFoldDb(pdbId);
          } else {
            await viewerInstance.loadPdb(pdbId);
          }
        }

        // Apply initial visual settings
        await applyVisualSettings(viewerInstance, representation, colorMode);
      } catch (err) {
        console.error('Failed to initialize MolStar viewer', err);
      } finally {
        if (active) {
          setIsViewerLoading(false);
        }
      }
    }

    init();

    return () => {
      active = false;
      if (viewerInstance) {
        viewerInstance.dispose();
      }
      if (parentRef.current) {
        parentRef.current.innerHTML = '';
      }
      viewerRef.current = null;
    };
  }, [pdbId]);

  // Apply visual settings on representation or colorMode change
  useEffect(() => {
    if (viewerRef.current && !isViewerLoading) {
      applyVisualSettings(viewerRef.current, representation, colorMode);
    }
  }, [representation, colorMode, isViewerLoading]);

  // Helper to apply representation and coloring modes
  const applyVisualSettings = async (
    viewer: Viewer,
    rep: MolViewerRepresentation,
    col: MolViewerColorMode
  ) => {
    try {
      const structures = viewer.plugin.managers.structure.hierarchy.current.structures;
      if (structures.length === 0) return;

      const preset =
        rep === 'surface'
          ? PresetStructureRepresentations['molecular-surface']
          : rep === 'spheres'
          ? PresetStructureRepresentations.auto
          : PresetStructureRepresentations['polymer-cartoon'];

      const colorTheme =
        col === 'plddt'
          ? 'plddt-plus-model-index'
          : col === 'hydrophobicity'
          ? 'hydrophobicity'
          : 'chain-id';

      await viewer.plugin.managers.structure.component.applyPreset(structures, preset, {
        theme: {
          globalName: colorTheme as any,
        },
      } as any);
    } catch (err) {
      console.warn('Could not apply visual settings to MolStar', err);
    }
  };

  const handleRepresentationChange = (nextRepresentation: MolViewerRepresentation) => {
    setInternalRepresentation(nextRepresentation);
    onRepresentationChange?.(nextRepresentation);
  };

  const handleColorModeChange = (nextColorMode: MolViewerColorMode) => {
    setInternalColorMode(nextColorMode);
    onColorModeChange?.(nextColorMode);
  };

  const handleZoomIn = () => {
    const camera = viewerRef.current?.plugin.canvas3d?.camera;
    if (camera) {
      const snapshot = camera.getSnapshot();
      camera.setState({ radius: snapshot.radius * 0.85 }, 150);
    }
  };

  const handleZoomOut = () => {
    const camera = viewerRef.current?.plugin.canvas3d?.camera;
    if (camera) {
      const snapshot = camera.getSnapshot();
      camera.setState({ radius: snapshot.radius * 1.15 }, 150);
    }
  };

  const handleRecenter = () => {
    viewerRef.current?.plugin.canvas3d?.requestCameraReset();
  };

  const [isRendering, setIsRendering] = useState(false);

  const handleGenerateDetailedRender = async () => {
    setIsRendering(true);
    try {
      const payload = {
        pdb_id: pdbId,
        representation: representation,
        color_by: colorMode === 'chain' ? 'chain' : 'plddt',
        residues: []
      };

      const response = await fetch(`${API_BASE}/api/pymol/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'image/png'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to generate render');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pdbId}_pymol_${representation}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PyMOL render error:', err);
      alert('Failed to generate PyMOL render.');
    } finally {
      setIsRendering(false);
    }
  };

  return (

    <div
      className="group relative flex h-[400px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-inner backdrop-blur-md"
      data-testid="mol-viewer-container"
    >
      {/* WebGL Canvas Parent Mount Point */}
      <div ref={parentRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Loading Overlay */}
      {isViewerLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-3xs font-mono text-cyan-300 uppercase tracking-widest">
            {t('mol.fetching') || 'Loading structure...'}
          </span>
        </div>
      )}

      {/* Custom UI Header Controls */}
      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-center justify-between gap-3 text-3xs font-bold uppercase tracking-[0.18em] text-slate-400">
        <div className="flex gap-2">
          <span className="pointer-events-auto rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">
            PDB {pdbId}
          </span>
          <button
            onClick={handleGenerateDetailedRender}
            disabled={isRendering}
            data-testid="pymol-render-btn"
            className="pointer-events-auto rounded-full border border-cyan-400/35 bg-cyan-500/20 hover:bg-cyan-500/30 px-3 py-1 text-cyan-200 font-bold uppercase cursor-pointer disabled:bg-slate-800 disabled:border-white/5 transition-all"
          >
            {isRendering ? 'Rendering...' : 'Generate Detailed Render'}
          </button>
        </div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-200">
          {t('mol.previewReady')}
        </span>
      </div>

      {/* Control Overlay Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-2 shadow-lg backdrop-blur-md">
        <div className="flex space-x-1">
          <button
            onClick={handleZoomIn}
            className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10"
            title={t('mol.zoomIn')}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10"
            title={t('mol.zoomOut')}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleRecenter}
            className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10"
            title={t('mol.recenter')}
          >
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
              {t(`mol.${rep}` as const)}
            </button>
          ))}
        </div>

        <span className="h-5 w-px self-center bg-white/10" />

        <div className="flex items-center space-x-1.5">
          {(['plddt', 'chain', 'hydrophobicity'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleColorModeChange(mode)}
              className={`rounded border px-2 py-0.5 text-3xs font-extrabold uppercase transition-all ${
                colorMode === mode
                  ? 'border-cyan-500/30 bg-cyan-500/20 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t(`mol.${mode}` as const)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MolViewer;
