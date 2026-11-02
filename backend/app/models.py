from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    role = Column(String(32), default="developer")  # developer, robot_owner, admin
    display_name = Column(String(128))
    bio = Column(Text)
    avatar_url = Column(String(256))
    created_at = Column(DateTime, default=datetime.utcnow)

    developer_profile = relationship("DeveloperProfile", back_populates="user", uselist=False)
    skills = relationship("Skill", back_populates="creator")
    purchases = relationship("Purchase", back_populates="user")
    robot_profiles = relationship("RobotProfile", back_populates="owner")
    reviews = relationship("Review", back_populates="user")
    simulations = relationship("SimulationSession", back_populates="user")


class DeveloperProfile(Base):
    __tablename__ = "developer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    guild_name = Column(String(128), default="RoboSkill Artisan Guild")
    website = Column(String(256))
    payout_address = Column(String(256))
    total_sales = Column(Integer, default=0)
    total_earnings_cents = Column(Integer, default=0)  # stored in cents
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="developer_profile")
    earnings = relationship("CreatorEarning", back_populates="developer")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(String(128), primary_key=True, index=True)  # e.g., "roboskill.obstacle-avoidance"
    name = Column(String(128), nullable=False, index=True)
    tagline = Column(String(256))
    description = Column(Text)
    category = Column(String(64), nullable=False, index=True)  # Navigation, etc.
    language = Column(String(32), default="Python", index=True)
    license = Column(String(64), default="MIT")
    price_cents = Column(Integer, default=0)  # 0 for free
    is_published = Column(Boolean, default=True)
    best_robot = Column(String(256), default="Differential Drive Rover / Two-Wheeled Chassis")
    best_microcontroller = Column(String(256), default="ESP32 / Raspberry Pi Pico / Arduino Uno")
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", back_populates="skills")
    versions = relationship("SkillVersion", back_populates="skill", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="skill")
    purchases = relationship("Purchase", back_populates="skill")
    downloads = relationship("Download", back_populates="skill")
    compatibility_results = relationship("CompatibilityResult", back_populates="skill")


class SkillVersion(Base):
    __tablename__ = "skill_versions"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(String(128), ForeignKey("skills.id"), nullable=False, index=True)
    version = Column(String(32), nullable=False)  # e.g. "0.1.0"
    release_notes = Column(Text)
    readme_markdown = Column(Text)
    tested_on_hardware = Column(Boolean, default=False)  # Explicitly False for physical compatibility
    unit_tests_passed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    skill = relationship("Skill", back_populates="versions")
    package = relationship("SkillPackage", back_populates="version", uselist=False, cascade="all, delete-orphan")
    manifest = relationship("SkillManifest", back_populates="version", uselist=False, cascade="all, delete-orphan")


class SkillPackage(Base):
    __tablename__ = "skill_packages"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("skill_versions.id"), unique=True, nullable=False)
    storage_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    sha256_hash = Column(String(64))
    file_tree = Column(JSON)  # Directory structure
    created_at = Column(DateTime, default=datetime.utcnow)

    version = relationship("SkillVersion", back_populates="package")


class SkillManifest(Base):
    __tablename__ = "skill_manifests"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("skill_versions.id"), unique=True, nullable=False)
    raw_json = Column(JSON, nullable=False)
    schema_version = Column(String(16), default="1.0")
    required_capabilities = Column(JSON)  # ["distance_sensor", "mobile_base"]
    inputs = Column(JSON)
    outputs = Column(JSON)
    runtime_info = Column(JSON)
    tested_on = Column(JSON)

    version = relationship("SkillVersion", back_populates="manifest")


