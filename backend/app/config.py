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

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mock_mode: bool = True
    host: str = "127.0.0.1"
    port: int = 8000

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
