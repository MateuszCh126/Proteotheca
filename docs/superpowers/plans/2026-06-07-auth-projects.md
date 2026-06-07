# Auth and Saved Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Neon-ready Postgres persistence, FastAPI registration/login/session endpoints, and authenticated saved research projects for BioMed Explorer.

**Architecture:** The backend gets a small async SQLAlchemy persistence layer, JWT sessions stored in `httpOnly` cookies, and owner-scoped project APIs. The frontend gets an auth context, compact header auth controls, and a saved-projects panel that persists and restores the current BioMed Explorer analysis state.

**Tech Stack:** FastAPI, Pydantic v2, SQLAlchemy async, asyncpg, aiosqlite for tests, passlib/bcrypt, python-jose, React/Vite/TypeScript.

---

## File Structure

Backend files:

- Create `backend/app/database.py`: async SQLAlchemy engine/session lifecycle and schema initialization helper for tests/local dev.
- Create `backend/app/models.py`: ORM models for users, sessions, projects, and project snapshots.
- Create `backend/app/security.py`: password hashing, JWT signing/verification, cookie names/options.
- Create `backend/app/dependencies.py`: database session and current-user dependency.
- Create `backend/app/schemas/__init__.py`: schema package marker.
- Create `backend/app/schemas/auth.py`: auth request/response schemas.
- Create `backend/app/schemas/projects.py`: project request/response schemas.
- Create `backend/app/api/auth.py`: `/api/auth` routes.
- Create `backend/app/api/projects.py`: `/api/projects` routes.
- Create `backend/migrations/001_auth_projects.sql`: Neon/Postgres SQL migration.
- Modify `backend/app/config.py`: add auth, CORS, and database settings.
- Modify `backend/app/main.py`: wire auth/projects routers, safer CORS, DB initialization in local/test mode.
- Modify `backend/requirements.txt`: add persistence/auth dependencies.
- Modify `backend/tests/conftest.py`: isolate tests with temporary SQLite DB and dependency overrides.
- Create `backend/tests/test_auth.py`: auth behavior tests.
- Create `backend/tests/test_projects.py`: project ownership and snapshot tests.

Frontend files:

- Create `frontend/src/api/client.ts`: shared API base URL and JSON fetch helper.
- Create `frontend/src/api/auth.ts`: login/register/logout/me API functions.
- Create `frontend/src/api/projects.ts`: project CRUD API functions.
- Create `frontend/src/context/AuthContext.tsx`: auth state and session restore.
- Create `frontend/src/components/Auth/AuthDialog.tsx`: compact login/register dialog.
- Create `frontend/src/components/Auth/UserMenu.tsx`: signed-in user menu.
- Create `frontend/src/components/Projects/SaveProjectDialog.tsx`: save current analysis.
- Create `frontend/src/components/Projects/SavedProjectsPanel.tsx`: list/load/archive saved projects.
- Modify `frontend/src/main.tsx`: wrap app in `AuthProvider`.
- Modify `frontend/src/App.tsx`: wire auth controls and project save/load state.
- Modify `frontend/src/types`: add project/auth types if useful.

Notes:

- Use JSON list storage for `projects.tags` in ORM and tests. The Postgres migration may use `JSONB` for tags instead of `TEXT[]` to keep the application model portable across SQLite tests and Neon.
- No `.env` file with real values should be committed.
- Implement backend first and keep frontend API calls ready to work against `VITE_API_URL`.

---

## Task 1: Backend Dependencies and Configuration

**Files:**

- Modify: `backend/requirements.txt`
- Modify: `backend/app/config.py`
- Test: command-only verification

- [ ] **Step 1: Add backend dependencies**

Update `backend/requirements.txt` to include:

```txt
fastapi>=0.100.0
uvicorn>=0.22.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
httpx>=0.24.0
tenacity>=8.2.0
pytest>=7.0.0
pytest-asyncio>=0.21.0
sqlalchemy[asyncio]>=2.0.0
asyncpg>=0.29.0
aiosqlite>=0.19.0
passlib[bcrypt]>=1.7.4
python-jose[cryptography]>=3.3.0
email-validator>=2.0.0
```

- [ ] **Step 2: Extend settings**

