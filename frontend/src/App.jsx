import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Activity,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  RefreshCw,
  Terminal,
  Send,
  Eye,
  Key,
  ChevronRight
} from 'lucide-react';

const API_BASE = '/api/v1';

export default function App() {
  // Authentication & Session State
  const [token, setToken] = useState(localStorage.getItem('aegis_jwt_token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(Boolean(token));

  // Auth View State: 'login' | 'signup'
  const [authTab, setAuthTab] = useState('login');

  // Forms
  const [loginForm, setLoginForm] = useState({ username: 'dr.sharma', password: 'Doctor123!' });
  const [signupForm, setSignupForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'DOCTOR',
    department: 'Critical Care Medicine',
    licenseNumber: ''
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Security Test Panel State
  const [testResponse, setTestResponse] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  // Clinical Flight Deck State
  const [patientId] = useState("ICU-BED-04 (p000011)");
  const [hourIndex] = useState(22);
  const [urgency] = useState("CRITICAL_SEPSIS");
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [actionFeedback, setActionFeedback] = useState(null);

  // Verify stored token on initial load
  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setCheckingSession(false);
    }
  }, []);

  const fetchCurrentUser = async (jwt) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      } else {
        // Stale or invalid token
        handleLogout();
      }
    } catch (err) {
      console.error("Auth check error:", err);
      handleLogout();
    } finally {
      setCheckingSession(false);
    }
  };

  const handleLogin = async (e, customPayload = null) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const payload = customPayload || loginForm;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('aegis_jwt_token', data.token);
        setToken(data.token);
        setCurrentUser({
          id: data.id,
          username: data.username,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          department: data.department,
          licenseNumber: data.licenseNumber
        });
        setActionFeedback({
          type: 'success',
          title: `Welcome, ${data.fullName}`,
          message: `Authenticated as [${data.role}]. Security permissions and flight deck unlocked.`
        });
      } else {
        setAuthError(data.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setAuthError('Unable to connect to Aegis backend server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm)
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('aegis_jwt_token', data.token);
        setToken(data.token);
        setCurrentUser({
          id: data.id,
          username: data.username,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          department: data.department,
          licenseNumber: data.licenseNumber
        });
        setActionFeedback({
          type: 'success',
          title: 'Account Registered & Activated',
          message: `Signed in as ${data.role} (${data.fullName}). Welcome to Aegis-ICU.`
        });
      } else {
        if (data.validationErrors) {
          const firstErr = Object.values(data.validationErrors)[0];
          setAuthError(firstErr);
        } else {
          setAuthError(data.message || 'Registration failed.');
        }
      }
    } catch (err) {
      setAuthError('Connection error contacting Aegis backend API.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aegis_jwt_token');
    setToken('');
    setCurrentUser(null);
    setTestResponse(null);
    setActionFeedback(null);
  };

  // Quick 1-Click Demo Login
  const quickLoginAs = (role) => {
    if (role === 'DOCTOR') {
      const creds = { username: 'dr.sharma', password: 'Doctor123!' };
      setLoginForm(creds);
      handleLogin(null, creds);
    } else {
      const creds = { username: 'nurse.priya', password: 'Nurse123!' };
      setLoginForm(creds);
      handleLogin(null, creds);
    }
  };

  // Run Role-Based Security Verification
  const executeSecurityTest = async (endpoint, method = 'GET', body = null, testName = '') => {
    setTestLoading(true);
    setTestResponse(null);

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const startTime = performance.now();
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });
      const data = await res.json().catch(() => ({ raw: 'Empty / Non-JSON response' }));
      const latency = Math.round(performance.now() - startTime);

      setTestResponse({
        testName,
        endpoint: `${API_BASE}${endpoint}`,
        method,
        status: res.status,
        statusText: res.statusText || (res.status === 200 ? 'OK' : res.status === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED'),
        latency,
        data,
        authenticatedAs: currentUser ? `${currentUser.username} (${currentUser.role})` : 'Anonymous (No Token)'
      });
    } catch (err) {
      setTestResponse({
        testName,
        endpoint: `${API_BASE}${endpoint}`,
        method,
        status: 'NETWORK_ERROR',
        statusText: 'Failed to Connect',
        latency: 0,
        data: { error: err.message },
        authenticatedAs: currentUser ? `${currentUser.username} (${currentUser.role})` : 'Anonymous'
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Clinician Sepsis Bundle Action
  const handleAuthorizeBundle = async () => {
    if (!currentUser) return;
    if (currentUser.role !== 'DOCTOR') {
      setActionFeedback({
        type: 'error',
        title: 'Authorization Denied (Spring Security 403)',
        message: 'Only Attending Doctors have statutory clinical authority to prescribe the Surviving Sepsis Campaign bundle. ICU Nurses cannot sign off on broad-spectrum antimicrobial protocols.'
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/clinical/doctor/authorize-bundle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ patientId })
      });
      const data = await res.json();
      setActionFeedback({
        type: 'success',
        title: 'Sepsis Bundle Prescribed',
        message: `Authorized by ${currentUser.fullName} (${currentUser.licenseNumber}). Antimicrobials & STAT labs dispatched.`
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Clinician AI Override Action
  const handleOverrideAI = async () => {
    if (!currentUser) return;
    if (currentUser.role !== 'DOCTOR') {
      setActionFeedback({
        type: 'error',
        title: 'Override Rejected (Spring Security 403)',
        message: 'Overriding an AI clinical deterioration recommendation requires Attending Physician authorization. Bedside Nurses are not legally authorized to cancel sepsis alert protocols.'
      });
      setOverrideModalOpen(false);
      return;
    }
    if (!overrideReason.trim()) {
      alert('Mandatory clinical rationale is required to override AI recommendation.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/hitl/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          actionTaken: 'OVERRIDDEN',
          overrideReason: overrideReason.trim()
        })
      });
      const data = await res.json();

      if (res.ok) {
        setOverrideModalOpen(false);
        setOverrideReason('');
        setActionFeedback({
          type: 'warning',
          title: 'AI Recommendation Overridden',
          message: `Audit Record: ${data.auditId}. Rationale logged by Attending Physician ${currentUser.username}.`
        });
      } else {
        setActionFeedback({
          type: 'error',
          title: 'Override Failed',
          message: data.message || 'Error recording override'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Loading Screen while verifying session
  if (checkingSession) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0B1120',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94A3B8',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.3)'
        }}>
          <Shield size={32} color="#FFFFFF" />
        </div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#F1F5F9', marginBottom: '8px' }}>
          AEGIS-ICU
        </div>
        <div style={{ fontSize: '13px', color: '#64748B' }}>
          Verifying clinician security credentials...
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 1: LOGIN / REGISTER PORTAL (Displayed first if not authenticated)
  // =========================================================================
  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#070C18',
        backgroundImage: 'radial-gradient(circle at 50% 15%, rgba(2, 132, 199, 0.12) 0%, transparent 60%)',
        color: '#F3F4F6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px', maxWidth: '520px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.4)',
            marginBottom: '16px'
          }}>
            <Shield size={32} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#F8FAFC', letterSpacing: '-0.03em', margin: 0 }}>
            AEGIS-ICU Clinical Gateway
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '8px', lineHeight: '1.5' }}>
            Neuro-Symbolic Multi-Agent Sepsis Deterioration &amp; Alert Fatigue Intelligence.
            Sign in with your clinical credentials to access the flight deck.
          </p>
        </div>

        {/* 1-Click Demo Profiles Card */}
        <div style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Demo Access (1-Click)
            </span>
            <span style={{ fontSize: '11px', color: '#38BDF8', backgroundColor: '#1E293B', padding: '2px 8px', borderRadius: '10px' }}>
              Pre-Seeded Roles
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={() => quickLoginAs('DOCTOR')}
              disabled={authLoading}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #059669',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Stethoscope size={16} color="#34D399" />
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#34D399' }}>ROLE_DOCTOR</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>Dr. Rajesh Sharma</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Attending Intensivist</div>
            </button>

            <button
              onClick={() => quickLoginAs('NURSE')}
              disabled={authLoading}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #0284C7',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <HeartPulse size={16} color="#38BDF8" />
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#38BDF8' }}>ROLE_NURSE</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>Priya Patel, RN</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>ICU Bedside Specialist</div>
            </button>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Tabs: Sign In / Register */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1E293B', backgroundColor: '#1E293B' }}>
            <button
              onClick={() => { setAuthTab('login'); setAuthError(''); }}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: authTab === 'login' ? '#0F172A' : 'transparent',
                color: authTab === 'login' ? '#38BDF8' : '#94A3B8',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <LogIn size={16} />
              Sign In
            </button>
            <button
              onClick={() => { setAuthTab('signup'); setAuthError(''); }}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: authTab === 'signup' ? '#0F172A' : 'transparent',
                color: authTab === 'signup' ? '#38BDF8' : '#94A3B8',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <UserPlus size={16} />
              Register Clinician
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            {authError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                color: '#F87171',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} color="#EF4444" />
                <span>{authError}</span>
              </div>
            )}

            {authTab === 'login' ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0', display: 'block', marginBottom: '6px' }}>
                    Username or Hospital Email
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. dr.sharma or nurse.priya"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0', display: 'block', marginBottom: '6px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    backgroundColor: '#0284C7',
                    color: 'white',
                    padding: '13px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  {authLoading ? 'Verifying Credentials...' : 'Sign In & Access Dashboard'}
                  <ChevronRight size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Role Radio Selection */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0', display: 'block', marginBottom: '8px' }}>
                    Select Clinical Role <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      backgroundColor: signupForm.role === 'DOCTOR' ? 'rgba(5, 150, 105, 0.2)' : '#1E293B',
                      border: signupForm.role === 'DOCTOR' ? '1px solid #059669' : '1px solid #334155',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#F1F5F9'
                    }}>
                      <input
                        type="radio"
                        name="role"
                        value="DOCTOR"
                        checked={signupForm.role === 'DOCTOR'}
                        onChange={() => setSignupForm({ ...signupForm, role: 'DOCTOR' })}
                      />
                      <div>
                        <div style={{ fontWeight: '700', color: '#34D399' }}>Doctor (MD)</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>Prescription &amp; Override</div>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      backgroundColor: signupForm.role === 'NURSE' ? 'rgba(2, 132, 199, 0.2)' : '#1E293B',
                      border: signupForm.role === 'NURSE' ? '1px solid #0284C7' : '1px solid #334155',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#F1F5F9'
                    }}>
                      <input
                        type="radio"
                        name="role"
                        value="NURSE"
                        checked={signupForm.role === 'NURSE'}
                        onChange={() => setSignupForm({ ...signupForm, role: 'NURSE' })}
                      />
                      <div>
                        <div style={{ fontWeight: '700', color: '#38BDF8' }}>Nurse (RN)</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>Vitals &amp; Care Admin</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                    Full Name &amp; Title <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Foster, MD"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                      Username <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="dr.jane"
                      value={signupForm.username}
                      onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                      Email <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jane@aegis.icu"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                    Password (min 6 characters) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Surgical ICU"
                      value={signupForm.department}
                      onChange={(e) => setSignupForm({ ...signupForm, department: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                      License Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MED-77123"
                      value={signupForm.licenseNumber}
                      onChange={(e) => setSignupForm({ ...signupForm, licenseNumber: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    backgroundColor: signupForm.role === 'DOCTOR' ? '#059669' : '#0284C7',
                    color: 'white',
                    padding: '13px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}
                >
                  {authLoading ? 'Registering...' : `Register & Enter Dashboard as ${signupForm.role}`}
                  <ChevronRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Security & Compliance Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#64748B' }}>
          Protected by Spring Security 6 &amp; JWT Bearer Tokens &bull; HL7 FHIR R4 Compliant
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: CLINICAL FLIGHT DECK & DASHBOARD (Only shown after login)
  // =========================================================================
  return (
    <div style={{ backgroundColor: '#0B1120', minHeight: '100vh', color: '#F3F4F6', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Clinical Navigation Bar */}
      <header style={{
        padding: '14px 28px',
        borderBottom: '1px solid #1E293B',
        backgroundColor: '#0F172A',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}>
            <Shield size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
                AEGIS-ICU
              </h1>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#1E293B',
                color: '#38BDF8',
                border: '1px solid #0284C7',
                fontWeight: '600'
              }}>
                Flight Deck
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0 0' }}>
              Multi-Agent Clinical Deterioration &amp; Alert Fatigue Intelligence
            </p>
          </div>
        </div>

        {/* Authenticated Clinician Badge & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Active Clinician Identity */}
          <div style={{
            backgroundColor: '#1E293B',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: currentUser.role === 'DOCTOR' ? '#047857' : '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {currentUser.role === 'DOCTOR' ? <Stethoscope size={18} color="#fff" /> : <HeartPulse size={18} color="#fff" />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#F1F5F9' }}>
                  {currentUser.fullName}
                </span>
                <span style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: '700',
                  backgroundColor: currentUser.role === 'DOCTOR' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                  color: currentUser.role === 'DOCTOR' ? '#34D399' : '#38BDF8',
                  border: `1px solid ${currentUser.role === 'DOCTOR' ? '#059669' : '#0284C7'}`
                }}>
                  ROLE_{currentUser.role}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                {currentUser.department} &bull; {currentUser.licenseNumber}
              </div>
            </div>
          </div>

          {/* Quick Role Switcher for Testing */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#1E293B',
            padding: '4px',
            borderRadius: '6px',
            border: '1px solid #334155'
          }}>
            <span style={{ fontSize: '11px', color: '#94A3B8', padding: '0 4px', fontWeight: '600' }}>Switch:</span>
            <button
              onClick={() => quickLoginAs('DOCTOR')}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                backgroundColor: currentUser?.role === 'DOCTOR' ? '#059669' : '#0F172A',
                color: currentUser?.role === 'DOCTOR' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Doctor
            </button>
            <button
              onClick={() => quickLoginAs('NURSE')}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                backgroundColor: currentUser?.role === 'NURSE' ? '#0284C7' : '#0F172A',
                color: currentUser?.role === 'NURSE' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Nurse
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Log out and return to Login Screen"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#334155',
              color: '#CBD5E1',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      {/* Global Feedback Banner */}
      {actionFeedback && (
        <div style={{
          backgroundColor: actionFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)'
            : actionFeedback.type === 'warning' ? 'rgba(245, 158, 11, 0.15)'
            : 'rgba(16, 185, 129, 0.15)',
          borderBottom: `1px solid ${
            actionFeedback.type === 'error' ? '#EF4444'
            : actionFeedback.type === 'warning' ? '#F59E0B'
            : '#10B981'
          }`,
          padding: '12px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {actionFeedback.type === 'error' ? <XCircle size={18} color="#EF4444" />
              : actionFeedback.type === 'warning' ? <AlertTriangle size={18} color="#F59E0B" />
              : <CheckCircle2 size={18} color="#10B981" />}
            <div>
              <strong style={{ fontSize: '13px', color: '#F8FAFC' }}>{actionFeedback.title}: </strong>
              <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{actionFeedback.message}</span>
            </div>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '13px' }}
          >
            &times; Dismiss
          </button>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <main style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Section 1: Security Foundation & Role Restriction Verification Console */}
        <section style={{
          backgroundColor: '#0F172A',
          borderRadius: '10px',
          border: '1px solid #1E293B',
          padding: '20px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#38BDF8" />
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>
                  Role-Based Endpoint Security Tester
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Test Spring Security <code>@PreAuthorize</code> filters and role guardrails in real-time.
                Try clicking each endpoint with your current role (<strong>{currentUser.role}</strong>) to observe 200 OK vs 403 Forbidden enforcement.
              </p>
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', backgroundColor: '#1E293B', padding: '6px 12px', borderRadius: '6px' }}>
              Active Clinician: <span style={{ color: currentUser.role === 'DOCTOR' ? '#34D399' : '#38BDF8', fontWeight: '700' }}>
                {currentUser.username} ({currentUser.role})
              </span>
            </div>
          </div>

          {/* Test Buttons Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px', marginBottom: '18px' }}>
            {/* 1. Public Endpoint */}
            <button
              onClick={() => executeSecurityTest('/clinical/public/status', 'GET', null, 'Public Clinical Status')}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#334155', color: '#E2E8F0', borderRadius: '4px', fontWeight: '700' }}>
                  PUBLIC
                </span>
                <span style={{ fontSize: '11px', color: '#10B981' }}>permitAll()</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F5F9' }}>Clinical Status</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', marginTop: '2px' }}>
                GET /clinical/public/status
              </div>
            </button>

            {/* 2. Shared Clinician Endpoint */}
            <button
              onClick={() => executeSecurityTest('/clinical/shared/patient-roster', 'GET', null, 'Shared Patient Roster')}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#4338CA', color: '#E0E7FF', borderRadius: '4px', fontWeight: '700' }}>
                  DOCTOR + NURSE
                </span>
                <span style={{ fontSize: '11px', color: '#818CF8' }}>hasAnyRole</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F5F9' }}>Patient Roster</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', marginTop: '2px' }}>
                GET /clinical/shared/patient-roster
              </div>
            </button>

            {/* 3. Doctor-Only Endpoint */}
            <button
              onClick={() => executeSecurityTest('/clinical/doctor/prescription-privileges', 'GET', null, 'Doctor Prescription Privileges')}
              style={{
                backgroundColor: '#1E293B',
                border: currentUser?.role === 'DOCTOR' ? '1px solid #059669' : '1px solid #334155',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', borderRadius: '4px', fontWeight: '700', border: '1px solid #059669' }}>
                  DOCTOR ONLY
                </span>
                <span style={{ fontSize: '11px', color: '#34D399' }}>hasRole('DOCTOR')</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F5F9' }}>Prescription Privileges</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', marginTop: '2px' }}>
                GET /clinical/doctor/prescription-privileges
              </div>
            </button>

            {/* 4. Nurse-Only Endpoint */}
            <button
              onClick={() => executeSecurityTest('/clinical/nurse/care-workflow', 'GET', null, 'Nurse Care Workflow')}
              style={{
                backgroundColor: '#1E293B',
                border: currentUser?.role === 'NURSE' ? '1px solid #0284C7' : '1px solid #334155',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'rgba(14, 165, 233, 0.2)', color: '#38BDF8', borderRadius: '4px', fontWeight: '700', border: '1px solid #0284C7' }}>
                  NURSE ONLY
                </span>
                <span style={{ fontSize: '11px', color: '#38BDF8' }}>hasRole('NURSE')</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#F1F5F9' }}>Bedside Care Workflow</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', marginTop: '2px' }}>
                GET /clinical/nurse/care-workflow
              </div>
            </button>
          </div>

          {/* Test Live Result Display Console */}
          {testResponse && (
            <div style={{
              backgroundColor: '#020617',
              borderRadius: '8px',
              border: `1px solid ${testResponse.status === 200 ? '#059669' : testResponse.status === 403 ? '#D97706' : '#DC2626'}`,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '10px 16px',
                backgroundColor: testResponse.status === 200 ? 'rgba(5, 150, 105, 0.2)'
                  : testResponse.status === 403 ? 'rgba(217, 119, 6, 0.2)'
                  : 'rgba(220, 38, 38, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Terminal size={16} color="#94A3B8" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                    {testResponse.testName} &rarr; HTTP {testResponse.status} {testResponse.statusText}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  Latency: <strong>{testResponse.latency} ms</strong> &bull; Clinician: <strong>{testResponse.authenticatedAs}</strong>
                </div>
              </div>

              <div style={{ padding: '14px 16px', fontSize: '12px', fontFamily: 'monospace' }}>
                <div style={{ color: '#94A3B8', marginBottom: '8px' }}>
                  <strong>Request:</strong> {testResponse.method} {testResponse.endpoint}
                </div>
                <pre style={{
                  color: testResponse.status === 200 ? '#34D399' : testResponse.status === 403 ? '#FBBF24' : '#F87171',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.4'
                }}>
                  {JSON.stringify(testResponse.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Clinical Deterioration & HITL Decision Center */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Telemetry Strip & Evidence */}
          <section style={{ backgroundColor: '#0F172A', borderRadius: '10px', padding: '20px', border: '1px solid #1E293B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} color="#EF4444" />
                <h2 style={{ fontSize: '16px', color: '#F9FAFB', fontWeight: '700', margin: 0 }}>
                  Hour {hourIndex} Bedside Telemetry vs. Baseline Scorecards
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '12px', padding: '3px 8px', backgroundColor: '#1E293B', borderRadius: '4px', color: '#CBD5E1' }}>
                  Bed: <strong>{patientId}</strong>
                </span>
                <span style={{ fontSize: '12px', padding: '3px 8px', backgroundColor: '#EF4444', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>
                  {urgency}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Heart Rate</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#EF4444' }}>101 <span style={{ fontSize: '12px' }}>bpm</span></div>
                <div style={{ fontSize: '11px', color: '#F87171', marginTop: '2px' }}>Creeping: +20 over 3h</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Blood Pressure</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#10B981' }}>146/91</div>
                <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px' }}>Compensated (SBP &gt; 100)</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Shock Index (HR/SBP)</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#F59E0B' }}>0.69 &rarr; 0.98</div>
                <div style={{ fontSize: '11px', color: '#F59E0B', marginTop: '2px' }}>Occult Shock Imminent</div>
              </div>
              <div style={{ backgroundColor: '#1E293B', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Standard NEWS2</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#94A3B8' }}>3 / 20</div>
                <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '2px' }}>MISSED (Rule blindspot)</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#1E1B4B', padding: '16px', borderRadius: '8px', border: '1px solid #4338CA' }}>
              <h3 style={{ fontSize: '14px', color: '#818CF8', margin: '0 0 10px 0', fontWeight: '700' }}>
                Multi-Agent Cross-Verification Consensus
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: '#E2E8F0' }}>
                <strong style={{ color: '#F87171' }}>Vitals Agent (Risk: 84%):</strong> Detected progressive tachycardia decoupled from systolic compensation.<br/>
                <strong style={{ color: '#FBBF24' }}>Labs Agent (Status: STAT_REQUIRED):</strong> Last Lactate (1.1 mmol/L) is 9 hours stale. Immediate STAT draw requested.<br/>
                <strong style={{ color: '#38BDF8' }}>Skeptic Agent (Discount: 0.05):</strong> Albuterol administered 6 hours ago cannot account for concurrent tachypnea (Resp: 21) and widening Shock Index. Genuine deterioration confirmed.
              </p>
            </div>
          </section>

          {/* HITL Action Panel with Role Checks */}
          <section style={{ backgroundColor: '#0F172A', borderRadius: '10px', padding: '20px', border: '1px solid #1E293B' }}>
            <h2 style={{ fontSize: '16px', color: '#F9FAFB', fontWeight: '700', marginBottom: '8px' }}>
              HITL Clinical Action Center
            </h2>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '14px' }}>
              Surviving Sepsis Campaign (Sepsis-3) 1-Hour Bundle recommended.
            </div>

            <div style={{
              backgroundColor: '#1E293B',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '16px',
              borderLeft: currentUser?.role === 'DOCTOR' ? '3px solid #10B981' : '3px solid #0284C7'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#CBD5E1' }}>Role Permission Status:</div>
              <div style={{ fontSize: '12px', color: currentUser?.role === 'DOCTOR' ? '#34D399' : '#38BDF8' }}>
                {currentUser?.role === 'DOCTOR'
                  ? 'Doctor Role Active: Authorized to prescribe bundles & override AI.'
                  : 'Nurse Role Active: Bedside care workflow enabled. Bundle prescription requires Attending sign-off.'}
              </div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', fontSize: '13px' }}>
              <li style={{ padding: '8px 0', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10B981" /> Measure STAT Blood Lactate
              </li>
              <li style={{ padding: '8px 0', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10B981" /> Blood Cultures x 2 prior to antibiotics
              </li>
              <li style={{ padding: '8px 0', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10B981" /> Empiric IV Broad-Spectrum Antimicrobials
              </li>
              <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10B981" /> Rapid Crystalloid Infusion (30 mL/kg)
              </li>
            </ul>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleAuthorizeBundle}
                style={{
                  backgroundColor: '#10B981',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Stethoscope size={16} />
                Authorize 1-Hour Sepsis Bundle
              </button>

              <button
                onClick={() => setOverrideModalOpen(true)}
                style={{
                  backgroundColor: '#334155',
                  color: '#F3F4F6',
                  padding: '10px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={16} color="#F59E0B" />
                Override AI (Mandatory Clinical Reason)
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Override AI Modal */}
      {overrideModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0F172A',
            borderRadius: '12px',
            border: '1px solid #EF4444',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertTriangle size={22} color="#EF4444" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>
                Override Multi-Agent Deterioration Warning
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '14px', lineHeight: '1.5' }}>
              Statutory clinical protocol: You are overriding an 84% composite sepsis alert.
              Attending Doctor credentials are required and a mandatory justification will be committed to the tamper-evident audit trail.
            </p>

            <textarea
              rows={4}
              required
              placeholder="e.g. Bedside echocardiogram shows normal cardiac output. SBP elevation is post-extubation anxiety, resolving with low-dose lorazepam. Lactate repeat ordered."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                marginBottom: '16px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleOverrideAI}
                style={{
                  flex: 1,
                  backgroundColor: '#EF4444',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Sign &amp; Commit Override
              </button>
              <button
                onClick={() => setOverrideModalOpen(false)}
                style={{
                  backgroundColor: '#334155',
                  color: '#CBD5E1',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
