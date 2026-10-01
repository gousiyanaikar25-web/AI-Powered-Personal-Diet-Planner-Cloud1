import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from ai_engine.diet_engine import calculate_targets, generate_plan


def test_targets():
    result = calculate_targets({
        "sex": "female",
        "age": 20,
        "height_cm": 165,
        "weight_kg": 60,
        "activity_level": "moderate",
        "goal": "cut",
    })

    assert result["bmr"] > 0
    assert result["tdee"] > 0
    assert result["daily_calories"] > 0
    assert result["macros"]["p"] > 0


def test_generate_plan():
    result = generate_plan({
        "sex": "female",
        "age": 20,
        "height_cm": 165,
        "weight_kg": 60,
        "activity_level": "moderate",
        "goal": "cut",
        "diet_pref": "vegetarian",
        "allergies": ["peanut"],
        "cuisines": ["indian"],
        "timeline_weeks": 3,
    })

    assert len(result["days"]) == 21
    assert len(result["days"][0]["meals"]) == 4
    assert len(result["days"][-1]["meals"]) == 4
    assert result["days"][0]["day"] == 1
    assert result["days"][-1]["day"] == 21
    assert result["engine"] == "rule-based"

