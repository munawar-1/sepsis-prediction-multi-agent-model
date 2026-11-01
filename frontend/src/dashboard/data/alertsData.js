// Realistic Synthetic Sepsis Surveillance Alert Dataset
// Integrated from Google Stitch Aegis-ICU Intelligence Workspace

export const INITIAL_ALERTS_DATA = [
  {
    id: "ALT-1092",
    patientId: "PT-9042",
    bed: "Bed 04",
    age: 68,
    gender: "Male",
    admissionDiagnosis: "Acute Hypoxemic Respiratory Failure / Sepsis Surveillance",
    icuDay: 3,
    headline: "Vital-sign trend convergence: Shock Index > 1.0 with widening pulse pressure",
    summary: "Heart rate acceleration (+34 bpm over 3 hrs) coupled with declining MAP despite fluid administration. Meets severe sepsis criteria.",
    agent: "Vitals Intelligence Agent",
    agentKey: "vitals",
    agentIcon: "Activity",
    agentSpecialty: "Physiological Telemetry & Trend Decomposition",
    priority: "CRITICAL",
    timestamp: "6 mins ago",
    rawTime: 6,
    isRead: false,
    isReviewed: false,
    vitals: {
      hr: "118 bpm",
      hrTag: "tachycardia alert",
      bp: "88/54 mmHg",
      map: "MAP 65 mmHg",
      rr: "26 /min",
      rrTag: "tachypneic",
      temp: "38.9 °C",
      tempTag: "febrile spike",
      spo2: "92% on 4L NC",
      shockIndex: "1.34 (critical)"
    },
    labs: {
      lactate: "3.8 mmol/L (elevated)",
      wbc: "16.4 × 10⁹/L",
      creatinine: "1.8 mg/dL",
      platelets: "138 × 10⁹/L"
    },
    meds: {
      activeList: [
        { name: "Norepinephrine", dose: "0.08 mcg/kg/min", status: "Active titration ongoing", statusColor: "text-rose-400" },
        { name: "Vancomycin IV", dose: "1.25g in 250mL", status: "Administered 07:45 (T-minus 4h)", statusColor: "text-slate-400" },
        { name: "Metoprolol 50mg", dose: "50mg oral", status: "Held due to hypotension (MAP < 65)", isHeld: true, statusColor: "text-amber-400" }
      ],
      currentSummary: "Norepinephrine (0.08 mcg/kg/min titrating), Vancomycin IV (administered 07:45), Metoprolol 50mg (held due to hypotension)"
    },
    initialAgentMessage: "Attending Dr. Sarah Al-Mansoor: I have detected a high-consequence physiological shift in **Patient PT-9042 (Bed 04)**. Over the last 180 minutes, the patient exhibits sustained tachycardia reaching 118 bpm, coincident with an acute drop in Mean Arterial Pressure to 65 mmHg, driving the Shock Index to 1.34 (high risk for septic hypoperfusion).\n\nLaboratory Intelligence corroborates this with a concurrent venous lactate rise to 3.8 mmol/L. While Medication Agent notes a recent Norepinephrine titration, this vasopressor support has not yet stabilized the perfusion trajectory.",
    evidenceSections: [
      {
        title: "Vital-Sign Trend Analysis (0–3h Observation Window)",
        details: [
          { label: "Heart Rate Velocity", val: "+11.3 bpm/hour continuous upward trajectory" },
          { label: "Mean Arterial Pressure (MAP)", val: "Fell to 65 mmHg despite 1L balanced crystalloid" },
          { label: "Respiratory Rate Trend", val: "Tachypnea increased to 26 /min with persistent work of breathing" },
          { label: "Core Body Temperature", val: "Spike to 38.9°C febrile within 90 minutes" }
        ],
        interpretation: "Trend analysis rules out benign situational tachycardia. Dynamic arterial waveform confirms decreased systemic vascular resistance."
      },
      {
        title: "Corroborating Laboratory Findings",
        details: [
          { label: "Serum Lactate", val: "3.8 mmol/L (Critical threshold > 2.0 mmol/L, indicates anaerobic metabolism)" },
          { label: "Leukocytosis (WBC)", val: "16.4 × 10⁹/L with 14% immature band forms" },
          { label: "Renal Function", val: "Creatinine doubled to 1.8 mg/dL indicative of acute kidney injury (KDIGO Stage 2)" }
        ],
        interpretation: "Multi-organ involvement pattern consistent with Sepsis-3 consensus criteria."
      },
      {
        title: "Medication & Fluid Context Evaluation",
        details: [
          { label: "Vasopressor Status", val: "Norepinephrine 0.08 mcg/kg/min currently titrating" },
          { label: "Anti-infectives", val: "Vancomycin IV administered 07:45; blood cultures in incubation" },
          { label: "Hemodynamic Confounder", val: "Metoprolol 50mg appropriately held due to hypotension" }
        ],
        interpretation: "Shock state refractory to initial fluid bolus; active vasopressor titration required."
      }
    ],
    chips: [
      "Why did you flag this patient as Critical?",
      "Could medication timing explain the tachycardia?",
      "Which vital parameter contributed most to the score?",
      "Are there conflicting indicators with the lab values?",
      "Explain the reasoning in simpler clinical terms."
    ],
    knowledgeBase: {
      "why": "I flagged PT-9042 as CRITICAL because both the Shock Index (1.34) and lactate elevation (3.8 mmol/L) occurred simultaneously. This multi-system convergence signals acute occult hypoperfusion consistent with Septic Shock rather than isolated dehydration.",
      "medication": "The Medication Agent evaluated whether the tachycardia could be induced by inotropic or chronotropic medications. The patient is receiving Norepinephrine at 0.08 mcg/kg/min while Metoprolol is held. The degree of tachycardia (118 bpm) combined with 38.9°C fever proves systemic inflammatory response rather than isolated adrenergic side effects.",
      "parameter": "The most significant contributor is the **Rate of MAP decline** coupled with the **Shock Index surge to 1.34**. In our early warning model, this parameter combination accounts for 44% of the risk weight.",
      "conflicting": "There are minimal conflicting indicators. Platelets have modestly decreased to 138k, and oxygenation remains at 92%. However, there is no evidence of cardiogenic failure on CVP telemetry.",
      "simpler": "In short: The patient's heart is beating too fast (118 bpm), blood pressure is dropping dangerously low despite IV fluids, and lactic acid in the blood is 3.8 mmol/L. Everything points to severe infection progressing into septic shock."
    }
  },
  {
    id: "ALT-1088",
    patientId: "PT-7719",
    bed: "Bed 07",
    age: 74,
    gender: "Male",
    admissionDiagnosis: "Biliary Pancreatitis",
    icuDay: 2,
    headline: "Elevated lactate trend identified with progressive metabolic acidemia",
    summary: "Laboratory Agent flagged serial lactate increase (2.1 to 3.8 mmol/L over 4h) with rising base deficit. Hemodynamics currently compensated.",
    agent: "Laboratory Intelligence Agent",
    agentKey: "lab",
    agentIcon: "FlaskConical",
    agentSpecialty: "Biochemical Kinetics & Organ Failure Markers",
    priority: "HIGH",
    timestamp: "24 mins ago",
    rawTime: 24,
    isRead: false,
    isReviewed: false,
    vitals: {
      hr: "96 bpm",
      hrTag: "elevated baseline",
      bp: "108/65 mmHg",
      map: "MAP 79 mmHg",
      rr: "22 /min",
      rrTag: "tachypneic",
      temp: "37.9 °C",
      tempTag: "subfebrile",
      spo2: "95% on 2L NC",
      shockIndex: "0.88 (Borderline)"
    },
    labs: {
      lactate: "3.8 mmol/L (↑ from 2.1)",
      wbc: "14.8 × 10⁹/L",
      creatinine: "1.4 mg/dL",
      platelets: "168 × 10⁹/L"
    },
    meds: {
      activeList: [
        { name: "Lactated Ringer's", dose: "100 mL/hr", status: "Active maintenance infusion", statusColor: "text-slate-400" },
        { name: "Fentanyl IV", dose: "25 mcg PRN", status: "Administered 13:10", statusColor: "text-slate-400" },
        { name: "Piperacillin-Tazobactam", dose: "3.375g IV", status: "Scheduled next due 15:00", statusColor: "text-clinical-teal" }
      ],
      currentSummary: "Maintenance LR 100 mL/hr, Fentanyl 25 mcg IV prn, Piperacillin-Tazobactam IV"
    },
    initialAgentMessage: "Attending Dr. Sarah Al-Mansoor: Laboratory Intelligence Agent reporting on **PT-7719 (Bed 07)**. We have isolated a rapid, steep trajectory in arterial lactate from 2.1 to 3.8 mmol/L over 4 hours, accompanied by base deficit worsening from -2.1 to -5.8 mEq/L.\n\nCritically: Vital Signs Agent reports the patient's blood pressure remains superficially compensated (MAP 79 mmHg). This represents occult cellular dysoxia preceding overt macroscopic hemodynamic collapse.",
    evidenceSections: [
      {
        title: "Serial Laboratory Kinetics",
        details: [
          { label: "Lactate Clearance Rate", val: "Negative clearance: +0.42 mmol/L/hr accumulation" },
          { label: "Anion Gap", val: "Expanded from 11 to 18 mEq/L" },
          { label: "Total Bilirubin", val: "Elevated at 2.4 mg/dL (consistent with biliary origin)" }
        ],
        interpretation: "Failure of metabolic clearance suggests worsening intra-abdominal septic focus or microvascular shunting."
      },
      {
        title: "Hemodynamic Compensation Check",
        details: [
          { label: "Mean Arterial Pressure", val: "Stable between 75–82 mmHg via peripheral vasoconstriction" },
          { label: "Peripheral Perfusion Index (PI)", val: "Down from 2.8 to 1.1 (Cool extremities noted)" }
        ],
        interpretation: "Normal MAP masks significant microcirculatory vasoconstriction."
      }
    ],
    chips: [
      "Why did you flag this patient as High priority?",
      "Could liver hypoperfusion explain the lactate clearance?",
      "Are blood cultures and repeat gases recommended?",
      "Explain your reasoning in simpler terms."
    ],
    knowledgeBase: {
      "why": "Lactate doubling while blood pressure appears 'normal' is a classic pitfall in ICU surveillance. Without early fluid resuscitation or source control, 68% of similar profiles progress to overt septic shock within 6 hours.",
      "liver": "Hepatic clearance compromise can contribute to lactate accumulation in severe pancreatitis; however, transaminases are only mildly elevated (AST 68, ALT 72), suggesting the primary driver is systemic tissue hypoperfusion rather than acute liver failure.",
      "recommend": "Clinical decision guidelines suggest sending repeat arterial blood gas with lactate at 2 hours, confirming blood culture draws, and assessing fluid responsiveness using dynamic measures.",
      "simpler": "Even though this patient's blood pressure looks okay on the bedside monitor, his cells are not getting enough oxygen. Lactate has climbed to 3.8 mmol/L, warning us of trouble before the blood pressure crashes."
    }
  },
  {
    id: "ALT-1082",
    patientId: "PT-6190",
    bed: "Bed 11",
    age: 58,
    gender: "Male",
    admissionDiagnosis: "Perforated Diverticulitis s/p Hartmann's",
    icuDay: 1,
    headline: "Medication context may mask heart-rate response in suspected sepsis",
    summary: "Patient on therapeutic Beta-Blocker (Metoprolol 50mg); blunted tachycardia conceals underlying inflammatory storm despite fever and tachypnea.",
    agent: "Medication Context Agent",
    agentKey: "meds",
    agentIcon: "Pill",
    agentSpecialty: "Pharmacological Confounder & Interaction Modeling",
    priority: "HIGH",
    timestamp: "1h 12m ago",
    rawTime: 72,
    isRead: false,
    isReviewed: false,
    vitals: {
      hr: "76 bpm",
      hrTag: "beta-blocked suppression",
      bp: "92/58 mmHg",
      map: "MAP 69 mmHg",
      rr: "26 /min",
      rrTag: "tachypneic",
      temp: "38.9 °C",
      tempTag: "febrile spike",
      spo2: "94% on RA",
      shockIndex: "0.82 (artificially depressed)"
    },
    labs: {
      lactate: "2.6 mmol/L",
      wbc: "19.8 × 10⁹/L (82% PMNs)",
      creatinine: "1.3 mg/dL",
      platelets: "190 × 10⁹/L"
    },
    meds: {
      activeList: [
        { name: "Metoprolol Tartrate", dose: "50mg PO BID", status: "Administered 08:00 (Masking Tachycardia)", statusColor: "text-amber-400" },
        { name: "Meropenem IV", dose: "1g q8h", status: "Active - Dose 2 complete", statusColor: "text-clinical-teal" },
        { name: "Normal Saline", dose: "500 mL bolus", status: "Completed 12:45", statusColor: "text-slate-400" }
      ],
      currentSummary: "Metoprolol Tartrate 50mg PO BID (Last dose 08:00), Meropenem 1g IV q8h"
    },
    initialAgentMessage: "Attending Dr. Sarah Al-Mansoor: Medication Context Agent warning regarding **PT-6190 (Bed 11)**. Conventional early-warning scoring algorithms show a misleadingly low risk score because heart rate is only 76 bpm.\n\nOur pharmacological model indicates active beta-1 adrenergic blockade (oral Metoprolol administered at 08:00). When adjusting for chronological drug bioavailability, the patient exhibits significant systemic SIRS with temperature 38.9°C, tachypnea (26 /min), and severe leukocytosis (WBC 19.8k).",
    evidenceSections: [
      {
        title: "Pharmacokinetic Blunting Assessment",
        details: [
          { label: "Active Drug", val: "Metoprolol Tartrate 50mg oral (Tmax ~1.5h, active plasma levels)" },
          { label: "Expected Physiological HR", val: "Estimated 105–115 bpm in unblocked state with T=38.9°C" },
          { label: "Adjusted Shock Index", val: "Recalibrated SI estimated at 1.15 vs raw 0.82" }
        ],
        interpretation: "Tachycardia is suppressed pharmacologically; patient has profound underlying vasodilation and inflammatory response."
      }
    ],
    chips: [
      "Could medication timing explain the vital sign findings?",
      "Should we hold the next beta-blocker dose?",
      "What is the infection source probability?",
      "Explain your reasoning in simpler terms."
    ],
    knowledgeBase: {
      "medication": "Yes, exactly. The scheduled Metoprolol taken 5 hours ago is suppressing the normal tachycardic reflex. A doctor glancing at a heart rate of 76 might assume the patient is calm, but the high fever (38.9°C) and rapid breathing prove severe systemic inflammation.",
      "hold": "While Aegis does not prescribe, clinical pharmacology consensus strongly advises holding beta-blockers when a surgical patient develops high fevers, borderline MAP (<65-70 mmHg), or escalating fluid requirements.",
      "source": "Given day-1 status post-Hartmann's procedure for perforated diverticulitis, anastomotic/stump leak or pelvic collection represents the highest risk source.",
      "simpler": "The patient's heart rate looks normal (76 bpm) only because his blood pressure medication is putting the brakes on his heart. Under the surface, he has a 38.9°C fever and high white count, meaning infection is progressing."
    }
  },
  {
    id: "ALT-1075",
    patientId: "PT-4402",
    bed: "Bed 02",
    age: 69,
    gender: "Female",
    admissionDiagnosis: "Urosepsis / Pyelonephritis",
    icuDay: 4,
    headline: "Multiple indicators have changed over the observation window",
    summary: "Composite alert: Gradual platelet consumption (-28% in 24h) and urine output drop to 0.4 mL/kg/h over consecutive 6 hours.",
    agent: "Vitals Intelligence Agent",
    agentKey: "vitals",
    agentIcon: "Activity",
    agentSpecialty: "Physiological Telemetry & Trend Decomposition",
    priority: "MODERATE",
    timestamp: "3h 10m ago",
    rawTime: 190,
    isRead: true,
    isReviewed: true,
    vitals: {
      hr: "88 bpm",
      hrTag: "stable rhythm",
      bp: "114/72 mmHg",
      map: "MAP 86 mmHg",
      rr: "18 /min",
      rrTag: "eupneic",
      temp: "37.2 °C",
      tempTag: "normothermic",
      spo2: "97% on RA",
      shockIndex: "0.77 (stable)"
    },
    labs: {
      lactate: "1.7 mmol/L (Improving)",
      wbc: "11.1 × 10⁹/L",
      creatinine: "1.1 mg/dL",
      platelets: "98 × 10⁹/L (Consumptive trend)"
    },
    meds: {
      activeList: [
        { name: "Ceftriaxone IV", dose: "2g q24h", status: "Administered 06:00", statusColor: "text-clinical-teal" },
        { name: "Enoxaparin SC", dose: "40mg daily", status: "Administered 09:00", statusColor: "text-slate-400" }
      ],
      currentSummary: "Ceftriaxone 2g IV q24h, Enoxaparin 40mg SC daily"
    },
    initialAgentMessage: "Attending Dr. Sarah Al-Mansoor: Monitoring summary for **PT-4402 (Bed 02)**. While hemodynamics and lactate have stabilized following antimicrobial therapy, our 24-hour delta surveillance notes progressive thrombocytopenia (platelets declining from 142k to 98k) and oliguria below 0.4 mL/kg/h.\n\nThis alert has been previously reviewed and logged for coagulation panel correlation.",
    evidenceSections: [
      {
        title: "Observation Window Delta (24h)",
        details: [
          { label: "Platelet Drop Velocity", val: "-44 × 10⁹/L over 24 hours" },
          { label: "Urine Output", val: "22 mL/hr average (Patient weight 62 kg: 0.35 mL/kg/hr)" }
        ],
        interpretation: "Sub-clinical consumption; low risk of immediate overt shock but warrants DIC surveillance."
      }
    ],
    chips: [
      "What evidence supports the platelet consumption?",
      "Are any conflicting indicators present?",
      "Explain your reasoning in simpler terms."
    ],
    knowledgeBase: {
      "evidence": "Platelets dropped across three successive draws: 142k → 121k → 98k. Fibrinogen is borderline at 190 mg/dL, suggesting mild consumptive coagulopathy associated with resolving Gram-negative bacteremia.",
      "conflicting": "Patient is clinically afebrile, alert, and MAP is robust at 86 mmHg. This confirms the acute shock phase has passed, leaving localized hematologic recovery monitoring.",
      "simpler": "Her fever and blood pressure are much better, but her blood clotting platelets have slipped under 100k, and urine output was slightly sluggish today. Good to keep an eye on her kidneys and blood counts."
    }
  }
];

