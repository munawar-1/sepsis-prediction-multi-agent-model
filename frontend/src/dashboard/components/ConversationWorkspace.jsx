import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Sparkles,
  Paperclip,
  Mic,
  MicOff,
  Info,
  ChevronDown,
  ChevronUp,
  User,
  ShieldCheck,
  LogOut,
  Stethoscope,
  UserCheck
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
  onOpenDischargeModal,
  onOpenReassignDoctor,
  onSendMessage
}) {
  const { user, isDoctor, isNurse } = useAuth();
  const [inputText, setInputText] = useState('');
  const [openEvidence, setOpenEvidence] = useState({ '0-0': true });
  const [attachmentNotice, setAttachmentNotice] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

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
      className="flex flex-col h-full max-h-full overflow-hidden flex-1 min-w-0 bg-[#F8FAFC] relative"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      {/* =========================================================================
          CHAT STREAM AREA - Starts directly with AI Clinical Intelligence Greeting
          (Top rectangular patient header & status breakdown completely removed)
          ========================================================================= */}
      <div
        className="chat-scroll-container flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 scroll-smooth min-h-0"
        style={{ flex: 1, overflowY: 'auto', scrollBehavior: 'smooth' }}
      >
        {/* Subtle Top Breadcrumb / Return to Dashboard Action */}
        <div className="max-w-4xl lg:max-w-5xl mx-auto flex items-center justify-between pb-1">
          <button
            onClick={onBackToInbox}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border-[1.5px] border-slate-200 shadow-2xs transition-all duration-200 cursor-pointer active:scale-95"
            title="Return to Dashboard Surveillance Queue"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-900 px-3 py-1 rounded-full bg-white border-[1.5px] border-slate-200 shadow-2xs">
              {alert.patientId}
            </span>
            <span className="text-xs font-mono font-bold text-teal-800 px-3 py-1 rounded-full bg-teal-50 border-[1.5px] border-teal-300 shadow-2xs">
              {alert.bed}
            </span>
            <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border-[1.5px] shadow-2xs uppercase ${
              alert.priority === 'CRITICAL'
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : alert.priority === 'HIGH'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-teal-50 text-teal-800 border-teal-300'
            }`}>
              {alert.priority}
            </span>

            {/* Attending Doctor Info & Reassignment (Nurse Action) */}
            {isNurse ? (
              <button
                type="button"
                onClick={onOpenReassignDoctor}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border-[1.5px] border-teal-300 shadow-2xs transition-all cursor-pointer"
                title="Change / Reassign Attending Physician"
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                <span>{alert.attendingDoctorName ? `Dr: ${alert.attendingDoctorName.split(',')[0].replace('Dr. ', '')}` : 'Assign MD'}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200">
                <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                <span>{alert.attendingDoctorName ? alert.attendingDoctorName.split(',')[0] : 'Attending MD'}</span>
              </span>
            )}

            {/* Discharge Patient Action (Nurse Only) */}
            {isNurse && (
              <button
                type="button"
                onClick={onOpenDischargeModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border-[1.5px] border-rose-300 shadow-2xs transition-all cursor-pointer active:scale-95"
                title="Discharge Patient & Free ICU Bed"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Discharge</span>
              </button>
            )}
          </div>
        </div>

        {/* Welcome Greeting & Suggested Prompts Card */}
        <div
          className="max-w-4xl lg:max-w-5xl mx-auto rounded-3xl bg-white border-[1.5px] border-slate-200 p-6 space-y-4 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-mono font-bold text-lg shrink-0 shadow-xs">
              Æ
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                AEGIS Clinical Intelligence
                <span className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-teal-50 text-teal-800 border-[1.5px] border-teal-300 font-bold">
                  Sepsis-3 Active
                </span>
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Hello Doctor, I'm AEGIS Clinical Intelligence. I have synthesized the real-time telemetry, laboratory results, and EHR stream for <strong>{alert.patientId}</strong> ({alert.bed} • {alert.admissionDiagnosis || 'MICU Ward 3B'}). How can I assist your clinical evaluation today?
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
                  className="rounded-full text-xs font-semibold px-4 py-1.5 bg-white border-[1.5px] border-slate-300 text-slate-800 hover:border-teal-500 hover:text-teal-900 hover:bg-teal-50 transition-all duration-200 ease-in-out cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
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
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
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
                  <div className="w-8 h-8 rounded-full bg-teal-50 border-[1.5px] border-teal-300 text-teal-700 flex items-center justify-center shrink-0 text-xs shadow-2xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              );
            }

            // AEGIS AI ASSISTANT RESPONSE
            return (
              <div key={idx} className="flex justify-start gap-3.5 items-start pr-12">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 font-mono font-bold text-xs shadow-2xs mt-0.5">
                  Æ
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900">AEGIS Clinical Intelligence</span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border-[1.5px] border-teal-300">
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
                                  <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                                    <Info className="w-3.5 h-3.5 text-teal-600" />
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
                                    <div className="p-3 rounded-xl bg-teal-50 border-[1.5px] border-teal-200 text-teal-900 text-xs font-medium leading-relaxed shadow-2xs">
                                      <strong className="font-bold text-teal-950">Clinical Interpretation:</strong> {ev.interpretation}
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
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                Æ
              </div>
              <div
                className="flex items-center gap-2 bg-white border-[1.5px] border-slate-200 px-4 py-2 rounded-full shadow-2xs"
              >
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
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
          FIXED BOTTOM DOCK (Modern Rounded Pill Input Ergonomics)
          ========================================================================= */}
      <footer
        className="sticky bottom-0 shrink-0 w-full z-20 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-[#F8FAFC]/90 pt-2 pb-3.5 px-4 sm:px-6 lg:px-8 border-t-[1.5px] border-slate-200/90 backdrop-blur-xs"
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
            <div className="text-xs font-mono text-teal-800 bg-teal-50 border-[1.5px] border-teal-300 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xs font-semibold">
              <Paperclip className="w-3.5 h-3.5 text-teal-600" />
              <span>{attachmentNotice}</span>
            </div>
          )}

          {/* Floating Pill / Fully Rounded Input Container */}
          <div
            className="relative rounded-full border-[1.5px] border-slate-300 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20 bg-white transition-all duration-200 ease-in-out flex items-center px-2.5 py-1.5 gap-2 shadow-sm hover:border-slate-400"
            style={{ borderRadius: '9999px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06), 0 2px 6px -1px rgba(0,0,0,0.02)' }}
          >
            {/* Attachment Button */}
            <button
              onClick={handleSimulateAttachment}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-all duration-200 ease-in-out cursor-pointer shrink-0"
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
                  : 'text-slate-500 hover:text-teal-600 hover:bg-teal-50'
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
                  ? 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-md hover:scale-105 active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
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
