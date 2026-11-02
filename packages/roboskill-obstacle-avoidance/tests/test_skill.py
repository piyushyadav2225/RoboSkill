
import pytest

from roboskill import ObstacleAvoidanceSkill


def test_clear_path():
    skill = ObstacleAvoidanceSkill()
    assert skill.run(100)["action"] == "forward"


def test_obstacle():
    skill = ObstacleAvoidanceSkill()
    assert skill.run(10)["action"] == "turn"


def test_threshold():
    skill = ObstacleAvoidanceSkill(20)
    assert skill.run(20)["action"] == "turn"


def test_invalid_input():
    skill = ObstacleAvoidanceSkill()
    result = skill.run(None)

    assert result["action"] == "stop"
    assert result["success"] is False


def test_negative_distance():
    skill = ObstacleAvoidanceSkill()
    assert skill.run(-10)["action"] == "stop"


def test_invalid_threshold():
    with pytest.raises(ValueError):
        ObstacleAvoidanceSkill(0)


def test_custom_threshold():
    skill = ObstacleAvoidanceSkill(30)

    assert skill.run(25)["action"] == "turn"
    assert skill.run(40)["action"] == "forward"
