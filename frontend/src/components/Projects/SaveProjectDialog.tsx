import React, { useMemo, useState } from 'react';
import { Save, X } from 'lucide-react';
import { type EntityType, projectsApi, type SavedProject } from '../../api/projects';
import { useI18n } from '../../context/I18nContext';

interface SaveProjectDialogProps {
  state: Record<string, unknown>;
  defaultTitle: string;
  entityType: EntityType;
  query: string;
  onClose: () => void;
  onSaved: (project: SavedProject) => void;
}

export default function SaveProjectDialog({
  state,
  defaultTitle,
  entityType,
  query,
  onClose,
  onSaved,
}: SaveProjectDialogProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState(query);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tags = useMemo(
    () =>
      tagInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagInput],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const project = await projectsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        entity_type: entityType,
        query,
        tags,
        state,
      });
      onSaved(project);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.couldNotSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
      <form onSubmit={submit} className="glass-panel w-full max-w-lg space-y-4 border border-cyan-400/20 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-white">
            <Save className="h-4 w-4 shrink-0 text-cyan-300" />
            <span className="truncate">{t('projects.saveResearchProject')}</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10" aria-label={t('projects.closeSaveDialog')}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          className="biomed-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Project Name"
          required
          maxLength={255}
        />
        <textarea
          className="biomed-input min-h-24 resize-none"
          placeholder={t('projects.description')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <input
          className="biomed-input"
          placeholder={t('projects.tagsCommaSeparated')}
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
        />

        <div className="flex items-center justify-between gap-3 text-[0.65rem] text-slate-400">
          <span className="min-w-0 truncate">
            {entityType.toUpperCase()} / {query}
          </span>
          <span className="shrink-0">{t('projects.tagsCount', { count: tags.length })}</span>
        </div>

        {error && <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {saving ? t('common.saving') : t('projects.saveProject')}
          </button>
        </div>
      </form>
    </div>
  );
}
