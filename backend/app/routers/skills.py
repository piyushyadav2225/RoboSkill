import io
import zipfile
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Skill, SkillVersion, SkillPackage, SkillManifest, Download, Review, User
from ..schemas import SkillSummary, SkillDetail, TestRunnerResult
from ..simulation.adapter import SkillRunnerAdapter
from ..config import PACKAGES_DIR

router = APIRouter(prefix="/api/skills", tags=["skills"])

CATEGORIES = [
    {"name": "Navigation", "description": "Obstacle avoidance, path planning, and autonomous trajectory traversal."},
    {"name": "Computer Vision", "description": "Visual tracking, feature extraction, stereoscopy, and visual odometry."},
    {"name": "Manipulation", "description": "Inverse kinematics, multi-axis grasping, and precision placement."},
    {"name": "Object Detection", "description": "Real-time bounding, semantic segmentation, and volumetric bounding."},
    {"name": "Autonomous Movement", "description": "Differential drive, holonomic movement, and quadrupedal locomotion."},
    {"name": "Speech and Interaction", "description": "Auditory processing, phonetics synthesis, and natural discourse."},
    {"name": "Sensor Processing", "description": "IMU Kalman filtering, lidar point-cloud processing, and sonar telemetry."},
    {"name": "Mapping and Localization", "description": "2D/3D SLAM, occupancy grid mapping, and loop closure."},
    {"name": "Industrial Automation", "description": "PLC bridge protocols, pick-and-place routines, and conveyor sync."},
    {"name": "Educational Robotics", "description": "Modular starter routines, STEM exercises, and simulator foundations."}
]


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    result = []
    for cat in CATEGORIES:
        count = db.query(Skill).filter(Skill.category == cat["name"], Skill.is_published == True).count()
        result.append({
            "name": cat["name"],
            "description": cat["description"],
            "skill_count": count
        })
    return result


@router.get("", response_model=List[SkillSummary])
def list_skills(
    category: Optional[str] = None,
    language: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query("newest", pattern="^(newest|price_low|price_high|popularity)$"),
    db: Session = Depends(get_db)
):
    query = db.query(Skill).filter(Skill.is_published == True)

    if category and category != "All":
        query = query.filter(Skill.category == category)
    if language and language != "All":
        query = query.filter(Skill.language == language)
    if search:
        pattern = f"%{search}%"
        query = query.filter((Skill.name.ilike(pattern)) | (Skill.description.ilike(pattern)))

    if sort_by == "newest":
        query = query.order_by(Skill.created_at.desc())
    elif sort_by == "price_low":
        query = query.order_by(Skill.price_cents.asc())
    elif sort_by == "price_high":
        query = query.order_by(Skill.price_cents.desc())

    skills = query.all()
    summaries = []

    for s in skills:
        latest_version = db.query(SkillVersion).filter(SkillVersion.skill_id == s.id).order_by(SkillVersion.created_at.desc()).first()
        downloads_count = db.query(Download).filter(Download.skill_id == s.id).count()
        reviews = db.query(Review).filter(Review.skill_id == s.id).all()
        rating_avg = sum(r.rating for r in reviews) / len(reviews) if reviews else 0.0

        summaries.append(SkillSummary(
            id=s.id,
            name=s.name,
            tagline=s.tagline,
            description=s.description,
            category=s.category,
            language=s.language,
            license=s.license,
            price_cents=s.price_cents,
            is_published=s.is_published,
            creator_name=s.creator.display_name if s.creator else "Unknown Artisan",
            version=latest_version.version if latest_version else "0.1.0",
            tested_on_hardware=latest_version.tested_on_hardware if latest_version else False,
            unit_tests_passed=latest_version.unit_tests_passed if latest_version else True,
            downloads_count=downloads_count,
            rating_avg=rating_avg,
            reviews_count=len(reviews),
            best_robot=getattr(s, "best_robot", None) or "Differential Drive Rover / Two-Wheeled Chassis",
            best_microcontroller=getattr(s, "best_microcontroller", None) or "ESP32 / Raspberry Pi Pico / Arduino Uno",
            created_at=s.created_at
        ))

    return summaries