Replace the `Settings` class in `backend/app/config.py` with:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mock_mode: bool = True
    host: str = "127.0.0.1"
    port: int = 8000

    database_url: str = "sqlite+aiosqlite:///./biomed_explorer.db"
    jwt_secret: str = "dev-only-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 24 * 60
    auth_cookie_name: str = "biomed_token"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"
    cors_allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    auto_create_tables: bool = True

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"
```

- [ ] **Step 3: Install dependencies**

Run:

```powershell
python -m pip install -r backend\requirements.txt
```

Expected: installation exits with code 0.

- [ ] **Step 4: Commit**

Run:

```powershell
git add backend\requirements.txt backend\app\config.py
git commit -m "Add backend auth database settings"
```

---

## Task 2: Database Models and Migration

**Files:**

- Create: `backend/app/database.py`
- Create: `backend/app/models.py`
- Create: `backend/migrations/001_auth_projects.sql`
- Test: import smoke command

- [ ] **Step 1: Create database session module**

Create `backend/app/database.py`:

```python
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models import Base

engine = create_async_engine(settings.database_url, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

async def create_all() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

- [ ] **Step 2: Create ORM models**

Create `backend/app/models.py`:

```python
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

def new_uuid() -> str:
    return str(uuid4())

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(50), default="user", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    sessions: Mapped[list["UserSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    projects: Mapped[list["Project"]] = relationship(back_populates="user", cascade="all, delete-orphan")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_jti: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    user_agent: Mapped[str | None] = mapped_column(Text)
    ip_address: Mapped[str | None] = mapped_column(String(64))

    user: Mapped[User] = relationship(back_populates="sessions")

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    entity_type: Mapped[str] = mapped_column(String(20), nullable=False)
    query: Mapped[str] = mapped_column(String(255), nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="projects")
    snapshots: Mapped[list["ProjectSnapshot"]] = relationship(back_populates="project", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_projects_user_updated", "user_id", "updated_at"),
        Index("idx_projects_user_entity", "user_id", "entity_type"),
    )

class ProjectSnapshot(Base):
    __tablename__ = "project_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255))
    state: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    project: Mapped[Project] = relationship(back_populates="snapshots")
```

- [ ] **Step 3: Add Neon/Postgres SQL migration**

Create `backend/migrations/001_auth_projects.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_jti TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    user_agent TEXT,
    ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('gene', 'variant', 'disease', 'mixed')),
    query TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_entity ON projects(user_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING gin(tags);

CREATE TABLE IF NOT EXISTS project_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT,
    state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_snapshots_project_created ON project_snapshots(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_snapshots_state ON project_snapshots USING gin(state);
```

- [ ] **Step 4: Verify imports**

Run:

```powershell
python -c "import sys; sys.path.insert(0, 'backend'); from app.models import User, Project; print(User.__tablename__, Project.__tablename__)"
```

Expected:

```text
users projects
```

- [ ] **Step 5: Commit**

Run:

```powershell
git add backend\app\database.py backend\app\models.py backend\migrations\001_auth_projects.sql
git commit -m "Add auth project database models"
```

---

## Task 3: Auth Security Helpers and Schemas

**Files:**

- Create: `backend/app/security.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/auth.py`
- Test: focused import/hash command

- [ ] **Step 1: Create auth schemas**

Create `backend/app/schemas/__init__.py` as an empty file.

Create `backend/app/schemas/auth.py`:

```python
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    role: str
    created_at: datetime
    last_active_at: datetime | None = None

    model_config = {"from_attributes": True}

class AuthResponse(BaseModel):
    user: UserResponse
```

- [ ] **Step 2: Create security helpers**

Create `backend/app/security.py`:

```python
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext
from starlette.responses import Response

from app.config import settings

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def normalize_email(email: str) -> str:
    return email.strip().lower()

def hash_password(password: str) -> str:
    return password_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return password_context.verify(password, password_hash)

def create_token_payload(user_id: str, email: str, role: str) -> tuple[str, datetime, str]:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expires_minutes)
    jti = uuid4().hex
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "jti": jti,
        "exp": expires_at,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expires_at, jti

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc

def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        max_age=settings.jwt_expires_minutes * 60,
        path="/",
    )

def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_cookie_name,
        path="/",
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        httponly=True,
    )
```

- [ ] **Step 3: Verify password hashing**

Run:

```powershell
python -c "import sys; sys.path.insert(0, 'backend'); from app.security import hash_password, verify_password; h=hash_password('password123'); print(verify_password('password123', h), verify_password('wrong', h))"
```

Expected:

```text
True False
```

- [ ] **Step 4: Commit**

Run:

```powershell
git add backend\app\security.py backend\app\schemas
git commit -m "Add auth security helpers"
```

---

## Task 4: Auth API with Tests

**Files:**

- Create: `backend/app/api/auth.py`
- Create: `backend/app/dependencies.py`
- Modify: `backend/app/main.py`
- Modify: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Write auth tests**

Create `backend/tests/test_auth.py`:

```python
import pytest

pytestmark = pytest.mark.asyncio

async def test_register_returns_safe_user_and_cookie(client):
    response = await client.post("/api/auth/register", json={
        "first_name": "Ada",
        "last_name": "Lovelace",
        "email": "ADA@example.com",
        "password": "password123",
    })

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "ada@example.com"
    assert "password_hash" not in body["user"]
    assert "biomed_token" in response.cookies

async def test_register_duplicate_email_returns_409(client):
    payload = {
        "first_name": "Ada",
        "last_name": "Lovelace",
        "email": "ada@example.com",
        "password": "password123",
    }
    assert (await client.post("/api/auth/register", json=payload)).status_code == 201

    response = await client.post("/api/auth/register", json=payload)

    assert response.status_code == 409

async def test_login_and_me_roundtrip(client):
    payload = {
        "first_name": "Grace",
        "last_name": "Hopper",
        "email": "grace@example.com",
        "password": "password123",
    }
    await client.post("/api/auth/register", json=payload)

    login = await client.post("/api/auth/login", json={
        "email": "grace@example.com",
        "password": "password123",
    })
    assert login.status_code == 200

    me = await client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "grace@example.com"

async def test_login_wrong_password_returns_401(client):
    await client.post("/api/auth/register", json={
        "first_name": "Alan",
        "last_name": "Turing",
        "email": "alan@example.com",
        "password": "password123",
    })

    response = await client.post("/api/auth/login", json={
        "email": "alan@example.com",
        "password": "wrong-password",
    })

    assert response.status_code == 401

async def test_logout_revokes_session(client):
    await client.post("/api/auth/register", json={
        "first_name": "Rosalind",
        "last_name": "Franklin",
        "email": "rosalind@example.com",
        "password": "password123",
    })

    logout = await client.post("/api/auth/logout")
    assert logout.status_code == 200

    me = await client.get("/api/auth/me")
    assert me.status_code == 401
```

- [ ] **Step 2: Run auth tests to verify failure**

Run:

```powershell
cd backend; pytest tests\test_auth.py -v
```

Expected: FAIL because `/api/auth/*` routes do not exist yet.

- [ ] **Step 3: Update test fixture**

Modify `backend/tests/conftest.py` to create isolated SQLite tables:

```python
import os
import sys
import tempfile

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import get_session
from app.main import app
from app.models import Base

@pytest.fixture
async def client():
    db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    db_file.close()
    test_engine = create_async_engine(f"sqlite+aiosqlite:///{db_file.name}", future=True)
    TestSession = async_sessionmaker(test_engine, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_session():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    await test_engine.dispose()
    os.unlink(db_file.name)
```

- [ ] **Step 4: Create auth dependencies**

Create `backend/app/dependencies.py`:

```python
from datetime import datetime, timezone

from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.models import User, UserSession
from app.security import decode_token

async def get_db(session: AsyncSession = Depends(get_session)) -> AsyncSession:
    return session

async def get_current_user(
    request: Request,
    authorization: str | None = Header(default=None),
    cookie_token: str | None = Cookie(default=None, alias=settings.auth_cookie_name),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = cookie_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = decode_token(token)
        user_id = payload["sub"]
        token_jti = payload["jti"]
    except (ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    session_result = await db.execute(
        select(UserSession).where(
            UserSession.token_jti == token_jti,
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > datetime.now(timezone.utc),
        )
    )
    user_session = session_result.scalar_one_or_none()
    if not user_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    user.last_active_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    return user
```

- [ ] **Step 5: Implement auth routes**

Create `backend/app/api/auth.py`:

```python
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_user
from app.models import User, UserSession
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.security import clear_auth_cookie, create_token_payload, hash_password, normalize_email, set_auth_cookie, verify_password

router = APIRouter()

def safe_user(user: User) -> UserResponse:
    return UserResponse.model_validate(user)

async def create_session_for_user(user: User, request: Request, db: AsyncSession) -> str:
    token, expires_at, jti = create_token_payload(user.id, user.email, user.role)
    session = UserSession(
        user_id=user.id,
        token_jti=jti,
        expires_at=expires_at,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    db.add(session)
    await db.commit()
    return token

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, request: Request, response: Response, db: AsyncSession = Depends(get_session)):
    email = normalize_email(payload.email)
    existing = await db.execute(select(User).where(User.email == email, User.deleted_at.is_(None)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        role="user",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = await create_session_for_user(user, request, db)
    set_auth_cookie(response, token)
    return AuthResponse(user=safe_user(user))

@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_session)):
    email = normalize_email(payload.email)
    result = await db.execute(select(User).where(User.email == email, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = await create_session_for_user(user, request, db)
    set_auth_cookie(response, token)
    return AuthResponse(user=safe_user(user))

@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    await db.execute(
        select(UserSession).where(UserSession.user_id == current_user.id, UserSession.revoked_at.is_(None))
    )
    sessions = await db.execute(select(UserSession).where(UserSession.user_id == current_user.id, UserSession.revoked_at.is_(None)))
    for session in sessions.scalars().all():
        session.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    clear_auth_cookie(response)
    return {"message": "Logged out"}

@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return safe_user(current_user)
```

- [ ] **Step 6: Wire router and DB startup**

Modify `backend/app/main.py` imports:

```python
from app.api import auth, diseases, genes, literature, projects, variants
from app.database import create_all
```

Inside lifespan before creating HTTP client:

```python
    if settings.auto_create_tables:
        await create_all()
```

Replace CORS origins:

```python
    allow_origins=settings.cors_origins,
```

Register auth router:

```python
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
```

- [ ] **Step 7: Run auth tests to verify pass**

Run:

```powershell
cd backend; pytest tests\test_auth.py -v
```

Expected: all tests in `test_auth.py` pass.

- [ ] **Step 8: Commit**

Run:

```powershell
git add backend\app\api\auth.py backend\app\dependencies.py backend\app\main.py backend\tests\conftest.py backend\tests\test_auth.py
git commit -m "Add FastAPI auth endpoints"
```

---

## Task 5: Projects API with Ownership Tests

**Files:**

- Create: `backend/app/schemas/projects.py`
- Create: `backend/app/api/projects.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_projects.py`

- [ ] **Step 1: Write project tests**

Create `backend/tests/test_projects.py`:

```python
import pytest

pytestmark = pytest.mark.asyncio

async def register_user(client, email):
    response = await client.post("/api/auth/register", json={
        "first_name": "Test",
        "last_name": "User",
        "email": email,
        "password": "password123",
    })
    assert response.status_code == 201
    return response.json()["user"]

async def test_create_and_list_project(client):
    await register_user(client, "owner@example.com")

    create = await client.post("/api/projects", json={
        "title": "BRAF V600E melanoma analysis",
        "description": "Initial review",
        "entity_type": "variant",
        "query": "rs113488022",
        "tags": ["BRAF", "melanoma"],
        "state": {"gene_symbol": "BRAF", "variant_id": "rs113488022"},
    })

    assert create.status_code == 201
    project = create.json()
    assert project["title"] == "BRAF V600E melanoma analysis"
    assert project["latest_snapshot"]["state"]["gene_symbol"] == "BRAF"

    listing = await client.get("/api/projects")
    assert listing.status_code == 200
    assert len(listing.json()) == 1

async def test_project_owner_only_access(client):
    await register_user(client, "owner@example.com")
    create = await client.post("/api/projects", json={
        "title": "Private project",
        "entity_type": "gene",
        "query": "BRAF",
        "tags": ["BRAF"],
        "state": {"gene_symbol": "BRAF"},
    })
    project_id = create.json()["id"]
    await client.post("/api/auth/logout")

    await register_user(client, "other@example.com")
    response = await client.get(f"/api/projects/{project_id}")

    assert response.status_code == 404

async def test_add_snapshot_and_archive_project(client):
    await register_user(client, "owner@example.com")
    create = await client.post("/api/projects", json={
        "title": "EGFR project",
        "entity_type": "gene",
        "query": "EGFR",
        "tags": ["EGFR"],
        "state": {"gene_symbol": "EGFR"},
    })
    project_id = create.json()["id"]

    snapshot = await client.post(f"/api/projects/{project_id}/snapshots", json={
        "name": "Mutation highlight",
        "state": {"gene_symbol": "EGFR", "selected_residues": [858]},
    })
    assert snapshot.status_code == 201
    assert snapshot.json()["state"]["selected_residues"] == [858]

    delete = await client.delete(f"/api/projects/{project_id}")
    assert delete.status_code == 200

    listing = await client.get("/api/projects")
    assert listing.status_code == 200
    assert listing.json() == []
```

- [ ] **Step 2: Run project tests to verify failure**

Run:

```powershell
cd backend; pytest tests\test_projects.py -v
```

Expected: FAIL because `/api/projects` routes do not exist yet.

- [ ] **Step 3: Create project schemas**

Create `backend/app/schemas/projects.py`:

```python
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

EntityType = Literal["gene", "variant", "disease", "mixed"]

class SnapshotCreate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    state: dict[str, Any]

class SnapshotResponse(BaseModel):
    id: str
    project_id: str
    name: str | None = None
    state: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}

class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    entity_type: EntityType
    query: str = Field(min_length=1, max_length=255)
    tags: list[str] = Field(default_factory=list)
    state: dict[str, Any]

class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    entity_type: EntityType | None = None
    query: str | None = Field(default=None, min_length=1, max_length=255)
    tags: list[str] | None = None

class ProjectResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    entity_type: EntityType
    query: str
    tags: list[str]
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    latest_snapshot: SnapshotResponse | None = None

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Implement projects API**

Create `backend/app/api/projects.py`:

```python
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_user
from app.models import Project, ProjectSnapshot, User
from app.schemas.projects import ProjectCreate, ProjectResponse, ProjectUpdate, SnapshotCreate, SnapshotResponse

router = APIRouter()

async def get_owned_project(project_id: str, user: User, db: AsyncSession) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id, Project.is_archived.is_(False))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project

