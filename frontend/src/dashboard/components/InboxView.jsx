import React from 'react';
import {
  Search,
  RefreshCw,
  Check,
  CheckCircle2,
  Activity,
  FlaskConical,
  Pill,
  ShieldCheck,
  Heart,
  Gauge,
  Zap,
  Brain,
  ArrowRight,
  Clock,
  Home,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AGENT_ICON_MAP = {
  vitals: Activity,
  lab: FlaskConical,
  meds: Pill,
  'data-quality': ShieldCheck
};

/**
 * Circular Risk Gauge Component (White Healthcare Theme)
 * Displays a circular progress ring with centered risk score percentage
 */
function CircularRiskGauge({ score = 84, priority = 'CRITICAL' }) {
  const size = 52;
  const strokeWidth = 4.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const color =
    priority === 'CRITICAL' ? '#EF4444' :
    priority === 'HIGH' ? '#F59E0B' :
    priority === 'MODERATE' ? '#0284C7' : '#059669';

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Active Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center Percentage Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs font-mono font-black tracking-tight" style={{ color }}>
          {clampedScore}%
        </span>
        <span className="text-[7.5px] font-mono uppercase tracking-widest text-slate-400 font-bold -mt-0.5">
          RISK
        </span>
      </div>
    </div>
  );
}

