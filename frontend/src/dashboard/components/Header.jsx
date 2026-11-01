import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function Header({
  isSidebarOpen,
  onToggleSidebar,
  title = "Clinical Inbox",
  subtitle = "Multi-Agent Sepsis Early Warning Surveillance"
}) {
  return (
    <header className="h-14 border-b border-navy-700 bg-navy-900/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg bg-navy-850 hover:bg-navy-800 border border-navy-700/80 hover:border-slate-500/60 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-all shadow-sm shrink-0"
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