async def latest_snapshot(project_id: str, db: AsyncSession) -> ProjectSnapshot | None:
    result = await db.execute(
        select(ProjectSnapshot).where(ProjectSnapshot.project_id == project_id).order_by(desc(ProjectSnapshot.created_at)).limit(1)
    )
    return result.scalar_one_or_none()

async def serialize_project(project: Project, db: AsyncSession) -> ProjectResponse:
    snapshot = await latest_snapshot(project.id, db)
    return ProjectResponse(
        id=project.id,
        title=project.title,
        description=project.description,
        entity_type=project.entity_type,
        query=project.query,
        tags=project.tags,
        is_archived=project.is_archived,
        created_at=project.created_at,
        updated_at=project.updated_at,
        latest_snapshot=SnapshotResponse.model_validate(snapshot) if snapshot else None,
    )

@router.get("", response_model=list[ProjectResponse])
async def list_projects(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(Project)
        .where(Project.user_id == current_user.id, Project.is_archived.is_(False))
        .order_by(desc(Project.updated_at))
    )
    return [await serialize_project(project, db) for project in result.scalars().all()]

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    project = Project(
        user_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description,
        entity_type=payload.entity_type,
        query=payload.query.strip(),
        tags=payload.tags,
    )
    db.add(project)
    await db.flush()
    snapshot = ProjectSnapshot(project_id=project.id, name="Initial state", state=payload.state)
    db.add(snapshot)
    await db.commit()
    await db.refresh(project)
    return await serialize_project(project, db)

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    project = await get_owned_project(project_id, current_user, db)
    return await serialize_project(project, db)

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, payload: ProjectUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    project = await get_owned_project(project_id, current_user, db)
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(project, key, value)
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project)
    return await serialize_project(project, db)

