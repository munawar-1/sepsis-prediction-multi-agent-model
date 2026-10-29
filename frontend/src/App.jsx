import React, { useState } from 'react';

export default function App() {
  const [patientId, setPatientId] = useState("ICU-BED-04 (p000011)");
  const [hourIndex, setHourIndex] = useState(22);
  const [urgency, setUrgency] = useState("CRITICAL_SEPSIS");

  return (
    <div style={{ backgroundColor: '#0B1120', minHeight: '100vh', color: '#F3F4F6', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#38BDF8', margin: 0 }}>AEGIS-ICU | Clinical Flight Deck</h1>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>Neuro-Symbolic Multi-Agent Sepsis Deterioration &amp; Alert Fatigue Prevention</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', padding: '4px 10px', backgroundColor: '#1E293B', borderRadius: '4px' }}>Active Bed: <strong>{patientId}</strong></span>
          <span style={{ fontSize: '13px', padding: '4px 10px', backgroundColor: '#EF4444', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>{urgency}</span>
        </div>
      </header>

      <main style={{ padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Telemetry Strip & Evidence */}
        <section style={{ backgroundColor: '#111827', borderRadius: '8px', padding: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '16px', color: '#F9FAFB', marginBottom: '16px' }}>Hour {hourIndex} Bedside Telemetry vs. Baseline Scorecards</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#1F2937', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Heart Rate</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#EF4444' }}>101 <span style={{ fontSize: '12px' }}>bpm</span></div>
              <div style={{ fontSize: '11px', color: '#F87171' }}>Creeping: +20 over 3h</div>
            </div>
            <div style={{ backgroundColor: '#1F2937', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Blood Pressure</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>146/91</div>
              <div style={{ fontSize: '11px', color: '#10B981' }}>Compensated (SBP &gt; 100)</div>
            </div>
            <div style={{ backgroundColor: '#1F2937', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Shock Index (HR/SBP)</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B' }}>0.69 <span style={{ fontSize: '12px' }}>$\to$ 0.98</span></div>
              <div style={{ fontSize: '11px', color: '#F59E0B' }}>Occult Shock Imminent</div>
            </div>
            <div style={{ backgroundColor: '#1F2937', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Standard NEWS2</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9CA3AF' }}>3 / 20</div>
              <div style={{ fontSize: '11px', color: '#EF4444' }}>MISSED (Rule-based blindspot)</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1E1B4B', padding: '16px', borderRadius: '6px', border: '1px solid #4338CA' }}>
            <h3 style={{ fontSize: '14px', color: '#818CF8', margin: '0 0 8px 0' }}>Multi-Agent Cross-Verification Consensus</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              <strong>Vitals Agent (Risk: 84%):</strong> Detected progressive tachycardia decoupled from systolic compensation.<br/>
              <strong>Labs Agent (Status: STAT_REQUIRED):</strong> Last Lactate (1.1 mmol/L) is 9 hours stale. Immediate STAT draw requested.<br/>
              <strong>Skeptic Agent (Discount: 0.05):</strong> Albuterol administered 6 hours ago cannot account for concurrent tachypnea (Resp: 21) and widening Shock Index. Genuine deterioration confirmed.
            </p>
          </div>
        </section>

        {/* HITL Action Panel */}
        <section style={{ backgroundColor: '#111827', borderRadius: '8px', padding: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '16px', color: '#F9FAFB', marginBottom: '16px' }}>HITL Clinical Action Center</h2>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '16px' }}>
            Surviving Sepsis Campaign (Sepsis-3) 1-Hour Bundle recommended. Clinician authorization required:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', fontSize: '13px' }}>
            <li style={{ padding: '8px 0', borderBottom: '1px solid #1F2937' }}>&#x2705; Measure STAT Blood Lactate</li>
            <li style={{ padding: '8px 0', borderBottom: '1px solid #1F2937' }}>&#x2705; Blood Cultures x 2 prior to antibiotics</li>
            <li style={{ padding: '8px 0', borderBottom: '1px solid #1F2937' }}>&#x2705; Empiric IV Broad-Spectrum Antimicrobials</li>
            <li style={{ padding: '8px 0' }}>&#x2705; Rapid Crystalloid Infusion (30 mL/kg)</li>
          </ul>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button style={{ backgroundColor: '#10B981', color: 'white', padding: '12px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
              Authorize 1-Hour Sepsis Bundle
            </button>
            <button style={{ backgroundColor: '#374151', color: '#F3F4F6', padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
              Override AI (Mandatory Clinical Reason)
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
