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
  ShieldCheck,
  Zap,
  Droplet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  onBackToInbox,
  onAcknowledgeAlert,
  onOpenOverrideModal,
  onSendMessage
}) {
  const { user, isDoctor, isNurse } = useAuth();
  const [inputText, setInputText] = useState('');
  const [openEvidence, setOpenEvidence] = useState({ '0-0': true });
  const [activeTab, setActiveTab] = useState('agents'); // 'agents', 'vitals', 'labs', 'meds'
  const messagesEndRef = useRef(null);
  const waveformRef = useRef(null);

  // Auto-scroll message history
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Live Arterial Waveform Canvas (Soft Teal on Daylight Grid)
  useEffect(() => {
    if (activeTab !== 'vitals') return;
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

      // Soft Daylight Grid (#E2E8F0)
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 14) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Continuous arterial ECG / pulse wave in Soft Teal (#0D9488)
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#0D9488';
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
      offset = (offset + 1.2) % 300;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [activeTab]);

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

  // Nurse/Doctor STAT Escalation Action
  const handleStatEscalate = () => {
    const nurseName = user?.fullName || 'Bedside Nurse';
    onSendMessage(`[STAT ESCALATION BY ${nurseName.toUpperCase()}]: Ordered emergency STAT Sepsis Blood Panel (Serum Lactate, CBC with differential, Blood Cultures x 2).`);
  };

  const AgentIcon = AGENT_ICON_MAP[alert.agentKey] || Activity;

  return (
    <>
      {/* =========================================================================
          COLUMN 2: CENTER CHAT CONTAINER (Gemini-style floating white card)
          ========================================================================= */}
      <section className="flex-1 h-full p-3 overflow-hidden flex flex-col">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col h-full overflow-hidden">
          
          {/* =========================================================================
              TIER 1: PATIENT INFO & SOFT ACTION BUTTONS
              ========================================================================= */}
          <div className="px-6 py-3.5 border-b border-[#F1F5F9] flex items-center justify-between shrink-0 bg-white">
            {/* Left: Back icon button, Patient ID, Bed badge, Demographics & Dx */}
            <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
              <button
                onClick={onBackToInbox}
                className="bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] rounded-xl p-2 transition-colors cursor-pointer shrink-0 border border-[#E2E8F0]"
                title="Return to clinical inbox"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <span className="font-semibold text-base text-[#334155] whitespace-nowrap">
                  {alert.patientId || 'PT-9042'}
                </span>

                <span className="bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1] text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                  {alert.bed || 'Bed 04'} • MICU
                </span>

                <span className="text-xs text-[#64748B] truncate">
                  {alert.age || 68}yo {alert.gender || 'Male'} • ICU Day {alert.icuDay || 3} • Dx: {alert.admissionDiagnosis || 'Acute Hypoxemic Respiratory Failure'}
                </span>
              </div>
            </div>

            {/* Right Action Bar */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Sepsis Status Pill */}
              <span className="bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                CRITICAL SEPSIS (Sepsis-3 Met)
              </span>

              {/* Acknowledge Button */}
              <button
                onClick={onAcknowledgeAlert}
                className={`bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0D9488] border border-[#99F6E4] text-xs font-medium px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  alert.isReviewed ? 'font-semibold' : ''
                }`}
                title="Acknowledge alert and log oversight in audit trail"
              >
                <Check className={`w-3.5 h-3.5 ${alert.isReviewed ? 'text-[#0D9488]' : ''}`} />
                <span>{alert.isReviewed ? 'Acknowledged' : 'Acknowledge'}</span>
              </button>

              {/* STAT Labs Button */}
              <button
                onClick={handleStatEscalate}
                className="bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] text-xs font-medium px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Order STAT Sepsis Blood Panel"
              >
                <Zap className="w-3.5 h-3.5 text-[#0284C7]" />
                <span className="hidden sm:inline">STAT Labs</span>
              </button>

              {/* Override AI Button */}
              <button
                onClick={onOpenOverrideModal}
                className="bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] text-xs font-medium px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Record clinical disagreement or override"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#64748B]" />
                <span className="hidden sm:inline">Override AI</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              TIER 2: AIRY STAT VITALS STRIP
              ========================================================================= */}
          <div className="px-6 py-2 bg-[#F8FAFC]/60 border-b border-[#F1F5F9] flex items-center gap-4 overflow-x-auto text-xs font-mono shrink-0">
            {/* HR */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 flex items-center gap-1.5 shrink-0 shadow-2xs">
              <span className="text-[#64748B]">HR:</span>
              <span className="font-bold text-[#334155]">{alert.vitals?.hr || '118 bpm'}</span>
              <span className="bg-[#FFF1F2] text-[#E11D48] px-1.5 py-0.5 rounded text-[10px] font-sans font-medium">
                Tachycardia
              </span>
            </div>

            {/* NIBP / MAP */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 flex items-center gap-1.5 shrink-0 shadow-2xs">
              <span className="text-[#64748B]">NIBP:</span>
              <span className="font-bold text-[#334155]">{alert.vitals?.bp || '88/54 mmHg'}</span>
              <span className="bg-[#FFFBEB] text-[#D97706] px-1.5 py-0.5 rounded text-[10px] font-sans font-medium">
                {alert.vitals?.map || 'MAP 65'}
              </span>
            </div>

            {/* RR */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 flex items-center gap-1.5 shrink-0 shadow-2xs">
              <span className="text-[#64748B]">RR:</span>
              <span className="font-bold text-[#334155]">{alert.vitals?.rr || '26 /min'}</span>
              <span className="bg-[#FFFBEB] text-[#D97706] px-1.5 py-0.5 rounded text-[10px] font-sans font-medium">
                Tachypnea
              </span>
            </div>

            {/* Temp */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 flex items-center gap-1.5 shrink-0 shadow-2xs">
              <span className="text-[#64748B]">Temp:</span>
              <span className="font-bold text-[#334155]">{alert.vitals?.temp || '38.9 °C'}</span>
              <span className="bg-[#FFF1F2] text-[#E11D48] px-1.5 py-0.5 rounded text-[10px] font-sans font-medium">
                Febrile
              </span>
            </div>

            {/* Shock Index */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 flex items-center gap-1.5 shrink-0 shadow-2xs">
              <span className="text-[#64748B]">Shock Index:</span>
              <span className="text-[#E11D48] font-semibold">{alert.vitals?.shockIndex || '1.34'}</span>
            </div>

            {/* Serum Lactate */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 flex items-center gap-1.5 shrink-0 shadow-2xs">
              <span className="text-[#64748B]">Lactate:</span>
              <span className="font-bold text-[#334155]">{alert.labs?.lactate || '3.8 mmol/L'}</span>
            </div>

            {/* SpO2 */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 flex items-center gap-1.5 shrink-0 shadow-2xs">
              <span className="text-[#64748B]">SpO₂:</span>
              <span className="font-semibold text-[#334155]">{alert.vitals?.spo2 || '92% 4L NC'}</span>
            </div>
          </div>

          {/* =========================================================================
              3. SCROLLABLE CONVERSATION STREAM (Gemini-Inspired)
              ========================================================================= */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {messages.map((m, idx) => {
                // System Audit Messages
                if (m.sender === "system") {
                  return (
                    <div key={idx} className="flex justify-center my-2">
                      <span className="px-3.5 py-1 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-mono text-[#64748B] flex items-center gap-1.5 shadow-2xs">
                        <CheckCheck className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                        <span>{m.text}</span>
                      </span>
                    </div>
                  );
                }

                // Clinician Messages
                if (m.sender === "doctor") {
                  return (
                    <div key={idx} className="flex justify-end gap-2.5">
                      <div className="max-w-xl flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-[#64748B]">{m.time}</span>
                          <span className="text-xs font-semibold text-[#334155]">
                            {user?.fullName || 'Clinician'} ({user?.role || 'DOCTOR'})
                          </span>
                        </div>
                        <div className="p-3.5 rounded-2xl rounded-tr-xs border border-[#E2E8F0] bg-[#F1F5F9] text-[#334155] text-sm leading-relaxed font-sans whitespace-pre-wrap shadow-2xs">
                          {m.text}
                        </div>
                      </div>
                    </div>
                  );
                }

                // AI Agent Turn
                const evidenceList = (m.evidence && m.evidence.length > 0)
                  ? m.evidence
                  : (idx === 0 && alert.evidenceSections) ? alert.evidenceSections : [];

                return (
                  <div key={idx} className="space-y-3">
                    {/* Agent Turn Header */}
                    <div className="flex items-center justify-between">
                      {/* Left: Gemini-style sparkle icon in soft mint circle + Name & Subtitle */}
                      <div className="flex items-center gap-3">
                        <div className="bg-[#F0FDFA] text-[#0D9488] p-2 rounded-full border border-[#CCFBF1] flex items-center justify-center shrink-0 shadow-2xs">
                          <Sparkles className="w-4 h-4 text-[#0D9488]" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[#334155] leading-tight">
                            {m.agentName || alert.agent || 'Vitals Intelligence Agent'}
                          </div>
                          <div className="text-xs text-[#64748B] mt-0.5">
                            {m.agentSpecialty || alert.agentSpecialty || 'Physiological Telemetry & Trend Decomposition'}
                          </div>
                        </div>
                      </div>

                      {/* Right: Soft metadata pill */}
                      <div className="bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] text-[11px] font-mono px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-2xs">
                        42ms • 96.8% Sync
                      </div>
                    </div>

                    {/* Agent Synthesis Text */}
                    <div className="pl-11 text-sm text-[#475569] leading-relaxed">
                      {idx === 0 ? (
                        <p className="mb-2">
                          Continuous hemodynamic monitoring confirms decreased systemic vascular resistance. Compensated shock is identified with a Shock Index of 1.34 alongside sustained tachycardia (+34 bpm) and tachypnea (26/min).
                        </p>
                      ) : (
                        m.text && m.text.split('\n\n').map((paragraph, pIdx) => {
                          const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                          return (
                            <p key={pIdx} className="mb-2 last:mb-0">
                              {parts.map((part, partIdx) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return (
                                    <strong key={partIdx} className="font-semibold text-[#0D9488]">
                                      {part.slice(2, -2)}
                                    </strong>
                                  );
                                }
                                return part;
                              })}
                            </p>
                          );
                        })
                      )}
                    </div>

                    {/* Expandable Clinical Reasoning Accordions */}
                    {evidenceList.length > 0 && (
                      <div className="pl-11 space-y-2 pt-2">
                        {evidenceList.map((ev, eIdx) => {
                          const isExpanded = !!openEvidence[`${idx}-${eIdx}`];
                          return (
                            <div key={eIdx} className="overflow-hidden">
                              <div
                                onClick={() => toggleEvidence(idx, eIdx)}
                                className="bg-[#F8FAFC] hover:bg-[#F1F5F9]/70 border border-[#E2E8F0] rounded-2xl px-4 py-2.5 flex items-center justify-between cursor-pointer transition select-none shadow-2xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <ChevronRight
                                    className={`w-4 h-4 transition-transform text-[#64748B] ${
                                      isExpanded ? 'rotate-90 text-[#0D9488]' : ''
                                    }`}
                                  />
                                  <span className="text-xs font-medium text-[#334155]">{ev.title}</span>
                                </div>
                                <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
                                  VERIFIED
                                </span>
                              </div>

                              {isExpanded && (
                                <div className="mt-1.5 p-3.5 bg-white border border-[#E2E8F0] rounded-2xl text-xs space-y-2 text-[#475569] shadow-2xs">
                                  {ev.details && ev.details.length > 0 && (
                                    <div className="space-y-1">
                                      {ev.details.map((d, dIdx) => (
                                        <div
                                          key={dIdx}
                                          className="flex items-start justify-between py-1 border-b border-[#F1F5F9] last:border-0"
                                        >
                                          <span className="font-mono text-xs text-[#64748B]">{d.label}:</span>
                                          <span className="font-medium text-right text-[#334155] ml-4">{d.val}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {ev.interpretation && (
                                    <div className="p-2.5 rounded-xl border border-[#99F6E4] bg-[#F0FDFA] text-[#334155] text-xs leading-relaxed">
                                      <strong className="font-mono uppercase text-[10px] text-[#0D9488] block mb-0.5">
                                        Ensemble Clinical Interpretation:
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
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="pl-11 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#99F6E4] bg-[#F0FDFA] text-xs font-mono text-[#0D9488] w-fit shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-ping" />
                  <span>{typingText}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* =========================================================================
              4. GEMINI-STYLE FLOATING BOTTOM COMPOSER
              ========================================================================= */}
          <footer className="border-t border-[#F1F5F9] bg-white shrink-0">
            <div className="max-w-3xl mx-auto w-full px-6 pb-4 pt-2">
              {/* Quick Suggestion Chips */}
              <div className="flex gap-2 overflow-x-auto pb-2.5 scrollbar-none">
                <button
                  onClick={() => onSendMessage("Why did you flag this patient as Critical?")}
                  className="bg-[#F8FAFC] hover:bg-[#F0FDFA] text-[#475569] hover:text-[#0D9488] border border-[#E2E8F0] hover:border-[#CCFBF1] rounded-full px-3.5 py-1.5 text-xs transition cursor-pointer font-medium whitespace-nowrap shrink-0 shadow-2xs"
                >
                  ✦ Why did you flag this patient as Critical?
                </button>
                <button
                  onClick={() => onSendMessage("Could medication timing explain the tachycardia?")}
                  className="bg-[#F8FAFC] hover:bg-[#F0FDFA] text-[#475569] hover:text-[#0D9488] border border-[#E2E8F0] hover:border-[#CCFBF1] rounded-full px-3.5 py-1.5 text-xs transition cursor-pointer font-medium whitespace-nowrap shrink-0 shadow-2xs"
                >
                  ✦ Could medication timing explain the tachycardia?
                </button>
                <button
                  onClick={() => onSendMessage("What parameter contributed most to the sepsis score?")}
                  className="bg-[#F8FAFC] hover:bg-[#F0FDFA] text-[#475569] hover:text-[#0D9488] border border-[#E2E8F0] hover:border-[#CCFBF1] rounded-full px-3.5 py-1.5 text-xs transition cursor-pointer font-medium whitespace-nowrap shrink-0 shadow-2xs"
                >
                  ✦ What parameter contributed most?
                </button>
              </div>

              {/* Prompt Input Box */}
              <div className="bg-[#F8FAFC] focus-within:bg-white border border-[#E2E8F0] focus-within:border-[#99F6E4] focus-within:ring-4 focus-within:ring-[#F0FDFA] rounded-2xl p-2.5 pl-4 flex items-center gap-3 transition-all shadow-2xs">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the ensemble to challenge hypotheses, explain SHAP drivers, or verify medications..."
                  className="text-sm text-[#334155] placeholder:text-[#94A3B8] bg-transparent flex-1 focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className={`bg-[#E6FFFA] hover:bg-[#CCFBF1] text-[#0D9488] border border-[#99F6E4] px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                    !inputText.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Footer Disclaimer */}
              <div className="text-[11px] text-[#94A3B8] text-center mt-2 font-sans">
                Aegis-ICU Multi-Agent Decision Support • Clinicians retain full diagnostic responsibility.
              </div>
            </div>
          </footer>

        </div>
      </section>

      {/* =========================================================================
          COLUMN 3: RIGHT CONSENSUS DRAWER (Gemini-style floating white card)
          ========================================================================= */}
      <aside className="w-80 flex-shrink-0 h-full p-3 pl-0 flex flex-col">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs h-full flex flex-col overflow-hidden">
          
          {/* 1. Top Segmented Pill Bar */}
          <div className="p-3.5 border-b border-[#F1F5F9] bg-white shrink-0">
            <div className="bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] flex text-xs font-medium">
              {[
                { id: 'agents', label: 'Agents' },
                { id: 'vitals', label: 'Vitals' },
                { id: 'labs', label: 'Labs' },
                { id: 'meds', label: 'Meds' }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={
                      isActive
                        ? 'bg-white text-[#0D9488] shadow-2xs rounded-lg py-1.5 flex-1 text-center border border-[#E2E8F0]/60 cursor-pointer transition'
                        : 'text-[#64748B] hover:text-[#334155] py-1.5 flex-1 text-center cursor-pointer transition'
                    }
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Consensus Header */}
          <div className="px-4 py-2.5 bg-[#F8FAFC]/50 border-b border-[#F1F5F9] flex items-center justify-between shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Multi-Agent Consensus
            </span>
            <span className="text-[11px] font-mono text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
              4 Agents Synced (96.8%)
            </span>
          </div>

          {/* 3. Soft Agent Evidence Cards & Tabs Content */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-white">
            
            {/* TAB 1: MULTI-AGENT CONSENSUS OVERVIEW */}
            {activeTab === 'agents' && (
              <div className="space-y-3">
                {/* Card 1: Data Quality Agent */}
                <div className="bg-[#F8FAFC] rounded-2xl p-3.5 border border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#334155]">Data Quality Agent</span>
                    <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-mono px-2 py-0.5 rounded-full">
                      HIGH INTEGRITY
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
                    Continuous telemetry stream verified with zero sensor artifacts. Core vitals completeness: 100%.
                  </p>
                </div>

                {/* Card 2: Vitals Intelligence Agent */}
                <div className="bg-[#F8FAFC] rounded-2xl p-3.5 border border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#334155]">Vitals Intelligence Agent</span>
                    <span className="bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] text-[10px] font-mono px-2 py-0.5 rounded-full">
                      RISK: 72.5%
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
                    Compensated shock identified: Shock Index is 1.34 (threshold &gt; 0.70). Tachycardia (+34 bpm) and Tachypnea (26/min) signal systemic acidosis compensation.
                  </p>
                </div>

                {/* Card 3: Laboratory Agent */}
                <div className="bg-[#F8FAFC] rounded-2xl p-3.5 border border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#334155]">Laboratory Agent</span>
                    <span className="bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-[10px] font-mono px-2 py-0.5 rounded-full">
                      MODERATE HYPOXIA
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
                    Serum Lactate elevated at 3.8 mmol/L. Leukocytosis 16.4 × 10⁹/L. Multi-organ microvascular stress confirmed.
                  </p>
                </div>

                {/* Card 4: Skeptic Agent */}
                <div className="bg-[#F8FAFC] rounded-2xl p-3.5 border border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#334155]">Skeptic Agent</span>
                    <span className="bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD] text-[10px] font-mono px-2 py-0.5 rounded-full">
                      ONLINE
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
                    Evaluating beta-agonist administration 45m prior as a secondary contributor to heart rate elevation.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: DETAILED VITALS & WAVEFORM */}
            {activeTab === 'vitals' && (
              <div className="space-y-3">
                {/* Waveform Card */}
                <div className="p-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-[#334155] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
                      Continuous Arterial Wave
                    </span>
                    <span className="text-[#64748B] text-[10px]">100 Hz</span>
                  </div>
                  <div className="h-24 w-full rounded-xl bg-white border border-[#E2E8F0] relative overflow-hidden flex items-center shadow-2xs">
                    <canvas ref={waveformRef} className="w-full h-full" />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#64748B]">
                    <span>Calibration: Arterial Line A1</span>
                    <span>Damping Factor: 0.68</span>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
                    <span className="text-xs font-medium text-[#475569]">Heart Rate:</span>
                    <span className="font-mono font-bold text-xs text-rose-600">{alert.vitals?.hr || '118 bpm'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
                    <span className="text-xs font-medium text-[#475569]">NIBP &amp; MAP:</span>
                    <span className="font-mono font-bold text-xs text-amber-600">{alert.vitals?.bp || '88/54 mmHg'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
                    <span className="text-xs font-medium text-[#475569]">Respiratory Rate:</span>
                    <span className="font-mono font-bold text-xs text-amber-600">{alert.vitals?.rr || '26 /min'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
                    <span className="text-xs font-medium text-[#475569]">Temperature:</span>
                    <span className="font-mono font-bold text-xs text-rose-600">{alert.vitals?.temp || '38.9 °C'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LABORATORY PANEL */}
            {activeTab === 'labs' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200 bg-amber-50 shadow-2xs">
                    <div>
                      <div className="text-xs font-semibold text-[#334155]">Serum Lactate</div>
                      <div className="text-[10px] font-mono text-[#64748B]">Normal: 0.5–2.0 mmol/L</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-amber-700">{alert.labs?.lactate || '3.8 mmol/L'}</div>
                      <div className="text-[9px] font-mono uppercase text-amber-800 font-semibold">Elevated</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
                    <div>
                      <div className="text-xs font-semibold text-[#334155]">WBC Count</div>
                      <div className="text-[10px] font-mono text-[#64748B]">Normal: 4.5–11.0 × 10⁹/L</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-[#334155]">{alert.labs?.wbc || '16.4 × 10⁹/L'}</div>
                      <div className="text-[9px] font-mono uppercase text-amber-700 font-semibold">Leukocytosis</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
                    <div>
                      <div className="text-xs font-semibold text-[#334155]">Creatinine</div>
                      <div className="text-[10px] font-mono text-[#64748B]">Baseline: 0.9 mg/dL</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-rose-600">{alert.labs?.creatinine || '1.8 mg/dL'}</div>
                      <div className="text-[9px] font-mono uppercase text-rose-700 font-semibold">Stage 2 AKI</div>
                    </div>
                  </div>
                </div>

                {/* Repeat Protocol Button */}
                <button
                  onClick={handleStatEscalate}
                  className="w-full py-2 px-3 rounded-xl border border-[#99F6E4] bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0D9488] text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Order Repeat STAT Lactate</span>
                </button>
              </div>
            )}

            {/* TAB 4: MEDICATIONS & CONFOUNDER ANALYSIS */}
            {activeTab === 'meds' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2 shadow-2xs">
                  <div className="text-xs font-semibold text-[#334155] flex items-center justify-between">
                    <span>Active Regimens</span>
                    <span className="text-[10px] font-mono text-[#64748B]">3 Meds</span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2 rounded-xl border border-rose-200 bg-rose-50 shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#334155]">
                        <span>Norepinephrine</span>
                        <span className="text-rose-600 font-mono text-[11px]">0.08 mcg/kg/min</span>
                      </div>
                      <div className="text-[10px] text-rose-700 mt-0.5">Active vasopressor titration ongoing</div>
                    </div>

                    <div className="p-2 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#334155]">
                        <span>Vancomycin IV</span>
                        <span className="text-[#64748B] font-mono text-[11px]">1.25g in 250mL</span>
                      </div>
                      <div className="text-[10px] text-[#64748B] mt-0.5">Administered 07:45 (T-minus 4h)</div>
                    </div>

                    <div className="p-2 rounded-xl border border-amber-200 bg-amber-50 shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#334155]">
                        <span>Metoprolol</span>
                        <span className="text-amber-700 font-mono text-[11px]">50mg Oral</span>
                      </div>
                      <div className="text-[10px] text-amber-800 mt-0.5">Held appropriately (MAP &lt; 65 mmHg)</div>
                    </div>
                  </div>
                </div>

                {/* Pharmacological Confounder Check */}
                <div className="p-3 rounded-2xl border border-purple-200 bg-purple-50 text-purple-900 text-xs leading-relaxed space-y-1">
                  <div className="flex items-center justify-between font-mono font-bold text-[10px]">
                    <span className="flex items-center gap-1 text-purple-800">
                      <Pill className="w-3.5 h-3.5 text-purple-600" />
                      CONFOUNDER CHECK
                    </span>
                    <span className="px-1.5 py-0.5 rounded border border-purple-300 bg-purple-100 text-purple-800">
                      PASSED
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-950">
                    Skeptic Agent verified that tachycardia (+34 bpm) is not solely iatrogenic from vasopressors, given concomitant fever (38.9°C) and metabolic acidosis.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* 4. Bottom Safety Callout */}
          <div className="m-3 mt-0 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl shrink-0">
            <div className="text-[10px] font-semibold text-[#B45309] uppercase tracking-wide">
              MARTHA'S RULE CLINICAL SAFETY NOTICE
            </div>
            <div className="text-[11px] text-[#D97706] mt-0.5">
              Rapid response escalation available if clinical trajectory diverges.
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}
