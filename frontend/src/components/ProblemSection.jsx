import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, TrendingUp, BellOff } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function ProblemSection() {
  const sectionRef = useRef(null);
  const pinContainerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(0);

  useGSAP(() => {
    const pin = pinContainerRef.current;

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 64px',
      end: '+=120%', // Controlled, compact pinned duration
      pin: pin,
      pinSpacing: true,
      scrub: 0.5,
      onUpdate: (self) => {
        const p = self.progress;
        setScrollProgress(p);
        if (p < 0.33) {
          setActiveStage(0);
        } else if (p < 0.68) {
          setActiveStage(1);
        } else {
          setActiveStage(2);
        }
      }
    });

    // Scrubbed SVG Graph Draw
    gsap.to('.problem-hr-path', {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 64px',
        end: '+=120%',
        scrub: true
      }
    });

    gsap.to('.problem-bp-path', {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 64px',
        end: '+=120%',
        scrub: true
      }
    });

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
      bedsideAlarmColor: "#9AA9BA",
      aegisRisk: "8%",
      explanation: "Post-surgical patient appears hemodynamically normal. Routine ICU checks show unremarkable numbers."
    },
    {
      hour: "08:15",
      stageLabel: "Phase 2: Signal Divergence (Aegis Window)",
      hr: 102,
      bp: "114/72",
      shockIndex: "0.89",
      news2: "3",
      bedsideAlarm: "SILENT",
      bedsideAlarmColor: "#9AA9BA",
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
      bedsideAlarmColor: "#FF5268",
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
        background: '#080E18',
        borderBottom: '1px solid #1A2738'
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
                color: '#F1F5FA',
                marginBottom: '16px'
              }}
            >
              Deterioration rarely starts with one alarming number.
            </h2>

            <p className="font-body" style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#9AA9BA',
              marginBottom: '20px'
            }}>
              Concerning physiological changes develop gradually. Relying only on isolated threshold alarms misses early combinations of signals—while driving severe alarm fatigue.
            </p>

            {/* Stage Indicator Card */}
            <div className="ui-panel" style={{ padding: '16px', background: '#0D1624', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#35D6C5', fontWeight: 600 }}>
                  SCROLL PROGRESSION: {current.stageLabel.toUpperCase()}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#F1F5FA' }}>
                  HOUR {current.hour}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#9AA9BA', margin: 0, lineHeight: 1.5 }}>
                {current.explanation}
              </p>
            </div>

            {/* Alarm Fatigue Research Citation */}
            <div style={{
              fontSize: '11.5px',
              color: '#617285',
              borderLeft: '2px solid #243247',
              paddingLeft: '12px',
              lineHeight: 1.5
            }}>
              <strong>Clinical Evidence:</strong> Hospital ICU studies report that 85% to 99% of acoustic telemetry alarms are clinically non-actionable, creating dangerous alarm desensitization (Joint Commission Alert #50).
            </div>
          </div>

          {/* Right Column: Vertically Centred Clinical Monitoring Visualization */}
          <div className="ui-panel" style={{
            padding: '24px',
            background: '#0D1624',
            transformOrigin: 'center center'
          }}>
            {/* Visual Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #1A2738'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="#35D6C5" />
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#F1F5FA' }}>
                  MULTI-SIGNAL DIVERGENCE ANALYSIS
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="#9AA9BA" />
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#9AA9BA' }}>
                  Hr {current.hour}
                </span>
              </div>
            </div>

            {/* Graph Legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
              <span style={{ color: '#FF5268' }}>● Heart Rate (bpm) — Upward Creep</span>
              <span style={{ color: '#35D6C5' }}>● Systolic BP (mmHg) — Compensatory Drop</span>
            </div>

            {/* SVG Trend Graph (Flat, clean strokes, clear thresholds) */}
            <div style={{
              background: '#080E18',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid #1A2738',
              marginBottom: '16px'
            }}>
              <svg viewBox="0 0 500 130" style={{ width: '100%', height: '120px', display: 'block' }}>
                {/* Reference Grid & Thresholds */}
                <line x1="0" y1="28" x2="500" y2="28" stroke="#243247" strokeDasharray="3 3" strokeWidth="1" />
                <text x="6" y="24" fill="#617285" fontSize="9" fontFamily="var(--font-mono)">HR Alarm Threshold (100 bpm)</text>

                <line x1="0" y1="98" x2="500" y2="98" stroke="#243247" strokeDasharray="3 3" strokeWidth="1" />
                <text x="6" y="112" fill="#617285" fontSize="9" fontFamily="var(--font-mono)">BP Alarm Threshold (90 mmHg)</text>

                {/* Aegis Early Window Box */}
                <rect x="200" y="10" width="140" height="110" fill="#111C2B" stroke="#35D6C5" strokeWidth="1" strokeDasharray="2 2" rx="4" />
                <text x="210" y="24" fill="#35D6C5" fontSize="9" fontWeight="600" fontFamily="var(--font-mono)">AEGIS WINDOW</text>
                <text x="210" y="34" fill="#9AA9BA" fontSize="8" fontFamily="var(--font-mono)">Signal Decoupling</text>

                {/* Progressive Heart Rate Trend Path */}
                <path
                  d="M 10,85 Q 120,78 240,55 T 485,18"
                  fill="none"
                  stroke="#FF5268"
                  strokeWidth="2.2"
                  strokeDasharray="500"
                  strokeDashoffset="500"
                  className="problem-hr-path"
                />

                {/* Progressive Blood Pressure Trend Path */}
                <path
                  d="M 10,38 Q 140,36 260,46 T 485,105"
                  fill="none"
                  stroke="#35D6C5"
                  strokeWidth="2.2"
                  strokeDasharray="500"
                  strokeDashoffset="500"
                  className="problem-bp-path"
                />
              </svg>
            </div>

            {/* Numerical Gauges (Real-Time Synchronized) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#080E18', padding: '10px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#617285' }}>HEART RATE</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: current.hr > 100 ? '#FF5268' : '#F1F5FA', fontFamily: 'var(--font-display)' }}>
                  {current.hr} <span style={{ fontSize: '10px', color: '#617285' }}>bpm</span>
                </div>
              </div>

              <div style={{ background: '#080E18', padding: '10px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#617285' }}>BLOOD PRESS.</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#35D6C5', fontFamily: 'var(--font-display)' }}>
                  {current.bp}
                </div>
              </div>

              <div style={{ background: '#080E18', padding: '10px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#617285' }}>SHOCK INDEX</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: parseFloat(current.shockIndex) > 0.85 ? '#E5B86A' : '#F1F5FA', fontFamily: 'var(--font-display)' }}>
                  {current.shockIndex}
                </div>
              </div>

              <div style={{ background: '#080E18', padding: '10px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#617285' }}>NEWS2 SCORE</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#9AA9BA', fontFamily: 'var(--font-display)' }}>
                  {current.news2}
                </div>
              </div>
            </div>

            {/* Side-by-Side Status Contrast */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                padding: '10px 12px',
                borderRadius: '6px',
                background: '#080E18',
                border: '1px solid #1A2738',
                fontSize: '11px'
              }}>
                <div style={{ color: '#617285', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>TRADITIONAL MONITOR</div>
                <div style={{ color: current.bedsideAlarmColor, fontWeight: 600 }}>{current.bedsideAlarm}</div>
              </div>

              <div style={{
                padding: '10px 12px',
                borderRadius: '6px',
                background: '#080E18',
                border: '1px solid #243247',
                fontSize: '11px'
              }}>
                <div style={{ color: '#35D6C5', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>AEGIS DECISION ENGINE</div>
                <div style={{ color: '#F1F5FA', fontWeight: 600 }}>RISK PROBABILITY: {current.aegisRisk}</div>
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
