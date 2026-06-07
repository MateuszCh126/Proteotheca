import { apiJson } from './client';

export type EntityType = 'gene' | 'variant' | 'disease' | 'mixed';

export interface ProjectSnapshot {
  id: string;
  project_id: string;
  name?: string | null;
  state: Record<string, unknown>;
  created_at: string;
}

export interface SavedProject {
  id: string;
  title: string;
  description?: string | null;
  entity_type: EntityType;
  query: string;
  tags: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  latest_snapshot?: ProjectSnapshot | null;
}

export interface ProjectCreatePayload {
  title: string;
  description?: string;
  entity_type: EntityType;
  query: string;
  tags: string[];
  state: Record<string, unknown>;
}

export const projectsApi = {
  list: () => apiJson<SavedProject[]>('/api/projects'),
  create: (payload: ProjectCreatePayload) =>
    apiJson<SavedProject>('/api/projects', { method: 'POST', body: JSON.stringify(payload) }),
  get: (id: string) => apiJson<SavedProject>(`/api/projects/${id}`),
  archive: (id: string) => apiJson<{ message: string }>(`/api/projects/${id}`, { method: 'DELETE' }),
};
