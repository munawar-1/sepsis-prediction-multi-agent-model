import React, { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Stethoscope,
  HeartPulse,
  LogOut,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({
  activeAlertCount = 3,
  onShowInbox,
  onExitToLanding,
  isInboxActive = false
}) {
  const { user, isDoctor, logout } = useAuth();
  const [timeStr, setTimeStr] = useState('');

  // Live Ward Telemetry Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col justify-between p-4 select-none h-full bg-[#F8FAFC]">
      {/* TOP SECTION: BRAND + NAV + TELEMETRY CARD */}
      <div className="flex flex-col gap-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F0FDFA] border border-[#99F6E4] flex items-center justify-center font-mono font-bold text-sm text-[#0D9488] shadow-xs">
              Æ
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-display font-bold text-sm text-[#334155] leading-tight">
                AEGIS-ICU
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1] font-semibold">
                  v3.0
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#64748B] tracking-wider uppercase mt-0.5">
                Clinical Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Navigation: Dashboard Inbox Active Pill */}
        <nav className="flex flex-col gap-1 mt-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] px-1 mb-0.5 font-semibold">
            Navigation
          </div>
          <button
            onClick={onShowInbox}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all shadow-xs border ${
              isInboxActive
                ? 'bg-white text-[#0D9488] border-[#99F6E4] shadow-xs font-semibold'
                : 'bg-white text-[#0D9488] shadow-xs border border-[#E2E8F0] hover:border-[#99F6E4]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="w-4 h-4 text-[#0D9488]" />
              <span className="text-[#0D9488]">Dashboard Inbox</span>
            </div>
            {activeAlertCount > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1] font-bold">
                {activeAlertCount}
              </span>
            )}
          </button>
        </nav>

        {/* Ward Telemetry Mini-Card */}
        <div className="bg-white rounded-2xl p-3 border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-[#475569]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
              Telemetry Stream
            </span>
            <span className="text-[10px] text-[#64748B]">{timeStr || '14:38:09'}</span>
          </div>
          
          {/* Soft teal SVG sparkline */}
          <div className="h-9 w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/70 flex items-center px-1 overflow-hidden">
            <svg className="w-full h-7" viewBox="0 0 200 40" fill="none" preserveAspectRatio="none">
              <path
                d="M0 20 L30 20 L38 20 L44 10 L50 32 L56 6 L62 26 L68 18 L74 20 L110 20 L118 20 L124 10 L130 32 L136 6 L142 26 L148 18 L154 20 L200 20"
                stroke="#0D9488"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono pt-0.5">
            <span className="font-semibold text-[#334155]">ICU Ward 3B</span>
            <span className="text-[#64748B]">• 12 Beds</span>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Single unified clinician profile card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-2.5 shadow-xs flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0D9488] shrink-0">
            {isDoctor ? <Stethoscope className="w-4 h-4" /> : <HeartPulse className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#334155] truncate leading-tight">
              {user?.fullName || 'Dr. Rajesh Sharma, MD'}
            </div>
            <div className="text-[10px] font-mono text-[#64748B] truncate mt-0.5">
              {isDoctor ? 'Attending' : 'ICU Nurse'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onExitToLanding && (
            <button
              onClick={onExitToLanding}
              title="Return to Aegis-ICU Homepage"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0D9488] hover:bg-[#F1F5F9] transition-colors"
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
            className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
