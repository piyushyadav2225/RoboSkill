
# RoboSkill Obstacle Avoidance

A reusable Python obstacle avoidance skill.

## Requirements
Python 3.11+

## Installation
python -m pip install -e ".[test]"

## Run
roboskill-obstacle --distance 100

## Custom threshold
roboskill-obstacle --distance 10 --stop-distance 30

## Run tests
python -m pytest -v

## Functionality
- Detects nearby obstacles using distance input.
- Requests forward movement when the path is clear.
- Requests a turn when an obstacle is detected.
- Requests a stop for invalid readings.

## Limitations
This package contains decision logic only.
Hardware integration and safety validation are required
before physical robot deployment.
