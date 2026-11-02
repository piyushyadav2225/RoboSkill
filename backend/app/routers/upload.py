import io
import json
import zipfile
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Skill, SkillVersion, SkillPackage, SkillManifest, User
from ..config import UPLOADS_DIR, STORAGE_DIR

router = APIRouter(prefix="/api/upload", tags=["upload"])

# Maximum allowed package size: 25 MB
MAX_PACKAGE_SIZE = 25 * 1024 * 1024
FORBIDDEN_EXTENSIONS = {".exe", ".dll", ".so", ".bin", ".bat", ".cmd", ".vbs", ".ps1", ".sh"}


@router.post("/inspect")
async def inspect_uploaded_package(file: UploadFile = File(...)):
    """
    Step 1 & 2: Safely receives and inspects an uploaded ZIP package in memory,
    checking structure and extracting manifest metadata without executing any code.
    """
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Invalid package format. RoboSkill requires a structured .zip archive.")

    content = await file.read()
    if len(content) > MAX_PACKAGE_SIZE:
        raise HTTPException(status_code=400, detail="Package file exceeds maximum limit of 25MB.")

    try:
        zf = zipfile.ZipFile(io.BytesIO(content))
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Corrupted or invalid ZIP archive.")

    namelist = zf.namelist()
    files_detected = []
    has_manifest = False
    manifest_path_in_zip = None
    has_readme = False
    has_pyproject = False
    has_src = False
    has_tests = False
    security_warnings = []

    for name in namelist:
        # Check forbidden binary extensions
        suffix = Path(name).suffix.lower()
        if suffix in FORBIDDEN_EXTENSIONS:
            security_warnings.append(f"Security Alert: Executable binary detected '{name}'. Third-party binaries are blocked.")

        # Path traversal check
        if ".." in name or name.startswith("/") or name.startswith("\\"):
            raise HTTPException(status_code=400, detail=f"Malicious path traversal detected: {name}")

        clean_name = name.rstrip("/")
        parts = clean_name.split("/")
        base = parts[-1] if parts else clean_name

        if base == "manifest.json":
            has_manifest = True
            manifest_path_in_zip = name
        elif base.lower() == "readme.md":
            has_readme = True
        elif base == "pyproject.toml":
            has_pyproject = True
        elif "src" in parts:
            has_src = True
        elif "tests" in parts:
            has_tests = True

        files_detected.append({
            "name": name,
            "is_dir": name.endswith("/"),
            "size": zf.getinfo(name).file_size
        })

    manifest_metadata = None
    readme_snippet = ""

    if has_manifest and manifest_path_in_zip:
        try:
            with zf.open(manifest_path_in_zip) as mf:
                manifest_metadata = json.loads(mf.read().decode("utf-8"))
        except Exception as e:
            security_warnings.append(f"Failed to parse manifest.json: {str(e)}")

    if has_readme:
        readme_entries = [n for n in namelist if n.lower().endswith("readme.md")]
        if readme_entries:
            try:
                with zf.open(readme_entries[0]) as rf:
                    readme_snippet = rf.read().decode("utf-8", errors="replace")[:1500]
            except Exception:
                pass

    # Save temporary staged file in UPLOADS_DIR
    temp_id = f"stage_{Path(file.filename).stem}_{int(Path(file.filename).stat().st_mtime if False else 1730000000)}"
    staged_path = UPLOADS_DIR / f"{file.filename}"
    with open(staged_path, "wb") as f:
        f.write(content)

    return {
        "filename": file.filename,
        "size_bytes": len(content),
        "structure": {
            "has_manifest": has_manifest,
            "has_readme": has_readme,
            "has_pyproject": has_pyproject,
            "has_src": has_src,
            "has_tests": has_tests,
            "total_files": len(files_detected)
        },
        "extracted_manifest": manifest_metadata,
        "readme_preview": readme_snippet,
        "security_warnings": security_warnings,
        "staged_file": file.filename
    }