class RobotProfile(Base):
    __tablename__ = "robot_profiles"

    id = Column(String(64), primary_key=True, index=True)  # e.g. "archimedes-rover-mk1"
    name = Column(String(128), nullable=False)
    manufacturer = Column(String(128), default="Custom / Community")
    category = Column(String(64), default="Differential Drive Rover")
    operating_system = Column(String(64), default="Ubuntu Linux 24.04 / Raspberry Pi OS")
    cpu_architecture = Column(String(32), default="ARM64 / x86_64")
    supported_languages = Column(JSON)  # ["Python", "C++", "ROS 2"]
    supported_middleware = Column(JSON)  # ["ROS 2 Humble", "Direct Python", "Micro-ROS"]
    communication_interfaces = Column(JSON)  # ["UART", "I2C", "CAN", "Ethernet", "WiFi"]
    description = Column(Text)
    is_custom = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="robot_profiles")
    capabilities = relationship("RobotCapability", back_populates="robot", cascade="all, delete-orphan")
    compatibility_results = relationship("CompatibilityResult", back_populates="robot")


class RobotCapability(Base):
    __tablename__ = "robot_capabilities"

    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(String(64), ForeignKey("robot_profiles.id"), nullable=False)
    capability_type = Column(String(64))  # sensor, actuator, computing, locomotion
    identifier = Column(String(64), nullable=False)  # distance_sensor, mobile_base, camera, arm_6dof
    specifications = Column(JSON)  # {"range_cm": [2, 400], "precision": "1cm"}

    robot = relationship("RobotProfile", back_populates="capabilities")


class CompatibilityResult(Base):
    __tablename__ = "compatibility_results"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(String(128), ForeignKey("skills.id"), nullable=False)
    robot_id = Column(String(64), ForeignKey("robot_profiles.id"), nullable=False)
    status = Column(String(32), nullable=False)  # COMPATIBLE, PARTIALLY COMPATIBLE, NOT COMPATIBLE, UNVERIFIED
    score_percentage = Column(Integer, default=0)
    reasons = Column(JSON)  # Details on what matches, what is missing, hardware verification status
    evaluated_at = Column(DateTime, default=datetime.utcnow)

    skill = relationship("Skill", back_populates="compatibility_results")
    robot = relationship("RobotProfile", back_populates="compatibility_results")


class SimulationSession(Base):
    __tablename__ = "simulation_sessions"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    skill_id = Column(String(128), nullable=False)
    robot_id = Column(String(64), nullable=False)
    environment = Column(String(64), default="ancient_workshop_arena")
    total_steps = Column(Integer, default=0)
    obstacles_avoided = Column(Integer, default=0)
    collisions = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="simulations")
    reports = relationship("SimulationReport", back_populates="session", cascade="all, delete-orphan")


class SimulationReport(Base):
    __tablename__ = "simulation_reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("simulation_sessions.id"), nullable=False)
    verdict = Column(String(32), default="SUCCESS")  # SUCCESS, COLLISION, TIMEOUT
    summary = Column(Text)
    metrics = Column(JSON)  # {"avg_distance_cm": 45.2, "turns_executed": 6}
    log_excerpt = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("SimulationSession", back_populates="reports")


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(String(128), ForeignKey("skills.id"), nullable=False)
    price_cents = Column(Integer, default=0)
    platform_fee_cents = Column(Integer, default=0)
    creator_payout_cents = Column(Integer, default=0)
    transaction_ref = Column(String(64), unique=True)
    status = Column(String(32), default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="purchases")
    skill = relationship("Skill", back_populates="purchases")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(String(128), ForeignKey("skills.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5
    title = Column(String(128))
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    skill = relationship("Skill", back_populates="reviews")
    user = relationship("User", back_populates="reviews")


class CreatorEarning(Base):
    __tablename__ = "creator_earnings"

    id = Column(Integer, primary_key=True, index=True)
    developer_id = Column(Integer, ForeignKey("developer_profiles.id"), nullable=False)
    amount_cents = Column(Integer, nullable=False)
    skill_id = Column(String(128))
    purchase_id = Column(Integer)
    description = Column(String(256))
    created_at = Column(DateTime, default=datetime.utcnow)

    developer = relationship("DeveloperProfile", back_populates="earnings")


class Download(Base):
    __tablename__ = "downloads"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(String(128), ForeignKey("skills.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ip_hash = Column(String(64))
    downloaded_at = Column(DateTime, default=datetime.utcnow)

    skill = relationship("Skill", back_populates="downloads")

