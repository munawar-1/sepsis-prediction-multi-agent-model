"""
Unit tests for Hybrid DataValidator tool.
Tests:
1. Normal telemetry passes with 0ms delay (is_valid=True, target_role=None).
2. Slipped finger clip detected (is_valid=False, target_role="ROLE_NURSE", fault_type="OXIMETER_DETACHED").
3. Inverted BP detected (is_valid=False, target_role="ROLE_NURSE", fault_type="INVERTED_BLOOD_PRESSURE").
4. Signal freeze detected (is_valid=False, target_role="ROLE_NURSE", fault_type="TELEMETRY_FROZEN").
5. Sudden physiological jump detected (is_valid=False, target_role="ROLE_NURSE").
"""

import os
import sys
import unittest

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from models.triage_orchestrator.src.data_validator import DataValidator


class TestDataValidator(unittest.TestCase):
    def setUp(self):
        self.validator = DataValidator()

    def test_healthy_normal_telemetry(self):
        vitals = {"HR": 78.0, "SBP": 120.0, "DBP": 80.0, "Resp": 16.0, "O2Sat": 98.0}
        res = self.validator.validate(vitals)
        self.assertTrue(res.is_valid)
        self.assertIsNone(res.target_role)
        self.assertIsNone(res.fault_type)
        self.assertEqual(len(res.detected_anomalies), 0)

    def test_slipped_pulse_oximeter_clip(self):
        # SpO2 70% with normal calm breathing (14) and calm HR (72)
        vitals = {"HR": 72.0, "SBP": 118.0, "DBP": 78.0, "Resp": 14.0, "O2Sat": 70.0}
        res = self.validator.validate(vitals)
        self.assertFalse(res.is_valid)
        self.assertEqual(res.target_role, "ROLE_NURSE")
        self.assertEqual(res.fault_type, "OXIMETER_DETACHED")
        self.assertIn("probe", res.bedside_action.lower())

    def test_inverted_blood_pressure_cuff(self):
        # SBP 75 <= DBP 85
        vitals = {"HR": 85.0, "SBP": 75.0, "DBP": 85.0, "Resp": 18.0, "O2Sat": 97.0}
        res = self.validator.validate(vitals)
        self.assertFalse(res.is_valid)
        self.assertEqual(res.target_role, "ROLE_NURSE")
        self.assertEqual(res.fault_type, "INVERTED_BLOOD_PRESSURE")
        self.assertIn("cuff", res.bedside_action.lower())

    def test_severe_pulse_pressure_dampening(self):
        # SBP 102 - DBP 95 = 7 mmHg (< 10 threshold)
        vitals = {"HR": 90.0, "SBP": 102.0, "DBP": 95.0, "Resp": 18.0, "O2Sat": 96.0}
        res = self.validator.validate(vitals)
        self.assertFalse(res.is_valid)
        self.assertEqual(res.target_role, "ROLE_NURSE")
        self.assertEqual(res.fault_type, "NARROW_PULSE_PRESSURE")

    def test_sudden_impossible_heart_rate_jump(self):
        vitals_prev = {"HR": 70.0, "SBP": 120.0, "MAP": 85.0, "Resp": 16.0}
        vitals_now = {"HR": 145.0, "SBP": 120.0, "MAP": 85.0, "Resp": 16.0, "O2Sat": 98.0}
        res = self.validator.validate(vitals_now, previous_vitals=vitals_prev)
        self.assertFalse(res.is_valid)
        self.assertEqual(res.target_role, "ROLE_NURSE")
        self.assertEqual(res.fault_type, "SIGNAL_DISCONTINUITY")

    def test_frozen_telemetry_stream(self):
        # All core parameters identical across consecutive readings
        vitals_prev = {"HR": 82.5, "SBP": 118.0, "MAP": 84.0, "Resp": 17.0}
        vitals_now = {"HR": 82.5, "SBP": 118.0, "MAP": 84.0, "Resp": 17.0, "O2Sat": 98.0}
        res = self.validator.validate(vitals_now, previous_vitals=vitals_prev)
        self.assertFalse(res.is_valid)
        self.assertEqual(res.target_role, "ROLE_NURSE")
        self.assertEqual(res.fault_type, "TELEMETRY_FROZEN")


if __name__ == "__main__":
    unittest.main()
