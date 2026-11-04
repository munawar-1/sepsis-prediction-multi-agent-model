import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Clock,
  Gauge,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { clinicalApi } from '../../services/api';

export default function SimulationControls({
  simulationDataset = null,
  currentHour = 0,
  maxHour = 5,
  isPlaying = false,
  speed = 1,
  onTogglePlay,
  onStepHour,
  onResetSimulation,
  onChangeSpeed,
  lastEvaluatedTime = null,
  evaluatingPatientId = null
}) {
  const [progressPct, setProgressPct] = useState(0);

  // Interval duration based on speed: 1x = 5000ms, 2x = 2500ms, 5x = 1000ms
  const intervalMs = Math.round(5000 / (speed || 1));

  useEffect(() => {
    if (!isPlaying) {
      setProgressPct(0);
      return;
    }

    const stepMs = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += stepMs;
      const pct = Math.min(100, Math.round((elapsed / intervalMs) * 100));
      setProgressPct(pct);

      if (elapsed >= intervalMs) {
        elapsed = 0;
        setProgressPct(0);
        if (onStepHour) onStepHour();
      }
    }, stepMs);

    return () => clearInterval(timer);
  }, [isPlaying, intervalMs, onStepHour]);

  return (
    <div className="bg-white dark:bg-[#0D1524] rounded-2xl border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs select-none">
      
      {/* Left: Simulation Status & Clock */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {isPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? 'bg-emerald-500' : 'bg-[#768CA8]'}`} />
          </span>
          <span className="font-bold text-[#0F172A] dark:text-[#F1F5FA] tracking-tight font-sans">
            {isPlaying ? 'Hourly Simulation Running' : 'Simulation Paused / Manual'}
          </span>
        </div>

        <div className="h-4 w-[1.5px] bg-[#D0DFEF] dark:bg-[#1E2D44] hidden sm:block" />

        <div className="flex items-center gap-1.5 font-mono text-[#334155] dark:text-[#CBD5E1] font-bold bg-[#F1F6FB] dark:bg-[#0B1528] px-2.5 py-1 rounded-xl border border-[#D0DFEF] dark:border-[#1E2D44]">
          <Clock className="w-3.5 h-3.5 text-[#64748B] dark:text-[#768CA8]" />
          <span>Hour {currentHour} of {maxHour}</span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 ml-1 font-semibold">(T+{currentHour}h ICU)</span>
        </div>

        {evaluatingPatientId && (
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 animate-pulse font-bold">
            Evaluating {evaluatingPatientId}
          </span>
        )}
      </div>

      {/* Middle: Progress Bar */}
      {isPlaying && (
        <div className="flex-1 max-w-xs min-w-[120px] hidden md:flex items-center gap-2">
          <div className="w-full h-1.5 rounded-full bg-[#EBF2FA] dark:bg-[#0B1424] overflow-hidden border border-[#D0DFEF] dark:border-[#1B2D48]">
            <div
              className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-[#64748B] dark:text-[#768CA8] font-semibold w-8">
            {Math.round(((intervalMs * (100 - progressPct)) / 100) / 1000)}s
          </span>
        </div>
      )}

      {/* Right: Controls & Speed */}
      <div className="flex items-center gap-2">
        {/* Speed Selector */}
        <div className="flex items-center rounded-xl bg-[#EBF2FA] dark:bg-[#0B1424] p-0.5 border border-[#D0DFEF] dark:border-[#1B2D48] text-[11px] font-mono font-bold">
          {[1, 2, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeSpeed && onChangeSpeed(s)}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                speed === s
                  ? 'bg-white dark:bg-[#132C4A] text-emerald-700 dark:text-[#00E5B9] border border-[#CBDCEE] dark:border-[#00E5B9]/40 shadow-2xs font-extrabold'
                  : 'bg-transparent text-[#5B718E] dark:text-[#7A91AD] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#DFEAF5] dark:hover:bg-[#14223A]'
              }`}
              title={`${s}x speed (${Math.round(5 / s)}s per hour)`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={onTogglePlay}
          className={`h-8 px-3 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
          title={isPlaying ? 'Pause Simulation' : 'Start Automatic Hourly Progression'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        {/* Step forward 1 Hour */}
        <button
          type="button"
          onClick={onStepHour}
          className="h-8 px-2.5 rounded-xl border border-[#D0DFEF] dark:border-[#1C2F4D] bg-white dark:bg-[#0E1B30] hover:bg-[#F0F5FA] dark:hover:bg-[#152744] text-[#334155] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-white font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
          title="Advance 1 Hour Manually"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">+1h</span>
        </button>

        {/* Reset */}
        <button
          type="button"
          onClick={onResetSimulation}
          className="h-8 px-2.5 rounded-xl border border-[#D0DFEF] dark:border-[#1C2F4D] bg-white dark:bg-[#0E1B30] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800/50 text-[#64748B] dark:text-[#8BA1BD] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
          title="Reset Ward to Initial Baseline Hour 0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  );
}

