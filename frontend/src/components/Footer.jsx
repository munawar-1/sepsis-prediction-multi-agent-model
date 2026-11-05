import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Shield, ArrowUp } from 'lucide-react';
import { scrollTo } from '../utils/lenis';
import AsciiGlitchRipple from './ui/ascii-glitch-ripple';

export default function Footer({ onOpenFlightDeck }) {
  const { isDark } = useTheme();

  const linkHoverColor = isDark ? '#35D6C5' : '#0D7679';

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
              justifyContent: 'center',
              shrink: 0
            }}>
              <Shield size={14} color="#35D6C5" />
            </div>
            <AsciiGlitchRipple
              as="span"
              className="font-display"
              dur={900}
              spread={1.1}
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: isDark ? '#F1F5FA' : '#0F172A',
                letterSpacing: '-0.01em'
              }}
            >
              HourZero
            </AsciiGlitchRipple>
          </div>

          <div style={{ maxWidth: '300px', margin: '0 0 12px 0' }}>
            <AsciiGlitchRipple
              as="p"
              dur={1100}
              spread={1.2}
              style={{
                lineHeight: 1.5,
                color: isDark ? '#617285' : '#64748B',
                margin: 0
              }}
            >
              Multi-agent physiological deterioration and clinical decision support concept.
            </AsciiGlitchRipple>
          </div>

          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: '#35D6C5',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '9px', userSelect: 'none' }}>●</span>
            <AsciiGlitchRipple
              as="span"
              dur={850}
              spread={1.0}
              style={{ color: '#35D6C5' }}
            >
              Research Prototype Environment
            </AsciiGlitchRipple>
          </div>
        </div>

        {/* Navigation Column */}
        <div>
          <h4 style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: isDark ? '#F1F5FA' : '#0F172A',
            textTransform: 'uppercase',
            marginBottom: '12px',
            letterSpacing: '0.05em'
          }}>
            <AsciiGlitchRipple
              as="span"
              dur={800}
              spread={1.0}
              style={{ color: isDark ? '#F1F5FA' : '#0F172A' }}
            >
              Navigation
            </AsciiGlitchRipple>
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <AsciiGlitchRipple
                as="a"
                href="#problem"
                onClick={(e) => { e.preventDefault(); scrollTo('#problem', { offset: -64 }); }}
                dur={850}
                spread={1.1}
                style={{
                  color: isDark ? '#9AA9BA' : '#475569',
                  textDecoration: 'none'
                }}
              >
                The Problem
              </AsciiGlitchRipple>
            </li>
            <li>
              <AsciiGlitchRipple
                as="a"
                href="#intelligence"
                onClick={(e) => { e.preventDefault(); scrollTo('#intelligence', { offset: -64 }); }}
                dur={900}
                spread={1.1}
                style={{
                  color: isDark ? '#9AA9BA' : '#475569',
                  textDecoration: 'none'
                }}
              >
                Three-Agent Intelligence
              </AsciiGlitchRipple>
            </li>
            <li>
              <AsciiGlitchRipple
                as="a"
                href="#how-it-works"
                onClick={(e) => { e.preventDefault(); scrollTo('#how-it-works', { offset: -64 }); }}
                dur={850}
                spread={1.1}
                style={{
                  color: isDark ? '#9AA9BA' : '#475569',
                  textDecoration: 'none'
                }}
              >
                System Pipeline
              </AsciiGlitchRipple>
            </li>
            <li>
              <AsciiGlitchRipple
                as="a"
                href="#clinical-review"
                onClick={(e) => { e.preventDefault(); scrollTo('#clinical-review', { offset: -64 }); }}
                dur={900}
                spread={1.1}
                style={{
                  color: isDark ? '#9AA9BA' : '#475569',
                  textDecoration: 'none'
                }}
              >
                Clinical Review &amp; Alert
              </AsciiGlitchRipple>
            </li>
            <li>
              <AsciiGlitchRipple
                as="a"
                href="#simulation"
                onClick={(e) => { e.preventDefault(); scrollTo('#simulation', { offset: -64 }); }}
                dur={850}
                spread={1.1}
                style={{
                  color: isDark ? '#9AA9BA' : '#475569',
                  textDecoration: 'none'
                }}
              >
                ICU Case Replay
              </AsciiGlitchRipple>
            </li>
          </ul>
        </div>

        {/* Clinical Frameworks */}
        <div>
          <h4 style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: isDark ? '#F1F5FA' : '#0F172A',
            textTransform: 'uppercase',
            marginBottom: '12px',
            letterSpacing: '0.05em'
          }}>
            <AsciiGlitchRipple
              as="span"
              dur={800}
              spread={1.0}
              style={{ color: isDark ? '#F1F5FA' : '#0F172A' }}
            >
              Evidence Standards
            </AsciiGlitchRipple>
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <AsciiGlitchRipple
                as="span"
                dur={950}
                spread={1.1}
                style={{ color: isDark ? '#617285' : '#64748B' }}
              >
                Surviving Sepsis Campaign (Sepsis-3)
              </AsciiGlitchRipple>
            </li>
            <li>
              <AsciiGlitchRipple
                as="span"
                dur={900}
                spread={1.1}
                style={{ color: isDark ? '#617285' : '#64748B' }}
              >
                Sequential Organ Failure (SOFA)
              </AsciiGlitchRipple>
            </li>
            <li>
              <AsciiGlitchRipple
                as="span"
                dur={900}
                spread={1.1}
                style={{ color: isDark ? '#617285' : '#64748B' }}
              >
                Shock Index Decoupling ($HR/SBP$)
              </AsciiGlitchRipple>
            </li>
            <li>
              <AsciiGlitchRipple
                as="span"
                dur={950}
                spread={1.1}
                style={{ color: isDark ? '#617285' : '#64748B' }}
              >
                Pharmacokinetic Elimination Modeling
              </AsciiGlitchRipple>
            </li>
            <li>
              <AsciiGlitchRipple
                as="span"
                dur={900}
                spread={1.1}
                style={{ color: isDark ? '#617285' : '#64748B' }}
              >
                HL7® FHIR® R4 Interoperability
              </AsciiGlitchRipple>
            </li>
          </ul>
        </div>

        {/* Clinical Console & Top */}
        <div>
          <h4 style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: isDark ? '#F1F5FA' : '#0F172A',
            textTransform: 'uppercase',
            marginBottom: '12px',
            letterSpacing: '0.05em'
          }}>
            <AsciiGlitchRipple
              as="span"
              dur={800}
              spread={1.0}
              style={{ color: isDark ? '#F1F5FA' : '#0F172A' }}
            >
              Console Gateway
            </AsciiGlitchRipple>
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
              cursor: 'pointer',
              padding: 0
            }}
          >
            <ArrowUp size={13} />
            <AsciiGlitchRipple
              as="span"
              dur={800}
              spread={1.0}
              style={{ color: isDark ? '#617285' : '#64748B' }}
            >
              Back to top
            </AsciiGlitchRipple>
          </button>
        </div>

      </div>

      {/* Copyright Notice */}
      <div style={{
        maxWidth: '1320px',
        margin: '0 auto',
        paddingTop: '18px',
        borderTop: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '10.5px',
        color: isDark ? '#617285' : '#64748B',
        fontFamily: 'var(--font-mono)'
      }}>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} HourZero
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
