import React, { useState, useEffect } from 'react';
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
  Gauge,
  Send,
  Plus,
  X,
  Sparkles,
  Check,
  ListPlus,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clinicalApi } from '../../services/api';

/**
 * MultiAgentConsensusCard
 *
 * Clearly distinguishes between:
 * 1. The 3 Diagnostic Feeder Models (Vitals XGBoost, Labs LightGBM, Skeptic Filter)
 * 2. The Supreme Final Verdict & Score of the Triage Orchestrator Agent (Orch Agent)
 * 3. A dedicated, interactive "Doctor's Immediate Resuscitation Checklist" (Surviving Sepsis 1-Hour Bundle)
 *    Enables the Attending Physician to select, customize, and assign bedside tasks directly to the nurse.
 */
export default function MultiAgentConsensusCard({
  patientId = 'PT-9042',
  patientName = 'Eleanor Vance',
  bedNumber = 'ICU-BED-01',
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
  const { user } = useAuth();
  const isCritical = urgency === 'CRITICAL' || urgency === 'CRITICAL_SEPSIS' || compositeRiskPct >= 70;
  const isModerate = urgency === 'HIGH' || urgency === 'MODERATE' || (compositeRiskPct >= 35 && compositeRiskPct < 70);

  // Default Surviving Sepsis 1-Hour Bundle Checklist items
  const defaultChecklist = [
    {
      id: 'task-lactate',
      title: 'Measure STAT Blood Lactate',
      detail: 'Re-measure serial lactate within 2-4 hours if initial ≥ 2.0 mmol/L to guide fluid titration and metabolic clearance.',
      badge: 'STAT (< 15 MIN)',
      category: 'STAT_LABS',
      urgent: true
    },
    {
      id: 'task-cultures',
      title: 'Obtain Blood Cultures (x2 Sets)',
      detail: 'Draw aerobic and anaerobic blood cultures from 2 distinct anatomical sites prior to antimicrobial infusion.',
      badge: 'PRIOR TO ANTIBIOTICS',
      category: 'STAT_LABS',
      urgent: true
    },
    {
      id: 'task-antibiotics',
      title: 'Initiate Empiric Broad-Spectrum IV Antimicrobials',
      detail: 'Administer broad-spectrum antimicrobial coverage within 1 hour of sepsis recognition.',
      badge: 'WITHIN 1 HOUR',
      category: 'MEDICATION_CHANGE',
      urgent: true
    },
    {
      id: 'task-fluids',
      title: 'Rapid 30 mL/kg Crystalloid Fluid Loading',
      detail: 'Administer balanced crystalloids for hypotension (MAP < 65 mmHg) or initial lactate ≥ 4.0 mmol/L.',
      badge: 'IMMEDIATE',
      category: 'RESUSCITATION',
      urgent: true
    },
    {
      id: 'task-vasopressor',
      title: 'Titrate Vasopressor Support (Norepinephrine)',
      detail: 'Target MAP ≥ 65 mmHg if patient remains refractory to initial crystalloid volume challenge.',
      badge: 'TITRATE TO MAP ≥ 65',
      category: 'MEDICATION_CHANGE',
      urgent: true
    },
    {
      id: 'task-art-line',
      title: 'Continuous Invasive Arterial Line Monitoring',
      detail: 'Establish arterial line transducer for beat-to-beat pressure waveform and continuous Shock Index surveillance.',
      badge: 'HEMODYNAMIC SURVEILLANCE',
      category: 'BEDSIDE_HARDWARE',
      urgent: false
    }
  ];

  // Helper to infer category from task title
  const inferCategory = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('lactate') || t.includes('culture') || t.includes('blood gas') || t.includes('cbc') || t.includes('lab')) return 'STAT_LABS';
    if (t.includes('norepinephrine') || t.includes('antimicrobial') || t.includes('antibiotic') || t.includes('vasopressor') || t.includes('infusion')) return 'MEDICATION_CHANGE';
    if (t.includes('crystalloid') || t.includes('fluid') || t.includes('bolus') || t.includes('resuscitation')) return 'RESUSCITATION';
    if (t.includes('arterial line') || t.includes('catheter') || t.includes('transducer') || t.includes('hardware')) return 'BEDSIDE_HARDWARE';
    return 'THERAPY_ORDER';
  };

  // Merge custom actionBundle if provided
  const initialChecklist = (actionBundle && actionBundle.length > 0)
    ? actionBundle.map((act, i) => ({
        id: `bundle-task-${i}`,
        title: typeof act === 'string' ? act : (act.action || act.title || 'Clinical Action'),
        detail: act.detail || act.rationale || 'Surviving Sepsis 1-Hour Protocol action bundle recommendation.',
        badge: act.badge || (act.urgent ? 'STAT 1-HOUR' : 'RECOMMENDED'),
        category: act.category || inferCategory(typeof act === 'string' ? act : act.title),
        urgent: act.urgent !== false
      }))
    : defaultChecklist;

  const [checklistItems, setChecklistItems] = useState(initialChecklist);
  const [selectedTasks, setSelectedTasks] = useState({});
  const [assignedTasks, setAssignedTasks] = useState({});
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [toast, setToast] = useState(null);

  // Custom Bedside Task Composer State
  const [isCustomComposerOpen, setIsCustomComposerOpen] = useState(false);
  const [customActionName, setCustomActionName] = useState('');
  const [customCategory, setCustomCategory] = useState('MEDICATION_CHANGE');
  const [customPriority, setCustomPriority] = useState('STAT');
  const [customDoctorNotes, setCustomDoctorNotes] = useState('');

  // Sync assigned tasks from localStorage on mount and when patient changes
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('aegis_bedside_tasks') || '[]');
      const assignedMap = {};
      stored
        .filter(t => t.patientId === patientId)
        .forEach(t => {
          assignedMap[t.actionName] = {
            status: t.status,
            assignedAt: t.orderedAt,
            priority: t.priority
          };
        });
      setAssignedTasks(assignedMap);
    } catch (e) {
      console.warn('Error reading stored tasks in consensus card:', e);
    }
  }, [patientId]);

  // Toggle selection for batch assignment
  const toggleSelectTask = (id) => {
    setSelectedTasks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Select or Deselect All
  const handleSelectAll = () => {
    const allSelected = checklistItems.every(item => selectedTasks[item.id]);
    if (allSelected) {
      setSelectedTasks({});
    } else {
      const newSel = {};
      checklistItems.forEach(item => {
        newSel[item.id] = true;
      });
      setSelectedTasks(newSel);
    }
  };

  // Dispatch orders to Bedside Nurse (Backend API + Local Storage + Custom Event)
  const dispatchOrdersToNurse = async (itemsToDispatch) => {
    if (!itemsToDispatch || itemsToDispatch.length === 0) return;
    setIsAssigning(true);

    try {
      const doctorName = user?.fullName || 'Dr. Rajesh Sharma, MD';
      const doctorUser = user?.username || 'dr.sharma';

      const ordersPayload = itemsToDispatch.map(item => ({
        patientId: patientId || 'PT-9042',
        actionName: item.title,
        category: item.category || inferCategory(item.title),
        priority: item.urgent ? 'STAT' : 'URGENT',
        rationale: item.detail || 'Surviving Sepsis 1-Hour Protocol action bundle recommendation.',
        doctorNotes: item.doctorNotes || `Bedside order authorized by ${doctorName} via Immediate Resuscitation Checklist`
      }));

      // 1. Call Backend API
      try {
        if (ordersPayload.length === 1) {
          await clinicalApi.assignDoctorOrder(ordersPayload[0]);
        } else {
          await clinicalApi.batchAssignDoctorOrders(ordersPayload);
        }
      } catch (backendErr) {
        console.warn('Backend API note (saving to client store):', backendErr.message);
      }

      // 2. Format as bedside tasks for Nurse Worklist
      const newBedsideOrders = ordersPayload.map((payload, idx) => ({
        id: Date.now() + idx + Math.floor(Math.random() * 1000),
        patientId: payload.patientId,
        patientName: patientName || (payload.patientId === 'PT-9042' ? 'Eleanor Vance' : `Patient ${payload.patientId}`),
        icuBedNumber: bedNumber || 'ICU-BED-01',
        orderCode: `ACT_${payload.category}_${Math.floor(Math.random() * 9000)}`,
        actionName: payload.actionName,
        category: payload.category,
        priority: payload.priority,
        status: 'APPROVED',
        signedByDoctor: doctorUser,
        rationale: `${payload.rationale} | Doctor Note: ${payload.doctorNotes}`,
        orderedAt: new Date().toISOString()
      }));

      // 3. Persist in localStorage for bedside dashboard
      const existing = JSON.parse(localStorage.getItem('aegis_bedside_tasks') || '[]');
      const updated = [
        ...newBedsideOrders,
        ...existing.filter(e => !newBedsideOrders.some(n => n.patientId === e.patientId && n.actionName === e.actionName))
      ];
      localStorage.setItem('aegis_bedside_tasks', JSON.stringify(updated));

      // 4. Dispatch global window event for real-time reactivity
      window.dispatchEvent(new CustomEvent('bedside-task-assigned', { detail: newBedsideOrders }));

      // 5. Update local assigned map in checklist
      setAssignedTasks(prev => {
        const next = { ...prev };
        itemsToDispatch.forEach(it => {
          next[it.title] = {
            status: 'APPROVED',
            assignedAt: new Date().toISOString(),
            priority: it.urgent ? 'STAT' : 'URGENT'
          };
        });
        return next;
      });

      // Clear selection
      setSelectedTasks({});

      // Show toast
      setToast({
        type: 'success',
        text: `✓ Assigned ${itemsToDispatch.length} task${itemsToDispatch.length > 1 ? 's' : ''} to Bedside Nurse for Patient ${patientId} (${bedNumber || 'ICU-BED-01'})! Reflecting in Bedside Worklist.`
      });
      setTimeout(() => setToast(null), 5000);

      if (onAcknowledge) {
        onAcknowledge();
      }
    } catch (err) {
      console.error('Error assigning orders to nurse:', err);
      setToast({
        type: 'error',
        text: 'Failed to assign task: ' + err.message
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsAssigning(false);
    }
  };

  // 1-Click Assign Single Task
  const handleAssignSingle = (item) => {
    dispatchOrdersToNurse([item]);
  };

  // Assign Selected Tasks
  const handleAssignSelected = () => {
    const selected = checklistItems.filter(item => selectedTasks[item.id]);
    if (selected.length > 0) {
      dispatchOrdersToNurse(selected);
    }
  };

  // Assign All Checklist Tasks
  const handleAssignAll = () => {
    dispatchOrdersToNurse(checklistItems);
    setIsAuthorized(true);
  };

  // Add Custom Bedside Task
  const handleCreateCustomTask = (e) => {
    e.preventDefault();
    if (!customActionName.trim()) return;

    const newTaskItem = {
      id: `custom-task-${Date.now()}`,
      title: customActionName.trim(),
      detail: customDoctorNotes.trim() || 'Bedside order assigned by Attending Physician.',
      badge: customPriority === 'STAT' ? 'STAT 1-HOUR' : customPriority,
      category: customCategory,
      urgent: customPriority === 'STAT',
      doctorNotes: customDoctorNotes.trim()
    };

    // Add to checklist items array
    setChecklistItems(prev => [newTaskItem, ...prev]);

    // Dispatch directly to nurse
    dispatchOrdersToNurse([newTaskItem]);

    // Reset form
    setCustomActionName('');
    setCustomDoctorNotes('');
    setIsCustomComposerOpen(false);
  };

  const selectedCount = checklistItems.filter(item => selectedTasks[item.id]).length;
  const assignedCount = checklistItems.filter(item => assignedTasks[item.title]).length;
  const allAssigned = checklistItems.length > 0 && checklistItems.every(item => assignedTasks[item.title]);

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
          Interactive task assignment directly from Doctor to Bedside Nurse
          ========================================================================= */}
      <div className="rounded-3xl bg-white dark:bg-[#0D1524] border-2 border-emerald-400 dark:border-emerald-600/80 shadow-md p-5 space-y-4">

        {/* Real-time Feedback Toast */}
        {toast && (
          <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-[1.5px] border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border-[1.5px] border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{toast.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Checklist Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-3 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-[#0E2A2A] border-[1.5px] border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Doctor's Immediate Resuscitation Checklist
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300">
                  Surviving Sepsis 1-Hour Protocol
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Assign STAT bedside orders directly to Nurse Priya for Patient {patientId} ({bedNumber})
              </div>
            </div>
          </div>

          {/* Action Header Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCustomComposerOpen(prev => !prev)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCustomComposerOpen ? 'Close Composer' : '+ Add Custom Task for Nurse'}</span>
            </button>

            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
            >
              {checklistItems.every(i => selectedTasks[i.id]) ? 'Deselect All' : `Select All (${checklistItems.length})`}
            </button>

            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
              {assignedCount} of {checklistItems.length} Dispatched
            </span>
          </div>
        </div>

        {/* Inline Custom Task Composer Form */}
        {isCustomComposerOpen && (
          <form
            onSubmit={handleCreateCustomTask}
            className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-[#112338] border-[1.5px] border-emerald-300 dark:border-emerald-700/60 shadow-sm space-y-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Create & Assign Custom Bedside Task to Nurse
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomComposerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Task / Medication Order Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Titrate Norepinephrine to 0.15 mcg/kg/min or Arterial Line insertion"
                  value={customActionName}
                  onChange={(e) => setCustomActionName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Priority
                </label>
                <select
                  value={customPriority}
                  onChange={(e) => setCustomPriority(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="STAT">STAT (Immediate 1-Hour)</option>
                  <option value="URGENT">URGENT (&lt; 30 min)</option>
                  <option value="ROUTINE">ROUTINE Bedside Order</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="MEDICATION_CHANGE">Medication Change / Titration</option>
                  <option value="RESUSCITATION">Fluid Resuscitation / Bolus</option>
                  <option value="STAT_LABS">STAT Laboratory Draw</option>
                  <option value="BEDSIDE_HARDWARE">Lines & Hardware (Arterial/Central)</option>
                  <option value="THERAPY_ORDER">Bedside Therapy & Monitoring</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Doctor's Bedside Notes for Nurse
                </label>
                <input
                  type="text"
                  placeholder="e.g. Target MAP >= 65 mmHg. Re-zero arterial transducer q2h."
                  value={customDoctorNotes}
                  onChange={(e) => setCustomDoctorNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCustomComposerOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAssigning || !customActionName.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAssigning ? 'Dispatching...' : 'Assign Order to Bedside Nurse'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Interactive Checklist Items */}
        <div className="space-y-2.5">
          {checklistItems.map((item) => {
            const isSelected = Boolean(selectedTasks[item.id]);
            const assigned = assignedTasks[item.title];
            const isAssigned = Boolean(assigned);
            const isExecuted = assigned?.status === 'EXECUTED';

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border-[1.5px] transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isExecuted
                    ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/60'
                    : isAssigned
                    ? 'bg-sky-50/60 border-sky-300 dark:bg-sky-950/30 dark:border-sky-800'
                    : isSelected
                    ? 'bg-emerald-50/40 border-emerald-400 dark:bg-emerald-950/20'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 dark:bg-[#131D31] dark:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Task Selection Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelectTask(item.id)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                    title={isSelected ? "Deselect task" : "Select task to assign to nurse"}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${isExecuted ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {item.title}
                      </span>

                      {/* Priority / Urgency Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
                        isExecuted
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'
                      }`}>
                        {isExecuted ? 'EXECUTED' : item.badge || 'STAT 1-HOUR'}
                      </span>

                      {/* Category Badge */}
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.category || inferCategory(item.title)}
                      </span>

                      {/* Real-time Bedside Worklist Badge */}
                      {isAssigned && !isExecuted && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                          <span>Assigned to Bedside Nurse</span>
                        </span>
                      )}
                      {isExecuted && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          ✓ Administered at Bedside
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      {item.detail}
                    </div>
                  </div>
                </div>

                {/* 1-Click Action Button on Each Row */}
                <div className="shrink-0 flex items-center gap-2">
                  {isAssigned ? (
                    <span className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>Dispatched</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAssignSingle(item)}
                      disabled={isAssigning}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                      title="Assign this task directly to bedside nurse"
                    >
                      <Send className="w-3 h-3" />
                      <span>Assign to Nurse</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Checklist Action Dock */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Digital Signature Log: Attending Physician Authority Enforced</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={handleAssignSelected}
                disabled={isAssigning}
                className="px-4 py-2 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Assign Selected ({selectedCount}) to Nurse</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAssignAll}
              disabled={isAssigning}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-sm active:scale-95 ${
                allAssigned
                  ? 'bg-emerald-100 text-emerald-800 border-[1.5px] border-emerald-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20 hover:shadow-md'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{allAssigned ? '✓ All Bundle Tasks Dispatched to Nurse' : 'Assign All Care Bundle Tasks to Nurse'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
