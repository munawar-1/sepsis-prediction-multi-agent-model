import React from 'react';
import { PanelLeftClose, PanelLeftOpen, ShieldCheck, Activity } from 'lucide-react';

export default function Header({
  isSidebarOpen,
  onToggleSidebar,
  title = "Clinical Inbox",
  subtitle = "Multi-Agent Sepsis Early Warning Surveillance"
}) {
  return (
    <header className="h-14 border-b border-navy-700 bg-navy-900/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-navy-800 transition-colors"
          title={isSidebarOpen ? "Collapse navigation sidebar" : "Expand navigation sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-2 text-xs min-w-0 truncate">
          <span className="font-display font-semibold text-slate-100 text-sm tracking-tight truncate">
            {title}
          </span>
          <span className="text-slate-600 shrink-0">/</span>
          <span className="text-slate-400 font-mono text-[11px] truncate">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Header Center / Right items */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Live Agent Flow Mini Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-850 border border-navy-700">
          <span className="w-2 h-2 rounded-full bg-clinical-teal animate-pulse" />
          <span className="text-[10px] font-mono text-slate-300">Agents Concurrence:</span>
          <span className="text-[10px] font-mono text-clinical-teal font-semibold">
            96.8% Convergence
          </span>
        </div>

        {/* Demonstration Notice Banner Tag */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy-850 border border-navy-700 text-[11px] font-mono text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-clinical-teal" />
          <span className="hidden sm:inline">Decision-Support Mode</span>
          <span className="sm:hidden">Support Mode</span>
        </div>

        <div className="h-4 w-px bg-navy-700 hidden sm:block" />

        {/* Time & Status */}
        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          <span>ICU-SYNC: </span>
          <span className="text-clinical-teal font-semibold">100% OK</span>
        </div>
      </div>
    </header>
  );
}

