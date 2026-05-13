import os
import sys
import unittest
from unittest.mock import patch

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import ai.predict_priority as pp


class TestPredictPriority(unittest.TestCase):
    def test_critical_fire(self):
        self.assertEqual(pp.predict_priority("Fire in building"), "Critical")
        self.assertEqual(pp.severity_score("Fire in building"), 0.95)

    def test_critical_robbery(self):
        self.assertEqual(pp.predict_priority("Robbery near ATM"), "Critical")

    def test_high_electric_pole_fallen(self):
        self.assertEqual(pp.predict_priority("Electric pole fallen on road"), "High")
        self.assertEqual(pp.severity_score("Electric pole fallen on road"), 0.80)

    def test_medium_service_disruption(self):
        self.assertEqual(pp.predict_priority("Streetlight not working"), "Medium")
        self.assertEqual(pp.severity_score("Streetlight not working"), 0.55)

    def test_low_informational(self):
        self.assertEqual(pp.predict_priority("Need office timing details"), "Low")
        self.assertEqual(pp.severity_score("Need office timing details"), 0.25)

    def test_default_medium_for_unclear_text(self):
        self.assertEqual(pp.predict_priority("Some unclear complaint text"), "Medium")

    def test_department_escalation_fire_and_rescue_min_high(self):
        self.assertEqual(
            pp.predict_priority("Streetlight not working", department="Fire and Rescue"),
            "High",
        )

    def test_department_escalation_police_force_critical_on_attack_terms(self):
        self.assertEqual(
            pp.predict_priority("Attack near market", department="Police"),
            "Critical",
        )

    def test_department_escalation_electricity_min_high_for_live_wire_terms(self):
        self.assertEqual(
            pp.predict_priority("Live wire near bus stop", department="Electricity"),
            "High",
        )

    def test_translation_path_is_used_before_matching(self):
        with patch.object(pp, "detect_language", return_value="ml"), patch.object(
            pp,
            "translate_to_english",
            return_value="gas leak in house",
        ):
            self.assertEqual(pp.predict_priority("ഗ്യാസ് പ്രശ്നം"), "Critical")

    def test_translation_variant_electricity_post_fell_maps_high(self):
        with patch.object(pp, "detect_language", return_value="ml"), patch.object(
            pp,
            "translate_to_english",
            return_value="electricity post fell",
        ):
            self.assertEqual(pp.predict_priority("വൈദ്യുതി പോസ്റ്റ് വീണു"), "High")

    def test_translation_variant_transformer_broke_maps_high(self):
        with patch.object(pp, "detect_language", return_value="ml"), patch.object(
            pp,
            "translate_to_english",
            return_value="the transformer broke",
        ):
            self.assertEqual(pp.predict_priority("ട്രാൻസ്ഫോർമർ പൊട്ടി"), "High")

    def test_translation_typo_steet_light_maps_medium(self):
        with patch.object(pp, "detect_language", return_value="ml"), patch.object(
            pp,
            "translate_to_english",
            return_value="steet light not working",
        ):
            self.assertEqual(pp.predict_priority("സ്റ്റ്രീറ്റ് ലൈറ്റ് പ്രവർത്തിക്കുന്നില്ല"), "Medium")


if __name__ == "__main__":
    unittest.main()