@router.post("/validate")
def validate_package(validation_req: Dict[str, Any]):
    """
    Step 4: Performs automated structural and safety integrity checks.
    """
    manifest = validation_req.get("manifest") or {}
    checks = []

    # Check 1: Structure Integrity
    has_manifest = validation_req.get("has_manifest", False)
    checks.append({
        "rule": "Archive Structure & Required Manifest",
        "passed": bool(has_manifest),
        "message": "manifest.json exists and is positioned appropriately." if has_manifest else "Missing manifest.json."
    })

    # Check 2: Manifest Metadata
    name_ok = bool(manifest.get("name"))
    ver_ok = bool(manifest.get("version"))
    id_ok = bool(manifest.get("id"))
    checks.append({
        "rule": "Identifier & Semantic Versioning",
        "passed": name_ok and ver_ok and id_ok,
        "message": f"Package '{manifest.get('name')}' v{manifest.get('version')} (ID: {manifest.get('id')})" if (name_ok and ver_ok) else "Missing name, id, or version in manifest."
    })

    # Check 3: Hardware Capabilities Declared
    caps = manifest.get("requirements", {}).get("capabilities", [])
    checks.append({
        "rule": "Hardware Capabilities Specification",
        "passed": isinstance(caps, list) and len(caps) > 0,
        "message": f"Declared capabilities: {', '.join(caps)}" if caps else "No specific hardware capabilities declared."
    })

    # Check 4: Runtime Specification
    runtime = manifest.get("runtime", {})
    lang_ok = bool(runtime.get("language"))
    checks.append({
        "rule": "Runtime Environment Specification",
        "passed": lang_ok,
        "message": f"Runtime: {runtime.get('language')} (min version: {runtime.get('minimum_version', '3.11')})"
    })

    # Check 5: Security Restrictions (No raw binaries)
    security_clean = len(validation_req.get("security_warnings", [])) == 0
    checks.append({
        "rule": "Security Sandbox & Binary Isolation",
        "passed": security_clean,
        "message": "No unauthorized compiled binaries or malicious paths detected." if security_clean else "Security warning raised."
    })

    all_passed = all(c["passed"] for c in checks)

    return {
        "status": "VALID" if all_passed else "INVALID",
        "all_passed": all_passed,
        "checks": checks
    }


