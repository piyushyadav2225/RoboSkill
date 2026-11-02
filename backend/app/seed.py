import json
import hashlib
from pathlib import Path
from datetime import datetime

from .database import engine, SessionLocal, Base
from .models import (
    User, DeveloperProfile, Skill, SkillVersion, SkillPackage, SkillManifest,
    RobotProfile, RobotCapability, CompatibilityResult
)
from .config import PACKAGES_DIR


def get_file_tree(path: Path) -> list:
    tree = []
    for item in sorted(path.rglob("*")):
        if any(ignored in item.parts for ignored in [".venv", ".venv-1", "__pycache__", ".pytest_cache", ".egg-info"]):
            continue
        rel = item.relative_to(path)
        tree.append({
            "path": str(rel).replace("\\", "/"),
            "is_dir": item.is_dir(),
            "size": item.stat().st_size if item.is_file() else 0
        })
    return tree


def compute_sha256(path: Path) -> str:
    hasher = hashlib.sha256()
    for file in sorted(path.rglob("*")):
        if file.is_file() and not any(p in file.parts for p in [".venv", "__pycache__", ".pytest_cache"]):
            with open(file, "rb") as f:
                while chunk := f.read(8192):
                    hasher.update(chunk)
    return hasher.hexdigest()


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Ensure Default Users
    dev_user = db.query(User).filter(User.username == "roboskill").first()
    if not dev_user:
        dev_user = User(
            username="roboskill",
            email="artisan@roboskill.internal",
            role="developer",
            display_name="RoboSkill Artisan Guild",
            bio="The founding workshop of autonomous mechanical intelligence and algorithmic skillcraft.",
            avatar_url="/avatars/guildmaster.png"
        )
        db.add(dev_user)
        db.commit()
        db.refresh(dev_user)

        dev_profile = DeveloperProfile(
            user_id=dev_user.id,
            guild_name="Founding Automaton Guild",
            website="https://roboskill.internal",
            payout_address="0xROBOSKILL_TREASURY_VAULT",
            total_sales=0,
            total_earnings_cents=0
        )
        db.add(dev_profile)
        db.commit()

    owner_user = db.query(User).filter(User.username == "archimedes_builder").first()
    if not owner_user:
        owner_user = User(
            username="archimedes_builder",
            email="builder@syndicate.internal",
            role="robot_owner",
            display_name="Archimedes Labs",
            bio="Experimental robotics tinkerer building autonomous rovers and clockwork mechanisms."
        )
        db.add(owner_user)
        db.commit()

    # 2. Seed the imported Obstacle Avoidance Skill
    imported_dir = PACKAGES_DIR / "roboskill-obstacle-avoidance"
    manifest_path = imported_dir / "manifest.json"
    readme_path = imported_dir / "README.md"

    if manifest_path.exists():
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest_data = json.load(f)

        readme_text = ""
        if readme_path.exists():
            with open(readme_path, "r", encoding="utf-8") as f:
                readme_text = f.read()

        skill_id = manifest_data.get("id", "roboskill.obstacle-avoidance")
        existing_skill = db.query(Skill).filter(Skill.id == skill_id).first()

        if not existing_skill:
            skill = Skill(
                id=skill_id,
                name="Obstacle Avoidance",
                tagline="Precision real-time collision prevention and evasive steering for mobile robots.",
                description="A reusable obstacle avoidance decision-making skill that uses distance measurements to determine movement requests. Detects obstacles within configurable stopping thresholds and issues evasive turn requests.",
                category="Navigation",
                language="Python",
                license="MIT",
                price_cents=0,  # Free open-core artisan release
                is_published=True,
                creator_id=dev_user.id
            )
            db.add(skill)
            db.commit()

            version = SkillVersion(
                skill_id=skill.id,
                version=manifest_data.get("version", "0.1.0"),
                release_notes="Initial verified release featuring full Python unit test suite, safe threshold validation, and simulation adapter interface.",
                readme_markdown=readme_text,
                tested_on_hardware=False,  # RULE: Do not claim physical robot compatibility!
                unit_tests_passed=True
            )
            db.add(version)
            db.commit()
            db.refresh(version)

            file_tree = get_file_tree(imported_dir)
            total_size = sum(item["size"] for item in file_tree)
            pkg_hash = compute_sha256(imported_dir)

            package = SkillPackage(
                version_id=version.id,
                storage_path=str(imported_dir),
                file_size_bytes=total_size,
                sha256_hash=pkg_hash,
                file_tree=file_tree
            )
            db.add(package)

            manifest_entity = SkillManifest(
                version_id=version.id,
                raw_json=manifest_data,
                schema_version=manifest_data.get("schema_version", "1.0"),
                required_capabilities=manifest_data.get("requirements", {}).get("capabilities", []),
                inputs=manifest_data.get("inputs", []),
                outputs=manifest_data.get("outputs", []),
                runtime_info=manifest_data.get("runtime", {}),
                tested_on=manifest_data.get("tested_on", [])
            )
            db.add(manifest_entity)
            db.commit()

    # 3. Seed Robot Hardware Profiles for Compatibility Evaluation
    robots = [
        {
            "id": "archimedes-rover-mk1",
            "name": "Archimedes Rover MK-I",
            "manufacturer": "Ancient Automaton Guild",
            "category": "Differential Drive Ground Rover",
            "operating_system": "Ubuntu 24.04 LTS (Noble) / Raspberry Pi OS",
            "cpu_architecture": "ARM64 (Cortex-A76)",
            "supported_languages": ["Python", "C++", "Rust"],
            "supported_middleware": ["ROS 2 Humble", "Direct Python 3.11+"],
            "communication_interfaces": ["UART", "I2C", "CAN", "WiFi 6"],
            "description": "An open-frame dual-tread experimental rover built for indoor navigation and sensor experimentation.",
            "capabilities": [
                {"capability_type": "sensor", "identifier": "distance_sensor", "specifications": {"type": "Ultrasonic HC-SR04", "range_cm": [2, 400]}},
                {"capability_type": "locomotion", "identifier": "mobile_base", "specifications": {"type": "differential_drive", "max_speed_mps": 0.8}},
                {"capability_type": "computing", "identifier": "python_runtime", "specifications": {"version": "3.12"}}
            ]
        },
        {
            "id": "davinci-hexapod-v2",
            "name": "DaVinci Clockwork Hexapod",
            "manufacturer": "Florentine Mechanics Ltd",
            "category": "Biomimetic 6-Legged Walker",
            "operating_system": "FreeRTOS / ESP-IDF",
            "cpu_architecture": "Xtensa Dual-Core 240MHz",
            "supported_languages": ["C++", "MicroPython"],
            "supported_middleware": ["Micro-ROS", "Custom Serial Protocol"],
            "communication_interfaces": ["BLE 5.0", "WiFi", "I2C"],
            "description": "Articulated mechanical crawler with 18 high-torque brass gear servos for rough terrain traversals.",
            "capabilities": [
                {"capability_type": "sensor", "identifier": "distance_sensor", "specifications": {"type": "VL53L0X ToF Laser", "range_cm": [3, 200]}},
                {"capability_type": "locomotion", "identifier": "mobile_base", "specifications": {"type": "hexapod_gait", "degrees_of_freedom": 18}},
                {"capability_type": "computing", "identifier": "micropython_runtime", "specifications": {"version": "1.22"}}
            ]
        },
        {
            "id": "hephaestus-forge-arm",
            "name": "Hephaestus 6-DOF Robotic Arm",
            "manufacturer": "Vulcan Foundry Works",
            "category": "Articulated Industrial Manipulator",
            "operating_system": "Real-Time Linux (PREEMPT_RT)",
            "cpu_architecture": "x86_64 Intel Core i7",
            "supported_languages": ["Python", "C++"],
            "supported_middleware": ["ROS 2 Iron", "EtherCAT"],
            "communication_interfaces": ["EtherCAT", "Gigabit Ethernet", "CANopen"],
            "description": "Heavy-duty 6-axis precision manipulator for metallurgy, assembly, and gear fabrication.",
            "capabilities": [
                {"capability_type": "actuator", "identifier": "arm_6dof", "specifications": {"payload_kg": 5.0, "reach_mm": 850}},
                {"capability_type": "sensor", "identifier": "force_torque_sensor", "specifications": {"axes": 6}},
                {"capability_type": "computing", "identifier": "python_runtime", "specifications": {"version": "3.11"}}
            ]
        },
        {
            "id": "vitruvian-scout-drone",
            "name": "Vitruvian Aerial Scout",
            "manufacturer": "Atelier Aeronautics",
            "category": "Autonomous Aerial Drone",
            "operating_system": "PX4 Autopilot / Ubuntu 22.04",
            "cpu_architecture": "ARM64 NVIDIA Orin Nano",
            "supported_languages": ["Python", "C++"],
            "supported_middleware": ["ROS 2 Humble", "MAVLink"],
            "communication_interfaces": ["WiFi", "Radio Telemetry 915MHz", "UART"],
            "description": "Compact aerial platform with stereoscopic vision and altitude barometer for spatial surveying.",
            "capabilities": [
                {"capability_type": "sensor", "identifier": "stereo_camera", "specifications": {"fps": 60, "resolution": "1080p"}},
                {"capability_type": "sensor", "identifier": "distance_sensor", "specifications": {"type": "Downward Lidar", "range_cm": [10, 1200]}},
                {"capability_type": "locomotion", "identifier": "quadcopter_propulsion", "specifications": {"thrust_kg": 2.4}}
            ]
        }
    ]

    for rob in robots:
        existing_rob = db.query(RobotProfile).filter(RobotProfile.id == rob["id"]).first()
        if not existing_rob:
            r = RobotProfile(
                id=rob["id"],
                name=rob["name"],
                manufacturer=rob["manufacturer"],
                category=rob["category"],
                operating_system=rob["operating_system"],
                cpu_architecture=rob["cpu_architecture"],
                supported_languages=rob["supported_languages"],
                supported_middleware=rob["supported_middleware"],
                communication_interfaces=rob["communication_interfaces"],
                description=rob["description"],
                is_custom=False
            )
            db.add(r)
            db.commit()

            for cap in rob["capabilities"]:
                c = RobotCapability(
                    robot_id=rob["id"],
                    capability_type=cap["capability_type"],
                    identifier=cap["identifier"],
                    specifications=cap.get("specifications")
                )
                db.add(c)
            db.commit()

    db.close()
    print("Database seeding completed successfully.")


if __name__ == "__main__":
    seed_database()

