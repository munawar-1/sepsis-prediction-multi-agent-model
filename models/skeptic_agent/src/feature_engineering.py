"""
Model 3 (Skeptic Agent): Feature Engineering & Confounder Analysis
Correlates electronic health record (EHR) medication records with vital spikes
and analyzes signal noise to identify benign alarm triggers.
"""

import os
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "dataset")

# Known medications that cause benign heart rate spikes
SYMPATHOMIMETIC_MEDS = [
    "Albuterol",
    "Salbutamol",
    "Epinephrine",
    "Dobutamine",
    "Dopamine",
    "Atropine"
]

def compute_confounder_features(vitals_row, medication_history):
    """
    Evaluates whether an active vital elevation is explained by recent medications
    or represents genuine systemic inflammatory response.
    """
    pass
