import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { AlertCircle, CheckCircle2, History, Check, ArrowRight } from 'lucide-react';

export default function AlertExperienceSection() {
  const { isDark } = useTheme();
  const [bundleChecks, setBundleChecks] = useState({
    lactate: true,
    cultures: true,
    antibiotics: true,
    fluids: false
  });

  const [decisionState, setDecisionState] = useState(null); // 'AUTHORIZED' | 'OVERRIDDEN' | null

  const toggleCheck = (key) => {
    setBundleChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section
      id="clinical-review"
      style={{
        position: 'relative',
        padding: '72px 24px',
        background: isDark ? '#080E18' : '#F8FAFC',
        borderBottom: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px auto' }}>
          <div style={{ marginBottom: '12px' }}>
            <span className="eyebrow-tag">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#35D6C5' }} />
              EXPLAINABLE CLINICAL ALERT &amp; GOVERNANCE
            </span>
          </div>

          <h2 className="font-display" style={{
            fontSize: 'clamp(1.9rem, 3.4vw, 2.75rem)',
            fontWeight: 650,
            lineHeight: 1.15,
            color: isDark ? '#F1F5FA' : '#0F172A',
            marginBottom: '14px'
          }}>
            Every alert should come with a reason.
          </h2>

          <p className="font-body" style={{ fontSize: '15px', color: isDark ? '#9AA9BA' : '#475569', lineHeight: 1.6 }}>
            Black-box scores generate alarm fatigue and clinical hesitation. HourZero deconstructs each assessment into physiological, biochemical, and pharmacological evidence before requesting clinician authorization.
          </p>
        </div>

        {/* Consolidated Card: Alert Evidence + Clinician Review */}
        <div className="ui-panel" style={{
          background: isDark ? '#0D1624' : '#FFFFFF',
          border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* Alert Header Bar */}
          <div style={{
            padding: '16px 20px',
            background: isDark ? '#111C2B' : '#F1F5F9',
            borderBottom: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: isDark ? '#162337' : '#E2E8F0',
                border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={18} color="#FF5268" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#F1F5FA' : '#0F172A' }}>
                    ICU-BED-04 (P-10492)
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    background: isDark ? '#162337' : '#E2E8F0',
                    color: '#FF5268',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
                    fontWeight: 600
                  }}>
                    ELEVATED RISK: 84%
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: isDark ? '#617285' : '#64748B', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  Age 68 • Post-Op Day 2 • Illustrative Demonstration Data
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isDark ? '#9AA9BA' : '#475569' }}>
              Generated: 3 mins ago • Human-in-the-Loop Active
            </div>
          </div>

          {/* 3 Evidence Streams Breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: '#1A2738'
          }} className="alert-evidence-grid">
            <div style={{ background: isDark ? '#0D1624' : '#FFFFFF', padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#35D6C5', fontWeight: 600, marginBottom: '6px' }}>
                1. VITALS EVIDENCE
              </div>
              <p style={{ fontSize: '13px', color: isDark ? '#F1F5FA' : '#0F172A', margin: 0, lineHeight: 1.5 }}>
                Insidious heart rate creep (+20 bpm over 3h) alongside compensated systolic BP (116/74 mmHg). Shock index elevated to 0.87.
              </p>
            </div>

            <div style={{ background: isDark ? '#0D1624' : '#FFFFFF', padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#559BFF', fontWeight: 600, marginBottom: '6px' }}>
                2. LABORATORY EVIDENCE
              </div>
              <p style={{ fontSize: '13px', color: isDark ? '#F1F5FA' : '#0F172A', margin: 0, lineHeight: 1.5 }}>
                Last serum lactate (1.1 mmol/L) is 9.2 hours stale. Platelet count decreased 18%. Repeat STAT draw prompt dispatched.
              </p>
            </div>

            <div style={{ background: isDark ? '#0D1624' : '#FFFFFF', padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#E5B86A', fontWeight: 600, marginBottom: '6px' }}>
                3. MEDICATION CONTEXT
              </div>
              <p style={{ fontSize: '13px', color: isDark ? '#F1F5FA' : '#0F172A', margin: 0, lineHeight: 1.5 }}>
                Albuterol half-life elapsed (&gt;90% cleared). Confounder discount rule rejected. True deterioration pattern confirmed.
              </p>
            </div>
          </div>

          {/* Clinician Review & Surviving Sepsis Bundle Action Area */}
          <div style={{
            padding: '20px',
            background: isDark ? '#080E18' : '#F8FAFC',
            borderTop: '1px solid #243247'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#35D6C5', fontWeight: 600 }}>
                SURVIVING SEPSIS CAMPAIGN (SEPSIS-3) 1-HOUR BUNDLE CONSIDERATIONS:
              </span>
              <span style={{ fontSize: '11px', color: isDark ? '#617285' : '#64748B', fontFamily: 'var(--font-mono)' }}>
                Demonstration Environment — Not for clinical use
              </span>
            </div>

            {/* Checklist */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginBottom: '16px'
            }} className="bundle-checklist">
              {[
                { key: 'lactate', text: 'Measure STAT Blood Lactate (re-measure if initial > 2 mmol/L)' },
                { key: 'cultures', text: 'Obtain blood cultures prior to administration of antibiotics' },
                { key: 'antibiotics', text: 'Administer broad-spectrum IV antimicrobials' },
                { key: 'fluids', text: 'Rapid crystalloid administration (30 mL/kg for hypoperfusion)' }
              ].map((item) => {
                const checked = bundleChecks[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleCheck(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: checked ? '#111C2B' : '#0D1624',
                      border: checked ? '1px solid #35D6C5' : '1px solid #1A2738',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      color: checked ? '#F1F5FA' : '#9AA9BA'
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      background: checked ? '#35D6C5' : 'transparent',
                      border: checked ? 'none' : '1px solid #617285',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {checked && <Check size={11} color="#080E18" strokeWidth={3} />}
                    </div>
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                {decisionState && (
                  <span style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: decisionState === 'AUTHORIZED' ? '#35D6C5' : '#FF5268',
                    fontWeight: 600
                  }}>
                    {decisionState === 'AUTHORIZED' ? '✓ Illustrative Event: 1-Hour Bundle Authorized' : '⚠ Illustrative Event: Override Logged with Rationale'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setDecisionState('OVERRIDDEN')}
                  className="btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  Override AI (Log Rationale)
                </button>

                <button
                  onClick={() => setDecisionState('AUTHORIZED')}
                  className="btn-primary"
                  style={{ fontSize: '13px', padding: '8px 18px' }}
                >
                  <span>Authorize Sepsis Bundle</span>
                  <CheckCircle2 size={15} />
                </button>
              </div>
            </div>

            {/* Audit Log Box (Factual, no unsupported FDA compliance claim) */}
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '6px',
              background: isDark ? '#0D1624' : '#FFFFFF',
              border: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: isDark ? '#9AA9BA' : '#475569',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                <span style={{ color: '#35D6C5' }}>ILLUSTRATIVE AUDIT TRAIL:</span> Demo Clinician 01 • Review ID #DEMO-2026-90412
              </div>
              <div style={{ color: isDark ? '#617285' : '#64748B' }}>
                Demonstration Environment • Doctor maintains 100% prescriptive authority
              </div>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .alert-evidence-grid {
            grid-template-columns: 1fr !important;
          }
          .bundle-checklist {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
