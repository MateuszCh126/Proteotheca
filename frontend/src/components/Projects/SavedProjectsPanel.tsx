import { useEffect, useState } from 'react';
import { Archive, FolderOpen, RefreshCw, X } from 'lucide-react';
import { projectsApi, type SavedProject } from '../../api/projects';
import { useI18n } from '../../context/I18nContext';

interface SavedProjectsPanelProps {
  open: boolean;
  onClose: () => void;
  onLoad: (state: Record<string, unknown>) => void;
}

export default function SavedProjectsPanel({ open, onClose, onLoad }: SavedProjectsPanelProps) {
  const { t } = useI18n();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingProjectId, setActingProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await projectsApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.couldNotLoadList'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void loadProjects();
    }
  }, [open]);

  if (!open) return null;

  const loadProject = async (project: SavedProject) => {
    setActingProjectId(project.id);
    setError(null);
    try {
      const fullProject = await projectsApi.get(project.id);
      const state = fullProject.latest_snapshot?.state;
      if (!state) {
        setError(t('projects.noSnapshot'));
        return;
      }
      onLoad(state);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.couldNotLoad'));
    } finally {
      setActingProjectId(null);
    }
  };

  const archiveProject = async (project: SavedProject) => {
    setActingProjectId(project.id);
    setError(null);
    try {
      await projectsApi.archive(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.couldNotArchive'));
    } finally {
      setActingProjectId(null);
    }
  };

  return (
    <aside className="fixed right-4 top-20 z-[90] w-[min(420px,calc(100vw-2rem))] max-h-[calc(100vh-6rem)] overflow-hidden border border-line p-4 shadow-2xl glass-panel">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-ink">
          <FolderOpen className="h-4 w-4 shrink-0 text-ink" />
          <span className="truncate">{t('projects.savedProjects')}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => void loadProjects()} className="rounded-lg p-1.5 hover:bg-wash" aria-label={t('projects.refresh')}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-wash" aria-label={t('projects.closePanel')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && <p className="py-4 text-xs text-ink-2">{t('projects.loadingSaved')}</p>}
      {error && <p className="mt-3 rounded-lg border border-red-400/20 bg-wash px-3 py-2 text-xs text-red-200">{error}</p>}

      <div className="custom-scrollbar max-h-[70vh] overflow-y-auto divide-y divide-line">
        {!loading && projects.length === 0 && <p className="py-4 text-xs text-ink-2">{t('projects.empty')}</p>}

        {projects.map((project) => (
          <article key={project.id} className="space-y-2 py-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-ink">{project.title}</h3>
              <p className="truncate text-[0.65rem] text-ink-2">
                {project.entity_type.toUpperCase()} / {project.query}
              </p>
            </div>
            {project.description && <p className="line-clamp-2 text-xs text-ink-2">{project.description}</p>}
            {project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-line bg-wash px-2 py-0.5 text-[0.6rem] text-ink">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void loadProject(project)}
                disabled={actingProjectId === project.id}
                className="rounded-lg bg-ink px-2.5 py-1.5 text-xs font-bold text-paper hover:bg-ink disabled:opacity-60"
              >
                {t('common.load')}
              </button>
              <button
                type="button"
                onClick={() => void archiveProject(project)}
                disabled={actingProjectId === project.id}
                className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-ink-2 hover:bg-wash disabled:opacity-60"
              >
                <Archive className="mr-1 inline-block h-3.5 w-3.5" />
                {t('common.archive')}
              </button>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