@router.post("/{project_id}/snapshots", response_model=SnapshotResponse, status_code=status.HTTP_201_CREATED)
async def create_snapshot(project_id: str, payload: SnapshotCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    project = await get_owned_project(project_id, current_user, db)
    snapshot = ProjectSnapshot(project_id=project.id, name=payload.name, state=payload.state)
    project.updated_at = datetime.now(timezone.utc)
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return SnapshotResponse.model_validate(snapshot)

@router.delete("/{project_id}")
async def archive_project(project_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    project = await get_owned_project(project_id, current_user, db)
    project.is_archived = True
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Project archived"}
```

- [ ] **Step 5: Wire projects router**

Modify `backend/app/main.py`:

```python
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
```

- [ ] **Step 6: Run backend auth/project tests**

Run:

```powershell
cd backend; pytest tests\test_auth.py tests\test_projects.py -v
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

Run:

```powershell
git add backend\app\api\projects.py backend\app\main.py backend\app\schemas\projects.py backend\tests\test_projects.py
git commit -m "Add saved projects API"
```

---

## Task 6: Frontend Auth API and Context

**Files:**

- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/auth.ts`
- Create: `frontend/src/context/AuthContext.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Create shared API client**

Create `frontend/src/api/client.ts`:

```ts
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 2: Create auth API functions**

Create `frontend/src/api/auth.ts`:

```ts
import { apiJson } from './client';

export interface User {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
  created_at: string;
  last_active_at?: string | null;
}

export interface AuthResponse {
  user: User;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiJson<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: LoginPayload) =>
    apiJson<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () =>
    apiJson<{ message: string }>('/api/auth/logout', { method: 'POST' }),
  me: () => apiJson<User>('/api/auth/me'),
};
```

- [ ] **Step 3: Create AuthContext**

Create `frontend/src/context/AuthContext.tsx`:

```tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, LoginPayload, RegisterPayload, User } from '../api/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setError(null);
    const response = await authApi.login(payload);
    setUser(response.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setError(null);
    const response = await authApi.register(payload);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, error, login, register, logout }), [user, loading, error, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
```

- [ ] **Step 4: Wrap the app**

Modify `frontend/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

- [ ] **Step 5: Run frontend type check**

Run:

```powershell
cd frontend; npm install; npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 6: Commit**

Run:

```powershell
git add frontend\src\api\client.ts frontend\src\api\auth.ts frontend\src\context\AuthContext.tsx frontend\src\main.tsx
git commit -m "Add frontend auth context"
```

---

## Task 7: Frontend Project API and UI

**Files:**

- Create: `frontend/src/api/projects.ts`
- Create: `frontend/src/components/Auth/AuthDialog.tsx`
- Create: `frontend/src/components/Auth/UserMenu.tsx`
- Create: `frontend/src/components/Projects/SaveProjectDialog.tsx`
- Create: `frontend/src/components/Projects/SavedProjectsPanel.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles/index.css`

- [ ] **Step 1: Create projects API functions**

Create `frontend/src/api/projects.ts`:

```ts
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
```

- [ ] **Step 2: Create compact auth dialog**

Create `frontend/src/components/Auth/AuthDialog.tsx`:

```tsx
import React, { useState } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  mode: 'login' | 'register';
  onClose: () => void;
}

