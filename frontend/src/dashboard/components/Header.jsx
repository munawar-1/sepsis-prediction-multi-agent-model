import React from 'react';
import { PanelLeftClose, PanelLeftOpen, Home, LogOut, Stethoscope, HeartPulse, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Header({
  isSidebarOpen,
  onToggleSidebar,
  onExitToLanding,
  title = "Clinical Inbox",
  subtitle = "Multi-Agent Sepsis Early Warning Surveillance"
}) {
  const { user, isDoctor, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  return (
    <header
      className={`h-14 border-b px-5 flex items-center justify-between shrink-0 z-20 transition-colors duration-200 ${
        isDark
          ? 'bg-[#0D121D]/95 border-[#1F293D] text-slate-200'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
      }`}
    >
      {/* Left: Sidebar Toggle & Clean Navigation Breadcrumb */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
            isDark
              ? 'bg-[#131B2A] hover:bg-[#1A2438] border-[#1F293D] text-slate-400 hover:text-slate-100'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
          title={isSidebarOpen ? "Collapse navigation sidebar" : "Expand navigation sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className={`w-4 h-4 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className={`font-semibold text-sm tracking-tight truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {title}
          </span>
          <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
          <span className={`font-mono text-[11px] truncate hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {subtitle}
          </span>
        </div>
      </div>

      {/* Right: Theme Toggle, Clinician Role Badge, Convergence, Home, Logout */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Day / Night Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Day Mode (Light)" : "Switch to Night Mode (Dark)"}
          aria-label="Toggle Day and Night Mode"
          className={`h-8 px-2.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-xs ${
            isDark
              ? 'bg-[#131B2A] hover:bg-[#1A2438] border-[#1F293D] text-slate-200 hover:border-teal-500/40'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:border-teal-600/40'
          }`}
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Day Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Night Mode</span>
            </>
          )}
        </button>

        {/* Live Agent Concurrence */}
        <div className={`hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${
          isDark ? 'bg-[#131B2A] border-[#1F293D]' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Ensemble:
          </span>
          <span className={`text-[10px] font-mono font-semibold ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>
            96.8% Sync
          </span>
        </div>

        {/* Clinician Profile Pill */}
        {user && (
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
            isDark ? 'bg-[#131B2A] border-[#1F293D]' : 'bg-slate-50 border-slate-200'
          }`}>
            {isDoctor ? (
              <Stethoscope className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            ) : (
              <HeartPulse className="w-3.5 h-3.5 text-sky-500" />
            )}
            <span className={`font-medium hidden md:inline ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {user.fullName || user.username}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              isDoctor
                ? (isDark ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-800')
                : (isDark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-800')
            }`}>
              {user.role}
            </span>
          </div>
        )}

        {/* Home Button */}
        <button
          onClick={onExitToLanding}
          className={`h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-medium transition-all shadow-xs ${
            isDark
              ? 'bg-[#131B2A] hover:bg-[#1A2438] border-[#1F293D] text-slate-300 hover:text-teal-400'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-teal-700'
          }`}
          title="Return to Aegis-ICU Homepage"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px] font-mono">Home</span>
        </button>

        {/* Sign Out Button */}
        {user && (
          <button
            onClick={() => {
              logout();
              if (onExitToLanding) onExitToLanding();
            }}
            className={`h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-medium transition-all shadow-xs ${
              isDark
                ? 'bg-[#131B2A] hover:bg-rose-950/40 border-[#1F293D] hover:border-rose-500/40 text-slate-400 hover:text-rose-300'
                : 'bg-slate-100 hover:bg-rose-50 border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-700'
            }`}
            title="Sign Out of Clinical Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-mono">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
}
