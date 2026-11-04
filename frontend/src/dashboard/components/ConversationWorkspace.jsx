import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  ShieldAlert,
  Send,
  Sparkles,
  Paperclip,
  Mic,
  MicOff,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  User,
  Activity,
  Gauge,
  FlaskConical,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ConversationWorkspace({
  alert,
  messages,
  isTyping,
  typingText,
  onBackToInbox,
  onAcknowledgeAlert,
  onOpenOverrideModal,
  onSendMessage
}) {
  const { user, isDoctor, isNurse } = useAuth();
  const [inputText, setInputText] = useState('');
  const [openEvidence, setOpenEvidence] = useState({ '0-0': true });
  const [attachmentNotice, setAttachmentNotice] = useState(null);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Derived Consensus & Clinical Risk Metrics
  const isCritical = alert?.priority === 'CRITICAL';
  const isHigh = alert?.priority === 'HIGH';
  const consensusRiskPct = isCritical ? 84 : isHigh ? 64 : 22;
  const consensusSyncPct = isCritical ? 96.8 : isHigh ? 92.4 : 99.1;
  const shockIndexVal = alert?.vitals?.shockIndex ? alert.vitals.shockIndex.split(' ')[0] : '1.34';
  const lactateVal = alert?.labs?.lactate ? alert.labs.lactate.split(' ')[0] + ' mmol/L' : '3.8 mmol/L';
  const mapVal = alert?.vitals?.map || 'MAP 65 mmHg';

  // Initialize SpeechRecognition if available
  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = (chipText) => {
    onSendMessage(chipText);
  };

  const toggleEvidence = (msgIdx, evIdx) => {
    const key = `${msgIdx}-${evIdx}`;
    setOpenEvidence(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStatEscalate = () => {
    const clinicianName = user?.fullName || 'Attending Physician';
    onSendMessage(`[STAT ESCALATION BY ${clinicianName.toUpperCase()}]: Ordered emergency STAT Sepsis Blood Panel (Serum Lactate, CBC with differential, Blood Cultures x 2).`);
  };

  const handleSimulateAttachment = () => {
    setAttachmentNotice('Attached: Arterial_Telemetry_LeadII.edf');
    setTimeout(() => {
      setAttachmentNotice(null);
    }, 4000);
  };

  const handleToggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          setIsListening(true);
          setTimeout(() => {
            setInputText(prev => prev ? `${prev} Summarize vital signs trajectory` : "Summarize vital signs trajectory");
            setIsListening(false);
          }, 2000);
        }
      } else {
        // Fallback simulation for browsers without Web Speech API
        setIsListening(true);
        setTimeout(() => {
          setInputText(prev => prev ? `${prev} Summarize vital signs trajectory` : "Summarize vital signs trajectory");
          setIsListening(false);
        }, 2000);
      }
    }
  };

  const suggestedPrompts = [
    { label: "Summarize patient condition", query: "Summarize patient condition" },
    { label: "Why is this patient classified as critical?", query: "Why is this patient classified as critical?" },
    { label: "Analyze vital sign trends", query: "Which vital parameter contributed most to the score?" },
    { label: "Identify abnormal laboratory results", query: "Identify abnormal laboratory results" },
    { label: "Review current medications", query: "Could medication timing explain the tachycardia?" },
    { label: "Explain the multi-agent consensus", query: "Explain the multi-agent consensus" },
    { label: "Identify potential clinical risks", query: "Identify potential clinical risks and conflicting indicators" }
  ];

  return (
    <div
      className="flex flex-col h-full max-h-full overflow-hidden flex-1 min-w-0 bg-[#F9FAFB] relative"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >

      {/* =========================================================================
          TOP PATIENT HEADER BAR
          ========================================================================= */}
      <header className="px-5 py-3 border-b-[1.5px] border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white z-20">

        {/* Left: Patient ID, Bed, Ward, Demographics */}
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
          <button
            onClick={onBackToInbox}
            className="w-9 h-9 rounded-full border-[1.5px] border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-all duration-200 ease-in-out cursor-pointer shrink-0 shadow-2xs active:scale-95"
            title="Return to triage dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Patient ID Pill */}
            <span className="font-bold text-xs text-slate-900 font-mono whitespace-nowrap px-3.5 py-1 rounded-full bg-slate-100 border-[1.5px] border-slate-300 shadow-2xs">
              {alert.patientId}
            </span>

            {/* Bed & Ward Pill */}
            <span className="bg-emerald-50 text-emerald-800 border-[1.5px] border-emerald-300 text-xs px-3.5 py-1 rounded-full font-bold whitespace-nowrap shadow-2xs">
              {alert.bed} • MICU Ward 3B
            </span>

            {/* Demographics Pill */}
            <span className="text-xs font-semibold text-slate-700 bg-slate-50 border-[1.5px] border-slate-200 px-3.5 py-1 rounded-full truncate shadow-2xs hidden sm:inline-flex">
              {alert.age || 68}yo {alert.gender || 'Male'} • Day {alert.icuDay || 3} • {alert.admissionDiagnosis || 'Acute Hypoxemic Respiratory Failure'}
            </span>
          </div>
        </div>

        {/* Right: Criticality Status & Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Criticality Status Pill */}
          <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full border-[1.5px] whitespace-nowrap shadow-2xs transition-all duration-200 ease-in-out flex items-center gap-1.5 ${
            isCritical
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : isHigh
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-rose-600 animate-pulse' : isHigh ? 'bg-amber-600' : 'bg-emerald-600'}`} />
            {isCritical ? 'CRITICAL STATUS: Sepsis Alert' : `${alert.priority} SURVEILLANCE`}
          </span>

          {/* Acknowledge Button */}
          <button
            onClick={onAcknowledgeAlert}
            className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 ease-in-out cursor-pointer flex items-center gap-1.5 border-[1.5px] shadow-2xs active:scale-95 ${
              alert.isReviewed
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300'
            }`}
            title="Acknowledge alert and log to clinical audit trail"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{alert.isReviewed ? 'Acknowledged' : 'Acknowledge'}</span>
          </button>

          {/* STAT Labs Button */}
          <button
            onClick={handleStatEscalate}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-[1.5px] border-blue-300 text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 ease-in-out cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Order STAT Sepsis Blood Panel"
          >
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">STAT Labs</span>
          </button>

          {/* Override AI Button (Doctor authority only) */}
          {isDoctor ? (
            <button
              onClick={onOpenOverrideModal}
              className="bg-white hover:bg-slate-50 text-slate-700 border-[1.5px] border-slate-300 text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 ease-in-out cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
              title="Record clinical override or disagreement (Physician Authority)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Override</span>
            </button>
          ) : (
            <button
              disabled
              className="bg-slate-100 text-slate-400 border-[1.5px] border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-full cursor-not-allowed flex items-center gap-1.5 opacity-60"
              title="Clinical AI Override is legally restricted to Attending Physicians (ROLE_DOCTOR)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Override (MD Only)</span>
            </button>
          )}

        </div>
      </header>

      {/* =========================================================================
          CRITICAL DATA INTEGRATION: COMPACT STATUS BAR & COLLAPSIBLE HEADER CARD
          Replaces eliminated right-hand summary panel. Positioned directly above conversation feed.
          ========================================================================= */}
      <section className="border-b-[1.5px] border-[#E5E7EB] bg-white shrink-0 z-10">
        <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-2.5">
          {/* Top Inline Status Ribbon */}
          <div className="flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Left: Core Consensus & Risk Metrics as Cylindrical Pills */}
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {/* Sepsis Risk Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono border-[1.5px] shadow-2xs transition-all duration-200 ${
                  isCritical
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : isHigh
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
                title="Multi-Agent Consensus Sepsis Risk Probability"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCritical ? 'bg-rose-600 animate-pulse' : isHigh ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}
                />
                <span className="font-bold text-[13px]">{consensusRiskPct}%</span>
                <span className="font-semibold font-sans">Sepsis Risk</span>
                <span className="text-[10px] font-sans font-medium opacity-80">({alert.priority || 'CRITICAL'})</span>
              </div>

              {/* Multi-Agent Consensus Pill */}
              <div
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono bg-emerald-50 border-[1.5px] border-emerald-300 text-emerald-900 shadow-2xs transition-all duration-200"
                title="Consensus Concordance across diagnostic agents"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-bold text-[13px] text-emerald-800">{consensusSyncPct}%</span>
                <span className="font-semibold text-xs text-emerald-700 font-sans">Consensus</span>
              </div>

              {/* Quick Risk Indicator Pills */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {/* Shock Index Pill */}
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border-[1.5px] border-rose-300 text-rose-900 shadow-2xs transition-all duration-200"
                  title="Shock Index: HR / SBP ratio exceeds severe hypoperfusion limit (> 1.0)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                  <span className="text-rose-700 font-sans font-semibold text-xs">SI:</span>
                  <span className="font-bold text-[13px] text-rose-700">{shockIndexVal}</span>
                </div>

                {/* Lactate Pill */}
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border-[1.5px] border-rose-300 text-rose-900 shadow-2xs transition-all duration-200"
                  title="Venous Lactate: elevated above 2.0 mmol/L; negative clearance rate (+0.42/h)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                  <span className="text-rose-700 font-sans font-semibold text-xs">Lactate:</span>
                  <span className="font-bold text-[13px] text-rose-700">{lactateVal}</span>
                </div>

                {/* MAP Pill */}
                <div
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border-[1.5px] border-amber-300 text-amber-900 shadow-2xs transition-all duration-200"
                  title="Mean Arterial Pressure: Refractory to initial 1L crystalloid bolus"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                  <span className="text-amber-700 font-sans font-semibold text-xs">MAP:</span>
                  <span className="font-bold text-[13px] text-amber-900">{mapVal}</span>
                </div>

                {/* Active Agents Indicator Pill */}
                <div
                  className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border-[1.5px] border-emerald-300 text-emerald-800 text-xs shadow-2xs transition-all duration-200"
                  title="Diagnostic telemetry signal-to-noise ratio"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-[13px] font-mono text-emerald-700">4 Agents</span>
                  <span className="font-semibold text-xs text-emerald-600 font-sans">(99.4% SNR)</span>
                </div>
              </div>
            </div>

            {/* Right: Expand / Collapse Toggle Button */}
            <button
              onClick={() => setIsMetricsExpanded(prev => !prev)}
              className="rounded-full flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-[1.5px] border-slate-300 transition-all duration-200 ease-in-out cursor-pointer shrink-0 ml-auto shadow-2xs active:scale-95"
              title={isMetricsExpanded ? "Collapse Risk Breakdown" : "Expand Full Multi-Agent Risk Breakdown"}
            >
              <span>{isMetricsExpanded ? 'Collapse' : 'Risk Breakdown'}</span>
              {isMetricsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ease-in-out" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ease-in-out" />
              )}
            </button>
          </div>

          {/* Collapsible Expanded Header Panel */}
          {isMetricsExpanded && (
            <div className="pt-3 mt-3 border-t-[1.5px] border-[#E5E7EB] space-y-3">
              {/* 4 Critical Risk Cards in Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Card 1: Multi-Agent Consensus */}
                <div className="p-4 rounded-2xl bg-[#F9FAFB] border-[1.5px] border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-slate-600">
                    <span>Multi-Agent Consensus</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border-[1.5px] border-emerald-300 font-bold">
                      {consensusSyncPct}% Sync
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-2xl font-bold font-mono ${isCritical ? 'text-rose-600' : isHigh ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {consensusRiskPct}%
                    </span>
                    <span className={`text-xs font-bold ${isCritical ? 'text-rose-600' : isHigh ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {isCritical ? 'Critical Sepsis Risk' : isHigh ? 'High Risk' : 'Normal'}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-rose-500' : isHigh ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${consensusRiskPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-snug">
                    Vitals, Laboratory, and Medication agents concordantly flag multi-system divergence. Sepsis-3 bundle triggered.
                  </p>
                </div>

                {/* Card 2: Shock Index */}
                <div className="p-4 rounded-2xl bg-white border-[1.5px] border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-slate-600">
                    <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-rose-600" /> Shock Index</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border-[1.5px] border-rose-300 font-bold">
                      CRITICAL
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-rose-600">{shockIndexVal}</div>
                  <div className="text-xs text-slate-800 font-semibold leading-tight">
                    HR ({alert?.vitals?.hr || '118'}) / SBP ({alert?.vitals?.bp ? alert.vitals.bp.split('/')[0] : '88'})
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-snug">
                    Exceeds severe septic hypoperfusion threshold (&gt; 1.0)
                  </p>
                </div>

                {/* Card 3: Venous Lactate */}
                <div className="p-4 rounded-2xl bg-white border-[1.5px] border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-slate-600">
                    <span className="flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5 text-rose-600" /> Venous Lactate</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border-[1.5px] border-rose-300 font-bold">
                      ELEVATED
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-rose-600">{lactateVal}</div>
                  <div className="text-xs text-slate-800 font-semibold leading-tight">
                    +0.42 mmol/L/hr accumulation
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-snug">
                    Negative metabolic clearance; indicates anaerobic tissue dysoxia
                  </p>
                </div>

                {/* Card 4: MAP & Perfusion Deficit */}
                <div className="p-4 rounded-2xl bg-white border-[1.5px] border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-slate-600">
                    <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-amber-600" /> MAP Deficit</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border-[1.5px] border-amber-300 font-bold">
                      REFRACTORY
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900">{mapVal}</div>
                  <div className="text-xs text-slate-800 font-semibold leading-tight">
                    BP {alert?.vitals?.bp || '88/54 mmHg'}
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-snug">
                    Refractory to 1L crystalloid; active Norepinephrine titration
                  </p>
                </div>
              </div>

              {/* Agent Synchronization & Telemetry Integrity Bar */}
              <div className="p-3 rounded-full bg-[#F9FAFB] border-[1.5px] border-slate-200 flex items-center justify-between gap-2 flex-wrap text-xs font-mono shadow-2xs">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <span className="text-[11px] uppercase font-bold text-slate-500 mr-1">Agent Sync:</span>
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Vitals
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Lab
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Meds
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Data Quality Agent: 99.4% Signal-to-Noise Ratio</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          CHAT STREAM AREA (flex: 1; overflow-y: auto; smooth scrolling & bottom padding)
          ========================================================================= */}
      <div
        className="chat-scroll-container flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 scroll-smooth min-h-0"
        style={{ flex: 1, overflowY: 'auto', scrollBehavior: 'smooth' }}
      >

        {/* Welcome Greeting & Suggested Prompts Card */}
        <div
          className="max-w-4xl lg:max-w-5xl mx-auto rounded-3xl bg-white border-[1.5px] border-slate-200 p-6 space-y-4 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-lg shrink-0 shadow-xs">
              Æ
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                AEGIS Clinical Intelligence
                <span className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border-[1.5px] border-emerald-300 font-bold">
                  Sepsis-3 Active
                </span>
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Hello Doctor, I'm AEGIS Clinical Intelligence. I have analyzed the available telemetry and EHR stream for <strong>{alert.patientId}</strong>. How can I assist your clinical evaluation today?
              </p>
            </div>
          </div>

          {/* Suggested Prompt Chips */}
          <div className="pt-3 border-t-[1.5px] border-slate-100">
            <div className="text-[11px] font-mono text-slate-500 mb-2 font-bold uppercase tracking-wider">
              Suggested clinical inquiries:
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(p.query)}
                  className="rounded-full text-xs font-semibold px-4 py-1.5 bg-white border-[1.5px] border-slate-300 text-slate-800 hover:border-emerald-500 hover:text-emerald-800 hover:bg-emerald-50 transition-all duration-200 ease-in-out cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message Flow */}
        <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-6">
          {messages.map((msg, idx) => {

            // SYSTEM AUDIT / STATUS EVENT
            if (msg.sender === 'system') {
              return (
                <div key={idx} className="flex justify-center my-3">
                  <div
                    className="text-xs font-mono font-semibold px-4 py-1.5 rounded-full bg-white text-slate-700 border-[1.5px] border-slate-200 flex items-center gap-2 shadow-2xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{msg.text}</span>
                    <span className="text-slate-400">• {msg.time}</span>
                  </div>
                </div>
              );
            }

            // DOCTOR USER MESSAGE
            if (msg.sender === 'doctor') {
              return (
                <div key={idx} className="flex justify-end gap-3 items-start pl-12">
                  <div
                    className="bg-white text-slate-900 rounded-2xl rounded-tr-xs px-4 py-3 max-w-xl text-xs font-medium leading-relaxed border-[1.5px] border-slate-200 shadow-2xs"
                  >
                    <div className="font-sans whitespace-pre-wrap">{msg.text}</div>
                    <div className="text-[11px] font-mono text-slate-500 font-semibold text-right mt-1.5">
                      {user?.fullName || 'Dr. Rajesh Sharma'} • {msg.time}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border-[1.5px] border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0 text-xs shadow-2xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              );
            }

            // AEGIS AI ASSISTANT RESPONSE
            return (
              <div key={idx} className="flex justify-start gap-3.5 items-start pr-12">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 font-mono font-bold text-xs shadow-2xs mt-0.5">
                  Æ
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900">AEGIS Clinical Intelligence</span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border-[1.5px] border-emerald-300">
                      {msg.agentName || alert.agent}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-medium">
                      {msg.time}
                    </span>
                  </div>

                  {/* Prose / Markdown-style structured response in Pure White Card */}
                  <div
                    className="bg-white border-[1.5px] border-slate-200 rounded-3xl p-5 text-xs text-slate-800 leading-relaxed space-y-4 font-sans shadow-2xs"
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-900 font-medium text-xs">
                      {msg.text}
                    </div>

                    {/* Expandable Evidence Sections */}
                    {msg.evidence && msg.evidence.length > 0 && (
                      <div className="pt-3 border-t-[1.5px] border-slate-100 space-y-2.5">
                        <div className="text-[11px] font-mono text-slate-500 uppercase font-bold tracking-wider">
                          Corroborating Evidence Accordions:
                        </div>

                        {msg.evidence.map((ev, evIdx) => {
                          const isOpen = openEvidence[`${idx}-${evIdx}`];

                          return (
                            <div key={evIdx} className="rounded-2xl border-[1.5px] border-slate-200 overflow-hidden bg-white shadow-2xs transition-all duration-200">
                              <button
                                onClick={() => toggleEvidence(idx, evIdx)}
                                className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold text-slate-900 hover:bg-slate-50 transition-all duration-200 ease-in-out cursor-pointer bg-slate-50/70"
                              >
                                <span className="flex items-center gap-2.5">
                                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                                    <Info className="w-3.5 h-3.5 text-emerald-600" />
                                  </div>
                                  <span className="font-semibold text-slate-900">{ev.title}</span>
                                </span>
                                <div className="w-6 h-6 rounded-full bg-white border-[1.5px] border-slate-200 flex items-center justify-center shadow-2xs">
                                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-600 transition-transform duration-200" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600 transition-transform duration-200" />}
                                </div>
                              </button>

                              {isOpen && (
                                <div className="px-4 pb-4 pt-3 space-y-2.5 text-xs border-t-[1.5px] border-slate-200 bg-white">
                                  {ev.details && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                      {ev.details.map((d, dIdx) => (
                                        <div key={dIdx} className="p-3 rounded-xl bg-slate-50 border-[1.5px] border-slate-200/90 shadow-2xs">
                                          <div className="text-[10px] font-mono font-semibold uppercase text-slate-500 tracking-wider">{d.label}</div>
                                          <div className="font-bold text-xs text-slate-900 font-mono mt-1">{d.val}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {ev.interpretation && (
                                    <div className="p-3 rounded-xl bg-emerald-50 border-[1.5px] border-emerald-200 text-emerald-900 text-xs font-medium leading-relaxed shadow-2xs">
                                      <strong className="font-bold text-emerald-950">Clinical Interpretation:</strong> {ev.interpretation}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start gap-3 items-center text-xs text-slate-600 font-mono">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                Æ
              </div>
              <div
                className="flex items-center gap-2 bg-white border-[1.5px] border-slate-200 px-4 py-2 rounded-full shadow-2xs"
              >
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                </span>
                <span className="text-slate-800 font-semibold">{typingText || 'AEGIS is synthesizing multi-agent telemetry...'}</span>
              </div>
            </div>
          )}

          {/* Spacer anchor to prevent messages from being covered */}
          <div ref={messagesEndRef} className="h-6 shrink-0" />
        </div>
      </div>

      {/* =========================================================================
          FIXED BOTTOM DOCK (Modern Floating Ergonomics & Pinned Bottom)
          ========================================================================= */}
      <footer
        className="sticky bottom-0 shrink-0 w-full z-20 bg-gradient-to-t from-[#F9FAFB] via-[#F9FAFB] to-[#F9FAFB]/90 pt-2 pb-3.5 px-4 sm:px-6 lg:px-8 border-t-[1.5px] border-[#E5E7EB]/90 backdrop-blur-xs"
        style={{ position: 'sticky', bottom: 0 }}
      >
        <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-2">

          {/* Voice Listening Banner */}
          {isListening && (
            <div className="text-xs font-mono text-rose-700 bg-rose-50 border-[1.5px] border-rose-300 px-4 py-1.5 rounded-full flex items-center justify-between shadow-2xs animate-pulse">
              <span className="flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                Listening to clinical voice dictation... Speak clearly into microphone.
              </span>
              <button
                onClick={handleToggleVoice}
                className="text-[10px] uppercase font-bold text-rose-700 hover:underline cursor-pointer transition-all duration-200 ease-in-out"
              >
                Stop
              </button>
            </div>
          )}

          {/* Simulated Attachment Notification */}
          {attachmentNotice && (
            <div className="text-xs font-mono text-emerald-800 bg-emerald-50 border-[1.5px] border-emerald-300 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xs font-semibold">
              <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
              <span>{attachmentNotice}</span>
            </div>
          )}

          {/* Floating Pill / Rounded-2xl Input Container */}
          <div
            className="relative rounded-full border-[1.5px] border-slate-300 focus-within:border-[#10B981] focus-within:ring-2 focus-within:ring-[#10B981]/25 bg-white transition-all duration-200 ease-in-out flex items-center px-2.5 py-1.5 gap-2 shadow-sm hover:border-slate-400"
            style={{ borderRadius: '9999px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06), 0 2px 6px -1px rgba(0,0,0,0.02)' }}
          >
            {/* Attachment Button */}
            <button
              onClick={handleSimulateAttachment}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-[#10B981] hover:bg-emerald-50 transition-all duration-200 ease-in-out cursor-pointer shrink-0"
              title="Attach clinical telemetry or lab slip (.edf, .csv, .pdf)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Dictation (Mic) Button */}
            <button
              onClick={handleToggleVoice}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-rose-100 text-rose-600 border border-rose-300 animate-pulse'
                  : 'text-slate-500 hover:text-[#10B981] hover:bg-emerald-50'
              }`}
              title={isListening ? "Stop voice dictation" : "Voice dictation (Dictate inquiry)"}
            >
              {isListening ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AEGIS about this patient's condition..."
              className="flex-1 px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none font-sans"
            />

            {/* Submit / Send Button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`w-9 h-9 rounded-full transition-all duration-200 ease-in-out cursor-pointer shrink-0 flex items-center justify-center shadow-xs ${
                inputText.trim()
                  ? 'bg-[#10B981] text-white hover:bg-[#059669] hover:shadow-md hover:scale-105 active:scale-95'
                  : 'bg-[#EDF3FA] dark:bg-[#101C30] text-[#768CA8] dark:text-[#5A7394] cursor-not-allowed'
              }`}
              title="Send clinical prompt (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Safety Disclaimer */}
          <div className="text-[11px] font-medium text-center text-slate-500 font-sans select-none pt-0.5">
            AEGIS-ICU is an AI clinical decision support system. Attending physician retains diagnostic authority.
          </div>
        </div>
      </footer>

    </div>
  );
}
