import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, ArrowUpRight } from 'lucide-react';
import { scrollTo } from '../utils/lenis';

export default function Navbar({ onOpenFlightDeck }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: "Problem", href: "#problem" },
    { name: "Intelligence", href: "#intelligence" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Clinical Review", href: "#clinical-review" },
    { name: "Simulation", href: "#simulation" }
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    scrollTo(href, { offset: -64 });
  };

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          zIndex: 100,
          background: isScrolled ? 'rgba(8, 14, 24, 0.96)' : '#080E18',
          borderBottom: '1px solid #243247',
          transition: 'background-color 0.2s ease',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div style={{
          maxWidth: '1320px',
          margin: '0 auto',
          width: '100%',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Brand Logo */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); scrollTo(0); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: '#111C2B',
              border: '1px solid #243247',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={16} color="#35D6C5" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="font-display" style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#F1F5FA',
                letterSpacing: '0.04em'
              }}>
                AEGIS-ICU
              </span>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: '#9AA9BA',
                letterSpacing: '0.02em'
              }}>
                RESEARCH PLATFORM
              </span>
            </div>
          </a>

          {/* Desktop Links (Single-Row, No Wrap) */}
          <nav
            className="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px'
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#9AA9BA',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#F1F5FA'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9AA9BA'}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onOpenFlightDeck}
              className="btn-secondary nav-action-btn"
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                padding: '7px 12px',
                borderRadius: '6px'
              }}
            >
              Flight Deck Preview
            </button>

            <button
              onClick={() => scrollTo('#clinical-review', { offset: -64 })}
              className="btn-primary"
              style={{
                fontSize: '12.5px',
                padding: '7px 14px',
                borderRadius: '6px'
              }}
            >
              <span>Explore Aegis</span>
              <ArrowUpRight size={14} />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle"
              style={{
                display: 'none',
                background: '#111C2B',
                border: '1px solid #243247',
                color: '#F1F5FA',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              right: 0,
              background: '#080E18',
              borderBottom: '1px solid #243247',
              padding: '16px 24px',
              zIndex: 99,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#F1F5FA',
                  textDecoration: 'none',
                  padding: '6px 0',
                  borderBottom: '1px solid #1A2738'
                }}
              >
                {link.name}
              </a>
            ))}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenFlightDeck(); }}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '13px' }}
              >
                Flight Deck
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); scrollTo('#clinical-review', { offset: -64 }); }}
                className="btn-primary"
                style={{ flex: 1, fontSize: '13px' }}
              >
                Explore Aegis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav, .nav-action-btn {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
