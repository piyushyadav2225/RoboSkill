import time
import math
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SimulationSession, SimulationReport, Skill, RobotProfile
from ..schemas import SimulationStepRequest, SimulationStepResponse
from ..simulation.adapter import SkillRunnerAdapter

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.post("/step", response_model=SimulationStepResponse)
def execute_simulation_step(req: SimulationStepRequest):
    """
    Executes a real decision step using the actual Python ObstacleAvoidanceSkill logic.
    """
    target_pkg = req.skill_id.replace("roboskill.", "roboskill-")
    adapter = SkillRunnerAdapter(target_pkg)
    result = adapter.execute_step(
        distance_cm=req.distance_cm,
        stop_distance_cm=req.stop_distance_cm
    )

    action = result.get("action", "stop")
    success = result.get("success", False)
    reason = result.get("reason", "unknown")

    # Generate telemetry context
    telemetry = {
        "sensor_mode": "ultrasonic_single_ray",
        "raw_distance_reading": req.distance_cm,
        "stop_threshold_configured": req.stop_distance_cm,
        "action_vector": [1.0, 0.0] if action == "forward" else ([0.0, 1.57] if action == "turn" else [0.0, 0.0]),
        "heading_delta_deg": 90.0 if action == "turn" else 0.0,
        "linear_velocity_mps": 0.4 if action == "forward" else 0.0,
        "simulation_fidelity": "algorithmic_decision_prototype (non-physical bench)"
    }

    return SimulationStepResponse(
        skill=result.get("skill", "obstacle_avoidance"),
        success=success,
        action=action,
        reason=reason,
        distance_cm=float(req.distance_cm) if req.distance_cm is not None else -1.0,
        stop_distance_cm=req.stop_distance_cm,
        timestamp=time.time(),
        simulated_telemetry=telemetry
    )


@router.post("/run-scenario")
def run_scenario(
    skill_id: str,
    robot_id: str,
    scenario_type: str = "approach_wall",  # approach_wall, corridor, clear_field
    stop_distance_cm: float = 20.0
):
    """
    Runs a multi-step scenario through the real skill and collects the full telemetry trace.
    """
    adapter = SkillRunnerAdapter("roboskill-obstacle-avoidance")

    steps = []
    # Generate distances based on scenario
    if scenario_type == "approach_wall":
        distances = [120, 95, 70, 50, 35, 25, 20, 18, 15, 12]
    elif scenario_type == "corridor":
        distances = [80, 75, 45, 22, 19, 85, 90, 30, 18, 60]
    else:
        distances = [150, 140, 130, 120, 110, 100, 90, 80]

    for idx, d in enumerate(distances):
        res = adapter.execute_step(d, stop_distance_cm=stop_distance_cm)
        steps.append({
            "step": idx + 1,
            "distance_cm": d,
            "action": res["action"],
            "reason": res["reason"],
            "success": res["success"]
        })

    return {
        "scenario": scenario_type,
        "total_steps": len(steps),
        "steps": steps,
        "avoidance_events": sum(1 for s in steps if s["action"] == "turn"),
        "forward_events": sum(1 for s in steps if s["action"] == "forward")
    }


@router.post("/save-report")
def save_simulation_report(report_data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Persists a simulation test report to the laboratory archives.
    """
    session_id = f"sim-{int(time.time())}"
    session = SimulationSession(
        id=session_id,
        user_id=1,
        skill_id=report_data.get("skill_id", "roboskill.obstacle-avoidance"),
        robot_id=report_data.get("robot_id", "archimedes-rover-mk1"),
        environment=report_data.get("environment", "ancient_laboratory"),
        total_steps=report_data.get("total_steps", 0),
        obstacles_avoided=report_data.get("obstacles_avoided", 0),
        collisions=report_data.get("collisions", 0)
    )
    db.add(session)
    db.commit()

    report = SimulationReport(
        session_id=session.id,
        verdict=report_data.get("verdict", "SUCCESS"),
        summary=report_data.get("summary", "Simulation completed in Ancient Engineering Virtual Lab."),
        metrics=report_data.get("metrics", {}),
        log_excerpt=report_data.get("log_excerpt", "")
    )
    db.add(report)
    db.commit()

    return {"status": "saved", "report_id": report.id, "session_id": session.id}

