import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { scrollTo } from '../utils/lenis';
import { useTheme } from '../context/ThemeContext';
import './cinematic.css';
import './landingScenes.css';

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const { isDark } = useTheme();
  const root = useRef(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.cine-label', { opacity: 0, y: 10, duration: .45 })
        .from('.cine-title b', { yPercent: 105, duration: .9, stagger: .11 }, '-=.18')
        .from('.cine-intro, .cine-actions, .cine-foot', { y: 15, opacity: 0, duration: .65, stagger: .1 }, '-=.44');
      gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: .65 } })
        .to('.cine-photo', { yPercent: 10, ease: 'none' }, 0)
        .to('.cine-grid', { yPercent: 5, ease: 'none' }, 0)
        .to('.cine-copy', { y: -28, ease: 'none' }, 0)
        .fromTo('.cine-read-progress', {scaleX: .04}, {scaleX: 1, ease: 'none'}, 0);
    });
    return () => media.revert();
  }, { scope: root });
  return <>
    <section className="cine-hero" ref={root}>
      <img className="cine-photo" src="/assets/hero-icu-cinematic.jpg" alt="" fetchPriority="high"/>
      <div className="cine-grid" aria-hidden="true"/>
      <div className="cine-copy">
        <div className="cine-label"><i/> AEGIS–ICU <span>/</span> CLINICAL INTELLIGENCE</div>
        <h1 className="cine-title"><span><b>See the signals</b></span><span><b>before they become</b></span><span><b>a crisis.</b></span></h1>
        <p className="cine-intro">Aegis-ICU brings vital trends, laboratory evidence, and medication context together through specialized AI agents to support earlier recognition of potential sepsis risk.</p>
        <div className="cine-actions">
          <button onClick={() => scrollTo('#problem')}>Explore Aegis <ArrowDown size={16}/></button>
          <button onClick={() => scrollTo('#how-it-works')}>Discover how it works <ArrowUpRight size={16}/></button>
        </div>
      </div>
      <svg className="hero-trace" viewBox="0 0 300 52" aria-hidden="true">
        <path d="M0 32h61l9-5 10 5h19l7-9 7 21 8-40 8 33 9-10 9 5h31q8-12 18 0h94" fill="none" stroke="currentColor"/>
        <path className="signal-runner" pathLength="100" strokeDasharray="8 92" d="M0 32h61l9-5 10 5h19l7-9 7 21 8-40 8 33 9-10 9 5h31q8-12 18 0h94" fill="none" stroke="currentColor" strokeWidth="3"/>
      </svg><div className="cine-foot"><i className="cine-read-progress" aria-hidden="true"/><span>01 / BEDSIDE OBSERVATION</span><span>SEPSIS-3 · HUMAN-IN-THE-LOOP</span></div>
    </section>
    <details className="cine-feed" onToggle={() => ScrollTrigger.refresh()}>
      <summary>Bedside telemetry <span>Illustrative feed · ICU Bed 04</span></summary>
          <div
            className="ui-panel"
            style={{
              padding: '20px',
              background: isDark ? '#0D1624' : '#FFFFFF',
              border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.06)'
            }}
          >
            {/* Telemetry Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '14px',
              borderBottom: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDark ? '#35D6C5' : '#0D9488' }} />
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: isDark ? '#F1F5FA' : '#0F172A' }}>
                  ICU-BED-04 (P-10492) • ILLUSTRATIVE FEED
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                padding: '2px 8px',
                borderRadius: '4px',
                background: isDark ? '#162337' : '#FEE2E2',
                color: isDark ? '#FF5268' : '#DC2626',
                border: isDark ? '1px solid #243247' : '1px solid #FECACA',
                fontWeight: 600
              }}>
                SEPSIS VECTOR DETECTED
              </span>
            </div>

            {/* SVG Waveform */}
            <div style={{
              background: isDark ? '#080E18' : '#F8FAFC',
              borderRadius: '8px',
              padding: '12px 14px',
              border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: isDark ? '#617285' : '#94A3B8',
                marginBottom: '4px'
              }}>
                <span style={{ color: isDark ? '#35D6C5' : '#0D9488' }}>LEAD II • ECG (mV)</span>
                <span>25 mm/s • GAIN 1.0</span>
              </div>

              <svg viewBox="0 0 500 55" style={{ width: '100%', height: '55px', display: 'block' }}>
                <path d="M0,27 H500" stroke={isDark ? "#111C2B" : "#E2E8F0"} strokeWidth="1" />
                <path
                  d="M0,27 L35,27 L42,23 L48,29 L54,27 L64,27 L70,16 L76,46 L82,6 L88,38 L92,25 L98,27 L130,27 L138,21 L146,27 L180,27 L187,23 L193,29 L200,27 L209,27 L215,16 L221,46 L227,6 L233,38 L237,25 L243,27 L275,27 L283,21 L291,27 L325,27 L332,23 L338,29 L345,27 L354,27 L360,16 L366,46 L372,6 L378,38 L382,25 L388,27 L420,27 L428,21 L436,27 L470,27 L477,23 L483,29 L490,27 L500,27"
                  fill="none"
                  stroke={isDark ? "#35D6C5" : "#0D9488"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Numerical Gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                background: isDark ? '#080E18' : '#F8FAFC',
                padding: '10px',
                borderRadius: '8px',
                border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0'
              }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isDark ? '#9AA9BA' : '#64748B' }}>HEART RATE</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', margin: '2px 0' }}>
                  <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: '#FF5268' }}>101</span>
                  <span style={{ fontSize: '10px', color: isDark ? '#617285' : '#94A3B8', fontFamily: 'var(--font-mono)' }}>bpm</span>
                </div>
                <span style={{ fontSize: '10px', color: '#FF5268', fontFamily: 'var(--font-mono)' }}>+20 bpm/3h</span>
              </div>

              <div style={{
                background: isDark ? '#080E18' : '#F8FAFC',
                padding: '10px',
                borderRadius: '8px',
                border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0'
              }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isDark ? '#9AA9BA' : '#64748B' }}>BLOOD PRESS.</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', margin: '2px 0' }}>
                  <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: isDark ? '#35D6C5' : '#0D9488' }}>116/74</span>
                  <span style={{ fontSize: '10px', color: isDark ? '#617285' : '#94A3B8', fontFamily: 'var(--font-mono)' }}>mmHg</span>
                </div>
                <span style={{ fontSize: '10px', color: isDark ? '#9AA9BA' : '#64748B', fontFamily: 'var(--font-mono)' }}>Compensating</span>
              </div>

              <div style={{
                background: isDark ? '#080E18' : '#F8FAFC',
                padding: '10px',
                borderRadius: '8px',
                border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0'
              }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isDark ? '#9AA9BA' : '#64748B' }}>SHOCK INDEX</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', margin: '2px 0' }}>
                  <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: '#E5B86A' }}>0.87</span>
                  <span style={{ fontSize: '10px', color: isDark ? '#617285' : '#94A3B8', fontFamily: 'var(--font-mono)' }}>HR/SBP</span>
                </div>
                <span style={{ fontSize: '10px', color: '#E5B86A', fontFamily: 'var(--font-mono)' }}>Widening</span>
              </div>
            </div>

            {/* 3-Agent Real-time Status Row */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '10px',
              borderRadius: '8px',
              background: isDark ? '#080E18' : '#F8FAFC',
              border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#35D6C5' : '#0D9488', fontFamily: 'var(--font-mono)' }}>Agent 1 (Vitals)</span>
                <span style={{ color: isDark ? '#F1F5FA' : '#0F172A' }}>Tachycardia decoupled from SBP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#559BFF' : '#2563EB', fontFamily: 'var(--font-mono)' }}>Agent 2 (Labs)</span>
                <span style={{ color: isDark ? '#9AA9BA' : '#64748B' }}>Lactate stale (&gt;8h) • Draw recommended</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#E5B86A' : '#D97706', fontFamily: 'var(--font-mono)' }}>Agent 3 (Context)</span>
                <span style={{ color: isDark ? '#F1F5FA' : '#0F172A' }}>Albuterol discount rejected (decayed)</span>
              </div>
            </div>
          </div>

    </details>
  </>;
}
