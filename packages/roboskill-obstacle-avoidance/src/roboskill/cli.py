
import argparse
import json

from roboskill import ObstacleAvoidanceSkill


def main():

    parser = argparse.ArgumentParser(
        description="RoboSkill Obstacle Avoidance"
    )

    parser.add_argument(
        "--distance",
        type=float,
        required=True
    )

    parser.add_argument(
        "--stop-distance",
        type=float,
        default=20.0
    )

    args = parser.parse_args()

    skill = ObstacleAvoidanceSkill(args.stop_distance)

    result = skill.run(args.distance)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
