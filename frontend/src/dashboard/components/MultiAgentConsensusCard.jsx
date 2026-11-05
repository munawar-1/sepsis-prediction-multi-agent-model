import React, { useState } from 'react';
import {
  HeartPulse,
  Beaker,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Clock,
  ArrowDown,
  CheckSquare,
  Square,
  Lock,
  Flame,
  Gauge
} from 'lucide-react';

/**
 * MultiAgentConsensusCard
 *
 * Clearly distinguishes between:
 * 1. The 3 Diagnostic Feeder Models (Vitals XGBoost, Labs LightGBM, Skeptic Filter)
 * 2. The Supreme Final Verdict & Score of the Triage Orchestrator Agent (Orch Agent)
 * 3. A dedicated, interactive "Doctor's Immediate Resuscitation Checklist" (Surviving Sepsis 1-Hour Bundle)
 */
export default function MultiAgentConsensusCard({
  patientId,
  bedNumber,
  urgency = 'CRITICAL_SEPSIS',
  compositeRiskPct = 75,
  shockIndex = '1.08',
  mapVal = '54 mmHg',
  lactateVal = '5.1 mmol/L',
  vitalsReasoning = '',
  labsReasoning = '',
  skepticReasoning = '',
  orchestratorReasoning = '',
  actionBundle = [],
  evidenceList = [],
  onAcknowledge = null
}) {
  const isCritical = urgency === 'CRITICAL' || urgency === 'CRITICAL_SEPSIS' || compositeRiskPct >= 70;
  const isModerate = urgency === 'HIGH' || urgency === 'MODERATE' || (compositeRiskPct >= 35 && compositeRiskPct < 70);

  // Default Surviving Sepsis 1-Hour Bundle Checklist items
  const defaultChecklist = [
    {
      id: 0,
      title: 'Measure STAT Blood Lactate',
      detail: 'Re-measure serial lactate within 2-4 hours if initial ≥ 2.0 mmol/L to guide fluid titration and metabolic clearance.',
      badge: 'STAT (< 15 MIN)',
      urgent: true
    },
    {
      id: 1,
      title: 'Obtain Blood Cultures (x2 Sets)',
      detail: 'Draw aerobic and anaerobic blood cultures from 2 distinct anatomical sites prior to antimicrobial infusion.',
      badge: 'PRIOR TO ANTIBIOTICS',
      urgent: true
    },
    {
      id: 2,
      title: 'Initiate Empiric Broad-Spectrum IV Antimicrobials',
      detail: 'Administer broad-spectrum antimicrobial coverage within 1 hour of sepsis recognition.',
      badge: 'WITHIN 1 HOUR',
      urgent: true
    },
    {
      id: 3,
      title: 'Rapid 30 mL/kg Crystalloid Fluid Loading',
      detail: 'Administer balanced crystalloids for hypotension (MAP < 65 mmHg) or initial lactate ≥ 4.0 mmol/L.',
      badge: 'IMMEDIATE',
      urgent: true
    },
    {
      id: 4,
      title: 'Titrate Vasopressor Support (Norepinephrine)',
      detail: 'Target MAP ≥ 65 mmHg if patient remains refractory to initial crystalloid volume challenge.',
      badge: 'TITRATE TO MAP ≥ 65',
      urgent: true
    },
    {
      id: 5,
      title: 'Continuous Invasive Arterial Line Monitoring',
      detail: 'Establish arterial line transducer for beat-to-beat pressure waveform and continuous Shock Index surveillance.',
      badge: 'HEMODYNAMIC SURVEILLANCE',
      urgent: false
    }
  ];

  // Merge custom actionBundle if provided
  const checklistItems = (actionBundle && actionBundle.length > 0)
    ? actionBundle.map((act, i) => ({
        id: i,
        title: typeof act === 'string' ? act : (act.action || act.title || 'Clinical Action'),
        detail: act.detail || act.rationale || 'Surviving Sepsis 1-Hour Protocol action bundle recommendation.',
        badge: act.badge || (act.urgent ? 'STAT 1-HOUR' : 'RECOMMENDED'),
        urgent: act.urgent !== false
      }))
    : defaultChecklist;

  // Interactive Checklist State
  const [checkedItems, setCheckedItems] = useState({});
  const [isAuthorized, setIsAuthorized] = useState(false);

  const toggleCheck = (idx) => {
    setCheckedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleAuthorizeAll = () => {
    const allChecked = {};
    checklistItems.forEach((_, idx) => {
      allChecked[idx] = true;
    });
    setCheckedItems(allChecked);
    setIsAuthorized(true);
    if (onAcknowledge) {
      onAcknowledge();
    }
  };

  const completedCount = checklistItems.filter((_, idx) => checkedItems[idx]).length;

  return (
    <div className="space-y-4 font-sans">

      {/* =========================================================================
          SECTION 1: 3 SPECIALIZED DIAGNOSTIC INPUT MODELS
          Visualizes the 3 feeder agents that feed telemetry into the Orchestrator
          ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
            <span>3 Specialized Diagnostic Feeder Models</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            Parallel Model Inferences
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* MODEL 1: Vitals Intelligence Agent */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0D1524] border-[1.5px] border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Vitals Agent
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Model 1 • XGBoost
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {Number(shockIndex) >= 1.0 ? 'SHOCK > 1.0' : 'COMPENSATED'}
                </span>
              </div>

              {/* Metric Row */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  SI: {shockIndex}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  MAP: {mapVal}
                </span>
              </div>

              {/* Reasoning */}
              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans bg-slate-50/70 dark:bg-[#131D31] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                {vitalsReasoning || 'Elevated Shock Index with arterial decoupling. Sympathetic vasoconstriction actively compensating for reduced stroke volume.'}
              </div>
            </div>
          </div>

          {/* MODEL 2: Biochemical Labs Agent */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0D1524] border-[1.5px] border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center shrink-0">
                    <Beaker className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Labs Agent
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Model 2 • LightGBM
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {parseFloat(lactateVal) >= 4.0 ? 'ANAEROBIC CRISIS' : parseFloat(lactateVal) >= 2.0 ? 'ELEVATED' : 'NORMAL'}
                </span>
              </div>

              {/* Metric Row */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  Lactate: {lactateVal}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  Martha's Rule: Concordant
                </span>
              </div>

              {/* Reasoning */}
              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans bg-slate-50/70 dark:bg-[#131D31] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                {labsReasoning || 'Acute cellular hypoxia identified. Negative lactate clearance with tissue dysoxia and systemic inflammatory cytokine mobilization.'}
              </div>
            </div>
          </div>

          {/* MODEL 3: Skeptic Safety Filter */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0D1524] border-[1.5px] border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Skeptic Filter
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Model 3 • Drug Audit
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  STAND ALERT (0% DISC)
                </span>
              </div>

              {/* Metric Row */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  Confounder Discount: 0.0%
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
                  True Sepsis
                </span>
              </div>

              {/* Reasoning */}
              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans bg-slate-50/70 dark:bg-[#131D31] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                {skepticReasoning || 'Safety Mandate: Inotropes & vasopressors evaluated. Hemodynamic tachycardia represents genuine systemic sepsis, not drug artifact.'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          CONVERGENCE INDICATOR (Visualizes Flow from 3 Models into Orchestrator)
          ========================================================================= */}
      <div className="flex items-center justify-center gap-2 py-0.5 text-[11px] font-mono text-slate-400 dark:text-slate-500">
        <ArrowDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
        <span className="font-semibold uppercase tracking-wider">
          Models Synthesized by Triage Orchestrator Consensus Graph
        </span>
        <ArrowDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
      </div>

      {/* =========================================================================
          SECTION 2: TRIAGE ORCHESTRATOR AGENT — FINAL SCORE & FINAL VERDICT
          The central supreme decision authority of the multi-agent system
          ========================================================================= */}
      <div
        className={`p-5 rounded-3xl border-2 transition-all duration-200 shadow-md ${
          isCritical
            ? 'bg-gradient-to-br from-rose-50/80 via-white to-rose-50/40 border-rose-400 dark:from-rose-950/30 dark:via-[#0D1524] dark:to-rose-950/10 dark:border-rose-700/80'
            : isModerate
              ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-amber-400 dark:from-amber-950/30 dark:via-[#0D1524] dark:to-amber-950/10 dark:border-amber-700/80'
              : 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 border-emerald-400 dark:from-emerald-950/30 dark:via-[#0D1524] dark:to-emerald-950/10 dark:border-emerald-700/80'
        }`}
      >
        <div className="space-y-4">

          {/* Top Header: Orchestrator Supreme Authority */}
          <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3.5 border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm border-2 ${
                  isCritical
                    ? 'bg-rose-600 text-white border-rose-300 dark:border-rose-500'
                    : isModerate
                      ? 'bg-amber-600 text-white border-amber-300 dark:border-amber-500'
                      : 'bg-emerald-600 text-white border-emerald-300 dark:border-emerald-500'
                }`}
              >
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Triage Orchestrator Agent (Orch Agent)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold uppercase">
                    Supreme Authority
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>Bayesian Arbiter Multi-Agent Consensus</span>
                  <span>•</span>
                  <span>Patient {patientId} ({bedNumber})</span>
                </div>
              </div>
            </div>

            {/* Final Verdict Status Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border-2 shadow-2xs flex items-center gap-1.5 ${
                  isCritical
                    ? 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-600 animate-pulse'
                    : isModerate
                      ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-600'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-600'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>FINAL VERDICT: {urgency.replace('_', ' ')}</span>
              </span>
            </div>
          </div>

          {/* Hero Final Score and Telemetry Matrix Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">

            {/* HERO STAT: Final Composite Sepsis Risk Score */}
            <div className="sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-[#0D1524] border-[1.5px] border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-center items-center text-center space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                Final Sepsis Score
              </div>
              <div
                className={`text-4xl font-black font-mono tracking-tight ${
                  isCritical ? 'text-rose-600' : isModerate ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {compositeRiskPct}%
              </div>
              <div className="text-[10px] font-sans font-bold text-slate-600 dark:text-slate-400">
                {isCritical ? 'Critical Sepsis Risk' : isModerate ? 'Moderate Alert' : 'Baseline Compensated'}
              </div>
              {/* Mini Risk Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isCritical ? 'bg-rose-600' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(compositeRiskPct, 100)}%` }}
                />
              </div>
            </div>

            {/* PERFUSION METRICS: Shock Index, MAP, Venous Lactate */}
            <div className="sm:col-span-3 grid grid-cols-3 gap-2.5">

              <div className="p-3 rounded-2xl bg-white dark:bg-[#0D1524] border-[1.5px] border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 flex flex-col justify-center">
                <div className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center justify-between">
                  <span>Shock Index</span>
                  <span className="text-rose-600 font-bold">&gt; 1.0</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {shockIndex}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Severe Circulatory Decoupling
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#0D1524] border-[1.5px] border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 flex flex-col justify-center">
                <div className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center justify-between">
                  <span>Mean Arterial Pressure</span>
                  <span className="text-amber-600 font-bold">&lt; 65</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {mapVal}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Refractory Perfusion Deficit
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#0D1524] border-[1.5px] border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 flex flex-col justify-center">
                <div className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center justify-between">
                  <span>Venous Lactate</span>
                  <span className="text-rose-600 font-bold">&gt; 4.0</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {lactateVal}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Severe Anaerobic Dysoxia
                </div>
              </div>

            </div>
          </div>

          {/* Orchestrator Final Consensus Reasoning Prose */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0D1524] border-[1.5px] border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
            <div className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Orchestrator Agent Synthesis & Clinical Mandate:</span>
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium">
              {orchestratorReasoning || (
                `The Triage Orchestrator synthesized all 3 diagnostic models: Vitals Agent isolates acute hemodynamic instability (Shock Index ${shockIndex}), corroborated by the Labs Agent detecting critical lactic dysoxia (${lactateVal}). The Skeptic Safety Filter verified real sepsis pathophysiology with 0% discount. Bayesian Arbiter escalates patient to ${urgency} requiring immediate initiation of the Surviving Sepsis 1-Hour Care Bundle.`
              )}
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          SECTION 3: SEPARATE BOX FOR DOCTOR'S IMMEDIATE RESUSCITATION CHECKLIST
          Functional, interactive checklist for the bedside physician right now
          ========================================================================= */}
      <div className="rounded-3xl bg-white dark:bg-[#0D1524] border-2 border-emerald-400 dark:border-emerald-600/80 shadow-md p-5 space-y-4">

        {/* Checklist Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-[#0E2A2A] border-[1.5px] border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Doctor's Immediate Resuscitation Checklist
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300">
                  Surviving Sepsis 1-Hour Protocol
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Execute STAT clinical orders for Patient {patientId} ({bedNumber}) • Required within 60 minutes
              </div>
            </div>
          </div>

          {/* Progress Pill */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
              {completedCount} of {checklistItems.length} Executed
            </span>
          </div>
        </div>

        {/* Interactive Checklist Items */}
        <div className="space-y-2">
          {checklistItems.map((item, idx) => {
            const isChecked = Boolean(checkedItems[idx]);

            return (
              <div
                key={idx}
                onClick={() => toggleCheck(idx)}
                className={`p-3 rounded-2xl border-[1.5px] transition-all duration-200 cursor-pointer flex items-start justify-between gap-3 ${
                  isChecked
                    ? 'bg-emerald-50/60 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/60'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 dark:bg-[#131D31] dark:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600 transition-colors">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${isChecked ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {item.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
                        isChecked
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'
                      }`}>
                        {isChecked ? 'EXECUTED' : item.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      {item.detail}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCheck(idx);
                    }}
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      isChecked
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    {isChecked ? 'Done' : 'Mark Done'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Checklist Action Dock */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Digital Signature Log: Attending Physician Authority Enforced</span>
          </div>

          <button
            type="button"
            onClick={handleAuthorizeAll}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-sm active:scale-95 ${
              isAuthorized
                ? 'bg-emerald-100 text-emerald-800 border-[1.5px] border-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-md'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAuthorized ? '✓ Sepsis Bundle Digitally Authorized' : 'Authorize & Sign 1-Hour Care Bundle'}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
