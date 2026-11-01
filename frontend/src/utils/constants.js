// Clinical constants and telemetry presets for Aegis-ICU

export const SIMULATION_TIMELINE = [
  {
    hour: 0,
    time: "00:00",
    label: "Baseline Admission",
    hr: 72,
    hrTrend: "Stable",
    bp: "124/80",
    map: 94,
    resp: 14,
    temp: 36.8,
    spo2: 98,
    shockIndex: 0.58,
    lactate: "1.0",
    wbc: "7.2",
    platelets: 210,
    creatinine: "0.9",
    riskScore: 6,
    riskLevel: "NORMAL",
    vitalsStatus: "NORMAL",
    labsStatus: "BASELINE",
    skepticStatus: "NO_CONFOUNDERS",
    summary: "Patient stable post-laparotomy. Vitals within normative baselines.",
    color: "#35D6C5"
  },
  {
    hour: 4,
    time: "04:00",
    label: "Occult Compensatory Phase",
    hr: 84,
    hrTrend: "Creeping (+12 bpm)",
    bp: "128/82",
    map: 97,
    resp: 16,
    temp: 37.2,
    spo2: 97,
    shockIndex: 0.65,
    lactate: "1.2",
    wbc: "9.1",
    platelets: 195,
    creatinine: "0.95",
    riskScore: 24,
    riskLevel: "EVALUATING",
    vitalsStatus: "SUBTLE_DRIFT",
    labsStatus: "NOMINAL",
    skepticStatus: "NO_CONFOUNDERS",
    summary: "Mild sinus rate creep detected by Random Forest model. Systolic compensation masking microvascular shift.",
    color: "#559BFF"
  },
  {
    hour: 8,
    time: "08:00",
    label: "Early Divergence",
    hr: 92,
    hrTrend: "Elevated (+20 bpm)",
    bp: "122/78",
    map: 92,
    resp: 19,
    temp: 37.8,
    spo2: 96,
    shockIndex: 0.75,
    lactate: "1.4",
    wbc: "11.8",
    platelets: 180,
    creatinine: "1.1",
    riskScore: 48,
    riskLevel: "WATCHLIST",
    vitalsStatus: "PATTERN_WARNING",
    labsStatus: "STALE (>8h)",
    skepticStatus: "ANALYZING_MAR",
    summary: "Tachycardia decoupled from hemodynamic demand. Traditional NEWS2 score remains under alarm threshold.",
    color: "#E5B86A"
  },
  {
    hour: 14,
    time: "14:00",
    label: "Latent Deterioration",
    hr: 101,
    hrTrend: "Tachypnea & Tachycardia",
    bp: "116/74",
    map: 88,
    resp: 22,
    temp: 38.4,
    spo2: 95,
    shockIndex: 0.87,
    lactate: "2.1",
    wbc: "14.6",
    platelets: 148,
    creatinine: "1.3",
    riskScore: 72,
    riskLevel: "HIGH_RISK",
    vitalsStatus: "SEPSIS_VECTOR",
    labsStatus: "ABNORMAL_LACTATE",
    skepticStatus: "CONFOUNDER_DISCOUNTED",
    summary: "Albuterol administered 5h prior ruled out as sole cause of tachypnea and tachycardia. Vitals-Lab convergence.",
    color: "#FF8A65"
  },
  {
    hour: 22,
    time: "22:00",
    label: "Critical Sepsis Vector",
    hr: 108,
    hrTrend: "Critical Tachycardia",
    bp: "98/62",
    map: 74,
    resp: 25,
    temp: 38.9,
    spo2: 93,
    shockIndex: 1.10,
    lactate: "3.2",
    wbc: "17.4",
    platelets: 122,
    creatinine: "1.6",
    riskScore: 89,
    riskLevel: "CRITICAL_SEPSIS",
    vitalsStatus: "DECOMPENSATION",
    labsStatus: "HYPERLACTATEMIA",
    skepticStatus: "GENUINE_SEPSIS_CONFIRMED",
    summary: "Severe organ hypoperfusion pattern identified. Traditional bedside monitors only now triggering low BP alarm (3.8h later than Aegis).",
    color: "#FF5268"
  }
];

