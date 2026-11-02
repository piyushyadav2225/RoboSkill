import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .database import engine, Base
from .seed import seed_database
from .routers import skills, compatibility, simulation, upload, user
from .config import WORKSPACE_DIR

# Create tables and ensure initial seed
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="RoboSkill API",
    description="The Ancient Engineering Marketplace for Robot Skills - REST API Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(skills.router)
app.include_router(compatibility.router)
app.include_router(simulation.router)
app.include_router(upload.router)
app.include_router(user.router)


@app.get("/api/health")
def health_check():
    return {
        "status": "operational",
        "service": "RoboSkill Marketplace API",
        "guild": "Artisan Robotics Syndicate",
        "runtime": "Python 3.13 FastAPI",
        "aesthetic": "Ancient Engineering Laboratory"
    }


# Mount built frontend if available
frontend_dist = WORKSPACE_DIR / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Allow API routes to be handled by routers, return 404 if not found
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)

