import React, { useState, useEffect, useRef } from 'react';
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
import { INITIAL_ALERTS_DATA, createSimulatedAlert } from './data/alertsData';
import Header from './components/Header';
import { useTheme } from '../context/ThemeContext';
import './dashboard-theme.css';

const STORAGE_SIDEBAR_WIDTH_KEY = 'aegis_sidebar_width';
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 480;
const DEFAULT_SIDEBAR_WIDTH = 260;

export default function StitchDashboard({ onExitToLanding }) {
  const { isDark } = useTheme();
  // Alert dataset state - default to first alert (PT-9042)
  const [alerts, setAlerts] = useState(INITIAL_ALERTS_DATA);
  const [selectedAlertId, setSelectedAlertId] = useState(() => INITIAL_ALERTS_DATA[0]?.id || null);

  // Active View: 'consultation', 'inbox', 'monitoring', 'records', 'agents', 'labs', 'medications', 'settings'
  const [activeView, setActiveView] = useState('consultation');

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
      } catch (e) {
        // Fallback to default width
      }
    }
    return DEFAULT_SIDEBAR_WIDTH;
  });

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  // Filter & Search for Inbox
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Override / Disagreement Modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  // Conversations map: alert.id -> array of messages
  const [conversations, setConversations] = useState(() => {
    const initialMap = {};
    INITIAL_ALERTS_DATA.forEach(alert => {
      initialMap[alert.id] = [
        {
          sender: "agent",
          agentName: alert.agent,
          agentSpecialty: alert.agentSpecialty,
          agentKey: alert.agentKey,
          time: alert.timestamp,
          text: alert.initialAgentMessage,
          evidence: alert.evidenceSections
        }
      ];
    });
    return initialMap;
  });

  // Typing state for simulated AI stream
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');

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

  // Ensure strict zero-overflow on root body element during dashboard session
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

  // Draggable Divider Pointer Event Handlers
  const handlePointerDown = (e) => {
    if (isSidebarCollapsed) return;
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);

    // Disable text selection and enforce cursor across entire window while dragging
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

  // Start New Consultation (like ChatGPT "+ New Chat")
  const handleNewConsultation = () => {
    setActiveView('consultation');
    if (!selectedAlertId && alerts.length > 0) {
      setSelectedAlertId(alerts[0].id);
    }
  };

  // Toggle Acknowledge
  const handleAcknowledgeAlert = () => {
    if (!selectedAlertId) return;
    const alert = alerts.find(a => a.id === selectedAlertId);
    if (!alert) return;

    const newReviewed = !alert.isReviewed;

    setAlerts(prev =>
      prev.map(a => (a.id === selectedAlertId ? { ...a, isReviewed: newReviewed } : a))
    );

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logText = newReviewed
      ? `Alert acknowledged at ${nowStr}. Clinical oversight recorded in audit trail.`
      : "Alert marked as unreviewed.";

    setConversations(prev => ({
      ...prev,
      [selectedAlertId]: [
        ...(prev[selectedAlertId] || []),
        {
          sender: "system",
          text: logText,
          time: "Just now"
        }
      ]
    }));
  };

  // Submit Clinical Override
  const handleRecordOverride = ({ category, notes }) => {
    if (!selectedAlertId) return;

    setConversations(prev => ({
      ...prev,
      [selectedAlertId]: [
        ...(prev[selectedAlertId] || []),
        {
          sender: "system",
          text: `Physician Override Recorded [${category}]: "${notes}"`,
          time: "Just now"
        }
      ]
    }));
  };

  // Send Message in Conversation Workspace
  const handleSendMessage = (userText) => {
    if (!selectedAlertId || !userText.trim()) return;
    const alert = alerts.find(a => a.id === selectedAlertId);
    if (!alert) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append Clinician message
    setConversations(prev => ({
      ...prev,
      [selectedAlertId]: [
        ...(prev[selectedAlertId] || []),
        {
          sender: "doctor",
          text: userText,
          time: userTime
        }
      ]
    }));

    // Start Typing Indicator
    setIsTyping(true);
    setTypingText(`AEGIS is synthesizing multi-agent telemetry...`);

    // Formulate clinical response
    setTimeout(() => {
      setIsTyping(false);
      const reply = formulateMockResponse(alert, userText);
      const agentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setConversations(prev => ({
        ...prev,
        [selectedAlertId]: [
          ...(prev[selectedAlertId] || []),
          {
            sender: "agent",
            agentName: alert.agent,
            agentSpecialty: alert.agentSpecialty,
            agentKey: alert.agentKey,
            time: agentTime,
            text: reply.text,
            evidence: reply.evidence || []
          }
        ]
      }));
    }, 750);
  };

  // Simulate New Incoming Alert
  const handleSimulateAlert = () => {
    const newAlert = createSimulatedAlert();
    setAlerts(prev => [newAlert, ...prev]);

    setConversations(prev => ({
      ...prev,
      [newAlert.id]: [
        {
          sender: "agent",
          agentName: newAlert.agent,
          agentSpecialty: newAlert.agentSpecialty,
          agentKey: newAlert.agentKey,
          time: newAlert.timestamp,
          text: newAlert.initialAgentMessage,
          evidence: newAlert.evidenceSections
        }
      ]
    }));
  };

  return (
    <div className={`dashboard-viewport h-screen h-[100dvh] w-screen overflow-hidden flex flex-col font-sans antialiased select-none ${
      isDark ? 'dashboard-theme-dark dark bg-[#080E18] text-[#F1F5FA]' : 'dashboard-theme-light light bg-[#F9FAFB] text-[#111827]'
    }`}>

      {/* =========================================================================
          GLOBAL TOP NAVIGATION BAR (Persistent across all 8 dashboard views)
          ========================================================================= */}
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        selectedAlert={selectedAlert}
        alerts={alerts}
        onSelectAlert={handleSelectAlert}
        onExitToLanding={onExitToLanding}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* Primary Workspace Row: Sidebar + Drag Divider + Main Views */}
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

      {/* =========================================================================
          DRAGGABLE VERTICAL DIVIDER & RESIZE HANDLE (220px to 480px, Persistent)
          ========================================================================= */}
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
          {/* Visual Divider Line */}
          <div
            className={`w-[2px] h-full transition-all duration-200 ease-in-out ${
              isDragging ? 'bg-[#10B981]' : 'bg-[#E5E7EB] group-hover:bg-[#10B981]'
            }`}
          />

          {/* Floating Grip Affordance & Tactile Pill */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-200 ease-in-out pointer-events-none ${
              isDragging ? 'opacity-100 scale-105' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <div
              className="w-4 h-9 rounded-full bg-white border-[1.5px] border-emerald-500 shadow-md flex flex-col items-center justify-center gap-0.5"
            >
              <div className="w-1.5 h-0.5 rounded-full bg-emerald-500" />
              <div className="w-1.5 h-0.5 rounded-full bg-emerald-500" />
              <div className="w-1.5 h-0.5 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PART B: MAIN WORKSPACE (Conversational AI Area or Dedicated Views)
          ========================================================================= */}
      <main className="flex-1 h-full flex overflow-hidden min-w-0">

        {/* VIEW 1: Primary Conversational AI Workspace */}
        {activeView === 'consultation' && selectedAlert && (
          <ConversationWorkspace
            alert={selectedAlert}
            messages={conversations[selectedAlert.id] || []}
            isTyping={isTyping}
            typingText={typingText}
            onBackToInbox={() => setActiveView('inbox')}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onOpenOverrideModal={() => setIsOverrideModalOpen(true)}
            onSendMessage={handleSendMessage}
          />
        )}

        {/* VIEW 2: Dashboard Triage Inbox */}
        {activeView === 'inbox' && (
          <div className="flex-1 h-full p-4 overflow-hidden flex flex-col">
            <div
              className="bg-white rounded-3xl border-[1.5px] border-slate-200 flex flex-col h-full overflow-hidden shadow-xs"
            >
              <InboxView
                alerts={alerts}
                currentFilter={currentFilter}
                onSetFilter={setCurrentFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectAlert={handleSelectAlert}
                onSimulateAlert={handleSimulateAlert}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: Dedicated AI Agents View */}
        {activeView === 'agents' && selectedAlert && (
          <AiAgentsView
            alert={selectedAlert}
            onOpenConsultation={() => setActiveView('consultation')}
          />
        )}

        {/* VIEW 4: Dedicated Patient Monitoring View */}
        {activeView === 'monitoring' && selectedAlert && (
          <MonitoringView
            alert={selectedAlert}
            onOpenConsultation={() => setActiveView('consultation')}
          />
        )}

        {/* VIEW 5: Dedicated Patient Records View */}
        {activeView === 'records' && selectedAlert && (
          <RecordsView
            alert={selectedAlert}
          />
        )}

        {/* VIEW 6: Dedicated Laboratory Reports View */}
        {activeView === 'labs' && selectedAlert && (
          <LabsView
            alert={selectedAlert}
          />
        )}

        {/* VIEW 7: Dedicated Medications View */}
        {activeView === 'medications' && selectedAlert && (
          <MedicationsView
            alert={selectedAlert}
          />
        )}

        {/* VIEW 8: Dedicated Settings & Audit View */}
        {activeView === 'settings' && (
          <SettingsView />
        )}
      </main>
      </div>

      {/* Clinical Override / Disagreement Modal */}
      <OverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        onSubmit={handleRecordOverride}
      />
    </div>
  );
}

// Clinical Response Engine with comprehensive reasoning
function formulateMockResponse(alert, userQuery) {
  const q = userQuery.toLowerCase();
  const kb = alert.knowledgeBase || {};

  if (q.includes("summarize") || q.includes("condition") || q.includes("overview") || q.includes("summary")) {
    return {
      text: `### Clinical Condition Summary: ${alert.patientId} (${alert.bed})

• **Primary Surveillance Finding:** Acute physiological trajectory divergence meets Sepsis-3 consensus criteria.
• **Hemodynamics:** Heart rate is **${alert.vitals?.hr || '118 bpm'}** with Mean Arterial Pressure depressed at **${alert.vitals?.map || '65 mmHg'}**, resulting in an abnormal Shock Index of **${alert.vitals?.shockIndex || '1.34'}**.
• **Metabolic & Tissue Perfusion:** Venous lactate is elevated at **${alert.labs?.lactate || '3.8 mmol/L'}** with negative clearance (+0.42 mmol/L/hr accumulation).
• **Organ Involvement:** Leukocytosis (**${alert.labs?.wbc || '16.4k'}**) with 14% band forms and serum creatinine doubling to **${alert.labs?.creatinine || '1.8 mg/dL'}** (KDIGO Stage 2 AKI).
• **Pharmacology:** Active Norepinephrine titration (0.08 mcg/kg/min); Metoprolol oral held appropriately.

**Clinical Recommendation:** Re-evaluate fluid responsiveness with dynamic measures (passive leg raise / stroke volume variation), ensure blood cultures x2 prior to repeat antibiotic redosing, and maintain MAP ≥ 65 mmHg.`,
      evidence: alert.evidenceSections || []
    };
  } else if (q.includes("why") || q.includes("critical") || q.includes("flag") || q.includes("high")) {
    return {
      text: `### Critical Classification Rationale: ${alert.patientId}

${kb["why"] || "The alert was triggered because the physiological trajectory diverged markedly from the ICU patient baseline, with multiple organ systems reflecting coordinated degradation."}

**Key Driving Parameters:**
1. **Shock Index (1.34):** The ratio of HR (118) to SBP (88) exceeds the severe septic hypoperfusion threshold (> 1.0).
2. **Elevated Lactate (3.8 mmol/L):** Indicates ongoing anaerobic metabolism and cellular dysoxia.
3. **Refractory Hypotension:** Mean Arterial Pressure remains at 65 mmHg despite 1L balanced crystalloid administration.

The Multi-Agent Triage Orchestrator assigns a **84% probability of overt septic shock progression** without early bundle escalation.`,
      evidence: [alert.evidenceSections?.[0] || {}]
    };
  } else if (q.includes("vital") || q.includes("trend") || q.includes("parameter") || q.includes("velocity")) {
    return {
      text: `### Vital Sign Velocity & Trend Analysis

${kb["parameter"] || "The most significant contributor is the rate of physiological velocity change (first derivative) rather than a single static threshold crossing."}

| Vital Parameter | Observed Value | Velocity / 3h Delta | Status |
| :--- | :--- | :--- | :--- |
| **Heart Rate** | ${alert.vitals?.hr || '118 bpm'} | +11.3 bpm / hour | Tachycardia Alert |
| **Blood Pressure** | ${alert.vitals?.bp || '88/54 mmHg'} | MAP fell 82 → 65 mmHg | Hypotensive Deficit |
| **Respiratory Rate** | ${alert.vitals?.rr || '26 /min'} | +6 breaths / min | Tachypneic |
| **Temperature** | ${alert.vitals?.temp || '38.9 °C'} | +1.4 °C spike | Febrile |
| **Shock Index** | ${alert.vitals?.shockIndex || '1.34'} | Rose from 0.88 to 1.34 | Critical |

Continuous arterial waveform analysis confirms reduced systemic vascular resistance consistent with distributive septic shock.`,
      evidence: [alert.evidenceSections?.[0] || {}]
    };
  } else if (q.includes("abnormal") || q.includes("lab") || q.includes("laboratory") || q.includes("lactate")) {
    return {
      text: `### Abnormal Laboratory Findings & Biochemical Kinetics

| Analyte | Observed Value | Reference Range | Interpretation |
| :--- | :--- | :--- | :--- |
| **Serum Lactate** | ${alert.labs?.lactate || '3.8 mmol/L'} | 0.5 – 2.0 mmol/L | Anaerobic tissue dysoxia |
| **Leukocytes (WBC)** | ${alert.labs?.wbc || '16.4 × 10⁹/L'} | 4.5 – 11.0 × 10⁹/L | Left shift (14% bands) |
| **Serum Creatinine** | ${alert.labs?.creatinine || '1.8 mg/dL'} | 0.7 – 1.3 mg/dL | KDIGO Stage 2 AKI |
| **Platelets** | ${alert.labs?.platelets || '138 × 10⁹/L'} | 150 – 450 × 10⁹/L | Mild consumptive trend |

**Laboratory Agent Assessment:** Lactate clearance is negative (+0.42 mmol/L/hr accumulation). This confirms true cellular hypoxia rather than artifactual draw delay.`,
      evidence: [alert.evidenceSections?.[1] || {}]
    };
  } else if (q.includes("medication") || q.includes("timing") || q.includes("pressor") || q.includes("beta") || q.includes("drug")) {
    return {
      text: `### Medication & Pharmacotherapy Evaluation

${kb["medication"] || "The Medication Context Agent correlated all administered doses over the past 8 hours to evaluate confounding. While active pharmacotherapy contributes subtle shifts, the primary driving force remains genuine tissue inflammation."}

• **Norepinephrine Infusion:** Currently running at 0.08 mcg/kg/min; titrated upwards to maintain MAP ≥ 65 mmHg.
• **Antimicrobials:** Vancomycin 1.25g administered at 07:45. Trough due at 18:00. Blood cultures remain in incubation.
• **Confounder Verification:** Oral Metoprolol 50mg was **appropriately held** due to MAP < 65 mmHg. Current heart rate of 118 bpm is genuine tachycardia and not artificially suppressed.`,
      evidence: [alert.evidenceSections?.[2] || {}]
    };
  } else if (q.includes("consensus") || q.includes("agent") || q.includes("orchestrat") || q.includes("multi-agent")) {
    return {
      text: `### Multi-Agent Consensus Architecture

The Aegis Multi-Agent System fused independent assessments across 4 specialized diagnostic agents:

1. **Vitals Intelligence Agent (Weight 40%):** Flags rapid HR velocity and Shock Index of 1.34 as high-consequence circulatory failure.
2. **Laboratory Intelligence Agent (Weight 35%):** Flags 3.8 mmol/L venous lactate and doubling of creatinine as acute end-organ hypoperfusion.
3. **Medication Context Agent (Weight 15%):** Excludes beta-blocker artifact; confirms active vasopressor requirement.
4. **Data Quality Agent (Weight 10%):** Confirms 99.4% signal-to-noise ratio on arterial line and pulse oximetry.

**Bayesian Ensemble Agreement:** **96.8%** Concordance across all agents in recommending immediate Sepsis-3 clinical protocol execution.`,
      evidence: alert.evidenceSections || []
    };
  } else if (q.includes("risk") || q.includes("conflict") || q.includes("complication") || q.includes("decompensat")) {
    return {
      text: `### Potential Clinical Risks & Conflicting Indicators

${kb["conflicting"] || "We evaluated conflicting indicators across lab and ventilator telemetry. Peripheral perfusion and acid-base metrics are unmistakably concordant with sepsis."}

**Identified Clinical Risks:**
• **Risk of Vasodilatory Collapse:** Vasopressor escalation may be required if systemic vascular resistance remains depressed.
• **Acute Kidney Injury:** KDIGO Stage 2 AKI requires careful avoidance of nephrotoxic medications and volume optimization.
• **Coagulopathy:** Platelet decline from 160k to 138k warrants monitoring for subclinical disseminated intravascular coagulation (DIC).

**Conflicting Findings:** Oxygen saturation remains relatively preserved at 92% on 4L NC; CVP telemetry indicates no overt signs of cardiogenic congestion.`,
      evidence: alert.evidenceSections || []
    };
  } else {
    return {
      text: `### Clinical Analysis for Query: "${userQuery}"

AEGIS has cross-referenced your query against **${alert.patientId}**'s real-time telemetry flowsheet:

• **Patient Bedside:** ${alert.bed} • MICU Ward 3B
• **Current Hemodynamics:** HR ${alert.vitals?.hr || '118 bpm'} | BP ${alert.vitals?.bp || '88/54'} | MAP ${alert.vitals?.map || '65 mmHg'}
• **Biochemical Profile:** Lactate ${alert.labs?.lactate || '3.8 mmol/L'} | WBC ${alert.labs?.wbc || '16.4k'}
• **Risk Status:** ${alert.priority} Sepsis Surveillance

The multi-agent consensus indicates high likelihood of septic shock progression unless bedside fluid optimization and source control are expedited.`,
      evidence: [
        {
          title: "Real-Time Telemetry Snapshot",
          details: [
            { label: "Shock Index", val: alert.vitals?.shockIndex || '1.34' },
            { label: "MAP Deficit", val: alert.vitals?.map || '65 mmHg' },
            { label: "Venous Lactate", val: alert.labs?.lactate || '3.8 mmol/L' }
          ],
          interpretation: "All metrics synchronized with hospital EHR and bedside telemetry."
        }
      ]
    };
  }
}