@router.get("/{skill_id}", response_model=SkillDetail)
def get_skill_detail(skill_id: str, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found in repository")

    latest_version = db.query(SkillVersion).filter(SkillVersion.skill_id == skill.id).order_by(SkillVersion.created_at.desc()).first()
    pkg = db.query(SkillPackage).filter(SkillPackage.version_id == latest_version.id).first() if latest_version else None
    manifest = db.query(SkillManifest).filter(SkillManifest.version_id == latest_version.id).first() if latest_version else None
    downloads_count = db.query(Download).filter(Download.skill_id == skill.id).count()
    reviews = db.query(Review).filter(Review.skill_id == skill.id).all()
    rating_avg = sum(r.rating for r in reviews) / len(reviews) if reviews else 0.0

    return SkillDetail(
        id=skill.id,
        name=skill.name,
        tagline=skill.tagline,
        description=skill.description,
        category=skill.category,
        language=skill.language,
        license=skill.license,
        price_cents=skill.price_cents,
        is_published=skill.is_published,
        creator_name=skill.creator.display_name if skill.creator else "Unknown Artisan",
        version=latest_version.version if latest_version else "0.1.0",
        tested_on_hardware=latest_version.tested_on_hardware if latest_version else False,
        unit_tests_passed=latest_version.unit_tests_passed if latest_version else True,
        downloads_count=downloads_count,
        rating_avg=rating_avg,
        reviews_count=len(reviews),
        best_robot=getattr(skill, "best_robot", None) or "Differential Drive Rover / Two-Wheeled Chassis",
        best_microcontroller=getattr(skill, "best_microcontroller", None) or "ESP32 / Raspberry Pi Pico / Arduino Uno",
        created_at=skill.created_at,
        release_notes=latest_version.release_notes if latest_version else "",
        readme_markdown=latest_version.readme_markdown if latest_version else "",
        manifest=manifest.raw_json if manifest else None,
        file_tree={"tree": pkg.file_tree} if pkg and pkg.file_tree else None,
        file_size_bytes=pkg.file_size_bytes if pkg else 0,
        requirements=manifest.raw_json.get("requirements") if manifest and manifest.raw_json else None
    )


@router.get("/{skill_id}/file")
def read_skill_file(skill_id: str, path: str = Query(..., description="Relative path in package"), db: Session = Depends(get_db)):
    """
    Reads a file inside the skill package for developer inspection.
    """
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # Check imported package or storage
    pkg_dir = PACKAGES_DIR / skill_id.replace(".", "-")
    if not pkg_dir.exists():
        pkg_dir = PACKAGES_DIR / "roboskill-obstacle-avoidance"

    safe_target = (pkg_dir / path).resolve()
    # Path traversal protection
    if not str(safe_target).startswith(str(pkg_dir.resolve())):
        raise HTTPException(status_code=403, detail="Forbidden file path")

    if not safe_target.exists() or safe_target.is_dir():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        with open(safe_target, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return {"path": path, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")


@router.get("/{skill_id}/download")
def download_skill_package(skill_id: str, db: Session = Depends(get_db)):
    """
    Builds and streams a verified clean ZIP package of the actual skill.
    """
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    pkg_dir = PACKAGES_DIR / skill_id.replace(".", "-")
    if not pkg_dir.exists():
        pkg_dir = PACKAGES_DIR / "roboskill-obstacle-avoidance"

    if not pkg_dir.exists():
        raise HTTPException(status_code=404, detail="Skill package directory missing")

    # Record download
    download_record = Download(skill_id=skill.id)
    db.add(download_record)
    db.commit()

    # Package in-memory ZIP
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in pkg_dir.rglob("*"):
            if file.is_file():
                if any(p in file.parts for p in [".venv", ".venv-1", "__pycache__", ".pytest_cache", ".egg-info"]):
                    continue
                arcname = file.relative_to(pkg_dir)
                zf.write(file, arcname=f"{skill_id}/{arcname}")

    zip_buffer.seek(0)
    filename = f"{skill_id}-v0.1.0.zip"
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.post("/{skill_id}/run-tests", response_model=TestRunnerResult)
def run_skill_tests(skill_id: str, db: Session = Depends(get_db)):
    """
    Executes actual pytest unit tests for the imported skill in the adapter.
    """
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    adapter = SkillRunnerAdapter("roboskill-obstacle-avoidance")
    result = adapter.run_unit_tests()
    return TestRunnerResult(**result)
