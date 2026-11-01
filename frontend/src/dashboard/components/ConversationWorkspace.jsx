import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Activity,
  FlaskConical,
  Pill,
  Check,
  ShieldAlert,
  PanelRightClose,
  PanelRightOpen,
  Send,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  Bot,
  CheckCheck
} from 'lucide-react';

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
  isPatientPanelOpen,
  onTogglePatientPanel,
  onBackToInbox,
  onAcknowledgeAlert,
  onOpenOverrideModal,
  onSendMessage
}) {
  const [inputText, setInputText] = useState('');
  const [openEvidence, setOpenEvidence] = useState({});
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of messages
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
    setOpenEvidence(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const AgentIcon = AGENT_ICON_MAP[alert.agentKey] || Activity;

  return (
    <div className="flex-1 flex flex-col bg-navy-950 overflow-hidden relative">
      {/* Conversation Top Navigation Bar */}
      <div className="h-14 border-b border-navy-700 bg-navy-900/95 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToInbox}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-slate-100 text-xs font-medium border border-navy-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Clinical Inbox</span>
          </button>

          <div className="h-4 w-px bg-navy-700" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-clinical-teal-dim border border-clinical-teal/30 flex items-center justify-center text-clinical-teal">
              <AgentIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-display font-bold text-slate-100 flex items-center gap-2">
                <span>{alert.agent}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-navy-800 text-slate-300 border border-navy-700">
                  {alert.bed} • {alert.patientId}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {alert.agentSpecialty}
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Status & Direct Action Toolbar */}
        <div className="flex items-center gap-2.5">
          {alert.priority === 'CRITICAL' ? (
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-clinical-rose-dim text-clinical-rose border border-clinical-rose/30">
              CRITICAL PRIORITY
            </span>
          ) : alert.priority === 'HIGH' ? (
            <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded-full bg-clinical-amber-dim text-clinical-amber border border-clinical-amber/30">
              HIGH PRIORITY
            </span>
          ) : (
            <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded-full bg-navy-800 text-slate-300 border border-navy-700">
              MODERATE PRIORITY
            </span>
          )}

          <div className="h-4 w-px bg-navy-700" />

          {/* Acknowledge / Review Actions */}
          <button
            onClick={onAcknowledgeAlert}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              alert.isReviewed
                ? 'bg-clinical-teal-dim border border-clinical-teal/40 text-clinical-teal'
                : 'bg-navy-800 hover:bg-navy-700 border border-navy-700 text-slate-200'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-clinical-teal" />
            <span>{alert.isReviewed ? 'Alert Acknowledged' : 'Acknowledge Alert'}</span>
          </button>

          <button
            onClick={onOpenOverrideModal}
            className="px-3 py-1.5 rounded-lg bg-navy-800/80 hover:bg-navy-800 border border-navy-700 text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Clinical Override</span>
          </button>

          {/* Patient Context Panel Toggle */}
          <button
            onClick={onTogglePatientPanel}
            className="p-1.5 rounded-lg bg-navy-800 border border-navy-700 text-slate-400 hover:text-slate-200 transition-colors"
            title={isPatientPanelOpen ? "Collapse patient context panel" : "Expand patient context panel"}
          >
            {isPatientPanelOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Message History Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((m, idx) => {
          if (m.sender === "system") {
            return (
              <div key={idx} className="flex justify-center my-3 animate-message">
                <span className="px-3 py-1 rounded-full bg-navy-850 border border-navy-700 text-[11px] font-mono text-slate-400 flex items-center gap-1.5 shadow-sm">
                  <CheckCheck className="w-3.5 h-3.5 text-clinical-teal" />
                  {m.text}
                </span>
              </div>
            );
          }

          if (m.sender === "doctor") {
            return (
              <div key={idx} className="flex justify-end gap-3 animate-message">
                <div className="max-w-xl flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-400">{m.time}</span>
                    <span className="text-xs font-semibold text-slate-200">
                      Dr. Sarah Al-Mansoor
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl rounded-tr-sm bg-navy-800 border border-navy-700 text-slate-100 text-xs leading-relaxed shadow-sm font-sans whitespace-pre-wrap">
                    {m.text}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center font-display font-medium text-[11px] text-slate-300 shrink-0 mt-4">
                  DR
                </div>
              </div>
            );
          }

          // Agent Message
          const formattedText = m.text
            ? m.text.split('\n\n').map((paragraph, pIdx) => {
                const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                return (
                  <p key={pIdx} className="mb-2 last:mb-0">
                    {parts.map((part, partIdx) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                          <strong key={partIdx} className="text-slate-100 font-semibold">
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
              <div className="w-7 h-7 rounded-md bg-clinical-teal-dim border border-clinical-teal/40 flex items-center justify-center text-clinical-teal shrink-0 mt-4">
                <Bot className="w-4 h-4" />
              </div>
              <div className="max-w-2xl flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-200">{m.agentName}</span>
                  <span className="text-[10px] font-mono text-slate-400">{m.agentSpecialty}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[10px] font-mono text-slate-400">{m.time}</span>
                </div>
                <div className="p-4 rounded-2xl rounded-tl-sm bg-navy-900 border border-navy-700 text-slate-200 text-xs leading-relaxed shadow-sm font-sans">
                  {formattedText}

                  {/* Expandable Supporting Clinical Evidence Sections */}
                  {m.evidence && m.evidence.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-navy-700 space-y-2.5">
                      <div className="text-[11px] font-mono uppercase text-clinical-teal font-semibold tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Supporting Clinical Evidence (Expandable)</span>
                      </div>

                      {m.evidence.map((ev, eIdx) => {
                        const isExpanded = !!openEvidence[`${idx}-${eIdx}`];
                        return (
                          <div
                            key={eIdx}
                            className="bg-navy-950/90 rounded-lg border border-navy-700 overflow-hidden"
                          >
                            <button
                              onClick={() => toggleEvidence(idx, eIdx)}
                              className="w-full px-3 py-2 flex items-center justify-between text-left text-xs font-medium text-slate-200 hover:bg-navy-850/60 transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <ChevronRight
                                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                                    isExpanded ? 'rotate-90 text-clinical-teal' : ''
                                  }`}
                                />
                                <span>{ev.title}</span>
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Verified
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="p-3 pt-1 border-t border-navy-800 text-[11px] space-y-2 bg-navy-950">
                                <div className="space-y-1">
                                  {ev.details.map((d, dIdx) => (
                                    <div
                                      key={dIdx}
                                      className="flex items-start justify-between py-1 border-b border-navy-850"
                                    >
                                      <span className="text-slate-400 font-mono">
                                        {d.label}:
                                      </span>
                                      <span className="text-slate-200 font-medium text-right ml-4">
                                        {d.val}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="p-2 rounded bg-navy-900 border border-navy-800 text-slate-300 text-[10px] font-sans italic">
                                  <strong className="text-clinical-teal not-italic font-mono mr-1">
                                    Agent Interpretation:
                                  </strong>
                                  {ev.interpretation}
                                </div>
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
          <div className="px-6 py-2 text-xs font-mono text-slate-400 flex items-center gap-2 animate-message">
            <span className="w-1.5 h-1.5 rounded-full bg-clinical-teal animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-clinical-teal animate-bounce [animation-delay:0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-clinical-teal animate-bounce [animation-delay:0.3s]" />
            <span className="text-slate-400 ml-1">{typingText}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer Area */}
      <div className="p-4 border-t border-navy-700 bg-navy-900/95 shrink-0">
        {/* Quick Inquire Suggestion Chips */}
        {alert.chips && alert.chips.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2.5">
            {alert.chips.map((chip, cIdx) => (
              <button
                key={cIdx}
                onClick={() => handleChipClick(chip)}
                className="px-2.5 py-1 rounded-full bg-navy-800 hover:bg-navy-750 border border-navy-700 text-slate-300 hover:text-slate-100 text-[11px] whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-3 h-3 text-clinical-teal" />
                <span>{chip}</span>
              </button>
            ))}
          </div>
        )}

        {/* Composer Input Bar */}
        <div className="relative bg-navy-950 border border-navy-700 rounded-xl focus-within:border-clinical-teal focus-within:ring-1 focus-within:ring-clinical-teal transition-all p-2.5 flex items-end gap-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the agent to explain evidence, challenge assumptions, or probe medication timing... (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="w-full bg-transparent resize-none border-0 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:ring-0 leading-relaxed font-sans"
          />
          <div className="flex items-center gap-2 shrink-0 pb-0.5">
            <button
              onClick={handleSend}
              className="px-3 py-2 rounded-lg bg-clinical-teal hover:bg-teal-500 text-navy-950 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Inquire</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Clinical Responsibility Disclaimer */}
        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>
              Aegis-ICU assists clinical judgment. The physician remains responsible for diagnostic and therapeutic decisions.
            </span>
          </span>
          <span className="shrink-0 ml-2">Synthetic ICU Benchmark Data</span>
        </div>
      </div>
    </div>
  );
}

