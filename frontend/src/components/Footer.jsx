import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Shield, ArrowUp } from 'lucide-react';
import { scrollTo } from '../utils/lenis';

export default function Footer({ onOpenFlightDeck }) {
  const { isDark } = useTheme();
  return (
    <footer style={{
      background: isDark ? '#04080F' : '#F1F5F9',
      borderTop: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
      padding: '40px 24px 24px 24px',
      color: isDark ? '#9AA9BA' : '#475569',
      fontSize: '12.5px'
    }}>
      <div style={{
        maxWidth: '1320px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
        gap: '36px',
        marginBottom: '32px'
      }} className="footer-grid">
        
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              background: isDark ? '#111C2B' : '#F1F5F9',
              border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={14} color="#35D6C5" />
            </div>
            <span className="font-display" style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#F1F5FA' : '#0F172A' }}>
              AEGIS-ICU
            </span>
          </div>

          <p style={{ lineHeight: 1.5, color: isDark ? '#617285' : '#64748B', maxWidth: '300px', margin: '0 0 12px 0' }}>
            Multi-agent physiological deterioration and clinical decision support concept.
          </p>

          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#35D6C5' }}>
            ● Research Prototype Environment
          </div>
        </div>

        {/* Navigation Column */}
        <div>
          <h4 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isDark ? '#F1F5FA' : '#0F172A', textTransform: 'uppercase', marginBottom: '12px' }}>
            Navigation
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><a href="#problem" onClick={(e) => { e.preventDefault(); scrollTo('#problem', { offset: -64 }); }} style={{ color: isDark ? '#9AA9BA' : '#475569', textDecoration: 'none' }}>The Problem</a></li>
            <li><a href="#intelligence" onClick={(e) => { e.preventDefault(); scrollTo('#intelligence', { offset: -64 }); }} style={{ color: isDark ? '#9AA9BA' : '#475569', textDecoration: 'none' }}>Three-Agent Intelligence</a></li>
            <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo('#how-it-works', { offset: -64 }); }} style={{ color: isDark ? '#9AA9BA' : '#475569', textDecoration: 'none' }}>System Pipeline</a></li>
            <li><a href="#clinical-review" onClick={(e) => { e.preventDefault(); scrollTo('#clinical-review', { offset: -64 }); }} style={{ color: isDark ? '#9AA9BA' : '#475569', textDecoration: 'none' }}>Clinical Review &amp; Alert</a></li>
            <li><a href="#simulation" onClick={(e) => { e.preventDefault(); scrollTo('#simulation', { offset: -64 }); }} style={{ color: isDark ? '#9AA9BA' : '#475569', textDecoration: 'none' }}>ICU Case Replay</a></li>
          </ul>
        </div>

        {/* Clinical Frameworks */}
        <div>
          <h4 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isDark ? '#F1F5FA' : '#0F172A', textTransform: 'uppercase', marginBottom: '12px' }}>
            Evidence Standards
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', color: isDark ? '#617285' : '#64748B' }}>
            <li>Surviving Sepsis Campaign (Sepsis-3)</li>
            <li>Sequential Organ Failure (SOFA)</li>
            <li>Shock Index Decoupling ($HR/SBP$)</li>
            <li>Pharmacokinetic Elimination Modeling</li>
            <li>HL7® FHIR® R4 Interoperability</li>
          </ul>
        </div>

        {/* Clinical Console & Top */}
        <div>
          <h4 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isDark ? '#F1F5FA' : '#0F172A', textTransform: 'uppercase', marginBottom: '12px' }}>
            Console Gateway
          </h4>
          <button
            onClick={onOpenFlightDeck}
            className="btn-secondary"
            style={{ width: '100%', fontSize: '11.5px', padding: '7px 12px', marginBottom: '12px', textAlign: 'center' }}
          >
            Open Flight Deck
          </button>
          
          <button
            onClick={() => scrollTo(0)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: isDark ? '#617285' : '#64748B',
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            <ArrowUp size={13} />
            <span>Back to top</span>
          </button>
        </div>

      </div>

      {/* Mandatory Disclaimer */}
      <div style={{
        maxWidth: '1320px',
        margin: '0 auto',
        paddingTop: '18px',
        borderTop: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '10.5px',
        color: isDark ? '#617285' : '#64748B',
        fontFamily: 'var(--font-mono)'
      }}>
        <p style={{ margin: 0, maxWidth: '820px', lineHeight: 1.4 }}>
          <strong>CLINICAL DISCLAIMER:</strong> Aegis-ICU is an assistive clinical decision-support and early-warning research system. It does not provide autonomous diagnosis or independent prescriptive authority. All therapeutic interventions must be validated by qualified critical care healthcare professionals.
        </p>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} Aegis-ICU
        </p>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 500px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