export const AGENT_PROFILES = [
  {
    id: "vitals",
    name: "Agent 01 — Vitals Intelligence",
    tagline: "High-Frequency Physiological Pattern Recognition",
    model: "Trained Random Forest Classifier + Time-Series Drift",
    color: "#35D6C5",
    icon: "Activity",
    description: "Evaluates continuous bedside telemetry at 5-minute rolling epochs. Rather than relying on rigid, single-parameter alert thresholds, it detects early multi-signal decoupling—such as subtle heart-rate creeping alongside compensatory systolic blood pressure.",
    metrics: [
      { label: "Heart Rate Trajectory", value: "+24 bpm / 4h", status: "Creeping" },
      { label: "Shock Index (HR/SBP)", value: "0.98", status: "Widening" },
      { label: "Respiratory Volatility", value: "24 bpm", status: "Tachypnea" },
      { label: "Model Confidence", value: "92.4%", status: "High" }
    ],
    technicalHighlights: [
      "Decoupled tachycardia detection ahead of systolic drop",
      "Shock index velocity tracking ($d(HR/SBP)/dt$)",
      "Standard NEWS2 blindspot compensation"
    ]
  },
  {
    id: "labs",
    name: "Agent 02 — Laboratory Intelligence",
    tagline: "Biomarker Kinetics & Staleness Verification",
    model: "Organ Dysfunction & Sepsis-3 Biochemical Heuristics",
    color: "#559BFF",
    icon: "FlaskConical",
    description: "Interprets laboratory pathology trends with automated staleness detection. Evaluates serum lactate clearance kinetics, leukocytosis shifts, platelet consumption, and acute kidney injury trajectories to substantiate physiological distress.",
    metrics: [
      { label: "Blood Lactate", value: "2.8 mmol/L", status: "Elevated STAT" },
      { label: "White Blood Cells", value: "16.8 x10^9/L", status: "Leukocytosis" },
      { label: "Platelet Count", value: "128 x10^9/L", status: "Consumptive" },
      { label: "Data Staleness", value: "6.2 hours old", status: "Flagged STAT" }
    ],
    technicalHighlights: [
      "Automated prompt for STAT blood lactate draw",
      "Platelet consumption rate tracking for coagulopathy",
      "Dynamic SOFA score organ dysfunction computation"
    ]
  },
  {
    id: "skeptic",
    name: "Agent 03 — Medication Context Intelligence",
    tagline: "Clinical Confounder & Pharmacological Context Engine",
    model: "Pharmacokinetics Knowledge Graph & Rule Verification",
    color: "#E5B86A",
    icon: "Pill",
    description: "Cross-examines electronic Medication Administration Records (eMAR) to identify pharmacological confounders. Distinguishes drug-induced tachycardia (e.g. beta-agonists) from septic deterioration without ever independently suppressing clinically critical alerts.",
    metrics: [
      { label: "Recent Inhalers", value: "Albuterol 2.5mg", status: "Given 5h ago" },
      { label: "Beta-Agonist Half-life", value: "3.8 hours", status: "Cleared" },
      { label: "Vasopressor Demand", value: "None", status: "Pre-shock" },
      { label: "Confounder Discount", value: "0.04 (Negligible)", status: "Alert Upheld" }
    ],
    technicalHighlights: [
      "Contextual discount strictly bounded (cannot dismiss critical signals)",
      "Chronological pharmacokinetic half-life decay modeling",
      "Reduces false-positive alert fatigue for ICU nursing staff"
    ]
  }
];

export const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Continuous Ingestion",
    role: "Bedside Telemetry & EHR Feed",
    detail: "High-frequency streaming of vital signs (ECG, SpO2, NIBP, Resp), laboratory pathology results, and MAR drug administrations via HL7 FHIR interfaces.",
    icon: "Radio"
  },
  {
    step: "02",
    title: "Vitals Pattern Analysis",
    role: "Agent 1: Physiological Vectors",
    detail: "Random Forest model calculates rolling variance, shock index slope, and multi-signal divergence, flagging subtle trends hours before threshold breaches.",
    icon: "Activity"
  },
  {
    step: "03",
    title: "Laboratory Integration",
    role: "Agent 2: Biochemical Evidence",
    detail: "Assesses cellular hypoxia (lactate), inflammatory markers (WBC), and organ degradation; triggers urgent lab draw recommendations if data is stale.",
    icon: "FlaskConical"
  },
  {
    step: "04",
    title: "Pharmacological Audit",
    role: "Agent 3: Contextual Skeptic",
    detail: "Reviews active infusions, recent bronchodilators, or anticholinergics to check if vitals perturbations have an anticipated pharmacological cause.",
    icon: "ShieldAlert"
  },
  {
    step: "05",
    title: "Consensus Synthesis",
    role: "Aegis Decision Engine",
    detail: "Synthesizes multi-agent evidence vectors into an explainable composite risk score with full feature-attribution reasoning.",
    icon: "Cpu"
  },
  {
    step: "06",
    title: "Clinician-in-the-Loop",
    role: "Clinical Review & Audit",
    detail: "Presents clear, un-siloed rationales to the intensivist. Clinician maintains 100% decision authority to execute bundle or override with rationale.",
    icon: "UserCheck"
  }
];

