import React, { useState } from 'react';
import { Shield, Lock, User, Mail, Building2, FileCheck2, ArrowRight, ArrowLeft, AlertCircle, Stethoscope, HeartPulse, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function RegisterPage({ onNavigate }) {
  const { signup, authLoading, authError, clearError } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const [role, setRole] = useState('DOCTOR'); // 'DOCTOR' or 'NURSE'
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Medical ICU (MICU)');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setLocalError('Please fill in all mandatory fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    const payload = {
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim(),
      password,
      role,
      department: department.trim() || (role === 'DOCTOR' ? 'Critical Care Medicine' : 'ICU Nursing'),
      licenseNumber: licenseNumber.trim() || (role === 'DOCTOR' ? 'MD-LIC-ACTIVE' : 'RN-LIC-ACTIVE')
    };

    try {
      await signup(payload);
      if (onNavigate) {
        onNavigate('/dashboard');
      }
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Please check the details and try again.');
    }
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
      padding: '32px 24px',
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
        maxWidth: '520px',
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
            marginBottom: '12px'
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
            Clinical Credentialing
          </h1>
          <p style={{
            fontSize: '12.5px',
            color: isDark ? '#9AA9BA' : '#235D69',
            lineHeight: 1.5
          }}>
            Register authorized ICU Clinician profile for HourZero
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

        {/* Role Selector Cards */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: isDark ? '#9AA9BA' : '#235D69',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Select Clinical Role Authority:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* DOCTOR Card */}
            <div
              onClick={() => setRole('DOCTOR')}
              style={{
                backgroundColor: role === 'DOCTOR'
                  ? (isDark ? 'rgba(53, 214, 197, 0.1)' : 'rgba(7, 99, 88, 0.10)')
                  : (isDark ? '#111C2B' : 'rgba(255, 255, 255, 0.70)'),
                border: role === 'DOCTOR'
                  ? (isDark ? '1.5px solid #35D6C5' : '1.5px solid #076358')
                  : (isDark ? '1px solid #243247' : '1px solid #B6E4F2'),
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Stethoscope size={16} color={role === 'DOCTOR' ? (isDark ? "#35D6C5" : "#0D9488") : (isDark ? "#9AA9BA" : "#64748B")} />
                <span style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: role === 'DOCTOR' ? (isDark ? "#35D6C5" : "#0D9488") : (isDark ? "#F1F5FA" : "#0F172A")
                }}>
                  Doctor (MD/DO)
                </span>
              </div>
              <p style={{ fontSize: '10.5px', color: isDark ? '#9AA9BA' : '#235D69', lineHeight: 1.4, margin: 0 }}>
                Diagnostic authority, medication orders, bundle sign-off & AI override rights.
              </p>
            </div>

            {/* NURSE Card */}
            <div
              onClick={() => setRole('NURSE')}
              style={{
                backgroundColor: role === 'NURSE'
                  ? (isDark ? 'rgba(14, 165, 233, 0.1)' : 'rgba(14, 165, 233, 0.10)')
                  : (isDark ? '#111C2B' : 'rgba(255, 255, 255, 0.70)'),
                border: role === 'NURSE'
                  ? '1.5px solid #0284C7'
                  : (isDark ? '1px solid #243247' : '1px solid #B6E4F2'),
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <HeartPulse size={16} color={role === 'NURSE' ? "#0EA5E9" : (isDark ? "#9AA9BA" : "#64748B")} />
                <span style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: role === 'NURSE' ? "#0EA5E9" : (isDark ? "#F1F5FA" : "#0F172A")
                }}>
                  Nurse (RN/BSN)
                </span>
              </div>
              <p style={{ fontSize: '10.5px', color: isDark ? '#9AA9BA' : '#235D69', lineHeight: 1.4, margin: 0 }}>
                Bedside telemetry monitoring, vital signs recording & STAT lab escalation.
              </p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: isDark ? '#9AA9BA' : '#235D69',
              marginBottom: '5px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Full Legal Name & Title
            </label>
            <div style={{ position: 'relative' }}>
              <User size={15} color={isDark ? "#617285" : "#94A3B8"} style={{ position: 'absolute', left: '12px', top: '10px' }} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={role === 'DOCTOR' ? "e.g. Dr. Rajesh Sharma, MD" : "e.g. Priya Patel, RN, BSN"}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: isDark ? '#9AA9BA' : '#235D69',
                marginBottom: '5px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. dr.sharma"
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '9px 12px',
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

            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: isDark ? '#9AA9BA' : '#235D69',
                marginBottom: '5px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Hospital Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color={isDark ? "#617285" : "#94A3B8"} style={{ position: 'absolute', left: '10px', top: '11px' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hourzero.icu"
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '9px 10px 9px 32px',
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: isDark ? '#9AA9BA' : '#235D69',
                marginBottom: '5px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Department
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={14} color={isDark ? "#617285" : "#94A3B8"} style={{ position: 'absolute', left: '10px', top: '11px' }} />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. MICU / SICU"
                  style={{
                    width: '100%',
                    padding: '9px 10px 9px 32px',
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
                marginBottom: '5px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                License #
              </label>
              <div style={{ position: 'relative' }}>
                <FileCheck2 size={14} color={isDark ? "#617285" : "#94A3B8"} style={{ position: 'absolute', left: '10px', top: '11px' }} />
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder={role === 'DOCTOR' ? "MD-90210" : "RN-44102"}
                  style={{
                    width: '100%',
                    padding: '9px 10px 9px 32px',
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
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: isDark ? '#9AA9BA' : '#235D69',
              marginBottom: '5px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Password (min. 6 characters)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} color={isDark ? "#617285" : "#94A3B8"} style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="new-password"
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
              backgroundColor: role === 'DOCTOR' ? (isDark ? '#35D6C5' : '#076358') : (isDark ? '#0EA5E9' : '#0284C7'),
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
              marginTop: '10px',
              transition: 'opacity 0.15s',
              opacity: authLoading ? 0.7 : 1
            }}
          >
            <span>{authLoading ? 'Creating Clinical Profile...' : `Register as ${role === 'DOCTOR' ? 'Doctor' : 'Nurse'}`}</span>
            {!authLoading && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Footer Link to Login */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: isDark ? '1px solid #1F293D' : '1px solid #B6E4F2',
          textAlign: 'center',
          fontSize: '12px',
          color: isDark ? '#9AA9BA' : '#64748B'
        }}>
          <span>Already hold clinical credentials? </span>
          <button
            type="button"
            onClick={() => onNavigate('/login')}
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
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
}
