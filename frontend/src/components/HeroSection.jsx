import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, ArrowDown, Activity, ShieldCheck, Check } from 'lucide-react';
import { scrollTo } from '../utils/lenis';
import { useTheme } from '../context/ThemeContext';

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection({ onOpenFlightDeck }) {
  const { isDark } = useTheme();
  const containerRef = useRef(null);
  const textColRef = useRef(null);
  const visualCardRef = useRef(null);
  const showcaseContainerRef = useRef(null);

  useGSAP(() => {
    // 1. Initial Entrance
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.hero-tag',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6 }
    )
    .fromTo('.hero-title-line',
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.1 },
      '-=0.3'
    )
    .fromTo('.hero-desc',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.6 },
      '-=0.4'
    )
    .fromTo('.hero-actions',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5 },
      '-=0.3'
    )
    .fromTo(visualCardRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.5'
    );

    // 2. Motion Transformation on Scroll
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.8
      }
    });

    scrollTl.to(textColRef.current, {
      y: -60,
      opacity: 0.2,
      ease: 'none'
    }, 0);

    scrollTl.to(visualCardRef.current, {
      scale: 1.08,
      y: 40,
      ease: 'none'
    }, 0);

  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      style={{
        position: 'relative',
        minHeight: '88vh',
        paddingTop: '96px',
        paddingBottom: '48px',
        background: isDark ? '#080E18' : '#F4F6F9',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderBottom: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
        overflow: 'hidden',
        transition: 'background-color 0.2s ease, border-color 0.2s ease'
      }}
    >
      {/* Cinematic ICU Background Image with Atmospheric Overlays */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <img
          src="/assets/hero-icu-cinematic.jpg"
          alt=""
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 40%',
            filter: 'blur(3px)',
            opacity: isDark ? 0.22 : 0.12,
            transform: 'scale(1.05)'
          }}
        />
        {/* Dark Navy / Daylight Slate Atmospheric Overlays */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? 'radial-gradient(ellipse at 75% 35%, rgba(20, 184, 166, 0.08) 0%, transparent 60%), linear-gradient(180deg, rgba(8, 14, 24, 0.72) 0%, rgba(8, 14, 24, 0.85) 50%, #080E18 100%)'
              : 'radial-gradient(ellipse at 75% 35%, rgba(13, 148, 136, 0.08) 0%, transparent 60%), linear-gradient(180deg, rgba(244, 246, 249, 0.72) 0%, rgba(244, 246, 249, 0.85) 50%, #F4F6F9 100%)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? 'linear-gradient(90deg, #080E18 0%, rgba(8, 14, 24, 0.88) 42%, rgba(8, 14, 24, 0.6) 100%)'
              : 'linear-gradient(90deg, #F4F6F9 0%, rgba(244, 246, 249, 0.88) 42%, rgba(244, 246, 249, 0.6) 100%)'
          }}
        />
      </div>

      <div style={{
        maxWidth: '1320px',
        margin: '0 auto',
        width: '100%',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '48px',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1
      }} className="hero-grid">
        
        {/* Left Column: Refined Editorial Typography */}
        <div ref={textColRef}>
          {/* Eyebrow Label */}
          <div className="hero-tag" style={{ marginBottom: '20px' }}>
            <span className="eyebrow-tag">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isDark ? '#35D6C5' : '#0D9488' }} />
              CLINICAL DECISION SUPPORT CONCEPT • Sepsis-3
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2.4rem, 4.4vw, 3.6rem)',
              fontWeight: 650,
              lineHeight: 1.15,
              color: isDark ? '#F1F5FA' : '#0F172A',
              marginBottom: '20px'
            }}
          >
            <span className="hero-title-line" style={{ display: 'block' }}>
              See the signals before
            </span>
            <span className="hero-title-line" style={{ display: 'block' }}>
              they become a crisis.
            </span>
          </h1>

          {/* Concise Supporting Description */}
          <p
            className="hero-desc font-body"
            style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: isDark ? '#9AA9BA' : '#475569',
              maxWidth: '520px',
              marginBottom: '32px'
            }}
          >
            Aegis-ICU brings vital trends, laboratory evidence, and medication context together through specialized AI agents to support earlier recognition of potential sepsis risk.
          </p>

          {/* Actions & Inline Transition */}
          <div className="hero-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <button
              onClick={() => scrollTo('#problem', { offset: -64 })}
              className="btn-primary"
            >
              <span>Explore Aegis</span>
              <ArrowDown size={14} />
            </button>

            <button
              onClick={() => scrollTo('#how-it-works', { offset: -64 })}
              className="btn-secondary"
            >
              <span>Discover how it works</span>
            </button>
          </div>

          {/* Clinical Assurance Pillars */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            paddingTop: '20px',
            borderTop: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: isDark ? '#9AA9BA' : '#64748B'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} color={isDark ? "#35D6C5" : "#0D9488"} />
              <span>Human-in-the-Loop</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} color={isDark ? "#35D6C5" : "#0D9488"} />
              <span>Transparent Evidence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} color={isDark ? "#35D6C5" : "#0D9488"} />
              <span>Zero Black-Box Alerts</span>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Telemetry Visual */}
        <div ref={visualCardRef} style={{ transformOrigin: 'center center' }}>
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
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </section>
  );
}
