import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, ArrowUpRight, LogIn, UserPlus, LogOut, Stethoscope, HeartPulse, Sun, Moon } from 'lucide-react';
import { scrollTo } from '../utils/lenis';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onOpenFlightDeck, onNavigate }) {
  const { user, isAuthenticated, isDoctor, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
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

  const handleNavigate = (path) => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    }
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
          background: isDark
            ? (isScrolled ? 'rgba(8, 14, 24, 0.96)' : '#080E18')
            : (isScrolled ? 'rgba(255, 255, 255, 0.96)' : '#FFFFFF'),
          borderBottom: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
          backdropFilter: 'blur(8px)',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div style={{
          maxWidth: '1360px',
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
              background: isDark ? '#111C2B' : '#F1F5F9',
              border: isDark ? '1px solid #243247' : '1px solid #CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={16} color={isDark ? "#35D6C5" : "#0D9488"} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="font-display" style={{
                fontSize: '15px',
                fontWeight: 700,
                color: isDark ? '#F1F5FA' : '#0F172A',
                letterSpacing: '0.04em'
              }}>
                HourZero
              </span>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: isDark ? '#9AA9BA' : '#64748B',
                letterSpacing: '0.02em'
              }}>
                RESEARCH PLATFORM
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav
            className="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '22px'
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
                  color: isDark ? '#9AA9BA' : '#475569',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#F1F5FA' : '#0F172A'}
                onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#9AA9BA' : '#475569'}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs & Auth Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Day / Night Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
              aria-label="Toggle Day and Night mode"
              style={{
                background: isDark ? '#111C2B' : '#F1F5F9',
                border: isDark ? '1px solid #243247' : '1px solid #CBD5E1',
                color: isDark ? '#F1F5FA' : '#0F172A',
                padding: '6px 9px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.15s ease'
              }}
            >
              {isDark ? (
                <>
                  <Sun size={13} color="#E5B86A" />
                  <span className="hidden sm:inline">Day</span>
                </>
              ) : (
                <>
                  <Moon size={13} color="#2563EB" />
                  <span className="hidden sm:inline">Night</span>
                </>
              )}
            </button>

            {isAuthenticated ? (
              /* Authenticated User Toolbar */
              <>
                <div
                  className="nav-action-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: isDark ? '#111C2B' : '#FFFFFF',
                    border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {isDoctor ? (
                    <Stethoscope size={13} color={isDark ? "#35D6C5" : "#0D9488"} />
                  ) : (
                    <HeartPulse size={13} color="#0EA5E9" />
                  )}
                  <span style={{ color: isDark ? '#F1F5FA' : '#0F172A', fontWeight: 600 }}>
                    {user?.fullName || user?.username}
                  </span>
                  <span style={{
                    fontSize: '9px',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: isDoctor
                      ? (isDark ? 'rgba(53, 214, 197, 0.15)' : 'rgba(13, 148, 136, 0.15)')
                      : 'rgba(14, 165, 233, 0.15)',
                    color: isDoctor
                      ? (isDark ? '#35D6C5' : '#0D9488')
                      : '#0EA5E9',
                    fontWeight: 700
                  }}>
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={() => handleNavigate('/dashboard')}
                  className="btn-primary"
                  style={{
                    fontSize: '12px',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Flight Deck</span>
                  <ArrowUpRight size={13} />
                </button>

                <button
                  onClick={logout}
                  className="btn-secondary nav-action-btn"
                  title="Sign Out"
                  style={{
                    fontSize: '11px',
                    padding: '7px 9px',
                    borderRadius: '6px',
                    color: isDark ? '#9AA9BA' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <LogOut size={13} />
                  <span>Exit</span>
                </button>
              </>
            ) : (
              /* Guest User: Login & Register Buttons */
              <>
                <button
                  onClick={() => handleNavigate('/login')}
                  className="btn-secondary"
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <LogIn size={13} color={isDark ? "#35D6C5" : "#0D9488"} />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => handleNavigate('/register')}
                  className="btn-secondary nav-action-btn"
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <UserPlus size={13} color="#0EA5E9" />
                  <span>Register</span>
                </button>

                <button
                  onClick={onOpenFlightDeck}
                  className="btn-primary"
                  style={{
                    fontSize: '12.5px',
                    padding: '7px 14px',
                    borderRadius: '6px'
                  }}
                >
                  <span>Explore HourZero</span>
                  <ArrowUpRight size={14} />
                </button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle"
              style={{
                display: 'none',
                background: isDark ? '#111C2B' : '#F1F5F9',
                border: isDark ? '1px solid #243247' : '1px solid #CBD5E1',
                color: isDark ? '#F1F5FA' : '#0F172A',
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
              background: isDark ? '#080E18' : '#FFFFFF',
              borderBottom: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
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
                  color: isDark ? '#F1F5FA' : '#0F172A',
                  textDecoration: 'none',
                  padding: '6px 0',
                  borderBottom: isDark ? '1px solid #1A2738' : '1px solid #E2E8F0'
                }}
              >
                {link.name}
              </a>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {isAuthenticated ? (
                <>
                  <div style={{
                    padding: '8px',
                    borderRadius: '6px',
                    background: isDark ? '#111C2B' : '#F1F5F9',
                    border: isDark ? '1px solid #243247' : '1px solid #E2E8F0',
                    fontSize: '12px',
                    color: isDark ? '#F1F5FA' : '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>{user?.fullName || user?.username}</span>
                    <span style={{
                      fontSize: '10px',
                      color: isDark ? '#35D6C5' : '#0D9488',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={() => handleNavigate('/dashboard')}
                    className="btn-primary"
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    Open Flight Deck
                  </button>
                  <button
                    onClick={logout}
                    className="btn-secondary"
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleNavigate('/login')}
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '13px' }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleNavigate('/register')}
                    className="btn-primary"
                    style={{ flex: 1, fontSize: '13px' }}
                  >
                    Register
                  </button>
                </div>
              )}
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
