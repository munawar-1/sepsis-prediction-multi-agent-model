import React from 'react';
import { Shield, ArrowRight, LayoutDashboard, ArrowUpRight } from 'lucide-react';
import { scrollTo } from '../utils/lenis';

export default function ClosingSection({ onOpenFlightDeck }) {
  return (
    <section
      style={{
        position: 'relative',
        padding: '80px 24px 60px 24px',
        background: '#080E18',
        borderBottom: '1px solid #1A2738',
        textAlign: 'center'
      }}
    >
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        
        {/* Shield Icon Emblem (Clean, zero glow) */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          background: '#111C2B',
          border: '1px solid #243247',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <Shield size={24} color="#35D6C5" />
        </div>

        {/* Kinetic Headline with Inline CTA (Impilo Motion Language Adaptation) */}
        <h2 className="font-display" style={{
          fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
          fontWeight: 650,
          lineHeight: 1.25,
          color: '#F1F5FA',
          marginBottom: '20px'
        }}>
          Explore how Aegis{' '}
          <button
            onClick={() => scrollTo('#clinical-review', { offset: -64 })}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              verticalAlign: 'middle',
              margin: '0 8px',
              fontSize: '15px',
              padding: '6px 16px',
              borderRadius: '6px'
            }}
          >
            <span>Explore System</span>
            <ArrowRight size={14} />
          </button>
          supports every critical decision.
        </h2>

        {/* Supporting Message */}
        <p className="font-body" style={{
          fontSize: '16px',
          lineHeight: 1.6,
          color: '#9AA9BA',
          maxWidth: '620px',
          margin: '0 auto 32px auto'
        }}>
          Bringing physiological trends, laboratory evidence, and medication context together to support earlier recognition of potential sepsis risk.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
          <button
            onClick={onOpenFlightDeck}
            className="btn-secondary"
            style={{ fontSize: '13.5px', padding: '10px 20px' }}
          >
            <LayoutDashboard size={15} />
            <span>Launch Clinical Flight Deck</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          color: '#617285',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)'
        }}>
          <span>HL7® FHIR® R4 Ingestion</span>
          <span>•</span>
          <span>Sepsis-3 Framework</span>
          <span>•</span>
          <span>Transparent Attribution</span>
          <span>•</span>
          <span>Human Prescriptive Control</span>
        </div>

      </div>
    </section>
  );
}
