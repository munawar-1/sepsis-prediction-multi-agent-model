import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Sun,
  Moon,
  Stethoscope,
  HeartPulse,
  Home,
  LogOut,
  Settings,
  Check,
  CheckCheck,
  AlertTriangle,
  ChevronDown,
  X,
  Activity,
  ShieldAlert,
  User,
  Zap,
  Clock,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const VIEW_METADATA = {
  consultation: {
    title: "Clinical Consultation",
    subtitle: "Interactive AI Diagnostic Workspace",
    patientContext: true
  },
  inbox: {
    title: "Clinical Triage Inbox",
    subtitle: "Multi-Agent Surveillance Queue",
    patientContext: false
  },
  monitoring: {
    title: "Patient Monitoring",
    subtitle: "Real-Time Telemetry & Hemodynamics",
    patientContext: true
  },
  records: {
    title: "Patient Records",
    subtitle: "Electronic Health Records & History",
    patientContext: true
  },
  agents: {
    title: "AI Diagnostic Ensemble",
    subtitle: "5 Autonomous Clinical Agents Active",
    patientContext: true
  },
  labs: {
    title: "Laboratory Reports",
    subtitle: "Biochemical Kinetics & Blood Gases",
    patientContext: true
  },
  medications: {
    title: "Medications & Dosing",
    subtitle: "Active Infusions & Administration Flowsheet",
    patientContext: true
  },
  settings: {
    title: "System Settings & Audit",
    subtitle: "Model Parameters & Clinical Governance",
    patientContext: false
  }
};

