# Auth, Database, and User Projects Design

## Context

BioMed Explorer is a React/Vite frontend with a FastAPI backend. The next feature adds persistent users, registration, login, logout, current-session lookup, and saved research projects. The implementation should reuse the behavioral pattern from `C:\Users\gamin\.gemini\antigravity\scratch\exotic-pets\animalsshop`: bcrypt password hashing, JWT-based authentication, `httpOnly` cookies, `/register`, `/login`, `/logout`, and `/me`.

The code will be adapted to Python/FastAPI instead of copied from the Express implementation.

## Database Recommendation

Use Neon Postgres on the free tier for the first deployed version.

Reasons:

- Postgres fits the data model: users, sessions, projects, project snapshots, saved analysis state, and JSONB payloads.
- Neon works well with Vercel-hosted frontends and serverless-style deployment.
- Vercel Marketplace can provision Neon and inject database credentials into the Vercel project environment.
- The same Postgres schema can scale to paid Neon or another Postgres host without changing the application model.

Required environment variables:

- `DATABASE_URL`: pooled Postgres connection string for application queries.
- `JWT_SECRET`: long random secret used to sign access tokens.
- `AUTH_COOKIE_SECURE`: true in production, false for local development.
- `CORS_ALLOWED_ORIGINS`: comma-separated frontend origins.

## Scope

This spec covers:

- User registration and login.
- Secure password storage.
- Authenticated session handling through signed JWTs in `httpOnly` cookies.
- Current user endpoint.
- Logout.
- User-owned saved projects.
- Project snapshots containing BioMed Explorer analysis state.
- Backend tests for auth and project ownership.
- Frontend auth shell and project save/load UI entry points.

This spec does not cover:

- GitHub publishing.
- Payments.
- Patient/PHI workflows.
- Team collaboration or project sharing.
- HIPAA-grade production compliance.

## Backend Architecture

Add modules under `backend/app`:

- `database.py`: async SQLAlchemy engine/session factory using `DATABASE_URL`.
- `models.py`: SQLAlchemy ORM models.
- `schemas/auth.py`: Pydantic request/response schemas.
- `schemas/projects.py`: Pydantic project schemas.
- `security.py`: password hashing, JWT creation/verification, cookie helpers.
- `dependencies.py`: `get_db`, `get_current_user`, and authorization helpers.
- `api/auth.py`: auth routes.
- `api/projects.py`: user project routes.

Use Alembic or a checked-in SQL migration file. For this phase, a checked-in SQL migration is acceptable if it is easy to run locally and in Neon. Alembic is preferred if the backend already starts accumulating schema versions.

## Data Model

### users

- `id UUID PRIMARY KEY`
- `email TEXT UNIQUE NOT NULL`
- `password_hash TEXT NOT NULL`
- `first_name TEXT`
- `last_name TEXT`
- `role TEXT NOT NULL DEFAULT 'user'`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `last_active_at TIMESTAMPTZ`
- `deleted_at TIMESTAMPTZ`

Indexes:

- unique index on lowercased email
- index on `deleted_at`

### user_sessions

- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `token_jti TEXT UNIQUE NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `expires_at TIMESTAMPTZ NOT NULL`
- `revoked_at TIMESTAMPTZ`
- `user_agent TEXT`
- `ip_address TEXT`

This enables logout and future session revocation without trusting JWT expiry alone.

### projects

- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `title TEXT NOT NULL`
- `description TEXT`
- `entity_type TEXT NOT NULL` with values `gene`, `variant`, `disease`, or `mixed`
- `query TEXT NOT NULL`
- `tags TEXT[] NOT NULL DEFAULT '{}'`
- `is_archived BOOLEAN NOT NULL DEFAULT false`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Indexes:

- `(user_id, updated_at DESC)`
- `(user_id, entity_type)`
- GIN index on tags

### project_snapshots

- `id UUID PRIMARY KEY`
- `project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE`
- `name TEXT`
- `state JSONB NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

The `state` JSON stores the active BioMed Explorer view:

- loaded gene, variant, disease, and literature identifiers
- fetched or mock result payloads
- Mol* view settings
- highlighted residues/domains
- PyMOL render settings
- user notes and panel layout state

Indexes:

- `(project_id, created_at DESC)`
- GIN index on `state` if snapshot search is added later

## Auth API

Base path: `/api/auth`

### POST `/register`

Request:

