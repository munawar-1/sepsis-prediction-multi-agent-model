import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  X,
  Activity,
  FlaskConical,
  Pill,
  ShieldCheck,
  Heart,
  Gauge,
  Wind,
  Thermometer,
  Zap,
  Radio
} from 'lucide-react';

export default function PatientContextPanel({
  alert,
  isOpen,
  onClose,
  activeTab = 'overview',
  onTabChange
}) {
  const { isDark } = useTheme();
  const [currentTab, setCurrentTab] = useState(activeTab);
  const waveformRef = useRef(null);

  // Sync external activeTab prop if provided
  useEffect(() => {
    if (activeTab) setCurrentTab(activeTab);
  }, [activeTab]);

  // Live Arterial Waveform Canvas for Vitals Tab
  useEffect(() => {
    if (!isOpen || currentTab !== 'vitals') return;
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

      // Soft Grid (#E5E7EB)
      ctx.strokeStyle = isDark ? '#1E2D44' : '#E5E7EB';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 20) {
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

      // Continuous pulse wave in Emerald (#10B981)
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#10B981';
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
      offset = (offset + 1.3) % 300;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isOpen, currentTab, isDark]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'vitals', label: 'Vitals', icon: Activity },
    { id: 'labs', label: 'Labs', icon: FlaskConical },
    { id: 'medications', label: 'Medications', icon: Pill }
  ];

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    if (onTabChange) onTabChange(tabId);
  };

  return (
    <aside
      className="w-80 sm:w-96 flex-shrink-0 h-full flex flex-col bg-white border-l border-[#E5E7EB] select-none z-10 transition-all duration-300"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)' }}
    >

      {/* Header */}
      <div className="p-3.5 border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-xs font-bold text-[#111827] font-mono tracking-tight">Clinical Context Panel</span>
          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5] font-semibold">
            {alert.patientId}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl border border-[#E5E7EB] text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
          title="Collapse context panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Row */}
      <div className="px-3 pt-2 pb-1 border-b border-[#E5E7EB] bg-[#F9FAFB] flex gap-1 shrink-0 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isActive
                  ? 'bg-white text-[#10B981] font-semibold border border-[#E5E7EB]'
                  : 'text-[#4B5563] hover:text-[#111827] hover:bg-white/60'
                }`}
              style={isActive ? { boxShadow: '0 1px 2px rgba(0,0,0,0.03)' } : {}}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#10B981]' : 'text-[#6B7280]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-[#111827] bg-white">

        {/* =========================================================================
            TAB 1: OVERVIEW
            ========================================================================= */}
        {currentTab === 'overview' && (
          <div className="space-y-4">

            {/* Multi-Agent Consensus Score */}
            <div
              className="bg-white rounded-2xl p-4 border border-[#E5E7EB] space-y-3"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#9CA3AF] font-semibold">Multi-Agent Consensus</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5] font-bold">
                  96.8% Sync
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[#DC2626]">84%</span>
                <span className="text-xs font-semibold text-[#DC2626]">Critical Sepsis Risk</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-[#F3F4F6] overflow-hidden">
                <div className="h-full bg-[#DC2626] rounded-full" style={{ width: '84%' }} />
              </div>

              <p className="text-[11px] text-[#4B5563] leading-relaxed">
                Vitals, Laboratory, and Medication agents concordantly flag multi-system divergence. Sepsis-3 bundle triggered.
              </p>
            </div>

            {/* Risk Indicators */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] font-semibold">
                Key Clinical Risk Indicators
              </span>

              <div className="space-y-2">
                <div
                  className="p-3 rounded-2xl bg-white border border-[#E5E7EB] flex items-start gap-2.5"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] mt-1 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[#111827]">Shock Index: 1.34</div>
                    <div className="text-[11px] text-[#4B5563]">HR (118) / SBP (88) exceeds severe hypoperfusion limit (&gt; 1.0)</div>
                  </div>
                </div>

                <div
                  className="p-3 rounded-2xl bg-white border border-[#E5E7EB] flex items-start gap-2.5"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] mt-1 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[#111827]">Venous Lactate: 3.8 mmol/L</div>
                    <div className="text-[11px] text-[#4B5563]">Elevated above 2.0 threshold; negative clearance rate (+0.42/h)</div>
                  </div>
                </div>

                <div
                  className="p-3 rounded-2xl bg-white border border-[#E5E7EB] flex items-start gap-2.5"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#D97706] mt-1 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[#111827]">Mean Arterial Pressure Deficit</div>
                    <div className="text-[11px] text-[#4B5563]">MAP 65 mmHg refractory to initial 1L crystalloid bolus</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Synchronization Status */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] font-semibold">
                Agent Sync Feed
              </span>

              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 font-mono text-[11px]"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#111827] flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Vitals Agent
                  </span>
                  <span className="text-[#9CA3AF]">12s ago (Active)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#111827] flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Laboratory Agent
                  </span>
                  <span className="text-[#9CA3AF]">4m ago (Active)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#111827] flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Medication Agent
                  </span>
                  <span className="text-[#9CA3AF]">1m ago (Active)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#111827] flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Data Quality Agent
                  </span>
                  <span className="text-[#059669] font-bold">99.4% SNR</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 2: VITALS
            ========================================================================= */}
        {currentTab === 'vitals' && (
          <div className="space-y-4">

            {/* Live Waveform Canvas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#4B5563]">
                <span className="flex items-center gap-1.5 text-[#059669] font-semibold">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Arterial Pulse Waveform
                </span>
                <span className="text-[#9CA3AF]">Real-time</span>
              </div>
              <div
                className="h-28 w-full rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] overflow-hidden"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <canvas ref={waveformRef} className="w-full h-full block" />
              </div>
            </div>

            {/* Compact Vital Cards (Pure White with Soft Shadows) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="text-[10px] font-mono text-[#9CA3AF] flex items-center gap-1">
                  <Heart className="w-3 h-3 text-[#DC2626]" /> Heart Rate
                </div>
                <div className="text-base font-bold font-mono text-[#DC2626]">{alert.vitals?.hr || '118 bpm'}</div>
                <div className="text-[10px] text-[#DC2626] font-medium">Tachycardia Alert</div>
              </div>

              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="text-[10px] font-mono text-[#9CA3AF] flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-[#D97706]" /> NIBP / MAP
                </div>
                <div className="text-base font-bold font-mono text-[#111827]">{alert.vitals?.bp || '88/54'}</div>
                <div className="text-[10px] text-[#D97706] font-medium">{alert.vitals?.map || 'MAP 65 mmHg'}</div>
              </div>

              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="text-[10px] font-mono text-[#9CA3AF] flex items-center gap-1">
                  <Wind className="w-3 h-3 text-[#D97706]" /> Respiratory Rate
                </div>
                <div className="text-base font-bold font-mono text-[#111827]">{alert.vitals?.rr || '26 /min'}</div>
                <div className="text-[10px] text-[#D97706] font-medium">Tachypneic</div>
              </div>

              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="text-[10px] font-mono text-[#9CA3AF] flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-[#DC2626]" /> Temperature
                </div>
                <div className="text-base font-bold font-mono text-[#DC2626]">{alert.vitals?.temp || '38.9 °C'}</div>
                <div className="text-[10px] text-[#DC2626] font-medium">Febrile Spike</div>
              </div>

              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="text-[10px] font-mono text-[#9CA3AF] flex items-center gap-1">
                  <Activity className="w-3 h-3 text-[#10B981]" /> SpO2 Oximetry
                </div>
                <div className="text-base font-bold font-mono text-[#111827]">{alert.vitals?.spo2 || '92% 4L NC'}</div>
                <div className="text-[10px] text-[#4B5563]">Hypoxemic target</div>
              </div>

              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="text-[10px] font-mono text-[#9CA3AF] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#DC2626]" /> Shock Index
                </div>
                <div className="text-base font-bold font-mono text-[#DC2626]">{alert.vitals?.shockIndex || '1.34'}</div>
                <div className="text-[10px] text-[#DC2626] font-medium">Critical (&gt; 1.0)</div>
              </div>
            </div>

            {/* 4h Trend Velocity Note */}
            <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#D1FAE5] text-[11px] text-[#059669] leading-relaxed">
              <strong>Velocity Trend:</strong> Heart rate climbed +34 bpm over 3h window with concurrent MAP drop from 82 to 65 mmHg despite crystalloid boluses.
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 3: LABS
            ========================================================================= */}
        {currentTab === 'labs' && (
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] font-semibold">
              Laboratory Findings &amp; Ref Ranges
            </span>

            <div className="space-y-2">
              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#111827]">Serum Lactate</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2] font-bold">
                    CRITICAL
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-[#DC2626]">{alert.labs?.lactate || '3.8 mmol/L'}</div>
                <div className="text-[10px] text-[#4B5563] flex justify-between">
                  <span>Ref: 0.5 – 2.0 mmol/L</span>
                  <span className="text-[#DC2626] font-medium">+0.42/h delta</span>
                </div>
              </div>

              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#111827]">Leukocytes (WBC)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7] font-bold">
                    ELEVATED
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-[#111827]">{alert.labs?.wbc || '16.4 × 10⁹/L'}</div>
                <div className="text-[10px] text-[#4B5563] flex justify-between">
                  <span>Ref: 4.5 – 11.0 × 10⁹/L</span>
                  <span>14% immature bands</span>
                </div>
              </div>

              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#111827]">Serum Creatinine</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7] font-bold">
                    AKI STAGE 2
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-[#111827]">{alert.labs?.creatinine || '1.8 mg/dL'}</div>
                <div className="text-[10px] text-[#4B5563] flex justify-between">
                  <span>Ref: 0.7 – 1.3 mg/dL</span>
                  <span className="text-[#D97706] font-medium">Doubled from 0.9</span>
                </div>
              </div>

              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#111827]">Platelets</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] font-bold">
                    BORDERLINE
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-[#111827]">{alert.labs?.platelets || '138 × 10⁹/L'}</div>
                <div className="text-[10px] text-[#4B5563] flex justify-between">
                  <span>Ref: 150 – 450 × 10⁹/L</span>
                  <span>Mild consumption</span>
                </div>
              </div>
            </div>

            <div
              className="p-3.5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] text-[11px] text-[#4B5563] space-y-1"
            >
              <div className="font-bold text-[#111827]">Acid-Base Equilibrium:</div>
              <div>Arterial pH 7.28 • Base Deficit -5.8 mEq/L • HCO3 18 mEq/L</div>
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 4: MEDICATIONS
            ========================================================================= */}
        {currentTab === 'medications' && (
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] font-semibold">
              Active ICU Pharmacotherapy
            </span>

            {/* Warning on Confounder */}
            <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] text-[11px] text-[#B45309] leading-relaxed">
              <strong className="text-[#92400E]">Pharmacology Alert:</strong> Metoprolol 50mg held due to hypotension. Tachycardia represents genuine systemic inflammatory cascade.
            </div>

            {/* Meds List */}
            <div className="space-y-2">
              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#111827]">Norepinephrine</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7] font-bold">
                    TITRATING
                  </span>
                </div>
                <div className="text-xs font-mono text-[#059669] font-semibold">0.08 mcg/kg/min IV Infusion</div>
                <div className="text-[10px] text-[#9CA3AF]">Continuous infusion via CVC</div>
              </div>

              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#111827]">Vancomycin IV</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5] font-bold">
                    ADMINISTERED
                  </span>
                </div>
                <div className="text-xs font-mono text-[#111827] font-semibold">1.25g in 250mL D5W</div>
                <div className="text-[10px] text-[#9CA3AF]">Administered 07:45 (T-minus 4h)</div>
              </div>

              <div
                className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#111827]">Metoprolol Tartrate</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2] font-bold">
                    HELD
                  </span>
                </div>
                <div className="text-xs font-mono text-[#DC2626] font-semibold">50mg Oral Tablet</div>
                <div className="text-[10px] text-[#9CA3AF]">Held protocol: MAP &lt; 65 mmHg</div>
              </div>
            </div>

          </div>
        )}

      </div>
    </aside>
  );
}
