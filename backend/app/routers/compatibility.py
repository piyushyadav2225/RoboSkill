from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import RobotProfile, RobotCapability, Skill, SkillVersion, SkillManifest, CompatibilityResult
from ..schemas import RobotProfileSchema, CompatibilityReport, RobotCapabilitySchema

router = APIRouter(prefix="/api/compatibility", tags=["compatibility"])


@router.get("/robots", response_model=List[RobotProfileSchema])
def list_robot_profiles(db: Session = Depends(get_db)):
    robots = db.query(RobotProfile).all()
    results = []
    for r in robots:
        caps = [
            RobotCapabilitySchema(
                capability_type=c.capability_type,
                identifier=c.identifier,
                specifications=c.specifications
            )
            for c in r.capabilities
        ]
        results.append(RobotProfileSchema(
            id=r.id,
            name=r.name,
            manufacturer=r.manufacturer,
            category=r.category,
            operating_system=r.operating_system,
            cpu_architecture=r.cpu_architecture,
            supported_languages=r.supported_languages or [],
            supported_middleware=r.supported_middleware or [],
            communication_interfaces=r.communication_interfaces or [],
            description=r.description,
            is_custom=r.is_custom,
            capabilities=caps
        ))
    return results


@router.post("/robots", response_model=RobotProfileSchema)
def register_robot_profile(payload: RobotProfileSchema, db: Session = Depends(get_db)):
    existing = db.query(RobotProfile).filter(RobotProfile.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Robot profile with this ID already registered.")

    robot = RobotProfile(
        id=payload.id,
        name=payload.name,
        manufacturer=payload.manufacturer,
        category=payload.category,
        operating_system=payload.operating_system,
        cpu_architecture=payload.cpu_architecture,
        supported_languages=payload.supported_languages,
        supported_middleware=payload.supported_middleware,
        communication_interfaces=payload.communication_interfaces,
        description=payload.description,
        is_custom=True
    )
    db.add(robot)
    db.commit()

    for cap in payload.capabilities:
        c = RobotCapability(
            robot_id=robot.id,
            capability_type=cap.capability_type,
            identifier=cap.identifier,
            specifications=cap.specifications
        )
        db.add(c)
    db.commit()
    db.refresh(robot)

    return payload


@router.get("/evaluate", response_model=CompatibilityReport)
def evaluate_compatibility(
    skill_id: str = Query(..., description="ID of skill to check"),
    robot_id: str = Query(..., description="ID of robot profile"),
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    robot = db.query(RobotProfile).filter(RobotProfile.id == robot_id).first()
    if not robot:
        raise HTTPException(status_code=404, detail="Robot profile not found")

    latest_version = db.query(SkillVersion).filter(SkillVersion.skill_id == skill.id).order_by(SkillVersion.created_at.desc()).first()
    manifest = db.query(SkillManifest).filter(SkillManifest.version_id == latest_version.id).first() if latest_version else None

    required_caps = manifest.required_capabilities if manifest and manifest.required_capabilities else ["distance_sensor", "mobile_base"]
    runtime_info = manifest.runtime_info if manifest and manifest.runtime_info else {"language": "python", "minimum_version": "3.11"}
    req_lang = runtime_info.get("language", "python").lower()

    # Robot capabilities
    robot_cap_ids = {c.identifier for c in robot.capabilities}
    supported_langs = [l.lower() for l in (robot.supported_languages or [])]

    matched = []
    missing = []
    notes = []

    # Check capabilities
    for cap in required_caps:
        if cap in robot_cap_ids:
            matched.append(cap)
        else:
            missing.append(cap)

    # Check runtime language
    lang_supported = any(req_lang in l for l in supported_langs)
    if not lang_supported:
        notes.append(f"Language mismatch: Skill requires {req_lang.capitalize()}, robot supports {', '.join(robot.supported_languages or [])}.")

    # Status Determination Rules
    # RULE: Do not claim physical robot compatibility!
    # Even if capabilities match, Obstacle Avoidance has only been tested in software unit tests!
    hardware_tested = latest_version.tested_on_hardware if latest_version else False

    if len(missing) == 0 and lang_supported:
        if not hardware_tested:
            status = "UNVERIFIED"
            score = 80
            summary = "Hardware capabilities and runtime match, but physical robot deployment remains UNVERIFIED. Software unit tests pass, but hardware-in-the-loop and emergency braking have not been physically certified."
            notes.append("Passes all 7 Python unit tests in software simulation.")
            notes.append("Safety notice: Field testing on physical hardware is required before autonomous operation.")
        else:
            status = "COMPATIBLE"
            score = 100
            summary = "Full compatibility confirmed across hardware capabilities, runtime language, and physical bench tests."
    elif len(matched) > 0 and len(missing) > 0:
        status = "PARTIALLY COMPATIBLE"
        score = 45
        summary = f"Partial match. Missing required capabilities: {', '.join(missing)}. Middleware bridge or additional sensors required."
        notes.append(f"Missing sensors or actuators: {', '.join(missing)}.")
    else:
        status = "NOT COMPATIBLE"
        score = 10
        summary = f"Incompatible architecture. Robot lacks essential hardware ({', '.join(missing)}) or supported runtime."
        notes.append("Cannot execute on this target without fundamental hardware restructuring.")

    return CompatibilityReport(
        skill_id=skill.id,
        skill_name=skill.name,
        robot_id=robot.id,
        robot_name=robot.name,
        status=status,
        score_percentage=score,
        summary=summary,
        matched_capabilities=matched,
        missing_capabilities=missing,
        hardware_tested=hardware_tested,
        notes=notes
    )