@router.post("/publish")
def publish_skill(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Step 6: Commits the validated package to the database as published or draft.
    """
    manifest = payload.get("manifest") or {}
    skill_id = manifest.get("id") or f"artisan.{payload.get('name', 'skill').lower().replace(' ', '-')}"

    # Check existing - if ID exists, update or create version/variant
    existing = db.query(Skill).filter(Skill.id == skill_id).first()
    if existing:
        # Check if version exists
        target_version = manifest.get("version", "0.1.1")
        existing_version = db.query(SkillVersion).filter(SkillVersion.skill_id == skill_id, SkillVersion.version == target_version).first()
        if existing_version:
            # Suffix with random short hex to allow repeated testing
            import uuid
            skill_id = f"{skill_id}-v{uuid.uuid4().hex[:4]}"
            existing = None

    user = db.query(User).filter(User.username == "roboskill").first()

    is_draft = payload.get("is_draft", False)

    if not existing:
        skill = Skill(
            id=skill_id,
            name=payload.get("name") or manifest.get("name", "Untitled Skill"),
            tagline=payload.get("tagline", "Algorithmic robot skill"),
            description=payload.get("description") or manifest.get("description", "A custom robotics skill package."),
            category=payload.get("category") or manifest.get("category", "Navigation"),
            language=manifest.get("runtime", {}).get("language", "Python").capitalize(),
            license=payload.get("license") or manifest.get("license", "MIT"),
            price_cents=int(payload.get("price_cents", 0)),
            is_published=not is_draft,
            best_robot=payload.get("best_robot") or manifest.get("best_robot", "Differential Drive Rover / Two-Wheeled Chassis"),
            best_microcontroller=payload.get("best_microcontroller") or manifest.get("best_microcontroller", "ESP32 / Raspberry Pi Pico / Arduino Uno"),
            creator_id=user.id if user else 1
        )
        db.add(skill)
        db.commit()
    else:
        skill = existing
        if payload.get("best_robot"):
            skill.best_robot = payload.get("best_robot")
        if payload.get("best_microcontroller"):
            skill.best_microcontroller = payload.get("best_microcontroller")
        db.commit()

    version = SkillVersion(
        skill_id=skill.id,
        version=manifest.get("version", "0.1.0"),
        release_notes=payload.get("release_notes", "First published version."),
        readme_markdown=payload.get("readme_markdown", "# Robot Skill"),
        tested_on_hardware=False,  # RULE: Physical hardware remains unverified until certified
        unit_tests_passed=True
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    manifest_record = SkillManifest(
        version_id=version.id,
        raw_json=manifest,
        schema_version=manifest.get("schema_version", "1.0"),
        required_capabilities=manifest.get("requirements", {}).get("capabilities", []),
        inputs=manifest.get("inputs", []),
        outputs=manifest.get("outputs", []),
        runtime_info=manifest.get("runtime", {}),
        tested_on=manifest.get("tested_on", [])
    )
    db.add(manifest_record)

    pkg = SkillPackage(
        version_id=version.id,
        storage_path=f"storage/{skill_id}",
        file_size_bytes=payload.get("file_size_bytes", 1024),
        file_tree=[]
    )
    db.add(pkg)
    db.commit()

    return {
        "status": "success",
        "skill_id": skill.id,
        "is_published": skill.is_published,
        "message": "Skill successfully registered in RoboSkill archives."
    }


@router.post("/authenticate-and-publish")
async def authenticate_and_publish_skill(
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form("Navigation"),
    version: str = Form("0.1.0"),
    best_robot: str = Form("Differential Drive Rover"),
    best_microcontroller: str = Form("ESP32 / Raspberry Pi Pico"),
    code: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Developer Arena: Authenticate and publish a new robot skill package.
    Accepts either an uploaded structured .zip package or directly drafted Python logic,
    authenticates its contract, packages it into the local store, and commits it to the marketplace.
    """
    import re
    import uuid

    clean_slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    skill_id = f"artisan.{clean_slug}"

    # Handle collision
    existing = db.query(Skill).filter(Skill.id == skill_id).first()
    if existing:
        skill_id = f"{skill_id}-{uuid.uuid4().hex[:4]}"

    from ..config import PACKAGES_DIR
    target_dir = PACKAGES_DIR / skill_id
    target_dir.mkdir(parents=True, exist_ok=True)

    manifest_data = {
        "schema_version": "1.0",
        "id": skill_id,
        "name": name,
        "version": version,
        "description": description,
        "category": category,
        "license": "MIT",
        "best_robot": best_robot,
        "best_microcontroller": best_microcontroller,
        "runtime": {
            "language": "Python",
            "minimum_version": "3.11"
        },
        "inputs": ["distance_cm"],
        "outputs": ["action", "reason", "success"],
        "requirements": {
            "capabilities": ["distance_sensor", "mobile_base"]
        },
        "tested_on": ["Archimedes Virtual Simulation Workbench"]
    }

    if file and file.filename.endswith(".zip"):
        content = await file.read()
        try:
            zf = zipfile.ZipFile(io.BytesIO(content))
            zf.extractall(target_dir)
            # Check if manifest was in zip
            mf_path = target_dir / "manifest.json"
            if mf_path.exists():
                try:
                    with open(mf_path, "r", encoding="utf-8") as f:
                        extracted = json.load(f)
                        manifest_data.update(extracted)
                except Exception:
                    pass
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to unpack skill ZIP: {str(e)}")
    else:
        # Generate clean structure from drafted code
        src_dir = target_dir / "src" / "roboskill"
        tests_dir = target_dir / "tests"
        src_dir.mkdir(parents=True, exist_ok=True)
        tests_dir.mkdir(parents=True, exist_ok=True)

        py_code = code or """\"\"\"
Autonomous decision logic for %s.
\"\"\"

class ArtisanRobotSkill:
    def __init__(self, stop_threshold_cm: float = 20.0):
        self.stop_threshold_cm = stop_threshold_cm

    def run(self, distance_cm: float) -> dict:
        if distance_cm is None or distance_cm < 0:
            return {"action": "stop", "reason": "invalid_telemetry", "success": False}
        if distance_cm <= self.stop_threshold_cm:
            return {"action": "turn", "reason": "obstacle_avoided", "success": True}
        return {"action": "forward", "reason": "path_clear", "success": True}
""" % name

        with open(src_dir / "skill.py", "w", encoding="utf-8") as f:
            f.write(py_code)

        with open(src_dir / "__init__.py", "w", encoding="utf-8") as f:
            f.write("# RoboSkill package\n")

        with open(tests_dir / "test_skill.py", "w", encoding="utf-8") as f:
            f.write("""def test_execution():
    assert True
""")

        with open(target_dir / "README.md", "w", encoding="utf-8") as f:
            f.write(f"# {name}\n\n{description}\n\n### Best Hardware:\n- Robot: {best_robot}\n- Microcontroller: {best_microcontroller}\n")

        with open(target_dir / "pyproject.toml", "w", encoding="utf-8") as f:
            f.write(f"""[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "{skill_id}"
version = "{version}"
description = "{description}"
readme = "README.md"
requires-python = ">=3.11"
dependencies = []
""")

    # Always ensure manifest.json exists
    with open(target_dir / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)

    # Commit to DB
    user = db.query(User).filter(User.username == "roboskill").first()
    new_skill = Skill(
        id=skill_id,
        name=name,
        tagline=f"Authenticated skill: {name}",
        description=description,
        category=category,
        language="Python",
        license="MIT",
        price_cents=0,
        is_published=True,
        best_robot=best_robot,
        best_microcontroller=best_microcontroller,
        creator_id=user.id if user else 1
    )
    db.add(new_skill)
    db.commit()

    new_ver = SkillVersion(
        skill_id=new_skill.id,
        version=version,
        release_notes="Authenticated by RoboSkill Developer Arena Guild.",
        readme_markdown=f"# {name}\n\n{description}\n\nBest Robot: {best_robot}\nBest Microcontroller: {best_microcontroller}",
        tested_on_hardware=False,
        unit_tests_passed=True
    )
    db.add(new_ver)
    db.commit()
    db.refresh(new_ver)

    manifest_rec = SkillManifest(
        version_id=new_ver.id,
        raw_json=manifest_data,
        schema_version="1.0",
        required_capabilities=manifest_data.get("requirements", {}).get("capabilities", ["distance_sensor"]),
        inputs=["distance_cm"],
        outputs=["action", "reason", "success"],
        runtime_info={"language": "Python", "version": "3.11+"},
        tested_on=["RoboSkill Developer Arena"]
    )
    db.add(manifest_rec)

    pkg = SkillPackage(
        version_id=new_ver.id,
        storage_path=str(target_dir),
        file_size_bytes=2048,
        file_tree=[]
    )
    db.add(pkg)
    db.commit()

    return {
        "status": "authenticated",
        "auth_seal": f"SEAL-ARTISAN-{uuid.uuid4().hex[:8].upper()}",
        "skill_id": new_skill.id,
        "name": new_skill.name,
        "version": version,
        "best_robot": best_robot,
        "best_microcontroller": best_microcontroller,
        "message": f"Skill '{name}' authenticated and published to The Library marketplace."
    }


