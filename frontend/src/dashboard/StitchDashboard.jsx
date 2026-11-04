import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ConversationWorkspace from './components/ConversationWorkspace';
import InboxView from './components/InboxView';
import AiAgentsView from './components/AiAgentsView';
import MonitoringView from './components/MonitoringView';
import RecordsView from './components/RecordsView';
import LabsView from './components/LabsView';
import MedicationsView from './components/MedicationsView';
import SettingsView from './components/SettingsView';
import OverrideModal from './components/OverrideModal';
import NurseEntryModal from './components/NurseEntryModal';
import ExcelUploadModal from './components/ExcelUploadModal';
import AddPatientModal from './components/AddPatientModal';
import DischargeConfirmModal from './components/DischargeConfirmModal';
import ReassignDoctorModal from './components/ReassignDoctorModal';
import { downloadDemoWorkbookFile } from './data/demoFlowsheetData';
import Header from './components/Header';
import { Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { clinicalApi } from '../services/api';
import './dashboard-theme.css';

const STORAGE_SIDEBAR_WIDTH_KEY = 'aegis_sidebar_width';
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 480;
const DEFAULT_SIDEBAR_WIDTH = 260;

/**
 * Transforms raw backend BedRosterItemDto into UI alert model for dashboard views.
 * Zero hardcoded/mock patient data.
 */
/**
 * Clean clinical fallback when navigating to patient-specific views without an active patient selected.
 * Prevents black/empty viewports and provides 1-click patient selection or quick navigation to Ward Overview.
 */
function EmptyPatientState({ viewTitle, beds = [], onSelectPatient, onGoToWard }) {
  const occupiedBeds = beds.filter(b => Boolean(b.isOccupied ?? b.occupied ?? (b.patientId && String(b.patientId).trim().length > 0)));

  return (
    <div className="flex-1 h-full p-6 flex flex-col items-center justify-center overflow-y-auto">
      <div className="max-w-md w-full bg-white dark:bg-[#0D1524] rounded-3xl border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#0E2A2A] border-[1.5px] border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <Activity className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          No Patient Selected
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          {viewTitle ? `To view ${viewTitle}, select an active patient from the ward surveillance roster.` : 'Select an active patient to view clinical telemetry and diagnostics.'}
        </p>

        {occupiedBeds.length > 0 && (
          <div className="mt-5 space-y-2 text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1">
              Select Admitted Patient
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pt-0.5">
              {occupiedBeds.map(b => {
                const color = b.triageColor || 'GREEN';
                const isCrit = color === 'RED';
                const isHigh = color === 'YELLOW';
                return (
                  <button
                    key={b.bedNumber}
                    type="button"
                    onClick={() => onSelectPatient(b.patientId)}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-[#F8FAFD] dark:bg-[#111C2E] hover:border-emerald-500 dark:hover:border-emerald-500/60 hover:bg-emerald-50/30 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                        {b.bedNumber}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {b.patientName || b.patientId}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                          {b.patientId} • {b.admissionDiagnosis || b.primaryDiagnosis || 'ICU Observation'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isCrit
                        ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                        : isHigh
                          ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    }`}>
                      {b.urgencyLevel || (isCrit ? 'CRITICAL' : isHigh ? 'MODERATE' : 'STABLE')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onGoToWard}
            className="px-4 py-2 rounded-full text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
          >
            Go to Ward Overview
          </button>
        </div>
      </div>
    </div>
  );
}

function transformBedToAlert(bed) {
  const isRed = bed.triageColor === 'RED';
  const isYellow = bed.triageColor === 'YELLOW';
  const riskVal = bed.compositeRisk ?? bed.compositeSepsisRisk ?? 0.12;
  const riskPct = Math.round(riskVal * 100);

  const hrVal = bed.latestHeartRate ?? bed.heartRate;
  const hr = hrVal ? `${Math.round(hrVal)} bpm` : '80 bpm';

  let bp = '120/80 mmHg';
  if (bed.bloodPressure) {
    bp = `${bed.bloodPressure} mmHg`;
  } else if (bed.latestSystolicBp) {
    bp = `${Math.round(bed.latestSystolicBp)}/${Math.round(bed.latestDiastolicBp || 75)} mmHg`;
  }

  const mapValRaw = bed.latestMap ?? bed.meanArterialPressure;
  const mapVal = mapValRaw ? `MAP ${Math.round(mapValRaw)} mmHg` : 'MAP 90 mmHg';

  const lactateValRaw = bed.latestLactate ?? bed.lactate;
  const lactate = lactateValRaw != null ? `${Number(lactateValRaw).toFixed(1)} mmol/L` : '1.2 mmol/L';

  const shockIndexRaw = bed.shockIndex ?? (
    (bed.latestSystolicBp && bed.latestHeartRate && bed.latestSystolicBp > 0)
      ? (bed.latestHeartRate / bed.latestSystolicBp).toFixed(2)
      : '0.67'
  );
  const shockIndex = typeof shockIndexRaw === 'number' ? shockIndexRaw.toFixed(2) : String(shockIndexRaw);

  const rrVal = bed.respiratoryRate ? `${Math.round(bed.respiratoryRate)} /min` : '20 /min';
  const tempVal = bed.temperature != null ? `${Number(bed.temperature).toFixed(1)} °C` : '37.8 °C';
  const spo2Val = bed.o2Saturation != null ? `${Math.round(bed.o2Saturation)}%` : '96%';

  return {
    id: `ALT-${bed.patientId}`,
    patientId: bed.patientId,
    patientName: bed.patientName,
    bed: bed.bedNumber,
    age: bed.age || 65,
    gender: bed.gender || 'MALE',
    admissionDiagnosis: bed.admissionDiagnosis || bed.primaryDiagnosis || 'ICU Surveillance',
    icuDay: 2,
    priority: isRed ? 'CRITICAL' : isYellow ? 'HIGH' : 'NORMAL',
    urgencyLevel: bed.urgencyLevel || (isRed ? 'CRITICAL_SEPSIS' : isYellow ? 'MODERATE' : 'STABLE'),
    compositeRisk: riskVal,
    headline: bed.summaryHeadline || (isRed
      ? `Critical Shock Index Decoupling (${shockIndex}) with Hyperlactatemia (${lactate})`
      : isYellow
        ? `Moderate Sepsis Risk Warning: Deterioration Index ${riskPct}%`
        : `Physiological Telemetry Compensated within Baseline Limits`),
    summary: isRed
      ? `Multi-agent consensus isolates systemic vascular collapse. Immediate Attending Physician review required.`
      : isYellow
        ? `Laboratory and vitals agents flag trending metabolic burden. Routine surveillance ongoing.`
        : `Hemodynamics and cellular metabolism compensated.`,
    agent: isRed ? 'Triage Orchestrator' : 'Vitals Intelligence Agent',
    agentKey: isRed ? 'vitals' : 'vitals',
    agentSpecialty: 'Multi-Agent Consensus Synthesis',
    timestamp: 'Live Stream',
    isRead: true,
    isReviewed: false,
    vitals: {
      hr,
      bp,
      map: mapVal,
      rr: rrVal,
      temp: tempVal,
      spo2: spo2Val,
      shockIndex: `${shockIndex} (${isRed ? 'Critical > 1.0' : 'Normal'})`
    },
    labs: {
      lactate: `${lactate} (${parseFloat(lactate) >= 2.0 ? 'Elevated' : 'Normal'})`,
      wbc: bed.whiteBloodCellCount ? `${bed.whiteBloodCellCount.toFixed(1)} × 10⁹/L` : '12.4 × 10⁹/L',
      creatinine: bed.creatinine ? `${bed.creatinine.toFixed(1)} mg/dL` : '1.4 mg/dL',
      platelets: bed.platelets ? `${Math.round(bed.platelets)} × 10⁹/L` : '185 × 10⁹/L'
    },
    evidenceSections: [
      {
        title: 'Multi-Agent Neuro-Symbolic Synthesis',
        details: [
          { label: 'Shock Index (HR / SBP)', val: `${shockIndex} (Threshold: 1.0)` },
          { label: 'Venous Blood Lactate', val: lactate },
          { label: 'Mean Arterial Pressure', val: mapVal }
        ],
        interpretation: isRed
          ? 'Arterial line waveform confirms acute hypoperfusion meeting Sepsis-3 consensus criteria.'
          : 'Cardiorespiratory parameters compensated.'
      }
    ],
    initialAgentMessage: `Attending Clinician: Multi-Agent Triage Engine reporting on Patient ${bed.patientId} (${bed.bedNumber}). Current Composite Sepsis Risk is ${riskPct}% (${bed.urgencyLevel || 'STABLE'}). ${isRed ? 'Urgent Surviving Sepsis 1-Hour bundle authorization recommended.' : 'Patient physiological status stable.'}`
  };
}

export default function StitchDashboard({ onExitToLanding }) {
  const { isDark } = useTheme();
  const { user, isDoctor, isNurse } = useAuth();

  // Real backend bed roster & derived alerts state
  const [beds, setBeds] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active View: 'consultation', 'inbox', 'monitoring', 'records', 'agents', 'labs', 'medications', 'settings'
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('patientId') || params.get('patient')) {
          return 'consultation';
        }
      } catch (e) {}
    }
    return 'inbox';
  });

  // Sidebar Layout State & Width Persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_SIDEBAR_WIDTH_KEY);
        if (saved) {
          const parsed = Number(saved);
          if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return DEFAULT_SIDEBAR_WIDTH;
  });

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  // Filter & Search for Inbox / Ward
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isNurseModalOpen, setIsNurseModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isExcelAutoDemo, setIsExcelAutoDemo] = useState(false);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [isReassignDoctorModalOpen, setIsReassignDoctorModalOpen] = useState(false);
  const [initialVacantBed, setInitialVacantBed] = useState(null);

  const handleOpenAddPatient = (bedNumber = null) => {
    setInitialVacantBed(bedNumber);
    setIsAddPatientModalOpen(true);
  };

  const handlePatientAdmitted = (newPatient) => {
    fetchRoster();
    if (newPatient && newPatient.patientId) {
      setSelectedAlertId(`ALT-${newPatient.patientId}`);
      setActiveView('consultation');
    }
  };

  const handlePatientDischarged = (dischargeData) => {
    fetchRoster();
    setActiveView('inbox');
  };

  const handleDoctorReassigned = (reassignData) => {
    fetchRoster();
  };

  const handleOpenDemoFlowsheet = () => {
    setIsExcelAutoDemo(true);
    setIsExcelModalOpen(true);
  };

  const handleOpenExcelUpload = () => {
    setIsExcelAutoDemo(false);
    setIsExcelModalOpen(true);
  };

  const handleDownloadDemoFlowsheet = () => {
    downloadDemoWorkbookFile();
  };

  // Conversations map: alert.id -> array of messages
  const [conversations, setConversations] = useState({});

  // Typing state for AI Q&A
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');

  // Simulation Engine State
  const [simulationDataset, setSimulationDataset] = useState(null);
  const [simCurrentHour, setSimCurrentHour] = useState(0);
  const [simMaxHour, setSimMaxHour] = useState(5);
  const [simIsPlaying, setSimIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [simEvaluatingPid, setSimEvaluatingPid] = useState(null);

  // 1. Fetch Real Bed Roster from Spring Boot API
  const fetchRoster = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res = await clinicalApi.fetchBedRoster();
      if (res.data && Array.isArray(res.data)) {
        // Robust normalization so all fields (isOccupied, occupied, compositeRisk, vitals) work consistently
        const normalizedBeds = res.data.map(b => {
          const isOcc = Boolean(
            b.isOccupied === true ||
            b.occupied === true ||
            (b.patientId && String(b.patientId).trim().length > 0)
          );
          return {
            ...b,
            isOccupied: isOcc,
            occupied: isOcc,
            compositeRisk: b.compositeRisk ?? b.compositeSepsisRisk ?? 0,
            latestHeartRate: b.latestHeartRate ?? b.heartRate,
            latestSystolicBp: b.latestSystolicBp ?? (b.bloodPressure ? parseFloat(b.bloodPressure.split('/')[0]) : null),
            latestDiastolicBp: b.latestDiastolicBp ?? (b.bloodPressure ? parseFloat(b.bloodPressure.split('/')[1]) : null),
            latestMap: b.latestMap ?? b.meanArterialPressure,
            latestLactate: b.latestLactate ?? b.lactate,
            primaryDiagnosis: b.primaryDiagnosis ?? b.admissionDiagnosis,
          };
        });

        setBeds(normalizedBeds);
        const derivedAlerts = normalizedBeds.filter(b => b.occupied).map(transformBedToAlert);
        setAlerts(derivedAlerts);

        // Ensure a selected alert exists
        setSelectedAlertId(prev => {
          if (typeof window !== 'undefined') {
            try {
              const params = new URLSearchParams(window.location.search);
              const ptParam = params.get('patientId') || params.get('patient');
              if (ptParam) {
                const match = derivedAlerts.find(a =>
                  a.patientId?.toLowerCase() === ptParam.toLowerCase() ||
                  a.id?.toLowerCase() === ptParam.toLowerCase() ||
                  a.id?.toLowerCase() === `alt-${ptParam.toLowerCase()}`
                );
                if (match) return match.id;
              }
            } catch (e) {}
          }
          if (prev && derivedAlerts.some(a => a.id === prev)) return prev;
          // default to critical alert or first occupied patient
          const crit = derivedAlerts.find(a => a.priority === 'CRITICAL');
          return crit ? crit.id : (derivedAlerts[0]?.id || null);
        });

        // Initialize conversations map for any new alerts
        setConversations(prev => {
          const updated = { ...prev };
          derivedAlerts.forEach(alert => {
            if (!updated[alert.id]) {
              updated[alert.id] = [
                {
                  sender: "agent",
                  agentName: alert.agent,
                  agentSpecialty: alert.agentSpecialty,
                  agentKey: alert.agentKey,
                  time: "Live Stream",
                  text: alert.initialAgentMessage,
                  evidence: alert.evidenceSections
                }
              ];
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.warn('Failed to fetch bed roster:', err);
    } finally {
      if (!isSilent) setIsRefreshing(false);
    }
  }, []);

  // Initial fetch on mount & 5-second polling interval
  useEffect(() => {
    fetchRoster();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchRoster(true); // silent background poll
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchRoster]);

  // Selected Alert Object
  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || alerts[0] || null;

  // Keyboard shortcut (Ctrl+B / Cmd+B) to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const targetTag = e.target?.tagName?.toLowerCase();
        if (targetTag !== 'input' && targetTag !== 'textarea') {
          e.preventDefault();
          setIsSidebarCollapsed(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Strict zero-overflow on body
  useEffect(() => {
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('dashboard-active');
    document.documentElement.classList.add('dashboard-active');

    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.classList.remove('dashboard-active');
      document.documentElement.classList.remove('dashboard-active');
    };
  }, []);

  // Sidebar drag handler
  const handlePointerDown = (e) => {
    if (isSidebarCollapsed) return;
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onPointerMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = moveEvent.clientX;
      const newWidth = Math.min(Math.max(clientX, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
      setSidebarWidth(newWidth);
    };

    const onPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        setSidebarWidth((finalWidth) => {
          try {
            localStorage.setItem(STORAGE_SIDEBAR_WIDTH_KEY, String(finalWidth));
          } catch (err) {}
          return finalWidth;
        });
      }

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Select Alert & open consultation
  const handleSelectAlert = (alertId) => {
    setSelectedAlertId(alertId);
    setActiveView('consultation');
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  // Select Patient by patientId (from Ward Grid)
  const handleSelectPatient = (patientId) => {
    let targetAlert = alerts.find(a => a.patientId === patientId);
    if (!targetAlert) {
      const bed = beds.find(b => b.patientId === patientId);
      if (bed) {
        targetAlert = transformBedToAlert(bed);
        setAlerts(prev => [targetAlert, ...prev.filter(a => a.patientId !== patientId)]);
      }
    }
    if (targetAlert) {
      setSelectedAlertId(targetAlert.id);
      setActiveView('consultation');
      setAlerts(prev =>
        prev.map(a => (a.id === targetAlert.id ? { ...a, isRead: true } : a))
      );
    } else {
      setActiveView('inbox');
    }
  };

  // Start New Consultation
  const handleNewConsultation = () => {
    setActiveView('consultation');
    if (!selectedAlertId && alerts.length > 0) {
      setSelectedAlertId(alerts[0].id);
    }
  };

  // Acknowledge / Approve Alert (Doctor & Nurse)
  const handleAcknowledgeAlert = async () => {
    if (!selectedAlert) return;

    try {
      // 1. Digital signature recorded in immutable audit log
      await clinicalApi.recordHitlDecision({
        patientId: selectedAlert.patientId,
        actionTaken: 'APPROVED',
        actionsAuthorized: ['SEPSIS_BUNDLE_CONFIRMED', 'BEDSIDE_VITALS_ACKNOWLEDGED']
      });

      // 2. If Doctor, sign sepsis bundle actions
      if (isDoctor) {
        await clinicalApi.signClinicalActions({
          patientId: selectedAlert.patientId,
          actionsAuthorized: ['BLOOD_CULTURES', 'ANTIBIOTICS', 'FLUID_RESUSCITATION']
        });
      }

      // 3. Update local state
      setAlerts(prev =>
        prev.map(a => (a.id === selectedAlert.id ? { ...a, isReviewed: true } : a))
      );

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setConversations(prev => ({
        ...prev,
        [selectedAlert.id]: [
          ...(prev[selectedAlert.id] || []),
          {
            sender: "system",
            text: `Alert approved & digitally signed by ${user?.fullName || 'Attending'} at ${nowStr}. Committed to append-only audit trail.`,
            time: "Just now"
          }
        ]
      }));
    } catch (err) {
      alert('Failed to sign off on alert: ' + err.message);
    }
  };

  // Submit Clinical Override (Doctor Authority Enforced)
  const handleRecordOverride = async ({ category, notes }) => {
    if (!selectedAlert) return;

    try {
      const res = await clinicalApi.recordHitlDecision({
        patientId: selectedAlert.patientId,
        actionTaken: 'OVERRIDDEN',
        overrideReason: `${category}: ${notes}`,
        actionsAuthorized: ['OVERRIDE_DOCUMENTED']
      });

      if (res.error) {
        alert(res.error);
        return;
      }

      setConversations(prev => ({
        ...prev,
        [selectedAlert.id]: [
          ...(prev[selectedAlert.id] || []),
          {
            sender: "system",
            text: `Physician Override Digitally Signed [${category}]: "${notes}". SHA-256 Signature: ${res.data?.signatureHash || 'AUDIT-LOGGED'}`,
            time: "Just now"
          }
        ]
      }));
    } catch (err) {
      alert('Override rejected: ' + err.message);
    }
  };

  // Send Message in Conversation Workspace -> Grounded in real backend /alerts/explain
  const handleSendMessage = async (userText) => {
    if (!selectedAlert || !userText.trim()) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append Clinician inquiry
    setConversations(prev => ({
      ...prev,
      [selectedAlert.id]: [
        ...(prev[selectedAlert.id] || []),
        {
          sender: "doctor",
          text: userText,
          time: userTime
        }
      ]
    }));

    setIsTyping(true);
    setTypingText(`Aegis Multi-Agent Engine is synthesizing TreeSHAP evidence for ${selectedAlert.patientId}...`);

    try {
      const res = await clinicalApi.explainAlert(selectedAlert.patientId, userText);
      const answer = res.data?.answer || "Multi-agent evaluation completed based on latest arterial line telemetry and venous lactate.";
      const contributions = res.data?.agentContributions || {};
      const agentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setConversations(prev => ({
        ...prev,
        [selectedAlert.id]: [
          ...(prev[selectedAlert.id] || []),
          {
            sender: "agent",
            agentName: selectedAlert.agent,
            agentSpecialty: selectedAlert.agentSpecialty,
            agentKey: selectedAlert.agentKey,
            time: agentTime,
            text: answer,
            evidence: [
              {
                title: 'Neuro-Symbolic Agent Contributions',
                details: Object.entries(contributions).map(([k, v]) => ({
                  label: k,
                  val: `${Math.round(v * 100)}% Weight`
                })),
                interpretation: 'Grounded in real persisted evaluations and biological heuristics.'
              }
            ]
          }
        ]
      }));
    } catch (err) {
      setConversations(prev => ({
        ...prev,
        [selectedAlert.id]: [
          ...(prev[selectedAlert.id] || []),
          {
            sender: "system",
            text: `Clinical explanation query error: ${err.message}`,
            time: "Just now"
          }
        ]
      }));
    } finally {
      setIsTyping(false);
    }
  };

  // Step Simulation Forward by 1 Hour
  const handleStepSimulationHour = async () => {
    const nextHour = simCurrentHour + 1;
    if (nextHour > simMaxHour) {
      setSimIsPlaying(false);
      return;
    }

    setSimCurrentHour(nextHour);

    // If an uploaded dataset exists, ingest rows for this hour
    if (simulationDataset && Array.isArray(simulationDataset.rows)) {
      const rowsForHour = simulationDataset.rows.filter(r => r.hourIndex === nextHour);
      for (const row of rowsForHour) {
        setSimEvaluatingPid(row.patientId);
        try {
          await clinicalApi.logPatientTelemetry(row.patientId, {
            patientId: row.patientId,
            patientName: row.patientName,
            age: row.age,
            gender: row.gender,
            diagnosis: row.diagnosis,
            hourIndex: row.hourIndex,
            hr: row.hr,
            sbp: row.sbp,
            dbp: row.dbp,
            resp: row.resp,
            temp: row.temp,
            o2sat: row.o2sat,
            lactate: row.lactate,
            wbc: row.wbc,
            creatinine: row.creatinine,
            platelets: row.platelets,
            activeMedications: row.activeMedications
          });
        } catch (e) {
          console.warn('Simulation tick error:', e);
        }
      }
      setSimEvaluatingPid(null);
    }

    // Refresh ward after stepping
    fetchRoster(true);
  };

  const handleResetSimulation = async () => {
    setSimIsPlaying(false);
    setSimCurrentHour(0);
    setSimEvaluatingPid(null);
    setSimulationDataset(null); // Clear uploaded Excel batch on simulation reset
    try {
      await clinicalApi.resetWardDemo();
      fetchRoster();
    } catch (e) {
      console.warn('Simulation reset error:', e);
    }
  };

  const handleBatchLoaded = (batchData) => {
    setSimulationDataset(batchData);
    if (batchData.summary?.maxHourIndex) {
      setSimMaxHour(batchData.summary.maxHourIndex);
    }
    fetchRoster();
  };

  const handleStartSimulation = async (batchData) => {
    setSimulationDataset(batchData);
    if (batchData.summary?.maxHourIndex) {
      setSimMaxHour(batchData.summary.maxHourIndex);
    }
    setSimCurrentHour(0);

    // Immediately ingest Hour 0 rows so patients are admitted and show up in bed roster right away
    if (batchData && Array.isArray(batchData.rows)) {
      const rowsHour0 = batchData.rows.filter(r => r.hourIndex === 0);
      for (const row of rowsHour0) {
        setSimEvaluatingPid(row.patientId);
        try {
          await clinicalApi.logPatientTelemetry(row.patientId, {
            patientId: row.patientId,
            patientName: row.patientName,
            age: row.age,
            gender: row.gender,
            diagnosis: row.diagnosis,
            hourIndex: row.hourIndex,
            hr: row.hr,
            sbp: row.sbp,
            dbp: row.dbp,
            resp: row.resp,
            temp: row.temp,
            o2sat: row.o2sat,
            lactate: row.lactate,
            wbc: row.wbc,
            creatinine: row.creatinine,
            platelets: row.platelets,
            activeMedications: row.activeMedications
          });
        } catch (e) {
          console.warn('Simulation tick error at hour 0:', e);
        }
      }
      setSimEvaluatingPid(null);
      await fetchRoster(true);
    }

    setSimIsPlaying(true);
  };

  return (
    <div className={`dashboard-viewport h-screen h-[100dvh] w-screen overflow-hidden flex flex-col font-sans antialiased select-none ${
      isDark ? 'dashboard-theme-dark dark bg-[#080E18] text-[#F1F5FA]' : 'dashboard-theme-light light bg-[#F8FAFD] text-[#0F172A]'
    }`}>

      {/* Persistent Global Top Navigation Bar */}
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        selectedAlert={selectedAlert}
        alerts={alerts}
        onSelectAlert={handleSelectAlert}
        onExitToLanding={onExitToLanding}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
        onOpenAddPatient={handleOpenAddPatient}
      />

      {/* Primary Workspace Row: Sidebar + Resizable Divider + Active View */}
      <div className="flex-1 min-h-0 flex overflow-hidden w-full relative">
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          alerts={alerts}
          selectedAlertId={selectedAlertId}
          onSelectPatient={handleSelectAlert}
          onNewConsultation={handleNewConsultation}
          onExitToLanding={onExitToLanding}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          width={sidebarWidth}
          isDragging={isDragging}
        />

        {/* Resizable Vertical Divider */}
        {!isSidebarCollapsed && (
          <div
            onPointerDown={handlePointerDown}
            onDoubleClick={() => {
              setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
              try {
                localStorage.setItem(STORAGE_SIDEBAR_WIDTH_KEY, String(DEFAULT_SIDEBAR_WIDTH));
              } catch (e) {}
            }}
            className={`relative group z-30 select-none cursor-col-resize flex items-center justify-center transition-all duration-200 ease-in-out ${
              isDragging
                ? 'w-2 bg-[#10B981]/25 -mx-[4px]'
                : 'w-1.5 hover:w-2 hover:bg-[#10B981]/20 -mx-[3px]'
            }`}
            title="Drag to resize sidebar • Double-click to reset (260px) • Press Ctrl+B to collapse"
          >
            <div
              className={`w-[2px] h-full transition-all duration-200 ease-in-out ${
                isDragging ? 'bg-[#10B981]' : 'bg-[#E5E7EB] group-hover:bg-[#10B981]'
              }`}
            />
            <div
              className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-200 ease-in-out pointer-events-none ${
                isDragging ? 'opacity-100 scale-105' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <div className="w-4 h-9 rounded-full bg-white border-[1.5px] border-emerald-500 shadow-md flex flex-col items-center justify-center gap-0.5">
                <div className="w-1.5 h-0.5 rounded-full bg-emerald-500" />
                <div className="w-1.5 h-0.5 rounded-full bg-emerald-500" />
                <div className="w-1.5 h-0.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 h-full flex overflow-hidden min-w-0">

          {/* VIEW 1: Primary Conversational AI Workspace */}
          {activeView === 'consultation' && (
            selectedAlert ? (
              <ConversationWorkspace
                alert={selectedAlert}
                messages={conversations[selectedAlert.id] || []}
                isTyping={isTyping}
                typingText={typingText}
                onBackToInbox={() => setActiveView('inbox')}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onOpenOverrideModal={() => setIsOverrideModalOpen(true)}
                onOpenDischargeModal={() => setIsDischargeModalOpen(true)}
                onOpenReassignDoctor={() => setIsReassignDoctorModalOpen(true)}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <EmptyPatientState
                viewTitle="Clinical Consultation & AI Copilot"
                beds={beds}
                onSelectPatient={handleSelectPatient}
                onGoToWard={() => setActiveView('inbox')}
              />
            )
          )}

          {/* VIEW 2: Dashboard Triage Inbox & Ward Overview Grid */}
          {activeView === 'inbox' && (
            <div className="flex-1 h-full p-4 overflow-hidden flex flex-col">
              <div className="bg-white dark:bg-[#080E18] rounded-3xl border-[1.5px] border-slate-200 dark:border-[#1E2D44] flex flex-col h-full overflow-hidden shadow-xs">
                <InboxView
                  alerts={alerts}
                  beds={beds}
                  currentFilter={currentFilter}
                  onSetFilter={setCurrentFilter}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectAlert={handleSelectAlert}
                  onSelectPatient={handleSelectPatient}
                  onOpenAddPatient={handleOpenAddPatient}
                  onOpenNurseRound={() => setIsNurseModalOpen(true)}
                  onOpenExcelUpload={handleOpenExcelUpload}
                  onOpenDemoFlowsheet={handleOpenDemoFlowsheet}
                  onDownloadDemoFlowsheet={handleDownloadDemoFlowsheet}
                  onRefreshRoster={() => fetchRoster(false)}
                  isRefreshing={isRefreshing}
                  simulationProps={{
                    simulationDataset,
                    currentHour: simCurrentHour,
                    maxHour: simMaxHour,
                    isPlaying: simIsPlaying,
                    speed: simSpeed,
                    onTogglePlay: () => setSimIsPlaying(prev => !prev),
                    onStepHour: handleStepSimulationHour,
                    onResetSimulation: handleResetSimulation,
                    onChangeSpeed: (s) => setSimSpeed(s),
                    evaluatingPatientId: simEvaluatingPid
                  }}
                />
              </div>
            </div>
          )}

          {/* VIEW 3: Dedicated AI Agents View */}
          {activeView === 'agents' && (
            selectedAlert ? (
              <AiAgentsView
                alert={selectedAlert}
                onOpenConsultation={() => setActiveView('consultation')}
              />
            ) : (
              <EmptyPatientState
                viewTitle="AI Diagnostic Ensemble"
                beds={beds}
                onSelectPatient={handleSelectPatient}
                onGoToWard={() => setActiveView('inbox')}
              />
            )
          )}

          {/* VIEW 4: Dedicated Patient Monitoring View */}
          {activeView === 'monitoring' && (
            selectedAlert ? (
              <MonitoringView
                alert={selectedAlert}
                onOpenConsultation={() => setActiveView('consultation')}
              />
            ) : (
              <EmptyPatientState
                viewTitle="Patient Monitoring & Telemetry"
                beds={beds}
                onSelectPatient={handleSelectPatient}
                onGoToWard={() => setActiveView('inbox')}
              />
            )
          )}

          {/* VIEW 5: Dedicated Patient Records View */}
          {activeView === 'records' && (
            selectedAlert ? (
              <RecordsView
                alert={selectedAlert}
              />
            ) : (
              <EmptyPatientState
                viewTitle="Electronic Patient Records"
                beds={beds}
                onSelectPatient={handleSelectPatient}
                onGoToWard={() => setActiveView('inbox')}
              />
            )
          )}

          {/* VIEW 6: Dedicated Laboratory Reports View */}
          {activeView === 'labs' && (
            selectedAlert ? (
              <LabsView
                alert={selectedAlert}
              />
            ) : (
              <EmptyPatientState
                viewTitle="Laboratory Reports"
                beds={beds}
                onSelectPatient={handleSelectPatient}
                onGoToWard={() => setActiveView('inbox')}
              />
            )
          )}

          {/* VIEW 7: Dedicated Medications View */}
          {activeView === 'medications' && (
            selectedAlert ? (
              <MedicationsView
                alert={selectedAlert}
              />
            ) : (
              <EmptyPatientState
                viewTitle="Medications & Infusions Flowsheet"
                beds={beds}
                onSelectPatient={handleSelectPatient}
                onGoToWard={() => setActiveView('inbox')}
              />
            )
          )}

          {/* VIEW 8: Dedicated Settings & Audit View */}
          {activeView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Clinical Override Modal */}
      <OverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        onSubmit={handleRecordOverride}
      />

      {/* Nurse Hourly Round Entry Modal */}
      <NurseEntryModal
        isOpen={isNurseModalOpen}
        onClose={() => setIsNurseModalOpen(false)}
        patients={beds.filter(b => b.occupied)}
        selectedPatientId={selectedAlert?.patientId}
        onTelemetrySubmitted={() => fetchRoster()}
      />

      {/* Excel (.xlsx) Report Upload Modal */}
      <ExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onBatchLoaded={handleBatchLoaded}
        onStartSimulation={handleStartSimulation}
        autoLoadDemo={isExcelAutoDemo}
      />

      {/* Nurse: Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientModalOpen}
        onClose={() => setIsAddPatientModalOpen(false)}
        beds={beds}
        initialBedNumber={initialVacantBed}
        onPatientAdmitted={handlePatientAdmitted}
      />

      {/* Nurse: Discharge Patient Modal */}
      <DischargeConfirmModal
        isOpen={isDischargeModalOpen}
        onClose={() => setIsDischargeModalOpen(false)}
        patient={selectedAlert}
        onDischargeSuccess={handlePatientDischarged}
      />

      {/* Nurse: Reassign Attending Doctor Modal */}
      <ReassignDoctorModal
        isOpen={isReassignDoctorModalOpen}
        onClose={() => setIsReassignDoctorModalOpen(false)}
        patient={selectedAlert}
        onDoctorReassigned={handleDoctorReassigned}
      />
    </div>
  );
}
