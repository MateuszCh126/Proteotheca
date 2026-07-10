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

  const segBtn = (active: boolean) =>
    `rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${
      active ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
    }`;

  return (
    <div className="w-full" data-testid="mol-viewer-container">
      {/* Stage */}
      <div className="relative h-[500px] w-full overflow-hidden bg-[radial-gradient(120%_100%_at_50%_0%,#ffffff_0%,#f2f4f7_100%)]">
        {/* WebGL Canvas Parent Mount Point */}
        <div ref={parentRef} className="absolute inset-0 z-0 h-full w-full" />

        {/* Loading Overlay */}
        {isViewerLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/70 backdrop-blur-sm">
            <div className="mb-4 h-7 w-7 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              {t('mol.fetching') || 'Loading structure…'}
            </span>
          </div>
        )}

        {/* Corner labels */}
        <span className="absolute left-4 top-4 z-10 rounded-full border border-line bg-surface/90 px-3 py-1 font-mono text-[11px] text-ink-2 shadow-sm">
          PDB {pdbId}
        </span>
        <span className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1 font-mono text-[11px] text-ink-2 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-benign" />
          {t('mol.interactive3d')}
        </span>

        {/* pLDDT legend */}
        {colorMode === 'plddt' && (
          <div className="absolute bottom-4 left-4 z-10 select-none">
            <div className="h-1.5 w-[130px] rounded-full bg-[linear-gradient(90deg,hsl(var(--plddt-1)),hsl(var(--plddt-2))_42%,hsl(var(--plddt-3))_74%,hsl(var(--plddt-4)))]" />
            <div className="mt-1 flex w-[130px] justify-between font-mono text-[9px] text-ink-3">
              <span>low pLDDT</span><span>high</span>
            </div>
          </div>
        )}
      </div>

      {/* Control bar (below the stage, on the card) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={handleZoomIn} title={t('mol.zoomIn')} className="rounded-lg p-2 text-ink-2 transition-colors hover:bg-wash hover:text-ink">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={handleZoomOut} title={t('mol.zoomOut')} className="rounded-lg p-2 text-ink-2 transition-colors hover:bg-wash hover:text-ink">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={handleRecenter} title={t('mol.recenter')} className="rounded-lg p-2 text-ink-2 transition-colors hover:bg-wash hover:text-ink">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-line bg-wash p-1">
          {(['cartoon', 'surface', 'spheres'] as const).map((rep) => (
            <button key={rep} onClick={() => handleRepresentationChange(rep)} className={segBtn(representation === rep)}>
              {t(`mol.${rep}` as const)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-full border border-line bg-wash p-1">
          {(['plddt', 'chain', 'hydrophobicity'] as const).map((mode) => (
            <button key={mode} onClick={() => handleColorModeChange(mode)} className={segBtn(colorMode === mode)}>
              {t(`mol.${mode}` as const)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MolViewer;
