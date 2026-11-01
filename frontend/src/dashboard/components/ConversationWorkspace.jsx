import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Activity,
  FlaskConical,
  Pill,
  Check,
  ShieldAlert,
  Send,
  Sparkles,
  Info,
  ChevronRight,
  Bot,
  CheckCheck,
  Heart,
  Gauge,
  Wind,
  Thermometer,
  Layers,
  AlertTriangle,
  FileText,
  UserCheck,
  Stethoscope,
  HeartPulse,
  TrendingUp,
  Clock,
  ShieldCheck,
  PanelRightClose,
  PanelRightOpen,
  Zap,
  Droplet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const AGENT_ICON_MAP = {
  vitals: Activity,
  lab: FlaskConical,
  meds: Pill,
};

export default function ConversationWorkspace({
  alert,
  messages,
  isTyping,
  typingText,
  isPatientPanelOpen = true,
  onTogglePatientPanel,
  onBackToInbox,
  onAcknowledgeAlert,
  onOpenOverrideModal,
  onSendMessage
}) {
  const { user, isDoctor, isNurse } = useAuth();
  const { isDark } = useTheme();
  const [inputText, setInputText] = useState('');
  const [openEvidence, setOpenEvidence] = useState({ '0-0': true }); // default first evidence open for clarity
  const [activeTab, setActiveTab] = useState('agents'); // 'agents', 'vitals', 'labs', 'meds'
  const messagesEndRef = useRef(null);
  const waveformRef = useRef(null);

  // Auto-scroll message history
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Live Arterial Waveform Canvas
  useEffect(() => {
    if (activeTab !== 'vitals' || !isPatientPanelOpen) return;
    const canvas = waveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let offset = 0;

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;

      // Subtle grid
      ctx.strokeStyle = isDark ? '#1A2438' : '#E2E8F0';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Continuous arterial ECG / pulse wave
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = isDark ? '#14B8A6' : '#0D9488';
      ctx.beginPath();

      for (let x = 0; x < w; x++) {
        const t = (x + offset) % 150;
        let y = mid;
        if (t > 25 && t < 40) y = mid - Math.sin(((t - 25) / 15) * Math.PI) * 4;
        else if (t >= 45 && t < 50) y = mid + (t - 45) * 1.5;
        else if (t >= 50 && t < 56) y = mid - 20 + (t - 50) * 1.2;
        else if (t >= 56 && t < 62) y = mid + 7;
        else if (t >= 75 && t < 100) y = mid - Math.sin(((t - 75) / 25) * Math.PI) * 5.5;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      offset = (offset + 1.8) % 360;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [activeTab, isPatientPanelOpen, isDark, alert.id]);

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

  const toggleEvidence = (msgIdx, evIdx) => {
    const key = `${msgIdx}-${evIdx}`;
    setOpenEvidence(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Nurse STAT Escalation Quick Action
  const handleStatEscalate = () => {
    const nurseName = user?.fullName || 'Bedside Nurse';
    onSendMessage(`[STAT ESCALATION BY ${nurseName.toUpperCase()}]: Ordered emergency STAT Sepsis Blood Panel (Serum Lactate, CBC with differential, Blood Cultures x 2).`);
  };

  const AgentIcon = AGENT_ICON_MAP[alert.agentKey] || Activity;

  return (
    <div className={`h-full w-full flex flex-col overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070A0F] text-slate-200' : 'bg-[#F4F6F9] text-slate-800'
    }`}>
      {/* =========================================================================
          1. STRUCTURED PATIENT COMMAND & TELEMETRY BANNER
          ========================================================================= */}
      <header className={`border-b shrink-0 z-10 transition-colors duration-200 ${
        isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        {/* Row 1: Patient Identity, Status Badge, & Clinical Actions */}
        <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back button & Patient Demographics */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={onBackToInbox}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0 shadow-xs ${
                isDark
                  ? 'bg-[#131B2A] hover:bg-[#1A2438] text-slate-300 hover:text-white border-[#1F293D]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
              }`}
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <span>Back to Inbox</span>
            </button>

            <div className={`h-6 w-px ${isDark ? 'bg-[#1F293D]' : 'bg-slate-200'} shrink-0`} />

            {/* Patient Header Block */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#131B2A] border-teal-500/30 text-teal-400' : 'bg-teal-50 border-teal-200 text-teal-700'
              }`}>
                <AgentIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-display font-bold text-base tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {alert.patientId}
                  </span>
                  <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    isDark
                      ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                      : 'bg-teal-100 text-teal-800 border-teal-200'
                  }`}>
                    {alert.bed} • MICU
                  </span>
                  <span className={`font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    • Age {alert.age} • {alert.gender} • ICU Day {alert.icuDay}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs truncate">
                  <span className={`font-mono text-[10px] font-semibold ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>
                    DIAGNOSIS:
                  </span>
                  <span className={`truncate font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {alert.admissionDiagnosis}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Risk Badge & Role-Tailored Actions */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            {/* Priority Badge */}
            {alert.priority === 'CRITICAL' ? (
              <span className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border flex items-center gap-2 ${
                isDark
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                CRITICAL SEPSIS (Sepsis-3 Met)
              </span>
            ) : (
              <span className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border flex items-center gap-1.5 ${
                isDark
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                HIGH PRIORITY
              </span>
            )}

            <div className={`h-6 w-px ${isDark ? 'bg-[#1F293D]' : 'bg-slate-200'} hidden sm:block`} />

            {/* Action 1: Acknowledge Alert */}
            <button
              onClick={onAcknowledgeAlert}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs border ${
                alert.isReviewed
                  ? (isDark ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' : 'bg-teal-100 text-teal-800 border-teal-300 font-semibold')
                  : (isDark ? 'bg-[#131B2A] hover:bg-[#1A2438] text-slate-200 border-[#1F293D]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200')
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${alert.isReviewed ? (isDark ? 'text-teal-400' : 'text-teal-700') : ''}`} />
              <span>{alert.isReviewed ? 'Acknowledged' : 'Acknowledge'}</span>
            </button>

            {/* Action 2: STAT Labs Escalation (Nurse & Doctor) */}
            <button
              onClick={handleStatEscalate}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs border ${
                isDark
                  ? 'bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border-teal-500/40'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
              }`}
              title="Escalate STAT Sepsis Blood Panel Order"
            >
              <Zap className="w-3.5 h-3.5 text-teal-500" />
              <span>STAT Labs</span>
            </button>

            {/* Action 3: Clinical Override (Doctor Only) */}
            {isDoctor ? (
              <button
                onClick={onOpenOverrideModal}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs border ${
                  isDark
                    ? 'bg-[#131B2A] hover:bg-rose-950/40 text-rose-300 border-[#1F293D] hover:border-rose-500/40'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                }`}
                title="Physician Authority AI Override"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>Override AI</span>
              </button>
            ) : (
              <button
                disabled
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 opacity-60 cursor-not-allowed border ${
                  isDark ? 'bg-[#0D121D] border-[#1F293D] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
                title="Clinical AI override is restricted to Attending Physicians"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Override (Doctor Only)</span>
              </button>
            )}

            {/* Toggle Right Panel */}
            <button
              onClick={() => onTogglePatientPanel(prev => !prev)}
              className={`p-1.5 rounded-lg border transition-all ${
                isDark
                  ? 'bg-[#131B2A] hover:bg-[#1A2438] border-[#1F293D] text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title={isPatientPanelOpen ? "Collapse Clinical Deck" : "Expand Clinical Deck"}
            >
              {isPatientPanelOpen ? (
                <PanelRightClose className={`w-4 h-4 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Instant Clinical Telemetry Strip (At-a-glance vitals & biomarkers) */}
        <div className={`px-5 py-2.5 border-t flex items-center gap-3 overflow-x-auto text-xs font-mono transition-colors duration-200 ${
          isDark ? 'bg-[#070A0F]/80 border-[#1F293D]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase shrink-0 text-slate-400">
            <Activity className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            <span>STAT Vitals:</span>
          </div>

          {/* HR */}
          <div className={`px-2.5 py-1 rounded border flex items-center gap-2 shrink-0 ${
            isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>HR:</span>
            <span className="font-bold text-rose-500">{alert.vitals?.hr || '118 bpm'}</span>
            <span className="text-[10px] text-rose-500 bg-rose-500/10 px-1 rounded font-sans">▲ Tachycardia</span>
          </div>

          {/* Blood Pressure & MAP */}
          <div className={`px-2.5 py-1 rounded border flex items-center gap-2 shrink-0 ${
            isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>NIBP:</span>
            <span className="font-bold text-amber-500">{alert.vitals?.bp || '88/54 mmHg'}</span>
            <span className={`text-[10px] px-1 rounded font-sans ${
              isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700'
            }`}>
              {alert.vitals?.map || 'MAP 65 mmHg'}
            </span>
          </div>

          {/* Resp Rate */}
          <div className={`px-2.5 py-1 rounded border flex items-center gap-2 shrink-0 ${
            isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>RR:</span>
            <span className="font-bold text-amber-500">{alert.vitals?.rr || '26 /min'}</span>
            <span className="text-[10px] text-amber-500">Tachypnea</span>
          </div>

          {/* Temp */}
          <div className={`px-2.5 py-1 rounded border flex items-center gap-2 shrink-0 ${
            isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Temp:</span>
            <span className="font-bold text-rose-500">{alert.vitals?.temp || '38.9 °C'}</span>
            <span className="text-[10px] text-rose-500">Febrile</span>
          </div>

          {/* Shock Index */}
          <div className={`px-2.5 py-1 rounded border flex items-center gap-2 shrink-0 ${
            isDark ? 'bg-[#0D121D] border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span className="font-bold">Shock Index:</span>
            <span className="font-extrabold text-rose-500">{alert.vitals?.shockIndex || '1.34'}</span>
            <span className="text-[9px] uppercase px-1 rounded bg-rose-500/20 font-sans font-bold">Critical &gt; 0.70</span>
          </div>

          {/* Serum Lactate */}
          <div className={`px-2.5 py-1 rounded border flex items-center gap-2 shrink-0 ${
            isDark ? 'bg-[#0D121D] border-amber-900/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <span className="font-bold">Lactate:</span>
            <span className="font-extrabold text-amber-500">{alert.labs?.lactate || '3.8 mmol/L'}</span>
            <span className="text-[9px] uppercase px-1 rounded bg-amber-500/20 font-sans font-bold">Elevated</span>
          </div>

          {/* SpO2 */}
          <div className={`px-2.5 py-1 rounded border flex items-center gap-2 shrink-0 ${
            isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>SpO₂:</span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{alert.vitals?.spo2 || '92% 4L NC'}</span>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. TWO-COLUMN BALANCED WORKSPACE (CHAT & CLINICAL DECK)
          ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT COLUMN: MULTI-AGENT CLINICAL DIALOGUE */}
        <section className={`flex-1 flex flex-col overflow-hidden relative border-r transition-colors duration-200 ${
          isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-white border-slate-200'
        }`}>
          {/* Active Model Council Bar */}
          <div className={`px-6 py-2.5 border-b flex items-center justify-between text-xs font-mono transition-colors duration-200 ${
            isDark ? 'bg-[#0D121D]/80 border-[#1F293D]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                {alert.agent}
              </span>
              <span className={`hidden md:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                • {alert.agentSpecialty}
              </span>
            </div>
            <div className={`flex items-center gap-2.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="text-emerald-500 font-semibold">Active Council</span>
              <span>• Latency: 42ms</span>
              <span className="hidden sm:inline">• Confidence: 96.8%</span>
            </div>
          </div>

          {/* Scrollable Conversation Stream */}
          <div className={`flex-1 overflow-y-auto p-6 space-y-5 transition-colors duration-200 ${
            isDark ? 'bg-[#070A0F]' : 'bg-slate-50/50'
          }`}>
            {messages.map((m, idx) => {
              // 1. System Audit Messages
              if (m.sender === "system") {
                return (
                  <div key={idx} className="flex justify-center my-3">
                    <span className={`px-3.5 py-1.5 rounded-full border text-[11px] font-mono flex items-center gap-2 shadow-xs ${
                      isDark
                        ? 'bg-[#0D121D] border-[#1F293D] text-slate-300'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      <CheckCheck className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-teal-600'} shrink-0`} />
                      <span>{m.text}</span>
                    </span>
                  </div>
                );
              }

              // 2. Clinician (Doctor or Nurse) Messages
              if (m.sender === "doctor") {
                return (
                  <div key={idx} className="flex justify-end gap-3 animate-message">
                    <div className="max-w-xl flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {m.time}
                        </span>
                        <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {user?.fullName || 'Clinician'} ({user?.role || 'DOCTOR'})
                        </span>
                      </div>
                      <div className={`p-4 rounded-2xl rounded-tr-xs border text-xs leading-relaxed shadow-xs font-sans whitespace-pre-wrap ${
                        isDark
                          ? 'bg-[#131B2A] border-[#1F293D] text-slate-100'
                          : 'bg-teal-50 border-teal-200 text-slate-900'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-display font-medium text-xs shrink-0 mt-3 shadow-xs ${
                      isDark
                        ? 'bg-[#1A2438] border-[#1F293D] text-teal-400'
                        : 'bg-white border-slate-200 text-teal-700'
                    }`}>
                      {isDoctor ? 'DR' : 'RN'}
                    </div>
                  </div>
                );
              }

              // 3. Multi-Agent Structured Findings & Reasoning
              const formattedText = m.text
                ? m.text.split('\n\n').map((paragraph, pIdx) => {
                    const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={pIdx} className="mb-2 last:mb-0">
                        {parts.map((part, partIdx) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                              <strong key={partIdx} className={`font-semibold ${
                                isDark ? 'text-teal-300' : 'text-teal-800'
                              }`}>
                                {part.slice(2, -2)}
                              </strong>
                            );
                          }
                          return part;
                        })}
                      </p>
                    );
                  })
                : null;

              return (
                <div key={idx} className="flex justify-start gap-3 animate-message">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-1 shadow-xs ${
                    isDark
                      ? 'bg-[#0D121D] border-teal-500/40 text-teal-400'
                      : 'bg-teal-50 border-teal-200 text-teal-700'
                  }`}>
                    <Bot className="w-5 h-5" />
                  </div>

                  <div className="max-w-2xl flex flex-col items-start w-full">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {m.agentName || alert.agent}
                      </span>
                      <span className={`text-[10px] font-mono hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        • {m.agentSpecialty || alert.agentSpecialty}
                      </span>
                      <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {m.time}
                      </span>
                    </div>

                    <div className={`w-full p-4.5 rounded-2xl rounded-tl-xs border text-xs leading-relaxed shadow-xs font-sans ${
                      isDark
                        ? 'bg-[#0D121D] border-[#1F293D] text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}>
                      {formattedText}

                      {/* Supporting Clinical Evidence Drawers */}
                      {m.evidence && m.evidence.length > 0 && (
                        <div className={`mt-4 pt-3.5 border-t space-y-2.5 ${isDark ? 'border-[#1F293D]' : 'border-slate-100'}`}>
                          <div className={`text-[10px] font-mono uppercase font-bold tracking-wider flex items-center gap-1.5 ${
                            isDark ? 'text-teal-400' : 'text-teal-700'
                          }`}>
                            <Layers className="w-3.5 h-3.5" />
                            <span>Supporting Physiological Evidence (Verified by Ensemble)</span>
                          </div>

                          {m.evidence.map((ev, eIdx) => {
                            const isExpanded = !!openEvidence[`${idx}-${eIdx}`];
                            return (
                              <div
                                key={eIdx}
                                className={`rounded-xl border overflow-hidden transition-all ${
                                  isDark
                                    ? 'bg-[#070A0F] border-[#1F293D]'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <button
                                  onClick={() => toggleEvidence(idx, eIdx)}
                                  className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs font-medium transition-colors ${
                                    isDark
                                      ? 'text-slate-200 hover:bg-[#131B2A]'
                                      : 'text-slate-800 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <ChevronRight
                                      className={`w-3.5 h-3.5 transition-transform ${
                                        isExpanded
                                          ? `rotate-90 ${isDark ? 'text-teal-400' : 'text-teal-600'}`
                                          : (isDark ? 'text-slate-400' : 'text-slate-500')
                                      }`}
                                    />
                                    <span className="font-semibold">{ev.title}</span>
                                  </span>
                                  <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${
                                    isDark
                                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    Verified
                                  </span>
                                </button>

                                {isExpanded && (
                                  <div className={`p-3.5 pt-1.5 border-t text-[11px] space-y-2.5 ${
                                    isDark ? 'border-[#1F293D] bg-[#070A0F]' : 'border-slate-200 bg-white'
                                  }`}>
                                    <div className="space-y-1.5">
                                      {ev.details.map((d, dIdx) => (
                                        <div
                                          key={dIdx}
                                          className={`flex items-start justify-between py-1.5 border-b ${
                                            isDark ? 'border-[#1F293D]/60' : 'border-slate-100'
                                          }`}
                                        >
                                          <span className={`font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {d.label}:
                                          </span>
                                          <span className={`font-medium text-right ml-4 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                                            {d.val}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    {ev.interpretation && (
                                      <div className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
                                        isDark
                                          ? 'bg-[#0D121D] border-teal-500/20 text-slate-300'
                                          : 'bg-teal-50/70 border-teal-200 text-slate-700'
                                      }`}>
                                        <strong className={`font-mono mr-1.5 uppercase text-[10px] block mb-0.5 ${
                                          isDark ? 'text-teal-400' : 'text-teal-700'
                                        }`}>
                                          Agent Clinical Interpretation:
                                        </strong>
                                        {ev.interpretation}
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

            {/* Live Agent Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2.5 px-4 py-2 text-xs font-mono text-slate-400">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                <span>{typingText}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Composer & Suggestions */}
          <footer className={`p-4 border-t shrink-0 transition-colors duration-200 ${
            isDark ? 'bg-[#0D121D]/95 border-[#1F293D]' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            {/* Suggestion Inquiry Chips */}
            {alert.chips && alert.chips.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2.5 scrollbar-none">
                {alert.chips.map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => onSendMessage(chip)}
                    className={`px-3 py-1 rounded-full border text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 shadow-2xs ${
                      isDark
                        ? 'bg-[#131B2A] hover:bg-[#1A2438] border-[#1F293D] hover:border-teal-500/40 text-slate-300 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 hover:border-teal-300 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className={`w-3 h-3 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                    <span>{chip}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input Box */}
            <div className={`border rounded-xl transition-all p-2.5 flex items-end gap-3 shadow-2xs ${
              isDark
                ? 'bg-[#070A0F] border-[#1F293D] focus-within:border-teal-500'
                : 'bg-slate-50 border-slate-200 focus-within:border-teal-600 focus-within:bg-white'
            }`}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the agent to challenge hypotheses, explain SHAP drivers, or verify medications... (Press Enter to send)"
                rows={2}
                className={`w-full bg-transparent resize-none border-0 text-xs focus:outline-none focus:ring-0 leading-relaxed font-sans ${
                  isDark ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`px-3.5 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                  inputText.trim()
                    ? (isDark ? 'bg-teal-400 hover:bg-teal-300 text-slate-950 cursor-pointer' : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer')
                    : (isDark ? 'bg-[#131B2A] text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed')
                }`}
              >
                <span>Send</span>
                <Send className="w-3 h-3" />
              </button>
            </div>

            {/* Subtle Clinical Responsibility Disclaimer */}
            <div className={`flex items-center justify-between mt-2 px-1 text-[10px] font-mono ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <span className="flex items-center gap-1.5">
                <Info className="w-3 h-3 shrink-0" />
                <span>
                  Aegis-ICU Multi-Agent Decision Support. Clinicians retain full diagnostic and therapeutic responsibility.
                </span>
              </span>
              <span className="shrink-0 ml-2">Authenticated: {user?.fullName || 'Clinician'}</span>
            </div>
          </footer>
        </section>

        {/* RIGHT COLUMN: PATIENT CLINICAL INTELLIGENCE DECK */}
        {isPatientPanelOpen && (
          <aside className={`w-[440px] border-l flex flex-col shrink-0 overflow-hidden transition-colors duration-200 ${
            isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200'
          }`}>
            {/* Tabs Header */}
            <div className={`p-2 border-b flex items-center gap-1 transition-colors duration-200 ${
              isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-slate-50 border-slate-200'
            }`}>
              {[
                { id: 'agents', label: 'Agents', icon: Bot },
                { id: 'vitals', label: 'Vitals', icon: Activity },
                { id: 'labs', label: 'Labs', icon: FlaskConical },
                { id: 'meds', label: 'Meds', icon: Pill },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? (isDark
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold shadow-xs'
                            : 'bg-white text-teal-800 border border-teal-200 font-bold shadow-xs')
                        : (isDark
                            ? 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2A]'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors duration-200 ${
              isDark ? 'bg-[#0D121D]' : 'bg-white'
            }`}>
              {/* =================================================================
                  TAB 1: MULTI-AGENT CONSENSUS & FINDINGS
                  ================================================================= */}
              {activeTab === 'agents' && (
                <div className="space-y-3.5">
                  <div className={`flex items-center justify-between text-xs font-mono ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      Multi-Agent Consensus
                    </span>
                    <span className={`font-semibold ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>
                      4 Agents Synchronized (96.8%)
                    </span>
                  </div>

                  {/* 1. Data Quality Agent Finding */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Data Quality Agent
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        isDark
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        HIGH_INTEGRITY
                      </span>
                    </div>
                    <p className={`text-[11px] font-sans leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Continuous telemetry stream verified with zero sensor artifacts. Core vitals completeness: 100%. Arterial line calibration intact.
                    </p>
                  </div>

                  {/* 2. Vitals Agent Finding */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        <Activity className="w-4 h-4 text-rose-500" />
                        Vitals Intelligence Agent
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                        isDark
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        RISK: 72.5%
                      </span>
                    </div>
                    <div className={`text-[11px] font-sans leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Compensated shock identified: Shock Index is <strong className="text-rose-500 font-mono font-bold">1.34</strong> (threshold &gt; 0.70). Tachycardia (+34 bpm) and Tachypnea (26/min) signal systemic acidosis compensation.
                    </div>
                  </div>

                  {/* 3. Labs Agent Finding with Martha's Rule Notice */}
                  <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        <FlaskConical className="w-4 h-4 text-amber-500" />
                        Laboratory Agent
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        isDark
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        MODERATE_HYPOXIA
                      </span>
                    </div>
                    <p className={`text-[11px] font-sans leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Serum Lactate elevated at 3.8 mmol/L. Leukocytosis 16.4 × 10⁹/L. Multi-organ microvascular stress confirmed.
                    </p>

                    {/* Martha's Rule Safety Callout Box */}
                    <div className={`p-3 rounded-lg border text-[11px] font-sans leading-relaxed ${
                      isDark
                        ? 'bg-[#121A28] border-amber-800/50 text-amber-300/90'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}>
                      <strong className={`font-mono uppercase block mb-1 font-bold ${
                        isDark ? 'text-amber-400' : 'text-amber-800'
                      }`}>
                        Martha's Rule Clinical Safety Notice:
                      </strong>
                      Biochemical cellular markers can lag 2 to 6 hours behind microvascular hypoperfusion. Normal or missing labs must never automatically rule out sepsis.
                    </div>
                  </div>

                  {/* 4. Skeptic Agent Finding */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        <ShieldAlert className="w-4 h-4 text-purple-500" />
                        Skeptic Agent (Confounder Analysis)
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        isDark
                          ? 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        STAND_ALERT
                      </span>
                    </div>
                    <p className={`text-[11px] font-sans leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Active Norepinephrine infusion evaluated as a potential chronotropic contributor. Concomitant metabolic distress (lactate 3.8) confirms real septic deterioration. Alert preservation strictly maintained.
                    </p>
                  </div>

                  {/* Transparent Disagreements Card */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#070A0F] border-teal-500/30' : 'bg-teal-50/50 border-teal-200 shadow-2xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-teal-400' : 'text-teal-800'}`}>
                        <AlertTriangle className="w-4 h-4 text-teal-500" />
                        Transparent Disagreement
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Resolved</span>
                    </div>
                    <div className={`text-[11px] font-sans leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <strong>VITALS_SKEPTIC_DISCORDANCE:</strong> Skeptic Agent flagged vasopressor titration as potential cause of tachycardia, while Vitals Agent indicated rapid hemodynamic collapse.
                    </div>
                    <div className={`text-[10px] font-sans italic p-2 rounded border ${
                      isDark ? 'bg-[#0D121D] border-[#1F293D] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      Resolution: Sepsis alert remains ACTIVE. Confounder context is transparently displayed without suppressing alert vigilance.
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================
                  TAB 2: VITALS & CONTINUOUS WAVEFORM TELEMETRY
                  ================================================================= */}
              {activeTab === 'vitals' && (
                <div className="space-y-4">
                  {/* Waveform Card */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={`font-semibold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Continuous Arterial Waveform (Lead II)
                      </span>
                      <span className={`text-[11px] ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>250 Hz</span>
                    </div>
                    <div className={`h-24 w-full rounded-lg border relative overflow-hidden flex items-center ${
                      isDark ? 'bg-[#05080E] border-[#1F293D]' : 'bg-white border-slate-200'
                    }`}>
                      <canvas ref={waveformRef} className="w-full h-full block" />
                    </div>
                  </div>

                  {/* Vitals Scorecard Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={`p-3 rounded-lg border ${
                      isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-slate-50 border-slate-200 shadow-2xs'
                    }`}>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Heart Rate</div>
                      <div className="text-lg font-mono font-bold text-rose-500 mt-0.5">{alert.vitals?.hr || '118 bpm'}</div>
                      <div className="text-[10px] text-rose-500 mt-1 font-sans">Sustained tachycardia (+34 bpm)</div>
                    </div>

                    <div className={`p-3 rounded-lg border ${
                      isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-slate-50 border-slate-200 shadow-2xs'
                    }`}>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Blood Pressure</div>
                      <div className="text-lg font-mono font-bold text-amber-500 mt-0.5">{alert.vitals?.bp || '88/54'}</div>
                      <div className="text-[10px] text-amber-500 mt-1 font-sans">{alert.vitals?.map || 'MAP 65 mmHg'}</div>
                    </div>

                    <div className={`p-3 rounded-lg border ${
                      isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-slate-50 border-slate-200 shadow-2xs'
                    }`}>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Respiratory Rate</div>
                      <div className="text-lg font-mono font-bold text-amber-500 mt-0.5">{alert.vitals?.rr || '26 /min'}</div>
                      <div className="text-[10px] text-amber-500 mt-1 font-sans">Tachypnea compensatory</div>
                    </div>

                    <div className={`p-3 rounded-lg border ${
                      isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-slate-50 border-slate-200 shadow-2xs'
                    }`}>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Core Temperature</div>
                      <div className="text-lg font-mono font-bold text-rose-500 mt-0.5">{alert.vitals?.temp || '38.9 °C'}</div>
                      <div className="text-[10px] text-rose-500 mt-1 font-sans">Febrile spike</div>
                    </div>
                  </div>

                  {/* Shock Index Explanation Card */}
                  <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                    isDark ? 'bg-[#070A0F] border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span>Shock Index: HR / SBP</span>
                      <span className="text-rose-500 font-extrabold text-sm">{alert.vitals?.shockIndex || '1.34'}</span>
                    </div>
                    <p className="text-[11px] font-sans leading-relaxed">
                      Shock Index &gt; 1.0 indicates severe occult hypoperfusion and high mortality risk in critical care sepsis patients.
                    </p>
                  </div>
                </div>
              )}

              {/* =================================================================
                  TAB 3: STAT BLOOD PANEL & LAB FINDINGS
                  ================================================================= */}
              {activeTab === 'labs' && (
                <div className="space-y-4">
                  <div className={`p-3.5 rounded-xl border space-y-3 ${
                    isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}>
                    <div className={`flex items-center justify-between text-xs font-mono ${
                      isDark ? 'text-slate-300' : 'text-slate-800'
                    }`}>
                      <span className="font-semibold">STAT Blood Panel</span>
                      <span className="text-amber-500 font-semibold">Drawn 42 mins ago</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Lactate */}
                      <div className={`flex items-center justify-between p-2 rounded border ${
                        isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <div>
                          <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Serum Lactate</div>
                          <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Normal: 0.5–2.0 mmol/L</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-amber-500 text-sm">3.8 mmol/L</div>
                          <div className="text-[9px] font-mono text-amber-500 font-bold uppercase">CRITICAL</div>
                        </div>
                      </div>

                      {/* WBC */}
                      <div className={`flex items-center justify-between p-2 rounded border ${
                        isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <div>
                          <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>White Blood Cells (WBC)</div>
                          <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Normal: 4.5–11.0 × 10⁹/L</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>16.4 × 10⁹/L</div>
                          <div className="text-[9px] font-mono text-amber-500 uppercase font-semibold">Elevated (Leukocytosis)</div>
                        </div>
                      </div>

                      {/* Creatinine */}
                      <div className={`flex items-center justify-between p-2 rounded border ${
                        isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <div>
                          <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Serum Creatinine</div>
                          <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Baseline: 0.9 mg/dL</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-rose-500 text-sm">1.8 mg/dL</div>
                          <div className="text-[9px] font-mono text-rose-500 uppercase font-semibold">Stage 2 AKI</div>
                        </div>
                      </div>

                      {/* Platelets */}
                      <div className={`flex items-center justify-between p-2 rounded border ${
                        isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <div>
                          <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Platelets</div>
                          <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Normal: 150–450 × 10⁹/L</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>138 × 10⁹/L</div>
                          <div className={`text-[9px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mild Thrombocytopenia</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Martha's Rule Notice Reminder */}
                  <div className={`p-3 rounded-lg border text-[11px] font-sans leading-relaxed ${
                    isDark ? 'bg-[#121A28] border-amber-800/50 text-amber-300/90' : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    <strong className="font-mono uppercase block mb-1">Martha's Rule Safety Protocol:</strong>
                    Biochemical markers lag 2–6 hours behind hypoperfusion. Normal or missing labs must never automatically rule out sepsis.
                  </div>

                  <button
                    onClick={handleStatEscalate}
                    className={`w-full py-2 px-3 rounded-lg border text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
                      isDark
                        ? 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border-teal-500/40'
                        : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Order Repeat STAT Lactate Protocol</span>
                  </button>
                </div>
              )}

              {/* =================================================================
                  TAB 4: ACTIVE MEDICATIONS & CONFOUNDER ANALYSIS
                  ================================================================= */}
              {activeTab === 'meds' && (
                <div className="space-y-4">
                  <div className={`p-3.5 rounded-xl border space-y-3 ${
                    isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}>
                    <div className={`flex items-center justify-between text-xs font-mono ${
                      isDark ? 'text-slate-300' : 'text-slate-800'
                    }`}>
                      <span className="font-semibold">Active Medications &amp; Infusions</span>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>3 Regimens</span>
                    </div>

                    <div className="space-y-2">
                      <div className={`p-2.5 rounded-lg border ${
                        isDark ? 'bg-[#0D121D] border-rose-900/40' : 'bg-rose-50 border-rose-200 shadow-2xs'
                      }`}>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>Norepinephrine (Levophed)</span>
                          <span className="text-rose-500 font-mono">0.08 mcg/kg/min</span>
                        </div>
                        <div className="text-[10px] text-rose-500 font-sans mt-0.5">Active continuous vasopressor titration ongoing</div>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${
                        isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>Vancomycin IV</span>
                          <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>1.25g in 250mL</span>
                        </div>
                        <div className={`text-[10px] font-sans mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Administered 07:45 (T-minus 4h); cultures pending
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${
                        isDark ? 'bg-[#0D121D] border-amber-900/40' : 'bg-amber-50 border-amber-200 shadow-2xs'
                      }`}>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>Metoprolol (Beta-Blocker)</span>
                          <span className="text-amber-500 font-mono">50mg Oral</span>
                        </div>
                        <div className="text-[10px] text-amber-500 font-sans mt-0.5">Held appropriately due to MAP &lt; 65 mmHg</div>
                      </div>
                    </div>
                  </div>

                  {/* Confounder Analysis Card */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#070A0F] border-purple-900/40 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-purple-500" />
                        Pharmacological Confounder Check
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        isDark ? 'bg-purple-950/60 border-purple-800/60' : 'bg-purple-100 border-purple-300'
                      }`}>
                        PASSED
                      </span>
                    </div>
                    <p className="text-[11px] font-sans leading-relaxed">
                      Skeptic Agent verified that tachycardia (+34 bpm) is not solely iatrogenic from vasopressors, given concomitant fever (38.9°C) and metabolic acidosis (lactate 3.8 mmol/L).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
