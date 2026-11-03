import React, { useState } from 'react';
import {
  Activity,
  FlaskConical,
  Pill,
  ShieldCheck,
  Cpu,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare
} from 'lucide-react';

export default function AiAgentsView({ alert, onOpenConsultation }) {
  const [expandedAgent, setExpandedAgent] = useState('vitals');

  const agents = [
    {
      id: 'vitals',
      name: 'Vitals Intelligence Agent',
      shortName: 'Agent 1 • Vitals',
      role: 'Physiological Telemetry & Trend Decomposition',
      icon: Activity,
      color: '#059669',
      bgLight: '#ECFDF5',
      borderLight: '#A7F3D0',
      status: 'CRITICAL ALERT',
      statusType: 'critical',
      confidence: '94.2%',
      syncTime: '12 seconds ago',
      weight: '40%',
      summary: 'Detected sustained tachycardia (+34 bpm over 3h) with dropping MAP (65 mmHg) driving Shock Index to 1.34.',
      details: [
        { label: 'Observed Heart Rate', value: alert.vitals?.hr || '118 bpm', status: 'critical' },
        { label: 'Mean Arterial Pressure', value: alert.vitals?.map || 'MAP 65 mmHg', status: 'warning' },
        { label: 'Respiratory Rate', value: alert.vitals?.rr || '26 /min', status: 'warning' },
        { label: 'Temperature Spike', value: alert.vitals?.temp || '38.9 °C', status: 'critical' },
        { label: 'Calculated Shock Index', value: alert.vitals?.shockIndex || '1.34 (Elevated > 1.0)', status: 'critical' }
      ],
      findings: [
        'Rapid first-derivative acceleration in heart rate rules out benign diurnal variation.',
        'Dynamic arterial pulse-contour analysis indicates systemic vascular resistance collapse.',
        'Combined hemodynamic trajectory meets Sepsis-3 consensus criteria for acute hypoperfusion.'
      ]
    },
    {
      id: 'labs',
      name: 'Laboratory Intelligence Agent',
      shortName: 'Agent 2 • Labs',
      role: 'Biochemical Kinetics & Organ Failure Markers',
      icon: FlaskConical,
      color: '#2563EB',
      bgLight: '#EFF6FF',
      borderLight: '#BFDBFE',
      status: 'HIGH RISK',
      statusType: 'warning',
      confidence: '91.8%',
      syncTime: '4 minutes ago',
      weight: '35%',
      summary: 'Serial venous lactate elevation (3.8 mmol/L) accompanied by leukocytosis (16.4k) and acute kidney injury.',
      details: [
        { label: 'Serum Lactate', value: alert.labs?.lactate || '3.8 mmol/L', status: 'critical' },
        { label: 'Leukocytes (WBC)', value: alert.labs?.wbc || '16.4 × 10⁹/L', status: 'warning' },
        { label: 'Serum Creatinine', value: alert.labs?.creatinine || '1.8 mg/dL', status: 'warning' },
        { label: 'Platelet Count', value: alert.labs?.platelets || '138 × 10⁹/L', status: 'normal' }
      ],
      findings: [
        'Lactate clearance failure (+0.42 mmol/L/hr accumulation) confirms ongoing anaerobic cellular metabolism.',
        'Immature band forms (14%) indicate acute bone marrow stress response to severe systemic infection.',
        'Doubling of creatinine from baseline fulfills KDIGO Stage 2 Acute Kidney Injury.'
      ]
    },
    {
      id: 'meds',
      name: 'Medication Context Agent',
      shortName: 'Agent 3 • Pharmacology',
      role: 'Pharmacological Confounder & Interaction Modeling',
      icon: Pill,
      color: '#7C3AED',
      bgLight: '#F5F3FF',
      borderLight: '#DDD6FE',
      status: 'ACTIVE MONITORING',
      statusType: 'normal',
      confidence: '96.5%',
      syncTime: '1 minute ago',
      weight: '15%',
      summary: 'Evaluated vasopressor titration response. Verified Metoprolol hold to prevent masked decompensation.',
      details: [
        { label: 'Active Inotrope/Pressor', value: 'Norepinephrine 0.08 mcg/kg/min', status: 'warning' },
        { label: 'Antimicrobial Coverage', value: 'Vancomycin IV (07:45)', status: 'normal' },
        { label: 'Confounder Status', value: 'Metoprolol 50mg Held (MAP < 65)', status: 'normal' }
      ],
      findings: [
        'Vasopressor support initiated; titration curve indicates ongoing arterial vasodilation requiring escalation.',
        'Confirmed chronological clearance of previous oral beta-blocker; current heart rate is unmasked true tachycardia.',
        'No antagonistic drug-drug interactions detected across active ICU medication orders.'
      ]
    },
    {
      id: 'data-quality',
      name: 'Data Quality & Telemetry Agent',
      shortName: 'Agent 0 • Signal Integrity',
      role: 'Artifact Detection & Sensor Signal-to-Noise Ratio',
      icon: ShieldCheck,
      color: '#059669',
      bgLight: '#ECFDF5',
      borderLight: '#A7F3D0',
      status: 'OPTIMAL SIGNAL',
      statusType: 'normal',
      confidence: '99.4%',
      syncTime: 'Real-time',
      weight: '10%',
      summary: 'Bedside telemetry SNR verified at 99.4%. Excluded motion artifacts, ECG lead disconnects, and line flushes.',
      details: [
        { label: 'Telemetry SNR', value: '99.4% (Clinical Grade)', status: 'normal' },
        { label: 'Arterial Line Damping', value: 'Optimal (Snap-test verified)', status: 'normal' },
        { label: 'Sensor Dropout Rate', value: '0.00% over last 180 mins', status: 'normal' }
      ],
      findings: [
        'Pressure waveform dicrotic notch is crisp and physiologic; no catheter whip or over-damping artifacts.',
        'SpO2 plethysmograph pulsatile waveform strictly correlates with R-wave peak on telemetry Lead II.',
        'All laboratory inputs validated through HL7 FHIR laboratory interface with digital provenance signatures.'
      ]
    }
  ];

  return (
    <div className="custom-scrollbar flex-1 h-full overflow-y-auto bg-slate-50/50 p-6 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 border-[1.5px] border-emerald-200 text-emerald-600 flex items-center justify-center shadow-2xs shrink-0">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Multi-Agent System</h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-500">
                <span>Real-time autonomous clinical agents analyzing</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border-[1.5px] border-slate-200 font-mono font-bold text-slate-800">
                  {alert.patientId}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border-[1.5px] border-emerald-200 font-mono font-bold text-emerald-800">
                  {alert.bed}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={onOpenConsultation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 border-[1.5px] border-emerald-600 shadow-xs transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask AI About Agents</span>
            </button>
          </div>
        </div>

        {/* Multi-Agent Consensus Visualization Card */}
        <div
          className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900">Triage Orchestrator &amp; Multi-Agent Consensus</h2>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border-[1.5px] border-emerald-200 font-bold shadow-2xs">
              96.8% Model Agreement
            </span>
          </div>

          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            The Aegis Multi-Agent Architecture executes asynchronous Bayesian evidence fusion. Each agent independently analyzes high-frequency physiological streams before submitting findings to the central Orchestrator for clinical consensus.
          </p>

          {/* Consensus Weight Distribution Bar */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-slate-500">Ensemble Weight Breakdown:</span>
              <span className="font-bold text-slate-900">100% Calibrated</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 border-[1.5px] border-slate-200 overflow-hidden flex">
              <div style={{ width: '40%' }} className="bg-emerald-500 h-full" title="Vitals Agent (40%)" />
              <div style={{ width: '35%' }} className="bg-blue-600 h-full" title="Labs Agent (35%)" />
              <div style={{ width: '15%' }} className="bg-purple-600 h-full" title="Medication Agent (15%)" />
              <div style={{ width: '10%' }} className="bg-teal-600 h-full" title="Data Quality Agent (10%)" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/70 border-[1.5px] border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Vitals (40%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50/70 border-[1.5px] border-blue-200 px-2.5 py-1 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Labs (35%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50/70 border-[1.5px] border-purple-200 px-2.5 py-1 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>Meds (15%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-teal-700 bg-teal-50/70 border-[1.5px] border-teal-200 px-2.5 py-1 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                <span>Data Quality (10%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Structured Agent Cards List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Active Diagnostic Agents</h2>
            <span className="text-xs font-medium text-slate-400">Click to expand clinical reasoning</span>
          </div>

          {agents.map((agent) => {
            const Icon = agent.icon;
            const isExpanded = expandedAgent === agent.id;

            return (
              <div
                key={agent.id}
                className="bg-white rounded-3xl border-[1.5px] border-slate-200 overflow-hidden transition-all duration-200 shadow-xs hover:shadow-sm"
              >
                {/* Agent Header / Summary row */}
                <div
                  onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-[1.5px] shadow-2xs"
                      style={{ backgroundColor: agent.bgLight, borderColor: agent.borderLight, color: agent.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">{agent.name}</h3>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border-[1.5px] border-slate-200 font-semibold">
                          {agent.role}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 mt-1 truncate max-w-xl">{agent.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Status Badge */}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border-[1.5px] whitespace-nowrap shadow-2xs ${
                        agent.statusType === 'critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : agent.statusType === 'warning'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {agent.status}
                    </span>

                    {/* Confidence */}
                    <div className="hidden sm:block text-right">
                      <div className="text-[10px] font-mono text-slate-400 font-semibold">Confidence</div>
                      <div className="text-xs font-mono font-bold text-slate-900">{agent.confidence}</div>
                    </div>

                    <button className="w-8 h-8 rounded-full border-[1.5px] border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Details Area */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t-[1.5px] border-slate-200 bg-slate-50/60 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1.5 font-mono font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Last synchronization: {agent.syncTime}
                      </span>
                      <span className="font-mono font-semibold text-slate-700">Orchestrator Weight: {agent.weight}</span>
                    </div>

                    {/* Parameter Values Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {agent.details.map((detail, idx) => (
                        <div
                          key={idx}
                          className="bg-white border-[1.5px] border-slate-200 rounded-2xl p-3 shadow-2xs"
                        >
                          <div className="text-[10px] font-mono text-slate-500 truncate font-semibold">{detail.label}</div>
                          <div className={`text-xs font-bold font-mono mt-1 ${
                            detail.status === 'critical' ? 'text-rose-600' :
                            detail.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {detail.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Findings & Evidence */}
                    <div
                      className="bg-white border-[1.5px] border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs"
                    >
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                        Clinical Evidence &amp; Rationales:
                      </div>
                      <ul className="space-y-2 text-xs font-medium text-slate-700">
                        {agent.findings.map((finding, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
