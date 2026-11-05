import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, ArrowLeft, AlertCircle, Stethoscope, HeartPulse, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginPage({ onNavigate, returnPath = '/dashboard' }) {
  const { login, authLoading, authError, clearError } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!username.trim() || !password) {
      setLocalError('Please enter both your clinical username and password.');
      return;
    }

    try {
      await login(username.trim(), password);
      if (onNavigate) {
        onNavigate(returnPath);
      }
    } catch (err) {
      setLocalError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setLocalError('');
    clearError();
  };

  return (
    <div
      className={isDark ? 'auth-viewport auth-theme-dark' : 'auth-viewport auth-theme-light'}
      style={{
        background: isDark ? '#080E18' : 'linear-gradient(115deg, #B6E4F2 0%, #B3EEDC 30%, #D5FCBD 55%, #F5FCC0 78%, #F8EDB0 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      color: isDark ? '#F1F5FA' : '#0B4A57',
      position: 'relative',
      transition: 'background-color 0.2s ease, color 0.2s ease'
    }}>
      {/* Top Back Button */}
      <button
        onClick={() => onNavigate('/')}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          background: isDark ? '#111C2B' : 'rgba(255, 255, 255, 0.88)',
          border: isDark ? '1px solid #243247' : '1px solid #B6E4F2',
          color: isDark ? '#9AA9BA' : '#1A4F59',
          padding: '8px 14px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12.5px',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = isDark ? '#F1F5FA' : '#0F172A';
          e.currentTarget.style.borderColor = isDark ? '#35D6C5' : '#076358';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isDark ? '#9AA9BA' : '#475569';
          e.currentTarget.style.borderColor = isDark ? '#243247' : '#CBD5E1';
        }}
      >
        <ArrowLeft size={14} />
        <span>Back to Homepage</span>
      </button>

      {/* Top Right Day/Night Toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
        aria-label="Toggle theme"
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: isDark ? '#111C2B' : 'rgba(255, 255, 255, 0.88)',
          border: isDark ? '1px solid #243247' : '1px solid #B6E4F2',
          color: isDark ? '#F1F5FA' : '#0B4A57',
          padding: '8px 14px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          fontSize: '12px',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          transition: 'all 0.15s ease'
        }}
      >
        {isDark ? (
          <>
            <Sun size={14} color="#E5B86A" />
            <span>Day Mode</span>
          </>
        ) : (
          <>
            <Moon size={14} color="#2563EB" />
            <span>Night Mode</span>
          </>
        )}
      </button>

      {/* Main Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: isDark ? '#0D1624' : 'rgba(255, 255, 255, 0.90)',
        backdropFilter: isDark ? 'none' : 'blur(16px)',
        WebkitBackdropFilter: isDark ? 'none' : 'blur(16px)',
        border: isDark ? '1px solid #243247' : '1px solid rgba(182, 228, 242, 0.85)',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 12px 32px rgba(11, 74, 87, 0.08)',
        position: 'relative',
        transition: 'background-color 0.2s ease, border-color 0.2s ease'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(53, 214, 197, 0.15), rgba(13, 22, 36, 0.9))'
              : 'linear-gradient(135deg, rgba(13, 148, 136, 0.12), rgba(240, 253, 250, 0.9))',
            border: isDark ? '1px solid rgba(53, 214, 197, 0.35)' : '1px solid rgba(13, 148, 136, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px'
          }}>
            <Shield size={22} color={isDark ? "#35D6C5" : "#076358"} />
          </div>

          <h1 style={{
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: isDark ? '#F1F5FA' : '#0B4A57',
            letterSpacing: '-0.02em',
            marginBottom: '6px'
          }}>
            HourZero Flight Deck
          </h1>
          <p style={{
            fontSize: '12.5px',
            color: isDark ? '#9AA9BA' : '#235D69',
            lineHeight: 1.5
          }}>
            Multi-Agent Sepsis Surveillance & Clinical Triage
          </p>
        </div>

        {/* Error Notice */}
        {(localError || authError) && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '12px',
            color: '#DC2626',
            lineHeight: 1.4
          }}>
            <AlertCircle size={16} style={{ shrink: 0, marginTop: '2px' }} />
            <span>{localError || authError}</span>
          </div>
        )}

        {/* Quick Demo Credentials */}
        <div style={{
          backgroundColor: isDark ? '#111C2B' : 'rgba(240, 253, 250, 0.75)',
          border: isDark ? '1px solid #1F293D' : '1px solid #B6E4F2',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '22px'
        }}>
          <div style={{
            fontSize: '10.5px',
            fontFamily: 'var(--font-mono)',
            color: isDark ? '#35D6C5' : '#076358',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
            fontWeight: 600
          }}>
            Quick Fill Demo Accounts:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('dr.sharma', 'Doctor123!')}
              style={{
                backgroundColor: isDark ? '#162337' : '#FFFFFF',
                border: isDark ? '1px solid #243247' : '1px solid #B6E4F2',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '11px',
                color: isDark ? '#F1F5FA' : '#0B4A57',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = isDark ? '#35D6C5' : '#076358'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = isDark ? '#243247' : '#CBD5E1'}
            >
              <Stethoscope size={13} color={isDark ? "#35D6C5" : "#076358"} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600 }}>Doctor</div>
                <div style={{ fontSize: '9px', color: isDark ? '#9AA9BA' : '#64748B' }}>dr.sharma</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('nurse.priya', 'Nurse123!')}
              style={{
                backgroundColor: isDark ? '#162337' : '#FFFFFF',
                border: isDark ? '1px solid #243247' : '1px solid #B6E4F2',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '11px',
                color: isDark ? '#F1F5FA' : '#0B4A57',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0EA5E9'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = isDark ? '#243247' : '#CBD5E1'}
            >
              <HeartPulse size={13} color="#0EA5E9" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600 }}>Nurse</div>
                <div style={{ fontSize: '9px', color: isDark ? '#9AA9BA' : '#64748B' }}>nurse.priya</div>
              </div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: isDark ? '#9AA9BA' : '#235D69',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Clinical Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={15} color={isDark ? "#617285" : "#94A3B8"} style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. dr.sharma or nurse.priya"
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  backgroundColor: isDark ? '#080E18' : 'rgba(255, 255, 255, 0.95)',
                  border: isDark ? '1px solid #243247' : '1px solid #B6E4F2',
                  borderRadius: '8px',
                  color: isDark ? '#F1F5FA' : '#0B4A57',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  transition: 'border-color 0.15s'
                }}
                onFocus={(e) => e.target.style.borderColor = isDark ? '#35D6C5' : '#076358'}
                onBlur={(e) => e.target.style.borderColor = isDark ? '#243247' : '#CBD5E1'}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: isDark ? '#9AA9BA' : '#235D69',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Security Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color={isDark ? "#617285" : "#94A3B8"} style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  backgroundColor: isDark ? '#080E18' : 'rgba(255, 255, 255, 0.95)',
                  border: isDark ? '1px solid #243247' : '1px solid #B6E4F2',
                  borderRadius: '8px',
                  color: isDark ? '#F1F5FA' : '#0B4A57',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  transition: 'border-color 0.15s'
                }}
                onFocus={(e) => e.target.style.borderColor = isDark ? '#35D6C5' : '#076358'}
                onBlur={(e) => e.target.style.borderColor = isDark ? '#243247' : '#CBD5E1'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            style={{
              backgroundColor: isDark ? '#35D6C5' : '#076358',
              color: isDark ? '#080E18' : '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '11px 16px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: authLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
              transition: 'opacity 0.15s',
              opacity: authLoading ? 0.7 : 1
            }}
          >
            <span>{authLoading ? 'Verifying Credentials...' : 'Sign In to Flight Deck'}</span>
            {!authLoading && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Footer Link to Register */}
        <div style={{
          marginTop: '24px',
          paddingTop: '18px',
          borderTop: isDark ? '1px solid #1F293D' : '1px solid #B6E4F2',
          textAlign: 'center',
          fontSize: '12px',
          color: isDark ? '#9AA9BA' : '#64748B'
        }}>
          <span>Need clinical credentials? </span>
          <button
            type="button"
            onClick={() => onNavigate('/register')}
            style={{
              background: 'none',
              border: 'none',
              color: isDark ? '#35D6C5' : '#076358',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              padding: '0 4px',
              fontSize: '12px'
            }}
          >
            Register as Doctor or Nurse
          </button>
        </div>
      </div>
    </div>
  );
}
