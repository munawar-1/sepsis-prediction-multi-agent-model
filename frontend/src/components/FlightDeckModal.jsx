import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Activity, ExternalLink } from 'lucide-react';

export default function FlightDeckModal({ isOpen, onClose, onLaunchDashboard }) {
  const { isDark } = useTheme();
  const [patientId] = useState("ICU-BED-04 (p000011)");
  const [hourIndex] = useState(22);
  const [urgency] = useState("ELEVATED RISK");
  const [actionStatus, setActionStatus] = useState(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(4, 8, 15, 0.85)'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{
            width: '100%',
            maxWidth: '1040px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: '#0B1120',
            border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1F2937',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: isDark ? '#0D1624' : '#FFFFFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                background: isDark ? '#111C2B' : '#F1F5F9',
                border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={16} color="#35D6C5" />
              </div>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#F1F5FA' : '#0F172A', margin: 0, fontFamily: 'var(--font-display)' }}>
                  HourZero | Clinical Flight Deck Console
                </h2>
                <p style={{ fontSize: '11px', color: isDark ? '#9AA9BA' : '#475569', margin: '2px 0 0 0', fontFamily: 'var(--font-mono)' }}>
                  Multi-Agent Deterioration &amp; Alert Fatigue Prevention Concept
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', padding: '3px 8px', backgroundColor: '#162337', border: isDark ? '1px solid #243247' : '1px solid #E2E8F0', borderRadius: '4px', fontFamily: 'var(--font-mono)', color: isDark ? '#F1F5FA' : '#0F172A' }}>
                Active Bed: <strong>{patientId}</strong>
              </span>
              <span style={{ fontSize: '11px', padding: '3px 8px', backgroundColor: '#111C2B', color: '#FF5268', border: isDark ? '1px solid #243247' : '1px solid #E2E8F0', borderRadius: '4px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {urgency}
              </span>
              <button
                onClick={onClose}
                style={{
                  background: isDark ? '#162337' : '#E2E8F0',
                  border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
                  borderRadius: '4px',
                  color: isDark ? '#9AA9BA' : '#475569',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
            
            {/* Left: Telemetry & Multi-Agent Signals */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#F1F5FA' : '#0F172A', fontFamily: 'var(--font-mono)' }}>
                  SYNCHRONIZED TELEMETRY FEEDS (T-{hourIndex}h)
                </span>
                <span style={{ fontSize: '11px', color: '#35D6C5', fontFamily: 'var(--font-mono)' }}>
                  Real-time Processing
                </span>
              </div>

              {/* Vitals Summary Card */}
              <div style={{
                background: '#070C15',
                border: '1px solid #1F2937',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0', paddingBottom: '10px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isDark ? '#9AA9BA' : '#475569' }}>HEART RATE</span>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#FF5268', fontFamily: 'var(--font-display)' }}>108 bpm</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isDark ? '#9AA9BA' : '#475569' }}>BLOOD PRESSURE</span>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#35D6C5', fontFamily: 'var(--font-display)' }}>84/52 mmHg (MAP 63)</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isDark ? '#9AA9BA' : '#475569' }}>SHOCK INDEX</span>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#FF5268', fontFamily: 'var(--font-display)' }}>1.28</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: isDark ? '#9AA9BA' : '#475569' }}>
                  <span>Temperature: <strong style={{ color: isDark ? '#F1F5FA' : '#0F172A' }}>38.8 °C</strong></span>
                  <span>Resp Rate: <strong style={{ color: isDark ? '#F1F5FA' : '#0F172A' }}>24 /min</strong></span>
                  <span>SpO₂: <strong style={{ color: isDark ? '#F1F5FA' : '#0F172A' }}>93% on 3L</strong></span>
                </div>
              </div>

              {/* Three Agents Attribution Breakdowns */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: isDark ? '#0D1624' : '#FFFFFF', border: '1px solid #1F2937', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#35D6C5', fontFamily: 'var(--font-mono)' }}>AGENT 1: Vitals Intelligence</span>
                    <span style={{ fontSize: '11px', color: '#FF5268', fontWeight: 600 }}>Severe Risk (Score 0.88)</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: isDark ? '#9AA9BA' : '#475569', margin: 0 }}>
                    Shock index widening rapidly ($108 / 84 = 1.28$). Acute tachycardia uncoupled from compensatory vasoconstriction.
                  </p>
                </div>

                <div style={{ background: isDark ? '#0D1624' : '#FFFFFF', border: '1px solid #1F2937', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#559BFF', fontFamily: 'var(--font-mono)' }}>AGENT 2: Laboratory Intelligence</span>
                    <span style={{ fontSize: '11px', color: '#E5B86A', fontWeight: 600 }}>Elevated Sepsis Triad</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: isDark ? '#9AA9BA' : '#475569', margin: 0 }}>
                    Venous Lactate 3.8 mmol/L (acute doubling). WBC 16.4 with 14% bandemia indicating occult bacterial dissemination.
                  </p>
                </div>

                <div style={{ background: isDark ? '#0D1624' : '#FFFFFF', border: '1px solid #1F2937', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#E5B86A', fontFamily: 'var(--font-mono)' }}>AGENT 3: Medication Context</span>
                    <span style={{ fontSize: '11px', color: '#35D6C5', fontWeight: 600 }}>Active Vasopressor Support</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: isDark ? '#9AA9BA' : '#475569', margin: 0 }}>
                    Norepinephrine titrated to 0.08 mcg/kg/min at 07:45. Tachycardia cannot be attributed to beta-agonist confounders alone.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Clinician Governance & Actions */}
            <div style={{
              background: isDark ? '#0D1624' : '#FFFFFF',
              border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#F1F5FA' : '#0F172A', margin: '0 0 8px 0', fontFamily: 'var(--font-display)' }}>
                  HourZero Consensus Directive
                </h3>
                <p style={{ fontSize: '12px', color: isDark ? '#9AA9BA' : '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  High confidence indication of early septic decompensation. Recommend initiating Sepsis-3 1-Hour Bundled Care Protocol under attending physician oversight.
                </p>

                <div style={{
                  padding: '12px',
                  background: '#070C15',
                  border: '1px solid #1F2937',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#35D6C5', marginBottom: '6px' }}>
                    RECOMMENDED ACTIONS:
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11.5px', color: isDark ? '#F1F5FA' : '#0F172A' }}>
                    <li style={{ padding: '4px 0', borderBottom: '1px solid #1F2937' }}>✓ STAT Arterial Blood Gas &amp; Lactate</li>
                    <li style={{ padding: '4px 0', borderBottom: '1px solid #1F2937' }}>✓ Blood Cultures prior to broad antimicrobials</li>
                    <li style={{ padding: '4px 0', borderBottom: '1px solid #1F2937' }}>✓ 30 mL/kg balanced crystalloid resuscitation</li>
                    <li style={{ padding: '4px 0' }}>✓ Vasopressor titration targeting MAP ≥ 65 mmHg</li>
                  </ul>
                </div>
              </div>

              <div>
                {actionStatus ? (
                  <div style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: isDark ? '#162337' : '#E2E8F0',
                    border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
                    color: actionStatus === 'AUTHORIZED' ? '#35D6C5' : '#FF5268',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'center',
                    fontWeight: 600,
                    marginBottom: '10px'
                  }}>
                    {actionStatus === 'AUTHORIZED' ? 'Bundle Authorized & Dispatched to Bedside' : 'Override Logged with Attending Signature'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    <button
                      onClick={() => setActionStatus('AUTHORIZED')}
                      className="btn-primary"
                      style={{ fontSize: '12.5px', padding: '10px' }}
                    >
                      Authorize 1-Hour Bundle
                    </button>
                    <button
                      onClick={() => setActionStatus('OVERRIDDEN')}
                      className="btn-secondary"
                      style={{ fontSize: '12px', padding: '8px' }}
                    >
                      Override AI (Mandatory Reason)
                    </button>
                  </div>
                )}

                {onLaunchDashboard && (
                  <button
                    onClick={onLaunchDashboard}
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      fontSize: '12px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: '#35D6C5'
                    }}
                  >
                    <span>Launch Clinical Intelligence Workspace</span>
                    <ExternalLink size={13} />
                  </button>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
