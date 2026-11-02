import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BASE_DIR
PACKAGES_DIR = WORKSPACE_DIR / "packages"
BACKEND_DIR = WORKSPACE_DIR / "backend"
UPLOADS_DIR = BACKEND_DIR / "uploads"
STORAGE_DIR = BACKEND_DIR / "skills_storage"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'roboskill.db'}")

# Ensure folders exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

