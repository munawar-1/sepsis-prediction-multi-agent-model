import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutGrid,
  Activity,
  FlaskConical,
  Pill,
  Bell,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  activeAlertCount,
  onShowInbox,
  onExitToLanding
}) {
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
      ctx.strokeStyle = '#14B8A6';
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
  }, []);

  return (
    <aside
      className={`w-64 bg-navy-900 border-r border-navy-700 flex flex-col justify-between shrink-0 transition-all duration-300 z-30 ${
        isOpen ? 'ml-0' : '-ml-64'
      }`}
    >
      <div className="p-5 flex flex-col gap-5 overflow-y-auto">
        {/* Wordmark & Version */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-clinical-teal/20 to-teal-950 border border-clinical-teal/40 flex items-center justify-center text-clinical-teal font-mono font-semibold text-sm shadow-sm">
              Æ
            </div>
            <div>
              <div className="font-display font-bold text-slate-100 text-sm tracking-tight leading-tight flex items-center gap-1.5">
                AEGIS-ICU
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-navy-800 text-slate-400 border border-navy-700">
                  v2.4
                </span>
              </div>
              <div className="text-[10px] text-slate-400 tracking-wide font-mono">
                CLINICAL INTELLIGENCE
              </div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-clinical-amber-dim text-clinical-amber border border-clinical-amber/30">
            DEMO
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 mt-1">
          <div className="text-[10px] font-mono uppercase text-slate-400 px-3 tracking-wider mb-1">
            Navigation
          </div>
          <button
            onClick={onShowInbox}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-navy-800/90 text-clinical-teal border border-clinical-teal/30 shadow-sm text-xs font-medium transition-all group"
          >
            <LayoutGrid className="w-4 h-4 text-clinical-teal transition-transform group-hover:scale-105" />
            <span>Dashboard Inbox</span>
            <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-clinical-teal-dim text-clinical-teal font-semibold">
              {activeAlertCount}
            </span>
          </button>

          {/* Return to Public Landing Page */}
          <button
            onClick={onExitToLanding}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-navy-800/60 border border-transparent hover:border-navy-700 text-xs font-medium transition-all group mt-1"
            title="Return to Aegis-ICU Public Presentation"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-clinical-teal transition-transform group-hover:-translate-x-0.5" />
            <span>Exit to Homepage</span>
          </button>
        </nav>

        {/* System Telemetry Pulse */}
        <div className="bg-navy-850 rounded-lg p-3.5 border border-navy-700 mt-1">
          <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-clinical-teal animate-pulse" />
              Telemetry Stream
            </span>
            <span className="text-slate-300 text-[10px]">{timeStr || '14:38:09'}</span>
          </div>
          <div className="h-9 w-full bg-navy-950 rounded border border-navy-700/60 relative overflow-hidden flex items-center">
            <canvas ref={canvasRef} className="w-full h-full waveform-canvas opacity-85" />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2">
            <span>ICU Ward 3B</span>
            <span className="text-slate-300">12 Beds Monitored</span>
          </div>
        </div>

        {/* Active Intelligence Agents */}
        <div className="border-t border-navy-700 pt-4 flex flex-col gap-2.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
            Active Intelligence Agents
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-navy-850 border border-navy-700">
              <span className="text-slate-300 text-[11px] flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-clinical-teal" />
                Vitals Agent
              </span>
              <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-navy-850 border border-navy-700">
              <span className="text-slate-300 text-[11px] flex items-center gap-2">
                <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                Laboratory Agent
              </span>
              <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-navy-850 border border-navy-700">
              <span className="text-slate-300 text-[11px] flex items-center gap-2">
                <Pill className="w-3.5 h-3.5 text-purple-400" />
                Medication Agent
              </span>
              <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Profile Bar */}
      <div className="p-4 border-t border-navy-700 bg-navy-900/90 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center font-display font-medium text-xs text-slate-300 shadow-sm">
          DR
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-xs font-medium text-slate-200 truncate">Dr. Sarah Al-Mansoor</span>
          <span className="text-[10px] font-mono text-slate-400 truncate">Attending Intensivist</span>
        </div>
        <button
          className="p-1.5 hover:bg-navy-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
          title="Telemetry notifications active"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

