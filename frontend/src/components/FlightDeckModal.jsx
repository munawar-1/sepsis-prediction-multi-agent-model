import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Activity } from 'lucide-react';

export default function FlightDeckModal({ isOpen, onClose }) {
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
            border: '1px solid #243247',
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
            background: '#0D1624'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                background: '#111C2B',
                border: '1px solid #243247',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={16} color="#35D6C5" />
              </div>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F1F5FA', margin: 0, fontFamily: 'var(--font-display)' }}>
                  AEGIS-ICU | Clinical Flight Deck Console
                </h2>
                <p style={{ fontSize: '11px', color: '#9AA9BA', margin: '2px 0 0 0', fontFamily: 'var(--font-mono)' }}>
                  Multi-Agent Deterioration &amp; Alert Fatigue Prevention Concept
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', padding: '3px 8px', backgroundColor: '#162337', border: '1px solid #243247', borderRadius: '4px', fontFamily: 'var(--font-mono)', color: '#F1F5FA' }}>
                Active Bed: <strong>{patientId}</strong>
              </span>
              <span style={{ fontSize: '11px', padding: '3px 8px', backgroundColor: '#111C2B', color: '#FF5268', border: '1px solid #243247', borderRadius: '4px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {urgency}
              </span>
              <button
                onClick={onClose}
                style={{
                  background: '#162337',
                  border: '1px solid #243247',
                  color: '#9AA9BA',
                  padding: '4px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginLeft: '6px'
                }}
                aria-label="Close Flight Deck"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Flight Deck Body */}
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            
            {/* Main Column */}
            <div>
              <div style={{ backgroundColor: '#111827', borderRadius: '8px', padding: '16px', border: '1px solid #1F2937', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '13.5px', color: '#F9FAFB', margin: 0, fontWeight: 600 }}>
                    Hour {hourIndex} Bedside Telemetry vs. Baseline
                  </h3>
                  <span style={{ fontSize: '10.5px', color: '#35D6C5', fontFamily: 'var(--font-mono)' }}>
                    Continuous Feed
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ backgroundColor: '#162337', padding: '10px', borderRadius: '6px', border: '1px solid #243247' }}>
                    <div style={{ fontSize: '10px', color: '#9AA9BA', fontFamily: 'var(--font-mono)' }}>Heart Rate</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FF5268' }}>101 <span style={{ fontSize: '10px' }}>bpm</span></div>
                    <div style={{ fontSize: '9.5px', color: '#9AA9BA' }}>+20 over 3h</div>
                  </div>

                  <div style={{ backgroundColor: '#162337', padding: '10px', borderRadius: '6px', border: '1px solid #243247' }}>
                    <div style={{ fontSize: '10px', color: '#9AA9BA', fontFamily: 'var(--font-mono)' }}>Blood Pressure</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#35D6C5' }}>146/91</div>
                    <div style={{ fontSize: '9.5px', color: '#9AA9BA' }}>Compensated</div>
                  </div>

                  <div style={{ backgroundColor: '#162337', padding: '10px', borderRadius: '6px', border: '1px solid #243247' }}>
                    <div style={{ fontSize: '10px', color: '#9AA9BA', fontFamily: 'var(--font-mono)' }}>Shock Index</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#E5B86A' }}>0.69 → 0.98</div>
                    <div style={{ fontSize: '9.5px', color: '#9AA9BA' }}>Occult Shock</div>
                  </div>

                  <div style={{ backgroundColor: '#162337', padding: '10px', borderRadius: '6px', border: '1px solid #243247' }}>
                    <div style={{ fontSize: '10px', color: '#9AA9BA', fontFamily: 'var(--font-mono)' }}>Standard NEWS2</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9AA9BA' }}>3 / 20</div>
                    <div style={{ fontSize: '9.5px', color: '#FF5268' }}>MISSED (Blindspot)</div>
                  </div>
                </div>

                {/* Consensus Box */}
                <div style={{ backgroundColor: '#162337', padding: '14px', borderRadius: '6px', border: '1px solid #243247' }}>
                  <h4 style={{ fontSize: '12px', color: '#35D6C5', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)' }}>
                    <Activity size={14} />
                    <span>Multi-Agent Cross-Verification Consensus</span>
                  </h4>
                  <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#F1F5FA' }}>
                    <p style={{ margin: '0 0 4px 0' }}>
                      <strong style={{ color: '#35D6C5' }}>Vitals Agent (Risk: 84%):</strong> Detected progressive tachycardia decoupled from systolic compensation.
                    </p>
                    <p style={{ margin: '0 0 4px 0' }}>
                      <strong style={{ color: '#559BFF' }}>Labs Agent:</strong> Last Lactate (1.1 mmol/L) is 9 hours stale. Immediate STAT draw requested.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong style={{ color: '#E5B86A' }}>Skeptic Agent:</strong> Albuterol administered 6 hours ago cannot account for concurrent tachypnea. Deterioration pattern confirmed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Action Panel */}
            <div style={{ backgroundColor: '#111827', borderRadius: '8px', padding: '16px', border: '1px solid #1F2937', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '13.5px', color: '#F9FAFB', marginBottom: '10px', fontWeight: 600 }}>
                  Clinical Action Center
                </h3>
                <p style={{ fontSize: '11.5px', color: '#9AA9BA', marginBottom: '14px' }}>
                  Surviving Sepsis Campaign (Sepsis-3) 1-Hour Bundle considerations:
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', fontSize: '12px' }}>
                  <li style={{ padding: '6px 0', borderBottom: '1px solid #1F2937', display: 'flex', gap: '6px' }}>
                    <span>✓</span> <span>Measure STAT Blood Lactate</span>
                  </li>
                  <li style={{ padding: '6px 0', borderBottom: '1px solid #1F2937', display: 'flex', gap: '6px' }}>
                    <span>✓</span> <span>Blood Cultures prior to antibiotics</span>
                  </li>
                  <li style={{ padding: '6px 0', borderBottom: '1px solid #1F2937', display: 'flex', gap: '6px' }}>
                    <span>✓</span> <span>Broad-Spectrum Antimicrobials</span>
                  </li>
                  <li style={{ padding: '6px 0', display: 'flex', gap: '6px' }}>
                    <span>✓</span> <span>Rapid Crystalloid Infusion</span>
                  </li>
                </ul>
              </div>

              {actionStatus ? (
                <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: '#162337',
                  border: '1px solid #243247',
                  color: actionStatus === 'AUTHORIZED' ? '#35D6C5' : '#FF5268',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'center',
                  fontWeight: 600
                }}>
                  {actionStatus === 'AUTHORIZED' ? 'Bundle Authorized & Dispatched to Bedside' : 'Override Logged with Attending Signature'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
