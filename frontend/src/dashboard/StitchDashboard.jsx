import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import InboxView from './components/InboxView';
import ConversationWorkspace from './components/ConversationWorkspace';
import PatientContextPanel from './components/PatientContextPanel';
import OverrideModal from './components/OverrideModal';
import { INITIAL_ALERTS_DATA, createSimulatedAlert } from './data/alertsData';

export default function StitchDashboard({ onExitToLanding }) {
  // Alert dataset state
  const [alerts, setAlerts] = useState(INITIAL_ALERTS_DATA);
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  // Filter & Search
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPatientPanelOpen, setIsPatientPanelOpen] = useState(true);
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

  // Typing state for conversational simulation
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');

  // Selected Alert Object
  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || null;

  // Header Title & Subtitle
  const headerTitle = selectedAlert
    ? `${selectedAlert.patientId} (${selectedAlert.bed}) — Agent Dialogue`
    : "Clinical Inbox";
  const headerSubtitle = selectedAlert
    ? selectedAlert.headline
    : "Multi-Agent Sepsis Early Warning Surveillance";

  // Select Alert & mark read
  const handleSelectAlert = (alertId) => {
    setSelectedAlertId(alertId);
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  // Back to Inbox
  const handleBackToInbox = () => {
    setSelectedAlertId(null);
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
      ? `Dr. Sarah Al-Mansoor acknowledged this alert at ${nowStr}. Clinical oversight recorded in audit trail.`
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

    // Append Doctor message
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
    setTypingText(`${alert.agent} is reasoning over historical ICU records...`);

    // Formulate response using Stitch knowledgebase
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
    }, 900);
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
    <div className="bg-navy-950 text-slate-200 font-sans antialiased h-screen overflow-hidden flex select-none">
      {/* LEFT FIXED SIDEBAR */}
      <Sidebar
        isOpen={isSidebarOpen}
        activeAlertCount={alerts.filter(a => !a.isReviewed).length}
        onShowInbox={handleBackToInbox}
        onExitToLanding={onExitToLanding}
      />

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col bg-navy-950 overflow-hidden relative">
        {/* Top App Bar */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          title={headerTitle}
          subtitle={headerSubtitle}
        />

        {/* Content Wrapper */}
        <div className="flex-1 overflow-hidden relative">
          {selectedAlert ? (
            /* VIEW 2: Balanced 3-Pane Conversation Workspace */
            <div className="h-full flex overflow-hidden">
              <ConversationWorkspace
                alert={selectedAlert}
                messages={conversations[selectedAlert.id] || []}
                isTyping={isTyping}
                typingText={typingText}
                isPatientPanelOpen={isPatientPanelOpen}
                onTogglePatientPanel={() => setIsPatientPanelOpen(prev => !prev)}
                onBackToInbox={handleBackToInbox}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onOpenOverrideModal={() => setIsOverrideModalOpen(true)}
                onSendMessage={handleSendMessage}
              />

              {/* Collapsible Patient Context Panel */}
              <PatientContextPanel
                alert={selectedAlert}
                isOpen={isPatientPanelOpen}
                onClose={() => setIsPatientPanelOpen(false)}
              />
            </div>
          ) : (
            /* VIEW 1: Clinical Alert Inbox */
            <InboxView
              alerts={alerts}
              currentFilter={currentFilter}
              onSetFilter={setCurrentFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectAlert={handleSelectAlert}
              onSimulateAlert={handleSimulateAlert}
            />
          )}
        </div>
      </main>

      {/* Clinical Override / Disagreement Modal */}
      <OverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        onSubmit={handleRecordOverride}
      />
    </div>
  );
}

// Deterministic Response Engine from Stitch Export
function formulateMockResponse(alert, userQuery) {
  const q = userQuery.toLowerCase();
  const kb = alert.knowledgeBase || {};

  if (q.includes("why") || q.includes("flag") || q.includes("critical") || q.includes("high")) {
    return {
      text: kb["why"] || "The alert was triggered because the physiological trajectory diverged markedly from the ICU patient baseline, with multiple organ systems reflecting coordinated degradation."
    };
  } else if (q.includes("medication") || q.includes("timing") || q.includes("beta") || q.includes("vasopressor") || q.includes("pressor")) {
    return {
      text: kb["medication"] || kb["liver"] || "The Medication Context Agent correlated all administered doses over the past 8 hours to evaluate confounding. While active pharmacotherapy contributes subtle shifts, the primary driving force remains genuine tissue inflammation."
    };
  } else if (q.includes("parameter") || q.includes("contributed") || q.includes("most") || q.includes("vital")) {
    return {
      text: kb["parameter"] || "The most significant contributor is the rate of physiological velocity change (first derivative) rather than a single static threshold crossing."
    };
  } else if (q.includes("conflict") || q.includes("disagree") || q.includes("inconsistency")) {
    return {
      text: kb["conflicting"] || "We evaluated conflicting indicators across lab and ventilator telemetry. While oxygenation remains relatively preserved, peripheral perfusion and acid-base metrics are unmistakably concordant with sepsis."
    };
  } else if (q.includes("simple") || q.includes("plain") || q.includes("explain")) {
    return {
      text: kb["simpler"] || "In summary: The patient's vital signs and blood tests indicate the body is struggling against systemic infection. Early intervention now prevents sudden decompensation later."
    };
  } else {
    return {
      text: `Regarding your query: "${userQuery}"\n\nAegis evaluated this against ${alert.patientId}'s electronic flowsheet. The probability profile remains strongly indicative of sepsis progression. We recommend clinical bedside verification of volume status and reviewing pending microbiological isolates.`,
      evidence: [
        {
          title: "On-Demand Parameter Snapshot",
          details: [
            { label: "Observed Heart Rate", val: alert.vitals.hr },
            { label: "Current Blood Pressure", val: alert.vitals.bp },
            { label: "Serum Lactate", val: alert.labs.lactate }
          ],
          interpretation: "Values cross-referenced across laboratory and telemetry time-series."
        }
      ]
    };
  }
}

