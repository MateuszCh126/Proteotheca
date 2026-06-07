from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models import User, UserSession, utcnow
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.security import (
    clear_auth_cookie,
    create_token_payload,
    hash_password,
    normalize_email,
    set_auth_cookie,
    verify_password,
)


router = APIRouter()


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


async def _issue_session(
    request: Request,
    response: Response,
    db: AsyncSession,
    user: User,
) -> None:
    token, expires_at, jti = create_token_payload(user.id, user.email, user.role)
    db.add(
        UserSession(
            user_id=user.id,
            token_jti=jti,
            expires_at=expires_at,
            user_agent=request.headers.get("user-agent"),
            ip_address=_client_ip(request),
        )
    )
    user.last_active_at = utcnow()
    await db.commit()
    await db.refresh(user)
    set_auth_cookie(response, token)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    email = normalize_email(payload.email)
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    await _issue_session(request, response, db, user)
    return AuthResponse(user=user)


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    email = normalize_email(payload.email)
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None or user.deleted_at is not None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    await _issue_session(request, response, db, user)
    return AuthResponse(user=user)


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_session = getattr(request.state, "user_session", None)
    if user_session is not None:
        user_session.revoked_at = utcnow()
        await db.commit()
    clear_auth_cookie(response)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
