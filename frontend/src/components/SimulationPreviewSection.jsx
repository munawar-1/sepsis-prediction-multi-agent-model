import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Activity, ArrowRight } from 'lucide-react';
import { SIMULATION_TIMELINE } from '../utils/constants';

export default function SimulationPreviewSection({ onOpenFlightDeck }) {
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
        background: '#0D1624',
        borderBottom: '1px solid #1A2738'
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
            color: '#F1F5FA',
            marginBottom: '14px'
          }}>
            Watch the system respond as conditions evolve.
          </h2>

          <p className="font-body" style={{ fontSize: '15px', color: '#9AA9BA', lineHeight: 1.6 }}>
            Scrub across an accelerated 24-hour ICU trajectory to see how Aegis coordinates physiological, laboratory, and medication evidence as deterioration unfolds.
          </p>
        </div>

        {/* Clean Interactive Simulator Card */}
        <div className="ui-panel" style={{
          background: '#080E18',
          border: '1px solid #243247',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* Controls Bar */}
          <div style={{
            padding: '14px 20px',
            background: '#111C2B',
            borderBottom: '1px solid #243247',
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
                  background: '#162337',
                  border: '1px solid #243247',
                  color: '#9AA9BA',
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
                <span style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: '#F1F5FA', fontWeight: 600 }}>
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
                border: '1px solid #1A2738'
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
                    <span style={{ color: '#9AA9BA' }}>CASE #p000011</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5FA', fontFamily: 'var(--font-display)' }}>
                      {current.hrTrend}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9AA9BA' }}>
                      Blood Pressure: {current.bp} • MAP: {current.map} mmHg
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Numerical Gauges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ background: '#0D1624', padding: '10px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                  <span style={{ fontSize: '9.5px', color: '#617285', fontFamily: 'var(--font-mono)' }}>HEART RATE</span>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: current.hr > 100 ? '#FF5268' : '#35D6C5' }}>
                    {current.hr} <span style={{ fontSize: '9.5px', color: '#617285' }}>bpm</span>
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#617285' }}>SpO₂: {current.spo2}%</span>
                </div>

                <div style={{ background: '#0D1624', padding: '10px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                  <span style={{ fontSize: '9.5px', color: '#617285', fontFamily: 'var(--font-mono)' }}>RESPIRATION</span>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: current.resp > 20 ? '#FF8A65' : '#F1F5FA' }}>
                    {current.resp} <span style={{ fontSize: '9.5px', color: '#617285' }}>/min</span>
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#617285' }}>Temp: {current.temp}°C</span>
                </div>

                <div style={{ background: '#0D1624', padding: '10px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                  <span style={{ fontSize: '9.5px', color: '#617285', fontFamily: 'var(--font-mono)' }}>SHOCK INDEX</span>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: current.shockIndex > 0.85 ? '#E5B86A' : '#F1F5FA' }}>
                    {current.shockIndex}
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#617285' }}>Norm: &lt; 0.70</span>
                </div>

                <div style={{ background: '#0D1624', padding: '10px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                  <span style={{ fontSize: '9.5px', color: '#617285', fontFamily: 'var(--font-mono)' }}>SERUM LACTATE</span>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: parseFloat(current.lactate) > 2 ? '#FF5268' : '#559BFF' }}>
                    {current.lactate} <span style={{ fontSize: '9.5px', color: '#617285' }}>mmol/L</span>
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#617285' }}>Platelets: {current.platelets}k</span>
                </div>
              </div>
            </div>

            {/* Right: Risk Probability & Agent Consensus */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{
                background: '#0D1624',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #243247',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#9AA9BA' }}>
                    AEGIS COMPOSITE RISK SCORE:
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    color: current.color,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#162337',
                    border: '1px solid #243247'
                  }}>
                    {current.riskLevel}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span className="font-display" style={{ fontSize: '32px', fontWeight: 700, color: current.color }}>
                    {current.riskScore}%
                  </span>
                  <span style={{ fontSize: '12px', color: '#9AA9BA' }}>calibrated probability</span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '4px', background: '#080E18', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{
                    height: '100%',
                    width: `${current.riskScore}%`,
                    background: current.color,
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                <p style={{ fontSize: '12.5px', color: '#F1F5FA', margin: 0, lineHeight: 1.5 }}>
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
                background: '#0D1624',
                border: '1px solid #1A2738',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#35D6C5' }}>Agent 1 (Vitals):</span>
                  <span style={{ color: '#F1F5FA' }}>{current.vitalsStatus}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#559BFF' }}>Agent 2 (Labs):</span>
                  <span style={{ color: '#F1F5FA' }}>{current.labsStatus}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#E5B86A' }}>Agent 3 (Context):</span>
                  <span style={{ color: '#F1F5FA' }}>{current.skepticStatus}</span>
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
