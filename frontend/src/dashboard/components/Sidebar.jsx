import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutGrid,
  Activity,
  FlaskConical,
  Pill,
  ShieldCheck,
  Stethoscope,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Sidebar({
  isOpen,
  activeAlertCount,
  onShowInbox
}) {
  const { user, isDoctor } = useAuth();
  const { isDark } = useTheme();
  const canvasRef = useRef(null);
  const [timeStr, setTimeStr] = useState('');

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mini Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let offset = 0;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = isDark ? '#14B8A6' : '#0D9488';
      ctx.beginPath();

      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;

      for (let x = 0; x < w; x++) {
        const t = (x + offset) % 180;
        let y = mid;

        if (t > 40 && t < 55) {
          y = mid - Math.sin(((t - 40) / 15) * Math.PI) * 3;
        } else if (t >= 60 && t < 65) {
          y = mid + (t - 60) * 1.5;
        } else if (t >= 65 && t < 72) {
          y = mid - 14 + (t - 65) * 1.5;
        } else if (t >= 72 && t < 78) {
          y = mid + 5;
        } else if (t >= 95 && t < 120) {
          y = mid - Math.sin(((t - 95) / 25) * Math.PI) * 4.5;
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      offset = (offset + 1.2) % 360;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  return (
    <aside
      className={`w-64 border-r flex flex-col justify-between shrink-0 transition-all duration-300 z-30 select-none ${
        isDark ? 'bg-[#0D121D] border-[#1F293D] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
      } ${isOpen ? 'ml-0' : '-ml-64'}`}
    >
      <div className="p-5 flex flex-col gap-5 overflow-y-auto">
        {/* Wordmark & Version */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-md border flex items-center justify-center font-mono font-bold text-sm shadow-xs ${
              isDark
                ? 'bg-gradient-to-br from-teal-500/20 to-teal-950 border-teal-500/40 text-teal-400'
                : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}>
              Æ
            </div>
            <div>
              <div className={`font-display font-bold text-sm tracking-tight leading-tight flex items-center gap-1.5 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                AEGIS-ICU
                <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                  isDark ? 'bg-[#1A2438] text-slate-400 border-[#1F293D]' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  v3.0
                </span>
              </div>
              <div className={`text-[10px] tracking-wide font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                CLINICAL INTELLIGENCE
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 mt-1">
          <div className={`text-[10px] font-mono uppercase px-3 tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
            Navigation
          </div>
          <button
            onClick={onShowInbox}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-xs font-medium transition-all group shadow-xs ${
              isDark
                ? 'bg-[#131B2A] hover:bg-[#1A2438] text-teal-400 border-teal-500/30'
                : 'bg-teal-50 hover:bg-teal-100/70 text-teal-800 border-teal-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4 transition-transform group-hover:scale-105" />
            <span>Dashboard Inbox</span>
            <span className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-full font-semibold ${
              isDark ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-200 text-teal-900'
            }`}>
              {activeAlertCount}
            </span>
          </button>
        </nav>

        {/* System Telemetry Pulse */}
        <div className={`rounded-lg p-3.5 border ${
          isDark ? 'bg-[#131B2A] border-[#1F293D]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
            <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Telemetry Stream
            </span>
            <span className={`text-[10px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{timeStr || '14:38:09'}</span>
          </div>
          <div className={`h-9 w-full rounded border relative overflow-hidden flex items-center ${
            isDark ? 'bg-[#070A0F] border-[#1F293D]/60' : 'bg-white border-slate-200'
          }`}>
            <canvas ref={canvasRef} className="w-full h-full opacity-85" />
          </div>
          <div className={`flex justify-between items-center text-[10px] font-mono mt-2 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>ICU Ward 3B</span>
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>12 Beds Monitored</span>
          </div>
        </div>

        {/* Active Multi-Agent Ensemble */}
        <div className={`border-t pt-4 flex flex-col gap-2.5 ${isDark ? 'border-[#1F293D]' : 'border-slate-200'}`}>
          <div className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Active Multi-Agent Ensemble
          </div>
          <div className="space-y-1.5">
            <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded border ${
              isDark ? 'bg-[#131B2A] border-[#1F293D]' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-[11px] flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Data Quality Agent
              </span>
              <span className="text-[9px] font-mono text-emerald-500 font-semibold">ONLINE</span>
            </div>
            <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded border ${
              isDark ? 'bg-[#131B2A] border-[#1F293D]' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-[11px] flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Activity className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                Vitals Agent
              </span>
              <span className="text-[9px] font-mono text-emerald-500 font-semibold">ONLINE</span>
            </div>
            <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded border ${
              isDark ? 'bg-[#131B2A] border-[#1F293D]' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-[11px] flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <FlaskConical className="w-3.5 h-3.5 text-sky-500" />
                Laboratory Agent
              </span>
              <span className="text-[9px] font-mono text-emerald-500 font-semibold">ONLINE</span>
            </div>
            <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded border ${
              isDark ? 'bg-[#131B2A] border-[#1F293D]' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-[11px] flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Pill className="w-3.5 h-3.5 text-purple-500" />
                Skeptic Agent
              </span>
              <span className="text-[9px] font-mono text-emerald-500 font-semibold">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinician Profile Bar */}
      <div className={`p-4 border-t flex items-center gap-3 shrink-0 ${
        isDark ? 'border-[#1F293D] bg-[#0D121D]/90' : 'border-slate-200 bg-slate-50'
      }`}>
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-display font-medium text-xs shadow-xs shrink-0 ${
          isDark
            ? 'bg-[#1A2438] border-[#1F293D] text-teal-400'
            : 'bg-white border-slate-200 text-teal-700'
        }`}>
          {isDoctor ? <Stethoscope size={14} /> : <HeartPulse size={14} />}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {user?.fullName || 'Clinical User'}
          </span>
          <span className={`text-[10px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isDoctor ? 'Attending Intensivist' : 'Bedside ICU Nurse'}
          </span>
        </div>
        <div className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
          isDoctor
            ? (isDark ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-800')
            : (isDark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-800')
        }`}>
          {user?.role || 'DOCTOR'}
        </div>
      </div>
    </aside>
  );
}
