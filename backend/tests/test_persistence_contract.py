from pathlib import Path

from sqlalchemy.types import Uuid

from app.models import Project, ProjectSnapshot, User, UserSession


def test_orm_ids_use_cross_dialect_uuid_type():
    for model in (User, UserSession, Project, ProjectSnapshot):
        assert isinstance(model.__table__.c.id.type, Uuid)
        assert model.__table__.c.id.type.as_uuid is False

    assert isinstance(UserSession.__table__.c.user_id.type, Uuid)
    assert isinstance(Project.__table__.c.user_id.type, Uuid)
    assert isinstance(ProjectSnapshot.__table__.c.project_id.type, Uuid)


def test_auth_projects_migration_has_case_insensitive_email_unique_index():
    migration = Path("migrations/001_auth_projects.sql").read_text(encoding="utf-8").lower()

    assert "create unique index if not exists idx_users_email_lower" in migration
    assert "on users (lower(email))" in migration
