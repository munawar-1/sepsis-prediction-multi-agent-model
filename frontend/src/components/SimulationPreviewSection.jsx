import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Play, Pause, RotateCcw, Activity, ArrowRight } from 'lucide-react';
import { SIMULATION_TIMELINE } from '../utils/constants';

export default function SimulationPreviewSection({ onOpenFlightDeck }) {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev < SIMULATION_TIMELINE.length - 1 ? prev + 1 : 0));
      }, 2400);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const current = SIMULATION_TIMELINE[currentIndex];

  return (
    <section
      id="simulation"
      style={{
        position: 'relative',
        padding: '72px 24px',
        background: isDark ? '#0D1624' : '#FFFFFF',
        borderBottom: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px auto' }}>
          <div style={{ marginBottom: '12px' }}>
            <span className="eyebrow-tag">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#35D6C5' }} />
              ILLUSTRATIVE CASE REPLAY
            </span>
          </div>

          <h2 className="font-display" style={{
            fontSize: 'clamp(1.9rem, 3.4vw, 2.75rem)',
            fontWeight: 650,
            lineHeight: 1.15,
            color: isDark ? '#F1F5FA' : '#0F172A',
            marginBottom: '14px'
          }}>
            Watch the system respond as conditions evolve.
          </h2>

          <p className="font-body" style={{ fontSize: '15px', color: isDark ? '#9AA9BA' : '#475569', lineHeight: 1.6 }}>
            Scrub across an accelerated 24-hour ICU trajectory to see how Aegis coordinates physiological, laboratory, and medication evidence as deterioration unfolds.
          </p>
        </div>

        {/* Clean Interactive Simulator Card */}
        <div className="ui-panel" style={{
          background: isDark ? '#080E18' : '#F8FAFC',
          border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* Controls Bar */}
          <div style={{
            padding: '14px 20px',
            background: isDark ? '#111C2B' : '#F1F5F9',
            borderBottom: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Play/Pause & Reset */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: '#35D6C5',
                  border: 'none',
                  color: '#080E18',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: '1px' }} />}
              </button>

              <button
                onClick={() => { setIsPlaying(false); setCurrentIndex(0); }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: isDark ? '#162337' : '#E2E8F0',
                  border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
                  color: isDark ? '#9AA9BA' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                aria-label="Reset simulation to hour 0"
              >
                <RotateCcw size={14} />
              </button>

              <div style={{ marginLeft: '6px' }}>
                <span style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: isDark ? '#F1F5FA' : '#0F172A', fontWeight: 600 }}>
                  {current.time} (Hour {current.hour}:00) — {current.label}
                </span>
              </div>
            </div>

            {/* Stepper buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {SIMULATION_TIMELINE.map((item, idx) => (
                <button
                  key={item.hour}
                  onClick={() => { setIsPlaying(false); setCurrentIndex(idx); }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    border: currentIndex === idx ? '1px solid #35D6C5' : '1px solid #243247',
                    background: currentIndex === idx ? '#162337' : 'transparent',
                    color: currentIndex === idx ? '#35D6C5' : '#9AA9BA',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hr {item.hour}
                </button>
              ))}
            </div>
          </div>

          {/* Body Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: '24px',
            padding: '24px'
          }} className="sim-split-grid">
            
            {/* Left: Waveform Image & Live Gauges */}
            <div>
              <div style={{
                position: 'relative',
                height: '140px',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '16px',
                border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0'
              }}>
                <img
                  src="/assets/agent-vitals-telemetry.jpg"
                  alt="Clinical telemetry demonstration"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(8, 14, 24, 0.65)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#35D6C5', fontWeight: 600 }}>● BEDSIDE REPLAY FEED</span>
                    <span style={{ color: isDark ? '#9AA9BA' : '#475569' }}>CASE #p000011</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: isDark ? '#F1F5FA' : '#0F172A', fontFamily: 'var(--font-display)' }}>
                      {current.hrTrend}
                    </div>
                    <div style={{ fontSize: '11px', color: isDark ? '#9AA9BA' : '#475569' }}>
                      Blood Pressure: {current.bp} • MAP: {current.map} mmHg
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Numerical Gauges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ background: isDark ? '#0D1624' : '#FFFFFF', padding: '10px', borderRadius: '6px', border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '9.5px', color: isDark ? '#617285' : '#64748B', fontFamily: 'var(--font-mono)' }}>HEART RATE</span>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: current.hr > 100 ? '#FF5268' : '#35D6C5' }}>
                    {current.hr} <span style={{ fontSize: '9.5px', color: isDark ? '#617285' : '#64748B' }}>bpm</span>
                  </div>
                  <span style={{ fontSize: '9.5px', color: isDark ? '#617285' : '#64748B' }}>SpO₂: {current.spo2}%</span>
                </div>

                <div style={{ background: isDark ? '#0D1624' : '#FFFFFF', padding: '10px', borderRadius: '6px', border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '9.5px', color: isDark ? '#617285' : '#64748B', fontFamily: 'var(--font-mono)' }}>RESPIRATION</span>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: current.resp > 20 ? '#FF8A65' : '#F1F5FA' }}>
                    {current.resp} <span style={{ fontSize: '9.5px', color: isDark ? '#617285' : '#64748B' }}>/min</span>
                  </div>
                  <span style={{ fontSize: '9.5px', color: isDark ? '#617285' : '#64748B' }}>Temp: {current.temp}°C</span>
                </div>

                <div style={{ background: isDark ? '#0D1624' : '#FFFFFF', padding: '10px', borderRadius: '6px', border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '9.5px', color: isDark ? '#617285' : '#64748B', fontFamily: 'var(--font-mono)' }}>SHOCK INDEX</span>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: current.shockIndex > 0.85 ? '#E5B86A' : '#F1F5FA' }}>
                    {current.shockIndex}
                  </div>
                  <span style={{ fontSize: '9.5px', color: isDark ? '#617285' : '#64748B' }}>Norm: &lt; 0.70</span>
                </div>

                <div style={{ background: isDark ? '#0D1624' : '#FFFFFF', padding: '10px', borderRadius: '6px', border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '9.5px', color: isDark ? '#617285' : '#64748B', fontFamily: 'var(--font-mono)' }}>SERUM LACTATE</span>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: parseFloat(current.lactate) > 2 ? '#FF5268' : '#559BFF' }}>
                    {current.lactate} <span style={{ fontSize: '9.5px', color: isDark ? '#617285' : '#64748B' }}>mmol/L</span>
                  </div>
                  <span style={{ fontSize: '9.5px', color: isDark ? '#617285' : '#64748B' }}>Platelets: {current.platelets}k</span>
                </div>
              </div>
            </div>

            {/* Right: Risk Probability & Agent Consensus */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{
                background: isDark ? '#0D1624' : '#FFFFFF',
                padding: '16px',
                borderRadius: '8px',
                border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: isDark ? '#9AA9BA' : '#475569' }}>
                    AEGIS COMPOSITE RISK SCORE:
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    color: current.color,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isDark ? '#162337' : '#E2E8F0',
                    border: isDark ? '1px solid #243247' : '1px solid #E2E8F0'
                  }}>
                    {current.riskLevel}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span className="font-display" style={{ fontSize: '32px', fontWeight: 700, color: current.color }}>
                    {current.riskScore}%
                  </span>
                  <span style={{ fontSize: '12px', color: isDark ? '#9AA9BA' : '#475569' }}>calibrated probability</span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '4px', background: isDark ? '#080E18' : '#F8FAFC', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{
                    height: '100%',
                    width: `${current.riskScore}%`,
                    background: current.color,
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                <p style={{ fontSize: '12.5px', color: isDark ? '#F1F5FA' : '#0F172A', margin: 0, lineHeight: 1.5 }}>
                  {current.summary}
                </p>
              </div>

              {/* Status List */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '10px 12px',
                borderRadius: '6px',
                background: isDark ? '#0D1624' : '#FFFFFF',
                border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#35D6C5' }}>Agent 1 (Vitals):</span>
                  <span style={{ color: isDark ? '#F1F5FA' : '#0F172A' }}>{current.vitalsStatus}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#559BFF' }}>Agent 2 (Labs):</span>
                  <span style={{ color: isDark ? '#F1F5FA' : '#0F172A' }}>{current.labsStatus}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#E5B86A' }}>Agent 3 (Context):</span>
                  <span style={{ color: isDark ? '#F1F5FA' : '#0F172A' }}>{current.skepticStatus}</span>
                </div>
              </div>

              {/* Modal Launcher */}
              <button
                onClick={onOpenFlightDeck}
                className="btn-secondary"
                style={{ width: '100%', fontSize: '12.5px', padding: '8px 12px' }}
              >
                <span>Open Full Clinical Flight Deck</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .sim-split-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </section>
  );
}