export default function Header({
  activeView = 'consultation',
  onSelectView,
  selectedAlert,
  alerts = [],
  onSelectAlert,
  onExitToLanding,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenAddPatient
}) {
  const { user, isDoctor, isNurse, logout } = useAuth();
  const { theme, toggleTheme, isDark, setTheme } = useTheme();

  // Dropdown States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

  // Element Refs for Click-Outside handling
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const notificationsContainerRef = useRef(null);
  const profileContainerRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (notificationsContainerRef.current && !notificationsContainerRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileContainerRef.current && !profileContainerRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setIsMobileSearchVisible(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsMobileSearchVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered search results across patients and alerts
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return alerts.filter(a => {
      return (
        a.patientId?.toLowerCase().includes(q) ||
        a.bed?.toLowerCase().includes(q) ||
        a.agent?.toLowerCase().includes(q) ||
        a.admissionDiagnosis?.toLowerCase().includes(q) ||
        a.priority?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q)
      );
    });
  }, [alerts, searchQuery]);

  // Unread alerts count
  const unreadAlerts = useMemo(() => {
    return alerts.filter(a => !a.isReviewed);
  }, [alerts]);

  // View Metadata
  const currentMeta = VIEW_METADATA[activeView] || {
    title: "Clinical Flight Deck",
    subtitle: "Multi-Agent Surveillance System",
    patientContext: false
  };

  // User Initials
  const userInitials = useMemo(() => {
    if (user?.fullName) {
      const cleanName = user.fullName.replace(/^Dr\.\s*/i, '').trim();
      const parts = cleanName.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return cleanName.slice(0, 2).toUpperCase();
    }
    return isDoctor ? 'RS' : 'NP';
  }, [user?.fullName, isDoctor]);

  const displayName = user?.fullName || (isDoctor ? 'Dr. Rajesh Sharma, MD' : 'Nurse Priya Patel, RN');
  const displayRoleTitle = isDoctor ? 'Attending Intensivist' : 'ICU Clinical Nurse Specialist';
  const licenseNumber = isDoctor ? 'MD-LIC-48291-ICU' : 'RN-LIC-93104-ICU';

  const handleSelectSearchResult = (alertId) => {
    if (onSelectAlert) onSelectAlert(alertId);
    if (onSelectView && activeView === 'inbox') {
      onSelectView('consultation');
    }
    setIsSearchOpen(false);
    setIsMobileSearchVisible(false);
    setSearchQuery('');
  };

  const handleSelectNotification = (alertId) => {
    if (onSelectAlert) onSelectAlert(alertId);
    if (onSelectView) onSelectView('consultation');
    setIsNotificationsOpen(false);
  };

  return (
    <header
      className={`relative w-full h-14 sm:h-16 px-3 sm:px-5 flex items-center justify-between shrink-0 z-40 select-none border-b transition-colors duration-200 ${
        isDark
          ? 'bg-[#0D1524] border-[#1E2D44] text-slate-100'
          : 'bg-white border-[#E5E7EB] text-slate-900 shadow-2xs'
      }`}
    >
      {/* =====================================================================
          SECTION A: LEFT — SIDEBAR TOGGLE, BRAND LOGO & DYNAMIC BREADCRUMB
          ===================================================================== */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer ${
            isDark
              ? 'bg-[#142036] hover:bg-[#1B2B48] border-[#1E2D44] text-slate-300 hover:text-white'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
          title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-label="Toggle Navigation Sidebar"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-emerald-500" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-emerald-500" />
          )}
        </button>

        {/* AEGIS Brand Mark (Visible especially on collapsed sidebar or mobile) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-mono font-bold text-xs text-white shadow-xs">
            Æ
          </div>
          <span className="font-bold text-xs tracking-tight font-display hidden md:inline">
            AEGIS-ICU
          </span>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider hidden lg:inline border ${
            isDark
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            v3.0 Flight Deck
          </span>
        </div>

        {/* Vertical Divider */}
        <div className={`h-4 w-px hidden sm:block ${isDark ? 'bg-slate-700/60' : 'bg-slate-200'}`} />

        {/* Page Title & Breadcrumb Context */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="font-bold text-xs sm:text-sm tracking-tight truncate leading-tight">
                {currentMeta.title}
              </h1>
              {/* Optional Active Patient Pill Badge */}
              {currentMeta.patientContext && selectedAlert && (
                <div className={`hidden xl:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full border shrink-0 ${
                  selectedAlert.priority === 'CRITICAL'
                    ? (isDark ? 'bg-rose-950/40 text-rose-300 border-rose-500/40' : 'bg-rose-50 text-rose-700 border-rose-300')
                    : (isDark ? 'bg-amber-950/40 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-800 border-amber-300')
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedAlert.priority === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="font-bold">{selectedAlert.bed}</span>
                  <span>•</span>
                  <span>{selectedAlert.patientId}</span>
                </div>
              )}
            </div>
            <p className={`text-[10px] font-mono truncate hidden lg:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {currentMeta.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SECTION B: CENTER — GLOBAL SEARCH CONTROL (PATIENT / BED / AGENT)
          ===================================================================== */}
      <div
        ref={searchContainerRef}
        className={`relative flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-3 ${
          isMobileSearchVisible ? 'absolute inset-x-3 top-2.5 z-50 max-w-none flex' : 'hidden md:flex'
        }`}
      >
        <div className={`relative w-full flex items-center rounded-xl border transition-all duration-200 ${
          isDark
            ? 'bg-[#0B1322] border-[#1A2C46] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
            : 'bg-[#F0F5FA] border-[#D0DFEF] focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
        }`}>
          <Search className={`w-4 h-4 ml-3 shrink-0 ${isDark ? 'text-[#768CA8]' : 'text-[#64748B]'}`} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search patients, beds, agents (Ctrl+K)..."
            className={`w-full py-1.5 pl-2.5 pr-8 text-xs font-sans bg-transparent outline-none ${
              isDark ? 'text-[#F1F5FA] placeholder:text-[#768CA8]' : 'text-[#0F172A] placeholder:text-[#64748B]'
            }`}
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 p-0.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-[#1E2D44] text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className={`hidden lg:inline-flex items-center gap-0.5 absolute right-2.5 px-1.5 py-0.5 rounded text-[9px] font-mono border ${
              isDark ? 'bg-[#14263F] border-[#1E2D44] text-[#768CA8]' : 'bg-[#E2ECF7] border-[#CBDCEE] text-[#475569]'
            }`}>
              Ctrl K
            </kbd>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim() && (
          <div
            className={`absolute top-full left-0 right-0 mt-1.5 rounded-2xl border shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto ${
              isDark ? 'bg-[#0D1524] border-[#1E2D44]' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`p-2 text-[10px] font-mono font-bold uppercase tracking-wider border-b ${
              isDark ? 'text-slate-400 border-[#1E2D44] bg-[#0A111E]' : 'text-slate-500 border-slate-100 bg-slate-50'
            }`}>
              Matching ICU Patients &amp; Alerts ({searchResults.length})
            </div>

            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-sans">
                No active patient or alert matches "<span className="font-semibold text-slate-400">{searchQuery}</span>"
              </div>
            ) : (
              <div className="p-1 space-y-0.5">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSearchResult(item.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      isDark ? 'hover:bg-[#142036]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        item.priority === 'CRITICAL'
                          ? (isDark ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40' : 'bg-rose-50 text-rose-700 border border-rose-200')
                          : (isDark ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40' : 'bg-amber-50 text-amber-800 border border-amber-200')
                      }`}>
                        {item.bed?.split(' ')[1] || item.bed}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>{item.patientId}</span>
                          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>• {item.bed}</span>
                        </div>
                        <div className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {item.admissionDiagnosis || item.summary}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      item.priority === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {item.priority}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          SECTION C: RIGHT — CONTROLS, THEME TOGGLE, NOTIFICATIONS & PROFILE
          ===================================================================== */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

        {/* Mobile Search Icon Toggle */}
        <button
          onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
          className={`md:hidden w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
            isDark
              ? 'bg-[#101C30] border-[#1E2D44] text-[#8BA1BD]'
              : 'bg-[#EBF2FA] border-[#D0DFEF] text-[#556D8A]'
          }`}
          title="Search"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Live Multi-Agent Telemetry Pulse Badge */}
        <div className={`hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-mono ${
          isDark ? 'bg-[#0B1322] border-[#1A2C46]' : 'bg-[#F0F5FA] border-[#D0DFEF]'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className={`text-[10px] ${isDark ? 'text-[#768CA8]' : 'text-[#64748B]'}`}>
            Ensemble:
          </span>
          <span className={`text-[10px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            96.8% Sync
          </span>
        </div>

        {/* ===================================================================
            THEME TOGGLE: POLISHED SEGMENTED SWITCH (SUN & MOON)
            =================================================================== */}
        <div
          className={`flex items-center p-0.5 rounded-xl border transition-all duration-200 ${
            isDark
              ? 'bg-[#0B1322] border-[#1A2C46]'
              : 'bg-[#EBF2FA] border-[#D0DFEF]'
          }`}
          role="radiogroup"
          aria-label="Color Theme Switcher"
        >
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
              !isDark
                ? 'bg-white text-[#0F172A] shadow-xs border border-[#CBDCEE] font-bold'
                : 'bg-transparent text-[#7A91AD] hover:text-[#CBD5E1] hover:bg-[#0E1B2E] border border-transparent'
            }`}
            title="Switch to Daylight Mode"
            aria-checked={!isDark}
            role="radio"
          >
            <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500' : 'text-[#7A91AD]'}`} />
            <span className="hidden sm:inline text-[11px] font-mono">Day</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
              isDark
                ? 'bg-[#14263F] text-[#00E5B9] shadow-xs border border-[#00E5B9]/40 font-bold'
                : 'bg-transparent text-[#5B718E] hover:text-[#0F172A] hover:bg-[#DFEAF5] border border-transparent'
            }`}
            title="Switch to Night Clinical Mode"
            aria-checked={isDark}
            role="radio"
          >
            <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-[#00E5B9]' : 'text-[#5B718E]'}`} />
            <span className="hidden sm:inline text-[11px] font-mono">Night</span>
          </button>
        </div>

        {/* ===================================================================
            NOTIFICATIONS BELL & INTERACTIVE ALERT PANEL
            =================================================================== */}
        <div ref={notificationsContainerRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer ${
              isDark
                ? 'bg-[#101C30] hover:bg-[#162947] border-[#1E2D44] text-[#8BA1BD] hover:text-white'
                : 'bg-[#EBF2FA] hover:bg-[#DFEAF5] border-[#D0DFEF] text-[#556D8A] hover:text-[#0F172A]'
            }`}
            title={`Clinical Alerts (${unreadAlerts.length} unreviewed)`}
            aria-label="Clinical Alert Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-[#0D1524] shadow-xs">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationsOpen && (
            <div
              className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl overflow-hidden z-50 animate-message ${
                isDark ? 'bg-[#0D1524] border-[#1E2D44]' : 'bg-white border-slate-200'
              }`}
            >
              <div className={`p-3.5 border-b flex items-center justify-between ${
                isDark ? 'bg-[#0A111E] border-[#1E2D44]' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-500" />
                  <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    Active Clinical Alerts
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    unreadAlerts.length > 0
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {unreadAlerts.length} Unreviewed
                  </span>
                </div>

                {onSelectView && (
                  <button
                    onClick={() => {
                      onSelectView('inbox');
                      setIsNotificationsOpen(false);
                    }}
                    className="text-[11px] font-medium text-emerald-600 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No active surveillance alerts at this time.
                  </div>
                ) : (
                  alerts.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectNotification(item.id)}
                      className={`w-full p-3 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                        !item.isReviewed
                          ? (isDark ? 'bg-[#142036]/60 hover:bg-[#1B2B48]' : 'bg-rose-50/30 hover:bg-rose-50/60')
                          : (isDark ? 'hover:bg-[#142036]' : 'hover:bg-slate-50')
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        item.priority === 'CRITICAL'
                          ? (isDark ? 'bg-rose-950/70 text-rose-400 border border-rose-500/40' : 'bg-rose-100 text-rose-700')
                          : (isDark ? 'bg-amber-950/70 text-amber-400 border border-amber-500/40' : 'bg-amber-100 text-amber-800')
                      }`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-xs font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                              {item.patientId}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">({item.bed})</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {item.timestamp || 'Just now'}
                          </span>
                        </div>

                        <p className={`text-[11px] line-clamp-1 mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {item.summary || item.initialAgentMessage}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono">
                          <span className={`font-semibold ${
                            item.priority === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'
                          }`}>
                            {item.priority}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-400">{item.agent}</span>
                          {!item.isReviewed && (
                            <span className="ml-auto text-[9px] font-bold text-rose-500">
                              NEW
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nurse: Add Patient Header Quick Action */}
        {isNurse && onOpenAddPatient && (
          <button
            type="button"
            onClick={onOpenAddPatient}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs ${
              isDark
                ? 'bg-teal-950/60 hover:bg-teal-900/60 border-teal-800 text-teal-300'
                : 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-800'
            }`}
            title="Bedside Nurse: Admit New ICU Patient"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-600" />
            <span>+ Add Patient</span>
          </button>
        )}

        {/* ===================================================================
            CLINICIAN PROFILE BUTTON & DROPDOWN MENU
            =================================================================== */}
        <div ref={profileContainerRef} className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-2 p-1 sm:pl-1.5 sm:pr-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
              isDark
                ? 'bg-[#142036] hover:bg-[#1B2B48] border-[#1E2D44] text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
            }`}
            title="Clinician Account & Session Settings"
            aria-label="Clinician Profile Menu"
          >
            {/* Avatar Pill */}
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 border border-emerald-400/30 flex items-center justify-center text-white font-mono font-bold text-xs shadow-xs">
                {userInitials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0D1524]" />
            </div>

            {/* Clinician Name & Role Pill */}
            <div className="hidden md:flex flex-col text-left leading-none min-w-0">
              <span className="text-xs font-bold truncate max-w-[120px]">
                {displayName}
              </span>
              <span className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-semibold'}`}>
                {user?.role || (isDoctor ? 'DOCTOR' : 'NURSE')}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div
              className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl overflow-hidden z-50 animate-message ${
                isDark ? 'bg-[#0D1524] border-[#1E2D44]' : 'bg-white border-slate-200'
              }`}
            >
              {/* Profile Card Header */}
              <div className={`p-4 border-b ${
                isDark ? 'bg-[#0A111E] border-[#1E2D44]' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-mono font-bold text-sm shadow-xs shrink-0">
                    {userInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {displayName}
                    </h3>
                    <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {displayRoleTitle}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px]">
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase border ${
                        isDoctor
                          ? (isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-200')
                          : (isDark ? 'bg-sky-950/60 text-sky-300 border-sky-500/40' : 'bg-sky-50 text-sky-800 border-sky-200')
                      }`}>
                        {user?.role || (isDoctor ? 'DOCTOR' : 'NURSE')}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400">{licenseNumber}</span>
                    </div>
                  </div>
                </div>

                <div className={`mt-3 pt-2.5 border-t text-[10px] font-mono flex items-center justify-between ${
                  isDark ? 'border-[#1E2D44] text-slate-400' : 'border-slate-200 text-slate-500'
                }`}>
                  <span>Department:</span>
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    MICU • Ward 3B
                  </span>
                </div>
              </div>

              {/* Action Links */}
              <div className="p-1.5 space-y-0.5 text-xs font-medium">
                {/* System Settings */}
                {onSelectView && (
                  <button
                    onClick={() => {
                      onSelectView('settings');
                      setIsProfileOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                      isDark ? 'text-slate-300 hover:bg-[#142036] hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>System Settings &amp; Audit</span>
                  </button>
                )}

                {/* Day / Night Mode Toggle inside dropdown */}
                <button
                  onClick={toggleTheme}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                    isDark ? 'text-slate-300 hover:bg-[#142036] hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>Theme</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                    isDark ? 'bg-[#0A111E] text-slate-300 border-[#1E2D44]' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {isDark ? 'Night (Dark)' : 'Day (Light)'}
                  </span>
                </button>

                {/* Return to Homepage */}
                {onExitToLanding && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onExitToLanding();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                      isDark ? 'text-slate-300 hover:bg-[#142036] hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Home className="w-4 h-4 text-slate-400" />
                    <span>Return to Homepage</span>
                  </button>
                )}

                <div className={`my-1 border-t ${isDark ? 'border-[#1E2D44]' : 'border-slate-100'}`} />

                {/* Sign Out */}
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    if (onExitToLanding) onExitToLanding();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer text-rose-600 hover:bg-rose-500/10 font-medium`}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
