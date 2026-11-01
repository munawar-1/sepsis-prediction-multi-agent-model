import React, { useEffect, useRef } from 'react';
import {
  UserRound,
  X,
  TrendingUp,
  Heart,
  Gauge,
  Wind,
  Thermometer,
  Pill,
  Clock
} from 'lucide-react';

export default function PatientContextPanel({
  alert,
  isOpen,
  onClose
}) {
  const waveformRef = useRef(null);

  // Live Patient Observation Waveform Canvas (250 Hz simulated waveform)
  useEffect(() => {
    if (!isOpen) return;

    const canvas = waveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let offset = 0;

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;

      // Background subtle grid lines
      ctx.strokeStyle = '#131B2A';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Live ECG / Arterial Waveform
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#14B8A6';
      ctx.beginPath();

      for (let x = 0; x < w; x++) {
        const t = (x + offset) % 160;
        let y = mid;

        if (t > 30 && t < 45) {
          y = mid - Math.sin(((t - 30) / 15) * Math.PI) * 4; // P wave
        } else if (t >= 50 && t < 55) {
          y = mid + (t - 50) * 1.5; // Q
        } else if (t >= 55 && t < 62) {
          y = mid - 18 + (t - 55) * 1.2; // R peak
        } else if (t >= 62 && t < 68) {
          y = mid + 6; // S
        } else if (t >= 80 && t < 105) {
          y = mid - Math.sin(((t - 80) / 25) * Math.PI) * 5.5; // T wave
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      offset = (offset + 1.8) % 360;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isOpen, alert.id]);

  if (!isOpen) return null;

  return (
    <aside className="w-96 bg-navy-900 border-l border-navy-700 flex flex-col shrink-0 overflow-y-auto transition-all duration-300">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-navy-700 flex items-center justify-between shrink-0 bg-navy-900/90">
        <div className="flex items-center gap-2">
          <UserRound className="w-4 h-4 text-clinical-teal" />
          <span className="text-xs font-display font-bold text-slate-100">
            Patient Clinical Context
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-navy-800 transition-colors"
          title="Collapse Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Anatomical Illustration with Demographics Overlay */}
        <div className="relative rounded-xl border border-navy-700 bg-navy-950 overflow-hidden shadow-inner group">
          <div className="h-48 w-full relative overflow-hidden bg-[#05080E]">
            <img
              src="/assets/stitch-patient-icu.png"
              onError={(e) => {
                // Fallback to Stitch cloud URL if local asset ever has an issue
                e.target.onerror = null;
                e.target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBQpdjtv5UANYenO3uIdj3BdcTsGAohevJWVhvLkSTTjBrWPlzlO7QMwDYv_KhObOQqVWzppPUpeffhLAHrTrjwRtnOHqt6yvt1-thy5OPn8AYTzHthZBtxU-almOC35ctNXHXLsQptOahqmSUsAkgEXIanOlmdrpm2QtsrlDwBHJC2Uv5nTzHM6BZ_XZfUXZ__9s6uc1OiV7ZN7gKZyGQh7qf_jSsm4slw5S3uzjeV";
              }}
              alt="3D medical anatomical visualization of patient torso"
              className="w-full h-full object-cover object-center opacity-80 mix-blend-screen transition-transform duration-700 group-hover:scale-105"
            />

            {/* Subtle gradient overlay to enhance legibility of medical badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />

            {/* Overlaid Demographics Badges */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between pointer-events-none">
              <div className="bg-navy-900/90 backdrop-blur-md border border-navy-700/80 rounded-md px-2.5 py-1.5 shadow-sm">
                <div className="font-mono text-xs font-bold text-slate-100 flex items-center gap-2">
                  <span>{alert.patientId}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-clinical-teal-dim text-clinical-teal border border-clinical-teal/30 font-mono font-medium">
                    {alert.bed}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                  Age {alert.age} • {alert.gender === 'Male' ? 'Sex M' : 'Sex F'} • Day {alert.icuDay}
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-950/80 border border-clinical-rose/40 text-[9px] font-mono text-rose-300 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-clinical-rose animate-ping" />
                SEPSIS PROTOCOL
              </div>
            </div>

            {/* Bottom Condition Bar over image */}
            <div className="absolute bottom-2 left-2.5 right-2.5">
              <div className="text-[11px] font-sans font-medium text-slate-200 line-clamp-1 bg-navy-900/85 backdrop-blur-sm px-2.5 py-1 rounded border border-navy-700/80">
                <span className="text-clinical-teal font-mono text-[10px] mr-1">DX:</span>
                {alert.admissionDiagnosis}
              </div>
            </div>
          </div>
        </div>

        {/* Integrated Authentic ICU Telemetry Photography Card */}
        <div className="rounded-xl border border-navy-700 bg-navy-950/90 p-2.5 flex items-center gap-3">
          <div className="w-16 h-12 rounded-lg overflow-hidden relative shrink-0 border border-navy-700 bg-navy-900">
            <img
              src="https://lh3.googleusercontent.com/aida/AEtjO1WZkM8t7WJNhUgo6Nk7wB6BXEs2T63wxZkUmwuxiUX_yQFc1tl45U6Qmy0BOaY76rTF57f7nCkjgxzMSI2B8HwlJX0r7Kjv3iy7gwMDuDKvdv6S3fW8ff9gQpX5rBzJgV4Ztl_GY38FvK5sHkt7szKfN2dBgxLPc9iPLrxp8zGgeof8RRyfY_PuUW-fFU2VULczhKoaAHV_hSzO-ZT4JqkBXEW8_qb8H5Tpo-jhjBmjCQ"
              alt="Philips IntelliVue ICU Monitor Telemetry View"
              className="w-full h-full object-cover"
              onError={(e) => {
                // If external thumbnail fails, use local telemetry asset
                e.target.onerror = null;
                e.target.src = "/assets/agent-vitals-telemetry.jpg";
              }}
            />
            <div className="absolute inset-0 bg-clinical-teal/10 pointer-events-none" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
              <span className="text-slate-200 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                IntelliVue Feed 04
              </span>
              <span className="text-clinical-teal">Linked</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Continuous multiparameter bedside telemetry active.
            </p>
          </div>
        </div>

        {/* Live Patient Observation Waveform Canvas */}
        <div className="rounded-xl border border-navy-700 bg-navy-950/90 p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-clinical-teal animate-pulse" />
              LIVE PATIENT SIGNAL
            </span>
            <span className="text-slate-400">Observation sync: T-minus 2m</span>
          </div>

          <div className="h-14 w-full bg-navy-900/90 rounded-lg border border-navy-700 relative overflow-hidden">
            <canvas ref={waveformRef} className="w-full h-full block waveform-canvas" />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 px-0.5">
            <span className="text-rose-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Delta HR +34 bpm
            </span>
            <span className="text-slate-400">Sample: 250 Hz</span>
          </div>
        </div>

        {/* Live Vital Signs Scorecard Grid */}
        <div className="bg-navy-950/90 rounded-xl p-3.5 border border-navy-700 space-y-2.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>Telemetry Vitals</span>
            <span className="text-rose-400 font-mono text-[10px]">
              {alert.vitals.shockIndex || 'Shock Index: 1.34'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* HR */}
            <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-700/80">
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Heart Rate</span>
                <Heart className="w-3 h-3 text-rose-400" />
              </div>
              <div className="font-mono font-bold text-rose-400 mt-1">
                {alert.vitals.hr}
              </div>
              <div className="text-[9px] font-mono text-rose-300/80">
                {alert.vitals.hrTag}
              </div>
            </div>

            {/* BP */}
            <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-700/80">
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Arterial BP</span>
                <Gauge className="w-3 h-3 text-slate-400" />
              </div>
              <div className="font-mono font-bold text-slate-100 mt-1">
                {alert.vitals.bp}
              </div>
              <div className="text-[9px] font-mono text-amber-400">
                {alert.vitals.map}
              </div>
            </div>

            {/* RR */}
            <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-700/80">
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Resp Rate</span>
                <Wind className="w-3 h-3 text-slate-400" />
              </div>
              <div className="font-mono font-semibold text-slate-100 mt-1">
                {alert.vitals.rr}
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                {alert.vitals.rrTag}
              </div>
            </div>

            {/* Temp */}
            <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-700/80">
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Core Temp</span>
                <Thermometer className="w-3 h-3 text-amber-400" />
              </div>
              <div className="font-mono font-bold text-amber-400 mt-1">
                {alert.vitals.temp}
              </div>
              <div className="text-[9px] font-mono text-amber-300/80">
                {alert.vitals.tempTag}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Laboratory Values */}
        <div className="bg-navy-950/90 rounded-xl p-3.5 border border-navy-700 space-y-2">
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>Laboratory Panel</span>
            <span className="text-[10px] font-mono text-slate-400">Stat Lab Core</span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between py-1 border-b border-navy-850 items-center">
              <span className="text-slate-400">Serum Lactate:</span>
              <span className="text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900/60">
                {alert.labs.lactate}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-navy-850 items-center">
              <span className="text-slate-400">Leukocytes (WBC):</span>
              <span className="text-slate-200 font-medium">{alert.labs.wbc}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-navy-850 items-center">
              <span className="text-slate-400">Serum Creatinine:</span>
              <span className="text-slate-200 font-medium">{alert.labs.creatinine}</span>
            </div>
            <div className="flex justify-between py-1 items-center">
              <span className="text-slate-400">Platelet Count:</span>
              <span className="text-slate-200 font-medium">{alert.labs.platelets}</span>
            </div>
          </div>
        </div>

        {/* Section: Active Medications & Timing */}
        <div className="bg-navy-950/90 rounded-xl p-3.5 border border-navy-700 space-y-2.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>Active Medications &amp; Timing</span>
            <Pill className="w-3.5 h-3.5 text-purple-400" />
          </div>

          <div className="space-y-2">
            {alert.meds.activeList.map((med, mIdx) => (
              <div key={mIdx} className="bg-navy-900 p-2 rounded-lg border border-navy-700/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-medium ${med.isHeld ? 'text-slate-300 line-through' : 'text-slate-100'}`}>
                    {med.name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-300">
                    {med.dose}
                  </span>
                </div>
                <div className={`text-[10px] font-mono mt-0.5 flex items-center gap-1 ${med.statusColor || 'text-slate-400'}`}>
                  {med.isHeld ? (
                    <span className="px-1 py-0.2 rounded bg-amber-950/60 border border-amber-900/60 text-amber-400 font-semibold">
                      HELD
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-clinical-teal" />
                  )}
                  <span>{med.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

