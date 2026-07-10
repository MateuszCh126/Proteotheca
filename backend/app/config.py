import sys
import os

# Add the 'backend' folder and the workspace root folder to sys.path to resolve imports cleanly
current_dir = os.path.dirname(os.path.abspath(__file__)) # c:/.../backend/app
backend_dir = os.path.dirname(current_dir)             # c:/.../backend
workspace_dir = os.path.dirname(backend_dir)           # c:/.../med

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if workspace_dir not in sys.path:
    sys.path.insert(0, workspace_dir)

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mock_mode: bool = False
    host: str = "127.0.0.1"
    port: int = 8000
    database_url: str = "sqlite+aiosqlite:///./biomed_explorer.db"
    jwt_secret: str = "dev-only-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 1440
    auth_cookie_name: str = "biomed_token"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"
    cors_allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,https://proteotheca.vercel.app"
    auto_create_tables: bool = True

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_allowed_origins.split(",")
            if origin.strip()
        ]

settings = Settings()