export default function InboxView({
  alerts = [],
  currentFilter = 'all',
  onSetFilter,
  searchQuery = '',
  onSearchChange,
  onSelectAlert,
  onSimulateAlert,
  onExitToLanding
}) {
  const { logout } = useAuth();

  // Priority Rank for Sorting (Critical > High > Moderate > Low)
  const priorityRank = {
    CRITICAL: 1,
    HIGH: 2,
    MODERATE: 3,
    LOW: 4
  };

  // Helper to extract or dynamically calculate patient risk score
  const getPatientRiskScore = (patient) => {
    if (patient.riskScore !== undefined) return patient.riskScore;
    if (patient.priority === 'CRITICAL') return 84;
    if (patient.priority === 'HIGH') return 68;
    if (patient.priority === 'MODERATE') return 44;
    return 22;
  };

  // Severity Filter & Search matching
  const filteredAlerts = alerts.filter(item => {
    // Severity Filter logic
    if (currentFilter && currentFilter !== 'all') {
      if (currentFilter === 'unread') {
        if (item.isReviewed) return false;
      } else if (currentFilter === 'reviewed') {
        if (!item.isReviewed) return false;
      } else if (currentFilter === 'high') {
        if (item.priority !== 'CRITICAL' && item.priority !== 'HIGH') return false;
      } else {
        // Direct severity match (CRITICAL, HIGH, MODERATE, LOW)
        if (item.priority?.toUpperCase() !== currentFilter.toUpperCase()) return false;
      }
    }

    // Search logic (Patient ID, Bed Number, Diagnosis, Headline, Agent)
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchPatient = (item.patientId || '').toLowerCase().includes(q);
      const matchBed = (item.bed || '').toLowerCase().includes(q);
      const matchDiagnosis = (item.admissionDiagnosis || '').toLowerCase().includes(q);
      const matchHeadline = (item.headline || '').toLowerCase().includes(q);
      const matchSummary = (item.summary || '').toLowerCase().includes(q);
      const matchAgent = (item.agent || '').toLowerCase().includes(q);
      return matchPatient || matchBed || matchDiagnosis || matchHeadline || matchSummary || matchAgent;
    }

    return true;
  });

  // Sort: Critical & High first, then by rawTime
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const rankA = priorityRank[a.priority?.toUpperCase()] || 5;
    const rankB = priorityRank[b.priority?.toUpperCase()] || 5;
    if (rankA !== rankB) return rankA - rankB;
    return (a.rawTime ?? 0) - (b.rawTime ?? 0);
  });

  // Patient severity category counts for filter chips
  const totalCount = alerts.length;
  const criticalCount = alerts.filter(a => a.priority === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.priority === 'HIGH').length;
  const moderateCount = alerts.filter(a => a.priority === 'MODERATE').length;
  const lowCount = alerts.filter(a => a.priority === 'LOW').length;

  const severityFilters = [
    { id: 'all', label: 'All Patients', count: totalCount },
    { id: 'CRITICAL', label: 'Critical', count: criticalCount, color: '#EF4444' },
    { id: 'HIGH', label: 'High', count: highCount, color: '#F59E0B' },
    { id: 'MODERATE', label: 'Moderate', count: moderateCount, color: '#0284C7' },
    { id: 'LOW', label: 'Low', count: lowCount, color: '#059669' }
  ];

  // Primary action: Navigate directly to AI Consultation page for selected patient
  const handleCardClick = (patient) => {
    if (onSelectAlert) {
      onSelectAlert(patient.id);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#F8FAFC] text-slate-900 custom-scrollbar">

      {/* =========================================================================
          SECTION 1: COMPACT PATIENT CONTROL SECTION (Full-Screen Surveillance)
          ========================================================================= */}
      <div className="mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        
        {/* Severity Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-full border border-slate-200 bg-white shadow-2xs overflow-x-auto custom-scrollbar shrink-0">
          {severityFilters.map((tab) => {
            const isActive = currentFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSetFilter(tab.id)}
                className={`h-8 px-3.5 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold border border-transparent'
                }`}
              >
                {tab.id !== 'all' && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tab.color || '#0D9488' }}
                  />
                )}
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar + Compact Simulate Alert Button + Home/Logout Actions */}
        <div className="flex items-center gap-2.5 flex-1 lg:max-w-2xl justify-end">
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Patient ID (e.g. PT-9042), Bed, or Diagnosis..."
              className="w-full h-9 border border-slate-300 rounded-full pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/30 transition-all duration-200 font-sans shadow-2xs"
            />
          </div>

          {/* Simulate Alert Button */}
          <button
            onClick={onSimulateAlert}
            className="h-9 px-3.5 rounded-full border border-teal-300 bg-teal-50 hover:bg-teal-100 text-xs font-mono text-teal-800 flex items-center gap-1.5 shrink-0 transition-all duration-200 cursor-pointer font-bold shadow-2xs active:scale-95"
            title="Simulate incoming real-time ICU surveillance alert"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Simulate Alert</span>
          </button>

          {/* Home Button (Direct exit to landing page) */}
          {onExitToLanding && (
            <button
              onClick={onExitToLanding}
              className="w-9 h-9 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 hover:text-teal-700 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs shrink-0"
              title="Return to Landing Page"
            >
              <Home className="w-4 h-4" />
            </button>
          )}

          {/* Sign Out Button */}
          <button
            onClick={() => {
              logout();
              if (onExitToLanding) onExitToLanding();
            }}
            className="w-9 h-9 rounded-full border border-slate-300 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 hover:border-rose-200 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* =========================================================================
          SECTION 2: FULL-SCREEN PATIENT CARDS (2-Column Desktop Grid, 1-Col Mobile)
          ========================================================================= */}
      {sortedAlerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-teal-600 opacity-60 mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Patients Matching Active Criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Try adjusting your search query or switch the severity filter back to "All Patients".
          </p>
          <button
            onClick={() => {
              onSetFilter('all');
              onSearchChange('');
            }}
            className="mt-4 px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-300 hover:bg-teal-100 transition cursor-pointer shadow-2xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 pb-8">
          {sortedAlerts.map((patient) => {
            const isCritical = patient.priority === 'CRITICAL';
            const isHigh = patient.priority === 'HIGH';
            const isModerate = patient.priority === 'MODERATE';
            const AgentIcon = AGENT_ICON_MAP[patient.agentKey] || Activity;
            const riskScore = getPatientRiskScore(patient);

            // Dynamic severity border class (Thick animated borders)
            const severityCardBorderClass = isCritical
              ? 'severity-critical-card'
              : isHigh
              ? 'severity-high-card'
              : isModerate
              ? 'severity-moderate-card'
              : 'severity-low-card';

            // Severity badge styling
            const severityBadgeStyle = isCritical
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : isHigh
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : isModerate
              ? 'bg-sky-50 text-sky-800 border-sky-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300';

            return (
              <div
                key={patient.id}
                onClick={() => handleCardClick(patient)}
                className={`group relative rounded-2xl bg-white p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:translate-y-[-2px] shadow-xs hover:shadow-md ${severityCardBorderClass}`}
              >
                {/* ---------------- CARD TOP & MIDDLE SECTION ---------------- */}
                <div>
                  {/* Top Bar: Identification, Badges & Circular Risk Indicator */}
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: ID, Bed, Demographics, Severity */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Reviewed / Unreviewed Pulse Indicator */}
                        {!patient.isReviewed ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" title="Unreviewed Alert" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700" title="Acknowledged">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}

                        {/* Patient ID */}
                        <span className="font-mono text-lg font-bold text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors">
                          {patient.patientId}
                        </span>

                        {/* Bed Pill */}
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800">
                          {patient.bed}
                        </span>

                        {/* Severity Pill */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border-[1.5px] tracking-wide uppercase shadow-2xs ${severityBadgeStyle}`}>
                          {patient.priority}
                        </span>
                      </div>

                      {/* Demographics & Timestamp */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span>{patient.age ? `${patient.age} yo` : '68 yo'} • {patient.gender || 'Male'}</span>
                        <span>•</span>
                        <span className="font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {patient.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Right: Circular Patient Risk Rate Indicator */}
                    <CircularRiskGauge score={riskScore} priority={patient.priority} />
                  </div>

                  {/* Primary Diagnosis */}
                  <div className="mt-3.5 mb-3.5">
                    <div className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-teal-700 transition-colors">
                      {patient.admissionDiagnosis || 'Acute Respiratory Decompensation / Sepsis Surveillance'}
                    </div>
                  </div>

                  {/* Clinical Parameter Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Heart Rate */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 font-semibold">
                        <Heart className="w-3 h-3 text-[#EF4444]" />
                        <span>Heart Rate</span>
                      </div>
                      <div className="text-sm font-mono font-bold text-slate-900 mt-1">
                        {patient.vitals?.hr || '118 bpm'}
                      </div>
                    </div>

                    {/* Blood Pressure / MAP */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 font-semibold">
                        <Gauge className="w-3 h-3 text-[#F59E0B]" />
                        <span>BP / MAP</span>
                      </div>
                      <div className="text-sm font-mono font-bold text-slate-900 mt-1">
                        {patient.vitals?.map || 'MAP 65'}
                      </div>
                    </div>

                    {/* Shock Index */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 font-semibold">
                        <Zap className="w-3 h-3 text-[#EF4444]" />
                        <span>Shock Index</span>
                      </div>
                      <div className={`text-sm font-mono font-bold mt-1 ${
                        parseFloat(patient.vitals?.shockIndex || '0') >= 1.0 ? 'text-[#EF4444]' : 'text-slate-900'
                      }`}>
                        {patient.vitals?.shockIndex || '1.34'}
                      </div>
                    </div>

                    {/* Lactate */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 font-semibold">
                        <FlaskConical className="w-3 h-3 text-[#0284C7]" />
                        <span>Lactate</span>
                      </div>
                      <div className={`text-sm font-mono font-bold mt-1 ${
                        (patient.labs?.lactate || '').includes('3.') || (patient.labs?.lactate || '').includes('4.')
                          ? 'text-[#EF4444]'
                          : 'text-slate-900'
                      }`}>
                        {patient.labs?.lactate || '3.8 mmol/L'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---------------- CARD BOTTOM SECTION ---------------- */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  {/* Responsible Agent micro-indicator */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
                    <AgentIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">{patient.agent}</span>
                  </div>

                  {/* Cylindrical / Capsule Element: "Reasoning with Agent →" */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(patient);
                    }}
                    className="px-4 py-1.5 rounded-full border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold font-mono flex items-center gap-2 transition-all duration-200 group-hover:border-teal-400 group-hover:shadow-xs shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Brain className="w-3.5 h-3.5 text-teal-600" />
                    <span>Reasoning with Agent</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