```json
{
  "first_name": "Mateusz",
  "last_name": "Chachula",
  "email": "user@example.com",
  "password": "minimum-8-chars"
}
```

Behavior:

- Normalize email to lowercase.
- Validate name, email, and password.
- Hash password with bcrypt.
- Reject duplicate emails with 409.
- Create user and session.
- Set signed JWT as `httpOnly` cookie.
- Return safe user data.

### POST `/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "minimum-8-chars"
}
```

Behavior:

- Normalize email.
- Compare password with bcrypt hash.
- Create session and JWT.
- Set `httpOnly` cookie.
- Return safe user data.
- Return 401 for invalid credentials without revealing which field failed.

### POST `/logout`

Behavior:

- Revoke current session by JWT `jti` if present.
- Clear auth cookie.
- Return success JSON.

### GET `/me`

Behavior:

- Read auth cookie or optional Bearer token.
- Verify signature, expiry, session `jti`, and user existence.
- Return safe user data.
- Return 401 when unauthenticated.

## Projects API

Base path: `/api/projects`

All routes require authentication.

### GET `/`

Returns the authenticated user's projects ordered by most recently updated.

### POST `/`

Creates a project and initial snapshot.

Request:

```json
{
  "title": "BRAF V600E melanoma analysis",
  "description": "Initial target and therapeutic review",
  "entity_type": "variant",
  "query": "rs113488022",
  "tags": ["BRAF", "melanoma"],
  "state": {
    "gene_symbol": "BRAF",
    "variant_id": "rs113488022",
    "selected_residues": [600],
    "molstar": { "representation": "cartoon" }
  }
}
```

### GET `/{project_id}`

Returns one project with its latest snapshot. Must enforce owner-only access.

### PUT `/{project_id}`

Updates project metadata. Must enforce owner-only access.

### POST `/{project_id}/snapshots`

Adds a new saved state snapshot. Must enforce owner-only access.

### DELETE `/{project_id}`

Soft-archives the project by setting `is_archived = true`. Hard deletion is not part of this phase.

## Frontend Architecture

Add:

- `src/context/AuthContext.tsx`: session restore, login, register, logout, current user.
- `src/api/auth.ts`: auth API client using `credentials: 'include'`.
- `src/api/projects.ts`: projects API client using `credentials: 'include'`.
- Auth UI in the header: signed-out login/register actions and signed-in user menu.
- Save project action near the active research session controls.
- Saved projects panel or drawer with load and archive actions.

The UI should keep the existing premium scientific dashboard style. Auth and project controls should be compact, clinical, and work-focused. They should not turn the app into a landing page.

## Security Rules

- Never store raw passwords.
- Never expose `password_hash`.
- Use `httpOnly`, `SameSite=Lax`, secure cookies in production.
- Restrict CORS to configured origins instead of `*` when auth cookies are enabled.
- Use parameterized queries through SQLAlchemy.
- Enforce user ownership for every project read/write.
- Return generic login errors.
- Do not commit `.env` files or real connection strings.

## Testing

Backend pytest coverage:

- register succeeds and returns safe user data
- duplicate email returns 409
- login succeeds with correct password
- login fails with wrong password
- `/me` succeeds with session cookie
- logout revokes session
- project create/list/get works for owner
- project access is denied for another user
- project snapshot creation stores JSON state
- archived projects do not appear in the default list

Frontend coverage can start with focused smoke tests:

- signed-out header shows login/register controls
- after mocked login, user menu appears
- save project calls project API with active BioMed Explorer state
- saved project load restores the dashboard state

## Deployment Notes

For Vercel frontend plus separate FastAPI backend, configure:

- frontend `VITE_API_URL`
- backend `DATABASE_URL`
- backend `JWT_SECRET`
- backend `CORS_ALLOWED_ORIGINS`

If the backend is later deployed as Vercel Python functions, verify FastAPI routing and database connection lifecycle separately. A dedicated Python host for the backend is acceptable if PyMOL rendering requires heavier runtime support.

## Acceptance Criteria

- Users can register, log in, restore session, and log out.
- Auth cookies are `httpOnly`.
- Authenticated users can create, list, open, update, snapshot, and archive their own projects.
- Users cannot access another user's projects.
- Saved project state can represent gene, variant, disease, molecular viewer, render, and note data.
- Backend tests cover auth and project ownership.
- No secrets are committed.
