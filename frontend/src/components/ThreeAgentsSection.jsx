import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, FlaskConical, Pill, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { WORKFLOW_STEPS } from '../utils/constants';

gsap.registerPlugin(ScrollTrigger);

export default function ThreeAgentsSection() {
  const containerRef = useRef(null);
  const pinRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0); // 0: Vitals, 1: Labs, 2: Medication, 3: Convergence

  useGSAP(() => {
    const pin = pinRef.current;

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top 64px',
      end: '+=180%', // Compact, tight pinned duration
      pin: pin,
      pinSpacing: true,
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        if (p < 0.28) {
          setActiveStage(0);
        } else if (p < 0.58) {
          setActiveStage(1);
        } else if (p < 0.84) {
          setActiveStage(2);
        } else {
          setActiveStage(3);
        }
      }
    });

  }, { scope: containerRef });

  return (
    <section
      id="intelligence"
      ref={containerRef}
      style={{
        position: 'relative',
        background: '#0D1624',
        borderBottom: '1px solid #1A2738'
      }}
    >
      <div
        ref={pinRef}
        style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '36px 24px',
          maxWidth: '1320px',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Strip with Step Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span className="eyebrow-tag" style={{ marginBottom: '8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#35D6C5' }} />
              DOMAIN-SPECIFIC AI ARCHITECTURE
            </span>
            <h2 className="font-display" style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 650,
              color: '#F1F5FA',
              marginTop: '4px'
            }}>
              Three agents. One clearer clinical picture.
            </h2>
          </div>

          {/* Clean Flat Stepper Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { label: "1. Vitals", color: "#35D6C5" },
              { label: "2. Labs", color: "#559BFF" },
              { label: "3. Medication", color: "#E5B86A" },
              { label: "4. Convergence", color: "#F1F5FA" }
            ].map((step, idx) => (
              <button
                key={step.label}
                onClick={() => setActiveStage(idx)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: activeStage === idx ? `1px solid ${step.color}` : '1px solid #243247',
                  background: activeStage === idx ? '#162337' : '#080E18',
                  color: activeStage === idx ? step.color : '#9AA9BA',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pinned Split-Screen Storytelling Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.15fr',
          gap: '36px',
          alignItems: 'center',
          marginBottom: '28px'
        }} className="agents-split-grid">
          
          {/* Left Column: Changing Narrative */}
          <div>
            {activeStage === 0 && (
              <div key="vitals" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#111C2B', border: '1px solid #243247', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={16} color="#35D6C5" />
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#35D6C5', fontWeight: 600 }}>
                    AGENT 01 • PHYSIOLOGICAL INTELLIGENCE
                  </span>
                </div>

                <h3 className="font-display" style={{ fontSize: '24px', fontWeight: 650, color: '#F1F5FA', marginBottom: '10px' }}>
                  Vitals Agent: Random Forest Pattern Analysis
                </h3>

                <p className="font-body" style={{ fontSize: '14.5px', color: '#9AA9BA', lineHeight: 1.6, marginBottom: '18px' }}>
                  A trained Random Forest model scores rolling 5-minute telemetry vectors. It detects subtle multi-signal decoupling—such as heart rate creep paired with compensatory systolic blood pressure—hours before isolated thresholds trigger.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ background: '#080E18', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#617285' }}>HEART RATE TRAJECTORY</span>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#35D6C5', margin: '2px 0' }}>+20 bpm / 3h</div>
                    <span style={{ fontSize: '10px', color: '#9AA9BA' }}>Insidious creep</span>
                  </div>
                  <div style={{ background: '#080E18', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#617285' }}>SHOCK INDEX</span>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#E5B86A', margin: '2px 0' }}>0.87 (Occult)</div>
                    <span style={{ fontSize: '10px', color: '#9AA9BA' }}>Widening ratio</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#9AA9BA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="#35D6C5" />
                    <span>Evaluates continuous HR, BP, respiratory rate, and core temperature</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="#35D6C5" />
                    <span>Identifies occult compensation ahead of systolic collapse</span>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 1 && (
              <div key="labs" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#111C2B', border: '1px solid #243247', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FlaskConical size={16} color="#559BFF" />
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#559BFF', fontWeight: 600 }}>
                    AGENT 02 • LABORATORY INTELLIGENCE
                  </span>
                </div>

                <h3 className="font-display" style={{ fontSize: '24px', fontWeight: 650, color: '#F1F5FA', marginBottom: '10px' }}>
                  Laboratory Agent: Biomarkers &amp; Staleness
                </h3>

                <p className="font-body" style={{ fontSize: '14.5px', color: '#9AA9BA', lineHeight: 1.6, marginBottom: '18px' }}>
                  Correlates blood lactate, leukocytosis (WBC), consumptive thrombocytopenia (platelets), and serum creatinine while actively flagging stale specimens to ensure clinical assessments reflect current organ status.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ background: '#080E18', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#617285' }}>SERUM LACTATE</span>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#559BFF', margin: '2px 0' }}>2.8 mmol/L</div>
                    <span style={{ fontSize: '10px', color: '#E5B86A' }}>Hypoperfusion marker</span>
                  </div>
                  <div style={{ background: '#080E18', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#617285' }}>DATA STALENESS</span>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#FF5268', margin: '2px 0' }}>8.2h Old</div>
                    <span style={{ fontSize: '10px', color: '#FF5268' }}>STAT Redraw Urged</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#9AA9BA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="#559BFF" />
                    <span>Automated prompts for STAT repeat lactate redraws</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="#559BFF" />
                    <span>Monitors platelet consumption rate for early coagulopathy</span>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 2 && (
              <div key="meds" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#111C2B', border: '1px solid #243247', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Pill size={16} color="#E5B86A" />
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#E5B86A', fontWeight: 600 }}>
                    AGENT 03 • MEDICATION CONTEXT
                  </span>
                </div>

                <h3 className="font-display" style={{ fontSize: '24px', fontWeight: 650, color: '#F1F5FA', marginBottom: '10px' }}>
                  Context Agent: The Clinical Skeptic
                </h3>

                <p className="font-body" style={{ fontSize: '14.5px', color: '#9AA9BA', lineHeight: 1.6, marginBottom: '18px' }}>
                  Audits the electronic Medication Administration Record (eMAR). Evaluates drug half-lives to discount expected pharmacological confounders (e.g. beta-agonists) without ever independently suppressing critical alerts.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ background: '#080E18', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#617285' }}>RECENT DRUG ADMIN</span>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#E5B86A', margin: '2px 0' }}>Albuterol 2.5mg</div>
                    <span style={{ fontSize: '10px', color: '#9AA9BA' }}>Given 5h ago (decayed)</span>
                  </div>
                  <div style={{ background: '#080E18', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#617285' }}>CONFOUNDER RULE</span>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#FF5268', margin: '2px 0' }}>Discount Rejected</div>
                    <span style={{ fontSize: '10px', color: '#9AA9BA' }}>True Deterioration</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#9AA9BA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="#E5B86A" />
                    <span>Filters false positives caused by known bronchodilator drugs</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="#E5B86A" />
                    <span>Safety constraint: Never suppresses alerts during organ hypoperfusion</span>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 3 && (
              <div key="convergence" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#111C2B', border: '1px solid #243247', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={16} color="#35D6C5" />
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#35D6C5', fontWeight: 600 }}>
                    SYNTHESIS • AEGIS DECISION ENGINE
                  </span>
                </div>

                <h3 className="font-display" style={{ fontSize: '24px', fontWeight: 650, color: '#F1F5FA', marginBottom: '10px' }}>
                  Neuro-Symbolic Evidence Synthesis
                </h3>

                <p className="font-body" style={{ fontSize: '14.5px', color: '#9AA9BA', lineHeight: 1.6, marginBottom: '18px' }}>
                  All three evidence streams converge into an explainable consensus score, delivering full transparent rationales directly to the bedside flight deck for clinician review.
                </p>

                <div style={{
                  background: '#080E18',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #243247',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#35D6C5', fontWeight: 600 }}>
                      COMPOSITE RISK PROBABILITY: 84%
                    </span>
                    <span style={{ fontSize: '10px', color: '#9AA9BA', fontFamily: 'var(--font-mono)' }}>CONFIDENCE: HIGH</span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#F1F5FA', margin: 0, lineHeight: 1.5 }}>
                    Progressive tachycardia decoupled from systolic pressure + elevated lactate kinetics without active confounding medication effects.
                  </p>
                </div>

                <div style={{ fontSize: '12px', color: '#35D6C5', fontFamily: 'var(--font-mono)' }}>
                  ✓ Ready for clinician 1-Hour Sepsis Bundle authorization
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Evolving Clean Visual Panel */}
          <div className="ui-panel" style={{ padding: '24px', background: '#111C2B' }}>
            {activeStage === 0 && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#35D6C5', fontWeight: 600 }}>TELEMETRY VECTOR ANALYSIS</span>
                  <span style={{ color: '#9AA9BA' }}>RANDOM FOREST MODEL</span>
                </div>

                <div style={{ background: '#080E18', padding: '12px', borderRadius: '6px', border: '1px solid #1A2738', marginBottom: '14px' }}>
                  <div style={{ fontSize: '10px', color: '#617285', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    ART PRESSURE &amp; PULSE DRIFT
                  </div>
                  <svg viewBox="0 0 400 50" style={{ width: '100%', height: '50px' }}>
                    <path
                      d="M0,35 Q20,35 30,10 T50,22 T60,32 T90,35 Q110,35 120,10 T140,22 T150,32 T180,35 Q200,35 210,10 T230,22 T240,32 T270,35 Q290,35 300,10 T320,22 T330,32 T360,35 Q380,35 390,10 T400,22"
                      fill="none"
                      stroke="#35D6C5"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#617285' }}>
                    ATTRIBUTION WEIGHTS:
                  </span>
                  {[
                    { label: "Shock Index Slope (dSI/dt)", val: 88, color: "#FF5268" },
                    { label: "Heart Rate Variance (5-min)", val: 79, color: "#35D6C5" },
                    { label: "Respiratory Volatility", val: 64, color: "#559BFF" },
                    { label: "Core Temp Gradient", val: 45, color: "#E5B86A" }
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                        <span style={{ color: '#F1F5FA' }}>{item.label}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: item.color }}>{item.val}%</span>
                      </div>
                      <div style={{ height: '3px', background: '#080E18', borderRadius: '1.5px' }}>
                        <div style={{ height: '100%', width: `${item.val}%`, background: item.color, borderRadius: '1.5px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeStage === 1 && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#559BFF', fontWeight: 600 }}>BIOCHEMICAL EVIDENCE</span>
                  <span style={{ color: '#9AA9BA' }}>SOFA SCORE: +2</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ background: '#080E18', padding: '12px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                    <div style={{ fontSize: '10px', color: '#617285', fontFamily: 'var(--font-mono)' }}>SERUM LACTATE</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#FF5268', margin: '2px 0' }}>2.8 <span style={{ fontSize: '10px' }}>mmol/L</span></div>
                    <div style={{ fontSize: '10px', color: '#FF5268' }}>Elevated STAT</div>
                  </div>
                  <div style={{ background: '#080E18', padding: '12px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                    <div style={{ fontSize: '10px', color: '#617285', fontFamily: 'var(--font-mono)' }}>WHITE BLOOD CELLS</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#559BFF', margin: '2px 0' }}>16.8 <span style={{ fontSize: '10px' }}>x10⁹/L</span></div>
                    <div style={{ fontSize: '10px', color: '#559BFF' }}>Leukocytosis</div>
                  </div>
                  <div style={{ background: '#080E18', padding: '12px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                    <div style={{ fontSize: '10px', color: '#617285', fontFamily: 'var(--font-mono)' }}>PLATELETS</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#E5B86A', margin: '2px 0' }}>128 <span style={{ fontSize: '10px' }}>x10⁹/L</span></div>
                    <div style={{ fontSize: '10px', color: '#E5B86A' }}>Consumptive drop</div>
                  </div>
                  <div style={{ background: '#080E18', padding: '12px', borderRadius: '6px', border: '1px solid #1A2738' }}>
                    <div style={{ fontSize: '10px', color: '#617285', fontFamily: 'var(--font-mono)' }}>CREATININE</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5FA', margin: '2px 0' }}>1.4 <span style={{ fontSize: '10px' }}>mg/dL</span></div>
                    <div style={{ fontSize: '10px', color: '#9AA9BA' }}>KDIGO Stage 1</div>
                  </div>
                </div>

                <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: '#080E18',
                  border: '1px solid #243247',
                  fontSize: '11px',
                  color: '#9AA9BA'
                }}>
                  Lactate specimen age exceeds normative fresh window. Redraw prompt queued for attending nurse.
                </div>
              </div>
            )}

            {activeStage === 2 && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#E5B86A', fontWeight: 600 }}>PHARMACOKINETICS AUDIT</span>
                  <span style={{ color: '#9AA9BA' }}>eMAR SYNCED</span>
                </div>

                <div style={{ background: '#080E18', padding: '12px', borderRadius: '6px', border: '1px solid #1A2738', marginBottom: '14px' }}>
                  <div style={{ fontSize: '10px', color: '#617285', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                    ALBUTEROL CLEARANCE DECAY
                  </div>
                  <svg viewBox="0 0 400 65" style={{ width: '100%', height: '65px' }}>
                    <path
                      d="M10,12 Q50,15 110,38 T230,58 L390,60"
                      fill="none"
                      stroke="#E5B86A"
                      strokeWidth="2"
                    />
                    <circle cx="10" cy="12" r="3" fill="#E5B86A" />
                    <text x="20" y="16" fill="#E5B86A" fontSize="9" fontFamily="var(--font-mono)">Administered 14:00</text>
                    <circle cx="230" cy="58" r="3" fill="#FF5268" />
                    <text x="240" y="54" fill="#FF5268" fontSize="9" fontFamily="var(--font-mono)">T½ Elapsed</text>
                  </svg>
                </div>

                <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: '#080E18',
                  border: '1px solid #243247',
                  fontSize: '11.5px',
                  color: '#9AA9BA'
                }}>
                  Tachypnea and shock index continue past beta-agonist elimination half-life. Confounder discount probability calculated at <strong>0.04</strong> (discount rejected).
                </div>
              </div>
            )}

            {activeStage === 3 && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#35D6C5', fontWeight: 600 }}>UNIFIED CONSENSUS BLUEPRINT</span>
                  <span style={{ color: '#9AA9BA' }}>READY FOR REVIEW</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '8px 12px', background: '#080E18', borderRadius: '6px', borderLeft: '3px solid #35D6C5', fontSize: '11.5px' }}>
                    <strong style={{ color: '#35D6C5' }}>Vitals:</strong> Insidious rate creep +20 bpm decoupled from systolic blood pressure.
                  </div>
                  <div style={{ padding: '8px 12px', background: '#080E18', borderRadius: '6px', borderLeft: '3px solid #559BFF', fontSize: '11.5px' }}>
                    <strong style={{ color: '#559BFF' }}>Labs:</strong> Serum lactate 2.8 mmol/L with consumptive platelet decline.
                  </div>
                  <div style={{ padding: '8px 12px', background: '#080E18', borderRadius: '6px', borderLeft: '3px solid #E5B86A', fontSize: '11.5px' }}>
                    <strong style={{ color: '#E5B86A' }}>Medication:</strong> Bronchodilator half-life elapsed; confounder ruled out.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact 6-Stage Workflow Ticker Strip at the base */}
        <div id="how-it-works" style={{
          paddingTop: '20px',
          borderTop: '1px solid #1A2738'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#617285', textTransform: 'uppercase' }}>
              HOW AEGIS WORKS • 6-STAGE DATA PIPELINE
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '8px'
          }} className="workflow-strip">
            {WORKFLOW_STEPS.map((s) => (
              <div key={s.step} style={{
                background: '#080E18',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #1A2738'
              }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#35D6C5' }}>{s.step}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5FA', margin: '2px 0' }}>{s.title}</div>
                <div style={{ fontSize: '10px', color: '#617285', lineHeight: 1.3 }}>{s.role}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 900px) {
          .agents-split-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .workflow-strip {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
