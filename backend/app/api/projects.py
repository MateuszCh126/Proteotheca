from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user, get_db
from app.models import Project, ProjectSnapshot, User, utcnow
from app.schemas.projects import (
    ProjectCreate,
    ProjectResponse,
    ProjectSnapshotCreate,
    ProjectSnapshotResponse,
    ProjectUpdate,
)


router = APIRouter()


def _to_response(project: Project) -> ProjectResponse:
    snapshots = sorted(project.snapshots, key=lambda item: item.created_at)
    return ProjectResponse.model_validate(
        {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "entity_type": project.entity_type,
            "query": project.query,
            "tags": project.tags,
            "is_archived": project.is_archived,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "latest_snapshot": snapshots[-1] if snapshots else None,
        }
    )


async def _get_owned_project(
    db: AsyncSession,
    user_id: str,
    project_id: str,
    include_archived: bool = False,
) -> Project:
    conditions = [Project.id == project_id, Project.user_id == user_id]
    if not include_archived:
        conditions.append(Project.is_archived.is_(False))
    project = (
        await db.execute(
            select(Project)
            .options(selectinload(Project.snapshots))
            .where(*conditions)
        )
    ).scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = (
        await db.execute(
            select(Project)
            .options(selectinload(Project.snapshots))
            .where(Project.user_id == current_user.id, Project.is_archived.is_(False))
            .order_by(desc(Project.updated_at))
        )
    ).scalars().all()
    return [_to_response(project) for project in projects]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        entity_type=payload.entity_type,
        query=payload.query,
        tags=payload.tags,
    )
    project.snapshots.append(ProjectSnapshot(name="Initial", state=payload.state))
    db.add(project)
    await db.commit()
    await db.refresh(project)
    project = await _get_owned_project(db, current_user.id, project.id)
    return _to_response(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await _get_owned_project(db, current_user.id, project_id)
    return _to_response(project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await _get_owned_project(db, current_user.id, project_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(project, field, value)
    project.updated_at = utcnow()
    await db.commit()
    project = await _get_owned_project(db, current_user.id, project_id)
    return _to_response(project)


@router.post("/{project_id}/snapshots", response_model=ProjectSnapshotResponse, status_code=status.HTTP_201_CREATED)
async def create_snapshot(
    project_id: str,
    payload: ProjectSnapshotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await _get_owned_project(db, current_user.id, project_id)
    snapshot = ProjectSnapshot(project_id=project.id, name=payload.name, state=payload.state)
    project.updated_at = utcnow()
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


@router.delete("/{project_id}")
async def archive_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await _get_owned_project(db, current_user.id, project_id)
    project.is_archived = True
    project.updated_at = utcnow()
    await db.commit()
    return {"message": "Project archived"}
