import React, { useEffect, useRef } from 'react';
import {
  Activity,
  Heart,
  Gauge,
  Wind,
  Thermometer,
  Zap,
  Radio
} from 'lucide-react';

export default function MonitoringView({ alert }) {
  const canvasRef = useRef(null);

  // High-fidelity Multi-lead Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
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

      // Soft Daylight Grid (#E5E7EB)
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Continuous pulse wave in Emerald (#10B981)
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#10B981';
      ctx.beginPath();

      for (let x = 0; x < w; x++) {
        const t = (x + offset) % 150;
        let y = mid;
        if (t > 25 && t < 40) y = mid - Math.sin(((t - 25) / 15) * Math.PI) * 5;
        else if (t >= 45 && t < 50) y = mid + (t - 45) * 2;
        else if (t >= 50 && t < 56) y = mid - 28 + (t - 50) * 1.5;
        else if (t >= 56 && t < 62) y = mid + 9;
        else if (t >= 75 && t < 100) y = mid - Math.sin(((t - 75) / 25) * Math.PI) * 7;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      offset = (offset + 1.4) % 300;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const vitalsGrid = [
    { label: 'Heart Rate', value: alert.vitals?.hr || '118 bpm', status: 'critical', desc: 'Sinus Tachycardia (+11 bpm/h)', icon: Heart },
    { label: 'Blood Pressure / MAP', value: `${alert.vitals?.bp || '88/54'} (${alert.vitals?.map || 'MAP 65'})`, status: 'warning', desc: 'Hypotensive target window', icon: Gauge },
    { label: 'Respiratory Rate', value: alert.vitals?.rr || '26 /min', status: 'warning', desc: 'Tachypnea / accessory muscle use', icon: Wind },
    { label: 'Core Temperature', value: alert.vitals?.temp || '38.9 °C', status: 'critical', desc: 'Acute febrile spike', icon: Thermometer },
    { label: 'Pulse Oximetry', value: alert.vitals?.spo2 || '92% on 4L NC', status: 'warning', desc: 'Hypoxemic target window', icon: Activity },
    { label: 'Shock Index (HR/SBP)', value: alert.vitals?.shockIndex || '1.34', status: 'critical', desc: 'Severe systemic hypoperfusion', icon: Zap }
  ];

  return (
    <div className="custom-scrollbar flex-1 h-full overflow-y-auto bg-slate-50/50 p-6 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 border-[1.5px] border-emerald-200 text-emerald-600 flex items-center justify-center shadow-2xs shrink-0">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Monitoring &amp; Telemetry</h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-500">
                <span>Continuous bedside physiological streams for</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border-[1.5px] border-slate-200 font-mono font-bold text-slate-800">
                  {alert.patientId}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border-[1.5px] border-emerald-200 font-mono font-bold text-emerald-800">
                  {alert.bed}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-emerald-800 bg-emerald-50 border-[1.5px] border-emerald-200 px-3.5 py-1.5 rounded-full font-bold shadow-2xs self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>250 Hz Continuous Feed</span>
          </div>
        </div>

        {/* Live Telemetry Waveform Display Card */}
        <div
          className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-3.5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="text-xs font-bold text-slate-900 font-mono">Lead II / Arterial Line Real-Time Waveform</span>
            </div>
            <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-50 border-[1.5px] border-slate-200 px-3 py-0.5 rounded-full">
              Sweep Speed: 25 mm/s • Gain: 10 mm/mV
            </span>
          </div>

          <div className="h-48 w-full rounded-2xl bg-slate-50 border-[1.5px] border-slate-200 relative overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="absolute top-3 left-3 text-[11px] font-mono text-emerald-800 font-bold bg-white/95 px-3 py-1 rounded-full border-[1.5px] border-emerald-300 shadow-2xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ART_PULSE • HR 118</span>
            </div>
          </div>
        </div>

        {/* Live Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vitalsGrid.map((v, idx) => {
            const Icon = v.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border-[1.5px] border-slate-200 hover:border-slate-300 p-5 space-y-2.5 shadow-xs hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-emerald-600" />
                    {v.label}
                  </span>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border-[1.5px] tracking-wide ${
                    v.status === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    v.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {v.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-slate-900">{v.value}</div>
                <div className="text-xs font-medium text-slate-600">{v.desc}</div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
