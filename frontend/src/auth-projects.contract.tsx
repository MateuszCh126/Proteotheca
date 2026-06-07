import type { ComponentProps } from 'react';
import AuthDialog from './components/Auth/AuthDialog';
import UserMenu from './components/Auth/UserMenu';
import SaveProjectDialog from './components/Projects/SaveProjectDialog';
import SavedProjectsPanel from './components/Projects/SavedProjectsPanel';
import { API_BASE, apiJson } from './api/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { authApi, type AuthResponse, type LoginPayload, type RegisterPayload, type User } from './api/auth';
import {
  projectsApi,
  type EntityType,
  type ProjectCreatePayload,
  type ProjectSnapshot,
  type SavedProject,
} from './api/projects';

const authResponse: AuthResponse = {
  user: {
    id: 'user-1',
    email: 'ada@example.com',
    first_name: 'Ada',
    last_name: 'Lovelace',
    role: 'user',
    created_at: '2026-06-07T00:00:00Z',
    last_active_at: null,
  },
};

const user: User = authResponse.user;
const registerPayload: RegisterPayload = {
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: user.email,
  password: 'password123',
};
const loginPayload: LoginPayload = {
  email: user.email,
  password: 'password123',
};

const entityType: EntityType = 'mixed';
const snapshot: ProjectSnapshot = {
  id: 'snapshot-1',
  project_id: 'project-1',
  name: null,
  state: { gene: null, variant: null, disease: null, literature: null },
  created_at: '2026-06-07T00:00:00Z',
};
const createPayload: ProjectCreatePayload = {
  title: 'BioMed session research project',
  entity_type: entityType,
  query: 'BioMed session',
  tags: ['BioMed session'],
  state: snapshot.state,
};
const savedProject: SavedProject = {
  id: 'project-1',
  title: createPayload.title,
  description: null,
  entity_type: entityType,
  query: createPayload.query,
  tags: createPayload.tags,
  is_archived: false,
  created_at: snapshot.created_at,
  updated_at: snapshot.created_at,
  latest_snapshot: snapshot,
};

void API_BASE;
void apiJson<AuthResponse>('/api/auth/me');
void authApi.register(registerPayload);
void authApi.login(loginPayload);
void authApi.logout();
void authApi.me();
void projectsApi.list();
void projectsApi.create(createPayload);
void projectsApi.get(savedProject.id);
void projectsApi.archive(savedProject.id);
void AuthProvider;
void useAuth;
void UserMenu;

const authDialogProps: ComponentProps<typeof AuthDialog> = {
  mode: 'login',
  onClose: () => undefined,
};
const saveProjectProps: ComponentProps<typeof SaveProjectDialog> = {
  state: createPayload.state,
  defaultTitle: createPayload.title,
  entityType,
  query: createPayload.query,
  onClose: () => undefined,
  onSaved: () => undefined,
};
const savedProjectsPanelProps: ComponentProps<typeof SavedProjectsPanel> = {
  open: true,
  onClose: () => undefined,
  onLoad: () => undefined,
};

void authDialogProps;
void saveProjectProps;
void savedProjectsPanelProps;
