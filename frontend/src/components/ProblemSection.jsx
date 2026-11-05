import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, TrendingUp, BellOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

gsap.registerPlugin(ScrollTrigger);

export default function ProblemSection() {
  const { isDark } = useTheme();
  const sectionRef = useRef(null);
  const pinContainerRef = useRef(null);

  const [activeStage, setActiveStage] = useState(0);

  useGSAP(() => {
    const pin = pinContainerRef.current;

    const media = gsap.matchMedia();
    media.add('(min-width: 901px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)', () => {
      const story = gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, pin,
        start: 'top 64px', end: '+=145%', scrub: .5,
        onUpdate: self => setActiveStage(Math.min(2, Math.floor(self.progress * 3))) } });
      story.fromTo('.problem-photo img', { scale: 1.03 }, { scale: 1.19, xPercent: -3, ease: 'none' }, 0)
        .fromTo('.problem-hr-path, .problem-bp-path', { strokeDashoffset: 500 }, { strokeDashoffset: 0, ease: 'none' }, 0);
    });
    return () => media.revert();
  }, { scope: sectionRef });

  const stageData = [
    {
      hour: "00:00",
      stageLabel: "Phase 1: Apparent Stability",
      hr: 74,
      bp: "122/80",
      shockIndex: "0.61",
      news2: "0",
      bedsideAlarm: "SILENT",
      bedsideAlarmColor: isDark ? "#9AA9BA" : "#64748B",
      aegisRisk: "8%",
      explanation: "Post-surgical patient appears hemodynamically normal. Routine ICU checks show unremarkable numbers."
    },
    {
      hour: "08:15",
      stageLabel: "Phase 2: Signal Divergence (HourZero Window)",
      hr: 102,
      bp: "114/72",
      shockIndex: "0.89",
      news2: "3",
      bedsideAlarm: "SILENT",
      bedsideAlarmColor: isDark ? "#9AA9BA" : "#64748B",
      aegisRisk: "78%",
      explanation: "Heart rate creeps upward while compensatory vasoconstriction holds blood pressure. Standard threshold alarms remain completely silent."
    },
    {
      hour: "12:00",
      stageLabel: "Phase 3: Bedside Alarm Fires (Late)",
      hr: 112,
      bp: "88/54",
      shockIndex: "1.27",
      news2: "8",
      bedsideAlarm: "AUDIBLE ALARM",
      bedsideAlarmColor: "#DC2626",
      aegisRisk: "94%",
      explanation: "The bedside monitor finally sounds a loud alarm—hours after microvascular hypoperfusion has already commenced."
    }
  ];

  const current = stageData[activeStage];

  return (
    <section
      id="problem"
      ref={sectionRef}
      style={{
        position: 'relative',
        background: isDark ? '#080E18' : '#F4F6F9',
        borderBottom: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
        transition: 'background-color 0.2s ease, border-color 0.2s ease'
      }}
    >
      <div
        ref={pinContainerRef}
        style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          maxWidth: '1320px',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Split-Screen Desktop Composition */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.15fr',
          gap: '48px',
          alignItems: 'center',
          width: '100%',
          transformOrigin: 'center center'
        }} className="problem-split-grid">
          
          {/* Left Column: Compact Editorial Storytelling */}
          <div>
            <div style={{ marginBottom: '14px' }}>
              <span className="eyebrow-tag">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF5268' }} />
                THE THRESHOLD DILEMMA
              </span>
            </div>

            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(1.9rem, 3.2vw, 2.75rem)',
                fontWeight: 650,
                lineHeight: 1.15,
                color: isDark ? '#F1F5FA' : '#0F172A',
                marginBottom: '16px'
              }}
            >
              Deterioration rarely starts with one alarming number.
            </h2>

            <p className="font-body" style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: isDark ? '#9AA9BA' : '#475569',
              marginBottom: '20px'
            }}>
              Concerning physiological changes develop gradually. Relying only on isolated threshold alarms misses early combinations of signals—while driving severe alarm fatigue.
            </p>

            <div className="problem-photo"><img loading="lazy" src="/assets/hero-icu-ambient.jpg" alt="Bedside monitoring equipment in the ICU"/><span>OBSERVATION / {current.hour}</span></div>
            <div className="cine-phases" aria-label="Illustrative case phases">{stageData.map((phase, i) =>
              <button key={phase.hour} aria-pressed={activeStage === i} onClick={() => setActiveStage(i)}>{phase.hour}</button>)}</div>
            {/* Stage Indicator Card */}
            <div
              className="ui-panel"
              style={{
                padding: '16px',
                background: isDark ? '#0D1624' : '#FFFFFF',
                border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
                borderRadius: '12px',
                marginBottom: '20px',
                boxShadow: isDark ? 'none' : '0 4px 14px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isDark ? '#35D6C5' : '#0D9488', fontWeight: 600 }}>
                  SCROLL PROGRESSION: {current.stageLabel.toUpperCase()}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isDark ? '#F1F5FA' : '#0F172A', fontWeight: 600 }}>
                  HOUR {current.hour}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: isDark ? '#9AA9BA' : '#475569', margin: 0, lineHeight: 1.5 }}>
                {current.explanation}
              </p>
            </div>

            {/* Alarm Fatigue Research Citation */}
            <div style={{
              fontSize: '11.5px',
              color: isDark ? '#617285' : '#64748B',
              borderLeft: isDark ? '2px solid #243247' : '2px solid #CBD5E1',
              paddingLeft: '12px',
              lineHeight: 1.5
            }}>
              <strong style={{ color: isDark ? '#9AA9BA' : '#334155' }}>Clinical Evidence:</strong> Hospital ICU studies report that 85% to 99% of acoustic telemetry alarms are clinically non-actionable, creating dangerous alarm desensitization (Joint Commission Alert #50).
            </div>
          </div>

          {/* Right Column: Clinical Monitoring Visualization */}
          <div
            className="ui-panel"
            style={{
              padding: '24px',
              background: isDark ? '#0D1624' : '#FFFFFF',
              border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.06)',
              transformOrigin: 'center center'
            }}
          >
            {/* Visual Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color={isDark ? "#35D6C5" : "#0D9488"} />
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: isDark ? '#F1F5FA' : '#0F172A' }}>
                  MULTI-SIGNAL DIVERGENCE ANALYSIS
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color={isDark ? "#9AA9BA" : "#64748B"} />
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: isDark ? '#9AA9BA' : '#64748B' }}>
                  Hr {current.hour}
                </span>
              </div>
            </div>

            {/* Graph Legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
              <span style={{ color: '#FF5268' }}>● Heart Rate (bpm) — Upward Creep</span>
              <span style={{ color: isDark ? '#35D6C5' : '#0D9488' }}>● Systolic BP (mmHg) — Compensatory Drop</span>
            </div>

            {/* SVG Trend Graph */}
            <div style={{
              background: isDark ? '#080E18' : '#F8FAFC',
              borderRadius: '8px',
              padding: '12px',
              border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
              marginBottom: '16px'
            }}>
              <svg viewBox="0 0 500 130" style={{ width: '100%', height: '120px', display: 'block' }}>
                {/* Reference Grid & Thresholds */}
                <line x1="0" y1="28" x2="500" y2="28" stroke={isDark ? "#243247" : "#CBD5E1"} strokeDasharray="3 3" strokeWidth="1" />
                <text x="6" y="24" fill={isDark ? "#617285" : "#94A3B8"} fontSize="9" fontFamily="var(--font-mono)">HR Alarm Threshold (100 bpm)</text>

                <line x1="0" y1="98" x2="500" y2="98" stroke={isDark ? "#243247" : "#CBD5E1"} strokeDasharray="3 3" strokeWidth="1" />
                <text x="6" y="112" fill={isDark ? "#617285" : "#94A3B8"} fontSize="9" fontFamily="var(--font-mono)">BP Alarm Threshold (90 mmHg)</text>

                {/* Aegis Early Window Box */}
                <rect x="200" y="10" width="140" height="110" fill={isDark ? "#111C2B" : "#F0FDFA"} stroke={isDark ? "#35D6C5" : "#0D9488"} strokeWidth="1" strokeDasharray="2 2" rx="4" />
                <text x="210" y="24" fill={isDark ? "#35D6C5" : "#0D9488"} fontSize="9" fontWeight="600" fontFamily="var(--font-mono)">HourZero WINDOW</text>
                <text x="210" y="34" fill={isDark ? "#9AA9BA" : "#0F766E"} fontSize="8" fontFamily="var(--font-mono)">Signal Decoupling</text>

                {/* Progressive Heart Rate Trend Path */}
                <path
                  d="M 10,85 Q 120,78 240,55 T 485,18"
                  fill="none"
                  stroke="#FF5268"
                  strokeWidth="2.2"
                  strokeDasharray="500"
                  strokeDashoffset="0"
                  className="problem-hr-path"
                />

                {/* Progressive Blood Pressure Trend Path */}
                <path
                  d="M 10,38 Q 140,36 260,46 T 485,105"
                  fill="none"
                  stroke={isDark ? "#35D6C5" : "#0D9488"}
                  strokeWidth="2.2"
                  strokeDasharray="500"
                  strokeDashoffset="0"
                  className="problem-bp-path"
                />
              </svg>
            </div>

            {/* Numerical Gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                background: isDark ? '#080E18' : '#F8FAFC',
                padding: '10px',
                borderRadius: '8px',
                border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0'
              }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isDark ? '#617285' : '#64748B' }}>HEART RATE</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: current.hr > 100 ? '#FF5268' : (isDark ? '#F1F5FA' : '#0F172A'), fontFamily: 'var(--font-display)' }}>
                  {current.hr} <span style={{ fontSize: '10px', color: isDark ? '#617285' : '#94A3B8' }}>bpm</span>
                </div>
              </div>

              <div style={{
                background: isDark ? '#080E18' : '#F8FAFC',
                padding: '10px',
                borderRadius: '8px',
                border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0'
              }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isDark ? '#617285' : '#64748B' }}>BLOOD PRESS.</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: isDark ? '#35D6C5' : '#0D9488', fontFamily: 'var(--font-display)' }}>
                  {current.bp}
                </div>
              </div>

              <div style={{
                background: isDark ? '#080E18' : '#F8FAFC',
                padding: '10px',
                borderRadius: '8px',
                border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0'
              }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isDark ? '#617285' : '#64748B' }}>SHOCK INDEX</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: parseFloat(current.shockIndex) > 0.85 ? '#E5B86A' : (isDark ? '#F1F5FA' : '#0F172A'), fontFamily: 'var(--font-display)' }}>
                  {current.shockIndex}
                </div>
              </div>

              <div style={{
                background: isDark ? '#080E18' : '#F8FAFC',
                padding: '10px',
                borderRadius: '8px',
                border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0'
              }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isDark ? '#617285' : '#64748B' }}>NEWS2 SCORE</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: isDark ? '#9AA9BA' : '#475569', fontFamily: 'var(--font-display)' }}>
                  {current.news2}
                </div>
              </div>
            </div>

            {/* Side-by-Side Status Contrast */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: isDark ? '#080E18' : '#F8FAFC',
                border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
                fontSize: '11px'
              }}>
                <div style={{ color: isDark ? '#617285' : '#64748B', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>TRADITIONAL MONITOR</div>
                <div style={{ color: current.bedsideAlarmColor, fontWeight: 600 }}>{current.bedsideAlarm}</div>
              </div>

              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: isDark ? '#080E18' : '#F0FDFA',
                border: isDark ? '1px solid #243247' : '1px solid #CCFBF1',
                fontSize: '11px'
              }}>
                <div style={{ color: isDark ? '#35D6C5' : '#0D9488', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>HourZero DECISION ENGINE</div>
                <div style={{ color: isDark ? '#F1F5FA' : '#0F172A', fontWeight: 600 }}>RISK PROBABILITY: {current.aegisRisk}</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .problem-split-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </section>
  );
}
