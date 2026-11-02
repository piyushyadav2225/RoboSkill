
import math


class ObstacleAvoidanceSkill:

    def __init__(self, stop_distance_cm=20.0):
        if (
            isinstance(stop_distance_cm, bool)
            or not isinstance(stop_distance_cm, (int, float))
            or not math.isfinite(stop_distance_cm)
            or stop_distance_cm <= 0
        ):
            raise ValueError("Invalid stopping distance")

        self.stop_distance_cm = float(stop_distance_cm)

    def run(self, distance_cm):

        if (
            isinstance(distance_cm, bool)
            or not isinstance(distance_cm, (int, float))
            or not math.isfinite(distance_cm)
            or distance_cm < 0
        ):
            return {
                "skill": "obstacle_avoidance",
                "success": False,
                "action": "stop",
                "reason": "invalid_sensor_reading"
            }

        if distance_cm <= self.stop_distance_cm:
            action = "turn"
            reason = "obstacle_detected"
        else:
            action = "forward"
            reason = "path_clear"

        return {
            "skill": "obstacle_avoidance",
            "success": True,
            "action": action,
            "reason": reason,
            "distance_cm": float(distance_cm)
        }
