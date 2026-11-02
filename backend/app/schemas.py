from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class SkillManifestSchema(BaseModel):
    schema_version: str = "1.0"
    id: str
    name: str
    version: str
    description: str
    category: str
    runtime: Dict[str, Any]
    inputs: List[str]
    outputs: List[str]
    requirements: Dict[str, Any]
    tested_on: List[str]
    license: Optional[str] = "MIT"


class SkillSummary(BaseModel):
    id: str
    name: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    category: str
    language: str
    license: str
    price_cents: int
    is_published: bool
    creator_name: str
    version: str
    tested_on_hardware: bool
    unit_tests_passed: bool
    downloads_count: int
    rating_avg: float
    reviews_count: int
    best_robot: Optional[str] = "Differential Drive Rover / Two-Wheeled Chassis"
    best_microcontroller: Optional[str] = "ESP32 / Raspberry Pi Pico / Arduino Uno"
    created_at: datetime


class SkillDetail(SkillSummary):
    release_notes: Optional[str] = None
    readme_markdown: Optional[str] = None
    manifest: Optional[Dict[str, Any]] = None
    file_tree: Optional[Dict[str, Any]] = None
    file_size_bytes: int = 0
    requirements: Optional[Dict[str, Any]] = None


class RobotCapabilitySchema(BaseModel):
    capability_type: str
    identifier: str
    specifications: Optional[Dict[str, Any]] = None


class RobotProfileSchema(BaseModel):
    id: str
    name: str
    manufacturer: str
    category: str
    operating_system: str
    cpu_architecture: str
    supported_languages: List[str]
    supported_middleware: List[str]
    communication_interfaces: List[str]
    description: Optional[str] = None
    is_custom: bool = False
    capabilities: List[RobotCapabilitySchema] = []


class CompatibilityReport(BaseModel):
    skill_id: str
    skill_name: str
    robot_id: str
    robot_name: str
    status: str  # COMPATIBLE, PARTIALLY COMPATIBLE, NOT COMPATIBLE, UNVERIFIED
    score_percentage: int
    summary: str
    matched_capabilities: List[str]
    missing_capabilities: List[str]
    hardware_tested: bool
    notes: List[str]


class SimulationStepRequest(BaseModel):
    skill_id: str
    robot_id: str
    distance_cm: float
    stop_distance_cm: float = 20.0
    environment: str = "ancient_workshop"


class SimulationStepResponse(BaseModel):
    skill: str
    success: bool
    action: str  # forward, turn, stop
    reason: str
    distance_cm: float
    stop_distance_cm: float
    timestamp: float
    simulated_telemetry: Dict[str, Any]


class TestRunnerResult(BaseModel):
    skill_id: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    duration_seconds: float
    raw_output: str
    tests: List[Dict[str, Any]]


class UserSchema(BaseModel):
    id: int
    username: str
    email: str
    role: str
    display_name: Optional[str] = None
    bio: Optional[str] = None


class PurchaseRequest(BaseModel):
    skill_id: str
    payment_method: str = "mock_credit_card"  # Clear mockup