export function createSimulatedAlert() {
  const randId = 1100 + Math.floor(Math.random() * 50);
  const randPt = 8100 + Math.floor(Math.random() * 900);
  return {
    id: `ALT-${randId}`,
    patientId: `PT-${randPt}`,
    bed: "Bed 09",
    age: 71,
    gender: "Female",
    admissionDiagnosis: "Aspiration Pneumonia / Septic Progression",
    icuDay: 2,
    headline: "Sudden core temperature drop with paradoxical bradycardia",
    summary: "Hypothermia trend (35.4°C) with declining pulse in elderly patient exhibiting cold septic shock phenotype.",
    agent: "Vitals Intelligence Agent",
    agentKey: "vitals",
    agentIcon: "Activity",
    agentSpecialty: "Physiological Telemetry & Trend Decomposition",
    priority: "CRITICAL",
    timestamp: "Just now",
    rawTime: 0,
    isRead: false,
    isReviewed: false,
    vitals: {
      hr: "54 bpm",
      hrTag: "bradycardic collapse",
      bp: "82/44 mmHg",
      map: "MAP 56 mmHg",
      rr: "24 /min",
      rrTag: "tachypneic",
      temp: "35.4 °C",
      tempTag: "severe hypothermia",
      spo2: "91% on 3L NC",
      shockIndex: "0.66"
    },
    labs: {
      lactate: "4.1 mmol/L (Severe)",
      wbc: "2.8 × 10⁹/L (Leukopenia)",
      creatinine: "2.1 mg/dL",
      platelets: "88 × 10⁹/L"
    },
    meds: {
      activeList: [
        { name: "Broad-spectrum coverage", dose: "Empirical Cefepime", status: "Pending Pharmacy verification", statusColor: "text-amber-400" },
        { name: "Lactated Ringer's", dose: "500 mL bolus", status: "Active Infusion in progress", statusColor: "text-slate-400" }
      ],
      currentSummary: "Empiric Cefepime pending, 500 mL LR crystalloid bolus in progress"
    },
    initialAgentMessage: "Attending Dr. Sarah Al-Mansoor: URGENT real-time arrival. Newly analyzed patient exhibiting hypothermic sepsis pattern. Temperature has fallen to 35.4°C with leukopenia (2.8k) and severe hyperlactatemia (4.1 mmol/L). Elderly phenotype with impaired febrile response.",
    evidenceSections: [
      {
        title: "Hypothermic Septic Triad",
        details: [
          { label: "Core Temp Velocity", val: "-1.2°C over past 90 minutes" },
          { label: "White Cell Count", val: "2.8 × 10⁹/L (Severe leukopenia consumes circulating reserves)" }
        ],
        interpretation: "Correlates with mortality risk > 45% if fluid and inotropic resuscitation delayed."
      }
    ],
    chips: [
      "Why did you flag this patient as Critical?",
      "Explain the hypothermic septic phenotype.",
      "What immediate actions does Aegis suggest?"
    ],
    knowledgeBase: {
      "why": "Hypothermia in severe sepsis (<36.0°C) carries twice the mortality of hyperthermic fever. In combination with lactate 4.1 mmol/L and MAP 56 mmHg, immediate evaluation is indicated.",
      "hypothermic": "Elderly immunocompromised patients often fail to mount a fever. Instead, thermoregulation collapses, creating cold shock with paradoxical peripheral failure.",
      "immediate": "Sepsis-3 bundle recommends immediate warm balanced fluid resuscitation, blood cultures, target MAP >= 65 mmHg with vasopressor, and empiric broad-spectrum coverage."
    }
  };
}

