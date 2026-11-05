import React from 'react';
import { Activity, Beaker, ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck, Zap, HeartPulse } from 'lucide-react';

/**
 * MultiAgentConsensusCard
 * Replaces monolithic plain-text debug dump with a structured, executive multi-agent triage console.
 * Visualizes the cooperative outputs of the 4 diagnostic agents:
 * 1. Vitals Intelligence Agent (XGBoost + TreeSHAP)
 * 2. Biochemical Labs Agent (LightGBM + Martha's Rule)
 * 3. Skeptic Safety Filter (Confounder Reconciliation)
 * 4. Bayesian Arbiter & Resuscitation Bundle Engine
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
  actionBundle = [],
  evidenceList = []
}) {
  const isCritical = urgency === 'CRITICAL' || urgency === 'CRITICAL_SEPSIS' || compositeRiskPct >= 70;
  const isModerate = urgency === 'HIGH' || urgency === 'MODERATE' || (compositeRiskPct >= 35 && compositeRiskPct < 70);

  return (
    <div className="space-y-4">
      {/* 1. Executive Council Verdict Banner */}
      <div
        className={`p-4 rounded-3xl border-[1.5px] transition-all duration-200 ${
          isCritical
            ? 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/20 dark:border-rose-900/60'
            : isModerate
              ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/20 dark:border-amber-900/60'
              : 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/60'
        }`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shadow-2xs border-[1.5px] ${
                isCritical
                  ? 'bg-rose-600 text-white border-rose-400'
                  : isModerate
                    ? 'bg-amber-600 text-white border-amber-400'
                    : 'bg-emerald-600 text-white border-emerald-400'
              }`}
            >
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Multi-Agent Consensus Verdict
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    isCritical
                      ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                      : isModerate
                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {urgency.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Patient {patientId} ({bedNumber}) • Concurrent LangGraph Agent Evaluation
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono font-bold">
            <div className="px-3 py-1 rounded-full bg-white dark:bg-[#0D1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-sans">Risk:</span>
              <span className={isCritical ? 'text-rose-600' : isModerate ? 'text-amber-600' : 'text-emerald-600'}>
                {compositeRiskPct}%
              </span>
            </div>
            <div className="px-3 py-1 rounded-full bg-white dark:bg-[#0D1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-sans">Shock Index:</span>
              <span className="text-slate-900 dark:text-white">{shockIndex}</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-white dark:bg-[#0D1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-sans">Lactate:</span>
              <span className="text-slate-900 dark:text-white">{lactateVal}</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-white dark:bg-[#0D1524] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-sans">MAP:</span>
              <span className="text-slate-900 dark:text-white">{mapVal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Cooperative 4-Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">

        {/* AGENT 1: Vitals Intelligence Agent */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#0D1524] border-[1.5px] border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Vitals Agent (XGBoost)
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Hemodynamics & TreeSHAP
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {Number(shockIndex) >= 1.0 ? 'UNCOMPENSATED SHOCK' : 'COMPENSATED'}
            </span>
          </div>

          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-slate-50/70 dark:bg-[#131D31] p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            {vitalsReasoning || 'Patient exhibits elevated shock index with compensatory tachypnea. Sympathetic vasoconstriction attempting to preserve arterial pressure.'}
          </div>
        </div>

        {/* AGENT 2: Biochemical Labs Agent */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#0D1524] border-[1.5px] border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center">
                <Beaker className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Labs Agent (LightGBM)
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Cellular Hypoxia & Martha's Rule
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              {parseFloat(lactateVal) >= 4.0 ? 'ANAEROBIC CRISIS' : parseFloat(lactateVal) >= 2.0 ? 'ELEVATED STRESS' : 'NORMAL LABS'}
            </span>
          </div>

          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-slate-50/70 dark:bg-[#131D31] p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            {labsReasoning || 'Identified cellular hypoxia warning. Microvascular hypoperfusion verified via venous lactate and inflammatory biomarker mobilization.'}
          </div>
        </div>

        {/* AGENT 3: Skeptic Safety Filter */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#0D1524] border-[1.5px] border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Skeptic Agent (Safety Filter)
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Medication Confounder Audit
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              STAND ALERT (0% DISCOUNT)
            </span>
          </div>

          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-slate-50/70 dark:bg-[#131D31] p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            {skepticReasoning || 'Clinical Safety Mandate active: Inotropes/vasopressors evaluated. True physiological stress confirmed without discounting alarm.'}
          </div>
        </div>

        {/* AGENT 4: Bayesian Arbiter & Resuscitation Bundle */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#0D1524] border-[1.5px] border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Bayesian Arbiter
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Sepsis-3 1-Hour Bundle Actions
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              BUNDLE RECOMMENDED
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {(actionBundle && actionBundle.length > 0 ? actionBundle.slice(0, 3) : [
              { action: 'Measure STAT Blood Lactate', urgent: true },
              { action: 'Obtain Blood Cultures prior to antibiotics', urgent: true },
              { action: 'Administer Broad-Spectrum IV Antimicrobials', urgent: true }
            ]).map((act, aIdx) => (
              <div
                key={aIdx}
                className="flex items-center gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-[#131D31] border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200"
              >
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${act.urgent ? 'text-rose-500' : 'text-emerald-500'}`} />
                <span className="truncate font-medium">{act.action}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
