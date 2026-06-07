from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


EntityType = Literal["gene", "variant", "disease", "mixed"]


class ProjectSnapshotCreate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    state: dict[str, Any]


class ProjectSnapshotResponse(BaseModel):
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
    latest_snapshot: ProjectSnapshotResponse | None = None

    model_config = {"from_attributes": True}
