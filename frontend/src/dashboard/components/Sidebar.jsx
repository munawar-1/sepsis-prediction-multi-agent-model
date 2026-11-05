import React, { useMemo } from 'react';
import {
  MessageSquarePlus,
  LayoutGrid,
  Activity,
  FileText,
  Bot,
  FlaskConical,
  Pill,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  LogOut,
  Plus,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({
  activeView,
  onSelectView,
  alerts = [],
  selectedAlertId,
  onSelectPatient,
  onNewConsultation,
  onExitToLanding,
  isCollapsed,
  onToggleCollapse,
  width = 260,
  isDragging = false
}) {
  const { user, isDoctor, isNurse, logout } = useAuth();

  // Navigation Items Specification (Role-Specific)
  // Bedside Nurses do NOT have complex AI Agent or raw Lab Reports views
  // Instead, Nurses have Bedside Therapy & Tasks (Doctor Orders Worklist)
  const navItems = isNurse ? [
    { id: 'therapy', label: 'Bedside Tasks & Orders', icon: ClipboardList, badge: '3' },
    { id: 'inbox', label: 'Dashboard', icon: LayoutGrid, badge: alerts.filter(a => !a.isReviewed).length },
    { id: 'monitoring', label: 'Patient Monitoring', icon: Activity, badge: null },
    { id: 'records', label: 'Patient Records', icon: FileText, badge: null },
    { id: 'consultation', label: 'Consultation', icon: MessageSquarePlus, badge: null },
    { id: 'medications', label: 'Medications', icon: Pill, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null }
  ] : [
    { id: 'consultation', label: 'Consultation', icon: MessageSquarePlus, badge: null },
    { id: 'inbox', label: 'Dashboard', icon: LayoutGrid, badge: alerts.filter(a => !a.isReviewed).length },
    { id: 'therapy', label: 'Therapy & Orders', icon: ClipboardList, badge: null },
    { id: 'monitoring', label: 'Patient Monitoring', icon: Activity, badge: null },
    { id: 'records', label: 'Patient Records', icon: FileText, badge: null },
    { id: 'agents', label: 'AI Agents', icon: Bot, badge: '5' },
    { id: 'labs', label: 'Laboratory Reports', icon: FlaskConical, badge: null },
    { id: 'medications', label: 'Medications', icon: Pill, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null }
  ];

  // Derive dynamic user initials and profile metadata
  const userInitials = useMemo(() => {
    if (user?.fullName) {
      const cleanName = user.fullName.replace(/^Dr\.\s*/i, '').trim();
      const parts = cleanName.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return cleanName.slice(0, 2).toUpperCase();
    }
    return 'RS';
  }, [user?.fullName]);

  const displayName = user?.fullName || (isNurse ? 'Nurse Priya Patel, RN' : 'Dr. Rajesh Sharma, MD');
  const displayTitle = isNurse ? 'Bedside ICU Registered Nurse' : 'Attending Physician';

  return (
    <aside
      style={{ width: isCollapsed ? 68 : width }}
      className={`h-full flex-shrink-0 flex flex-col justify-between select-none bg-[#F9FAFB] border-r-[1.5px] border-[#E5E7EB] ${
        isDragging ? 'transition-none select-none pointer-events-none' : 'transition-all duration-200 ease-in-out'
      } ${isCollapsed ? 'p-2.5' : 'p-3'}`}
    >
      {/* Top: Brand Header, New Consultation & Primary Navigation */}
      <div className="sidebar-scroll-container flex flex-col gap-2.5 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5">
        
        {/* Brand & Collapse Toggle */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} pt-0.5 px-0.5`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-mono font-bold text-xs text-white shadow-xs">
                Æ
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 leading-tight tracking-tight">
                  HourZero
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border-[1.5px] border-emerald-300 font-bold">
                    v3.0
                  </span>
                </div>
                <div className="text-[10px] font-mono font-semibold text-slate-400 tracking-wider uppercase">
                  Clinical AI
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-white dark:bg-[#101C30] text-[#556D8A] dark:text-[#8BA1BD] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F0F5FA] dark:hover:bg-[#172A47] hover:border-[#B8D1EA] dark:hover:border-[#28446E] transition-all duration-200 ease-in-out cursor-pointer shadow-2xs"
            title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4 text-emerald-600" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* New Consultation Action Button (Cylindrical / Pill-shaped) */}
        <button
          onClick={onNewConsultation}
          className={`group flex items-center gap-2 rounded-full text-xs font-semibold transition-all duration-200 ease-in-out cursor-pointer bg-white dark:bg-[#0E182A] border-[1.5px] border-[#D0DFEF] dark:border-[#1E3456] hover:border-emerald-500 dark:hover:border-emerald-500/60 hover:bg-emerald-50/40 dark:hover:bg-[#13243C] shadow-2xs active:scale-95 ${
            isCollapsed
              ? 'w-10 h-10 justify-center p-0 text-emerald-600 mx-auto'
              : 'w-full px-3.5 py-2 text-[#0F172A] dark:text-[#F1F5FA]'
          }`}
          title="Start New Patient Consultation"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-50 border-[1.5px] border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0 font-bold text-xs group-hover:scale-105 transition-all duration-200 ease-in-out">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          {!isCollapsed && <span className="text-[#0F172A] dark:text-[#F1F5FA] font-semibold truncate">New Consultation</span>}
        </button>

        {/* Primary Navigation List */}
        <nav className="flex flex-col gap-1 mt-0.5">
          {!isCollapsed && (
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 py-1 font-bold">
              Platform
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const hasAlertBadge = typeof item.badge === 'number' && item.badge > 0;

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`group relative flex items-center justify-between rounded-full text-xs transition-all duration-200 ease-in-out cursor-pointer ${
                  isCollapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'px-3 py-2'
                } ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-[#0E2A2A] text-emerald-800 dark:text-emerald-300 font-bold border-[1.5px] border-emerald-300 dark:border-emerald-500/40 shadow-2xs'
                    : 'bg-transparent text-[#334155] dark:text-[#94A3B8] hover:bg-[#EBF2FA] dark:hover:bg-[#142036] hover:text-[#0F172A] dark:hover:text-[#F1F5FA] border-[1.5px] border-transparent font-semibold'
                }`}
                title={item.label}
              >
                <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-all duration-200 ease-in-out ${
                      isActive
                        ? 'text-emerald-700'
                        : 'text-slate-500 group-hover:text-slate-900'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate tracking-tight">{item.label}</span>}
                </div>

                {/* Subtle Badge Chip (Expanded) */}
                {!isCollapsed && item.badge && (
                  <span
                    className={`h-5 min-w-[20px] px-2 rounded-full text-[10px] font-mono font-bold flex items-center justify-center leading-none tracking-tight transition-all duration-200 ease-in-out border-[1.5px] shadow-2xs ${
                      hasAlertBadge
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : isActive
                          ? 'bg-white text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200 group-hover:text-slate-900 border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Subtle Micro-dot Chip for Collapsed Mode */}
                {isCollapsed && item.badge && (
                  <span
                    className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white transition-all duration-200 ease-in-out ${
                      hasAlertBadge ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Recent Patient Consultations List */}
        {!isCollapsed && (
          <div className="flex flex-col gap-1 mt-1.5 pt-2.5 border-t-[1.5px] border-[#E5E7EB] min-w-0">
            <div className="flex items-center justify-between px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              <span>Recent Consultations</span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border-[1.5px] border-slate-200">
                ICU 3B
              </span>
            </div>

            <div className="sidebar-scroll-container space-y-1 overflow-y-auto max-h-52 pr-0.5">
              {alerts.map((alert) => {
                const isSelected = selectedAlertId === alert.id;
                const isCrit = alert.priority === 'CRITICAL';
                const isHigh = alert.priority === 'HIGH';

                return (
                  <button
                    key={alert.id}
                    onClick={() => {
                      onSelectPatient(alert.id);
                      onSelectView('consultation');
                    }}
                    className={`group w-full text-left px-3 py-1.5 rounded-full text-xs transition-all duration-200 ease-in-out flex items-center justify-between gap-2 cursor-pointer border-[1.5px] ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-bold border-emerald-300 shadow-2xs'
                        : 'bg-transparent text-slate-700 hover:bg-slate-100 hover:border-slate-200 border-transparent font-medium'
                    }`}
                    title={`${alert.patientId} • ${alert.bed} (${alert.priority})`}
                  >
                    {/* Patient status indicator dot & ID & Bed */}
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Subtle patient status indicator (colored micro-dots) */}
                      <span className="relative flex h-2 w-2 shrink-0">
                        {isCrit && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        )}
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 transition-all duration-200 ease-in-out ${
                            isCrit
                              ? 'bg-rose-500'
                              : isHigh
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                        />
                      </span>

                      <span
                        className={`font-mono text-xs truncate transition-all duration-200 ease-in-out ${
                          isSelected
                            ? 'text-emerald-900 font-bold'
                            : 'text-slate-900 group-hover:text-slate-950 font-semibold'
                        }`}
                      >
                        {alert.patientId}
                      </span>
                      <span
                        className={`text-[10px] truncate transition-all duration-200 ease-in-out ${
                          isSelected
                            ? 'text-emerald-700 font-semibold'
                            : 'text-slate-500 group-hover:text-slate-700 font-medium'
                        }`}
                      >
                        {alert.bed}
                      </span>
                    </div>

                    {/* Right-aligned timestamp label */}
                    <span
                      className={`text-[10px] font-mono shrink-0 tabular-nums ml-auto transition-all duration-200 ease-in-out ${
                        isSelected
                          ? 'text-emerald-700 font-bold'
                          : 'text-slate-400 group-hover:text-slate-600 font-medium'
                      }`}
                    >
                      {alert.timestamp}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom User Profile Card */}
      <div className={`pt-2.5 mt-auto border-t-[1.5px] border-[#E5E7EB] shrink-0 ${isCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        <div
          className={`bg-white border-[1.5px] border-slate-200 rounded-3xl flex items-center justify-between transition-all duration-200 ease-in-out hover:border-slate-300 shadow-sm ${
            isCollapsed ? 'p-1.5 justify-center w-full' : 'p-2.5'
          }`}
        >
          {/* User Avatar & Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* User Avatar with Online Status Indicator */}
            <div
              className="relative shrink-0"
              title={`${displayName} • ${displayTitle} (On Duty)`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 border-[1.5px] border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs shadow-2xs transition-all duration-200 ease-in-out">
                <span className="font-mono text-xs font-bold text-emerald-800">
                  {userInitials}
                </span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white transition-all duration-200 ease-in-out" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {displayName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-500 truncate font-semibold">
                    {displayTitle}
                  </span>
                  {/* Status Pill */}
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border-[1.5px] border-emerald-300 shrink-0 transition-all duration-200 ease-in-out shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    On Duty
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isCollapsed && (
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {onExitToLanding && (
                <button
                  onClick={onExitToLanding}
                  title="Homepage"
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-[#EDF3FA] dark:bg-[#101C30] border border-[#D5E3F2] dark:border-[#1C2F4D] text-[#556D8A] dark:text-[#8BA1BD] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#DFEAF5] dark:hover:bg-[#172A47] hover:border-[#B8D1EA] dark:hover:border-[#28446E] transition-all duration-200 ease-in-out cursor-pointer shadow-2xs"
                >
                  <Home className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  if (onExitToLanding) onExitToLanding();
                }}
                title="Sign Out"
                className="w-7 h-7 rounded-full flex items-center justify-center bg-[#EDF3FA] dark:bg-[#101C30] border border-[#D5E3F2] dark:border-[#1C2F4D] text-[#556D8A] dark:text-[#8BA1BD] hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800/50 transition-all duration-200 ease-in-out cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Collapsed actions (Sign Out) */}
        {isCollapsed && (
          <button
            onClick={() => {
              logout();
              if (onExitToLanding) onExitToLanding();
            }}
            title="Sign Out"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#EDF3FA] dark:bg-[#101C30] border border-[#D5E3F2] dark:border-[#1C2F4D] text-[#556D8A] dark:text-[#8BA1BD] hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800/50 transition-all duration-200 ease-in-out cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