export default function AuthDialog({ mode, onClose }: Props) {
  const { login, register } = useAuth();
  const [activeMode, setActiveMode] = useState(mode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (activeMode === 'register') {
        await register({ first_name: firstName, last_name: lastName, email, password });
      } else {
        await login({ email, password });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm px-4">
      <form onSubmit={submit} className="glass-panel w-full max-w-md p-5 space-y-4 border border-cyan-400/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            {activeMode === 'register' ? <UserPlus className="w-4 h-4 text-cyan-300" /> : <LogIn className="w-4 h-4 text-cyan-300" />}
            <span>{activeMode === 'register' ? 'Create research account' : 'Sign in'}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="Close auth dialog">
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeMode === 'register' && (
          <div className="grid grid-cols-2 gap-3">
            <input className="biomed-input" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <input className="biomed-input" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        )}

        <input className="biomed-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="biomed-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={activeMode === 'register' ? 8 : 1} />

        {error && <p className="text-xs text-red-300">{error}</p>}

        <button type="submit" disabled={submitting} className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-60">
          {submitting ? 'Working...' : activeMode === 'register' ? 'Create account' : 'Sign in'}
        </button>

        <button type="button" className="text-xs text-slate-300 hover:text-cyan-300" onClick={() => setActiveMode(activeMode === 'register' ? 'login' : 'register')}>
          {activeMode === 'register' ? 'Already have an account?' : 'Need an account?'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create user menu**

Create `frontend/src/components/Auth/UserMenu.tsx`:

```tsx
import React from 'react';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200">
      <UserCircle className="w-4 h-4 text-cyan-300" />
      <span className="hidden sm:inline">{user.first_name || user.email}</span>
      <button type="button" onClick={logout} className="rounded-full p-1 hover:bg-white/10" aria-label="Log out">
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create save dialog and saved projects panel**

Create `frontend/src/components/Projects/SaveProjectDialog.tsx`:

```tsx
import React, { useMemo, useState } from 'react';
import { Save, X } from 'lucide-react';
import { EntityType, projectsApi, SavedProject } from '../../api/projects';

interface Props {
  state: Record<string, unknown>;
  defaultTitle: string;
  entityType: EntityType;
  query: string;
  onClose: () => void;
  onSaved: (project: SavedProject) => void;
}

export default function SaveProjectDialog({ state, defaultTitle, entityType, query, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState(query);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tags = useMemo(
    () => tagInput.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tagInput]
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const project = await projectsApi.create({
        title,
        description,
        entity_type: entityType,
        query,
        tags,
        state,
      });
      onSaved(project);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm px-4">
      <form onSubmit={submit} className="glass-panel w-full max-w-lg p-5 space-y-4 border border-cyan-400/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Save className="w-4 h-4 text-cyan-300" />
            <span>Save research project</span>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="Close save dialog">
            <X className="w-4 h-4" />
          </button>
        </div>

        <input className="biomed-input" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={255} />
        <textarea className="biomed-input min-h-24 resize-none" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
        <input className="biomed-input" placeholder="Tags, comma separated" value={tagInput} onChange={(event) => setTagInput(event.target.value)} />

        <div className="flex items-center justify-between text-2xs text-slate-400">
          <span>{entityType.toUpperCase()} / {query}</span>
          <span>{tags.length} tags</span>
        </div>

        {error && <p className="text-xs text-red-300">{error}</p>}

        <button type="submit" disabled={saving} className="w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Project'}
        </button>
      </form>
    </div>
  );
}
```

Create `frontend/src/components/Projects/SavedProjectsPanel.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { Archive, FolderOpen, RefreshCw, X } from 'lucide-react';
import { projectsApi, SavedProject } from '../../api/projects';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoad: (state: Record<string, unknown>) => void;
}

export default function SavedProjectsPanel({ open, onClose, onLoad }: Props) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await projectsApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  if (!open) return null;

  const loadProject = async (project: SavedProject) => {
    const fullProject = await projectsApi.get(project.id);
    const state = fullProject.latest_snapshot?.state;
    if (state) {
      onLoad(state);
      onClose();
    }
  };

  const archiveProject = async (project: SavedProject) => {
    await projectsApi.archive(project.id);
    setProjects((current) => current.filter((item) => item.id !== project.id));
  };

  return (
    <aside className="fixed right-4 top-20 z-[90] w-[min(420px,calc(100vw-2rem))] glass-panel border border-cyan-400/20 p-4 shadow-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <FolderOpen className="w-4 h-4 text-cyan-300" />
          <span>Saved Projects</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={loadProjects} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="Refresh projects">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="Close projects panel">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && <p className="py-4 text-xs text-slate-400">Loading saved research...</p>}
      {error && <p className="py-4 text-xs text-red-300">{error}</p>}

      <div className="max-h-[70vh] overflow-y-auto divide-y divide-white/10">
        {!loading && projects.length === 0 && (
          <p className="py-4 text-xs text-slate-400">No saved projects yet.</p>
        )}

        {projects.map((project) => (
          <article key={project.id} className="py-3 space-y-2">
            <div>
              <h3 className="text-sm font-bold text-white">{project.title}</h3>
              <p className="text-2xs text-slate-400">{project.entity_type.toUpperCase()} / {project.query}</p>
            </div>
            {project.description && <p className="text-xs text-slate-300 line-clamp-2">{project.description}</p>}
            <div className="flex flex-wrap gap-1">
              {project.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-3xs text-cyan-200">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => loadProject(project)} className="rounded-lg bg-cyan-400 px-2.5 py-1.5 text-xs font-bold text-slate-950">
                Load
              </button>
              <button type="button" onClick={() => archiveProject(project)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10">
                <Archive className="inline-block w-3.5 h-3.5 mr-1" />
                Archive
              </button>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
```

- [ ] **Step 5: Add input utility style**

Add this component utility to `frontend/src/styles/index.css` inside the Tailwind layer used for local component classes:

```css
.biomed-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid hsl(199 89% 48% / 0.22);
  background: hsl(222 47% 11% / 0.72);
  padding: 0.65rem 0.75rem;
  color: hsl(210 40% 98%);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
}

.biomed-input::placeholder {
  color: hsl(215 20% 65% / 0.72);
}

.biomed-input:focus {
  border-color: hsl(188 94% 50% / 0.7);
  box-shadow: 0 0 0 3px hsl(188 94% 50% / 0.12);
  background: hsl(222 47% 11% / 0.92);
}
```

- [ ] **Step 6: Wire App state save/load**

Modify `frontend/src/App.tsx`:

Add imports:

```tsx
import AuthDialog from './components/Auth/AuthDialog';
import UserMenu from './components/Auth/UserMenu';
import SaveProjectDialog from './components/Projects/SaveProjectDialog';
import SavedProjectsPanel from './components/Projects/SavedProjectsPanel';
import { useAuth } from './context/AuthContext';
```

Inside `App`, read auth state and add local dialog state:

```tsx
const { user } = useAuth();
const [authDialogMode, setAuthDialogMode] = useState<'login' | 'register' | null>(null);
const [showSaveProject, setShowSaveProject] = useState(false);
const [showSavedProjects, setShowSavedProjects] = useState(false);
```

Build current analysis state:

```ts
const currentProjectState = {
  gene: loadedGene,
  variant: loadedVariant,
  disease: loadedDisease,
  literature: loadedLiterature,
};
```

Add helpers:

```ts
const handleLoadProjectState = (state: any) => {
  setLoadedGene(state.gene ?? null);
  setLoadedVariant(state.variant ?? null);
  setLoadedDisease(state.disease ?? null);
  setLoadedLiterature(state.literature ?? null);
};

const activeQuery = loadedVariant?.variant_id || loadedGene?.symbol || loadedDisease?.disease_name || 'BioMed session';
const activeEntityType = loadedVariant ? 'variant' : loadedGene ? 'gene' : loadedDisease ? 'disease' : 'mixed';
const activeTitle = `${activeQuery} research project`;
```

In the header action area, replace the existing right-side content with:

```tsx
<div className="flex items-center space-x-3">
  <span className="text-2xs text-slate-400 font-mono hidden sm:flex items-center space-x-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
    <Database className="w-3 h-3 text-cyan-400" />
    <span>Aggregate Mode</span>
  </span>
  {user ? (
    <UserMenu />
  ) : (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setAuthDialogMode('login')} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10">
        Sign in
      </button>
      <button type="button" onClick={() => setAuthDialogMode('register')} className="rounded-lg bg-cyan-400 px-2.5 py-1.5 text-xs font-bold text-slate-950">
        Register
      </button>
    </div>
  )}
</div>
```

In the top session bar, add authenticated project actions:

```tsx
{user && (
  <div className="flex items-center gap-2">
    <button type="button" onClick={() => setShowSavedProjects(true)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10">
      Saved Projects
    </button>
    <button type="button" onClick={() => setShowSaveProject(true)} className="rounded-lg bg-cyan-400 px-2.5 py-1.5 text-xs font-bold text-slate-950">
      Save Project
    </button>
  </div>
)}
```

Before the closing root `</div>`, render dialogs:

```tsx
{authDialogMode && (
  <AuthDialog mode={authDialogMode} onClose={() => setAuthDialogMode(null)} />
)}
{showSaveProject && (
  <SaveProjectDialog
    state={currentProjectState}
    defaultTitle={activeTitle}
    entityType={activeEntityType}
    query={activeQuery}
    onClose={() => setShowSaveProject(false)}
    onSaved={() => setShowSavedProjects(true)}
  />
)}
<SavedProjectsPanel
  open={showSavedProjects}
  onClose={() => setShowSavedProjects(false)}
  onLoad={handleLoadProjectState}
/>
```

- [ ] **Step 7: Run frontend build**

Run:

```powershell
cd frontend; npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 8: Commit**

Run:

```powershell
git add frontend\src
git commit -m "Add auth and saved project UI"
```

---

## Task 8: Full Verification and Local Run Notes

**Files:**

- Modify: `PROJECT.md` or `TEST_INFRA.md` only if local launch instructions are missing.

- [ ] **Step 1: Run backend tests**

Run:

```powershell
cd backend; pytest -v
```

Expected: all backend tests pass, including existing gene/variant tests and new auth/project tests.

- [ ] **Step 2: Run frontend build**

Run:

```powershell
cd frontend; npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Run git status**

Run:

```powershell
git status -sb
```

Expected: clean working tree on `codex`, or only intentionally uncommitted runtime files ignored by `.gitignore`.

- [ ] **Step 4: Final commit if docs changed**

If launch docs changed:

```powershell
git add PROJECT.md TEST_INFRA.md
git commit -m "Document auth project setup"
```

---

## Self-Review

Spec coverage:

- Registration/login/logout/current user: Task 4.
- Secure password storage and JWT cookie auth: Tasks 3 and 4.
- User-owned saved projects and snapshots: Tasks 2 and 5.
- Backend tests for auth and ownership: Tasks 4 and 5.
- Frontend auth shell and project save/load entry points: Tasks 6 and 7.
- Neon deployment path and SQL migration: Tasks 1, 2, and 8.

Plan decisions:

- `projects.tags` uses JSON/JSONB rather than `TEXT[]` to keep SQLite tests and Neon production aligned through one application model.
- Project sharing, patient data handling, and GitHub publishing remain out of scope as specified.

Placeholder scan:

- No placeholder markers or vague implementation steps remain.

Type consistency:

- Backend uses snake_case JSON fields matching Pydantic schemas.
- Frontend project API uses the same snake_case payload fields.
- Auth cookie name is `biomed_token`, matching the backend test assertions and settings default.
