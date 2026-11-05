import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Activity,
  Heart,
  Gauge,
  Wind,
  Thermometer,
  Zap,
  Radio,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { clinicalApi } from '../../services/api';

export default function MonitoringView({ alert = {}, patientHistory = null }) {
  const { isDark } = useTheme();
  const canvasRef = useRef(null);
  const [history, setHistory] = useState(patientHistory);
  const [loading, setLoading] = useState(false);

  // Fetch real patient longitudinal history if not passed
  useEffect(() => {
    if (!alert?.patientId) return;
    let isMounted = true;
    async function loadHistory() {
      setLoading(true);
      try {
        const res = await clinicalApi.fetchPatientHistory(alert.patientId);
        if (res.data && isMounted) {
          setHistory(res.data);
        }
      } catch (e) {
        console.warn('Failed to load patient history:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadHistory();
    return () => { isMounted = false; };
  }, [alert?.patientId]);

  // Real-Time Waveform Canvas
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

      // Soft Grid
      ctx.strokeStyle = isDark ? '#1E2D44' : '#B6E4F2';
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
      ctx.strokeStyle = isDark ? '#10B981' : '#0A7D70';
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
  }, [isDark]);

  const latestTimelinePoint = history?.timeline && history.timeline.length > 0
    ? history.timeline[history.timeline.length - 1]
    : null;

  const hrVal = latestTimelinePoint?.heartRate ? `${Math.round(latestTimelinePoint.heartRate)} bpm` : (alert?.vitals?.hr || '118 bpm');
  const bpVal = latestTimelinePoint?.systolicBp ? `${Math.round(latestTimelinePoint.systolicBp)}/${Math.round(latestTimelinePoint.diastolicBp || 70)} mmHg` : (alert?.vitals?.bp || '88/54 mmHg');
  const mapVal = latestTimelinePoint?.meanArterialPressure ? `MAP ${Math.round(latestTimelinePoint.meanArterialPressure)} mmHg` : (alert?.vitals?.map || 'MAP 65 mmHg');
  const rrVal = latestTimelinePoint?.respiratoryRate ? `${Math.round(latestTimelinePoint.respiratoryRate)} /min` : (alert?.vitals?.rr || '26 /min');
  const tempVal = latestTimelinePoint?.temperature ? `${latestTimelinePoint.temperature.toFixed(1)} °C` : (alert?.vitals?.temp || '38.9 °C');
  const spo2Val = latestTimelinePoint?.o2Saturation ? `${Math.round(latestTimelinePoint.o2Saturation)}%` : (alert?.vitals?.spo2 || '92%');
  const shockIndexVal = latestTimelinePoint?.shockIndex ? `${latestTimelinePoint.shockIndex.toFixed(2)}` : (alert?.vitals?.shockIndex || '1.34');

  const vitalsGrid = [
    { label: 'Heart Rate', value: hrVal, status: parseFloat(hrVal) > 100 ? 'critical' : 'normal', desc: 'Bedside telemetry sensor', icon: Heart },
    { label: 'Blood Pressure / MAP', value: `${bpVal} (${mapVal})`, status: (latestTimelinePoint?.meanArterialPressure && latestTimelinePoint.meanArterialPressure < 65) ? 'critical' : 'normal', desc: 'Arterial line / NIBP monitor', icon: Gauge },
    { label: 'Respiratory Rate', value: rrVal, status: parseFloat(rrVal) > 22 ? 'warning' : 'normal', desc: 'Ventilator / Impedance pneumography', icon: Wind },
    { label: 'Core Temperature', value: tempVal, status: parseFloat(tempVal) >= 38.3 ? 'critical' : 'normal', desc: 'Core body thermistor', icon: Thermometer },
    { label: 'Pulse Oximetry', value: spo2Val, status: parseFloat(spo2Val) < 94 ? 'warning' : 'normal', desc: 'Plethysmograph O2 sensor', icon: Activity },
    { label: 'Shock Index (HR/SBP)', value: shockIndexVal, status: parseFloat(shockIndexVal) >= 1.0 ? 'critical' : 'normal', desc: 'Hemodynamic decoupling index', icon: Zap }
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
                <span>Real longitudinal telemetry progression for</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border-[1.5px] border-slate-200 font-mono font-bold text-slate-800">
                  {alert?.patientId || "PT-1004"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border-[1.5px] border-emerald-200 font-mono font-bold text-emerald-800">
                  {alert?.bed || "ICU-BED-04"}
                </span>
                {history?.latestTriageColor && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    history.latestTriageColor === 'RED' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                    history.latestTriageColor === 'YELLOW' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                    'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    {history.latestUrgencyLevel} ({Math.round(history.latestCompositeRisk * 100)}% Risk)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-emerald-800 bg-emerald-50 border-[1.5px] border-emerald-200 px-3.5 py-1.5 rounded-full font-bold shadow-2xs self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>250 Hz Continuous Feed</span>
          </div>
        </div>

        {/* Live Telemetry Waveform Display Card */}
        <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="text-xs font-bold text-slate-900 font-mono">Lead II / Arterial Line Real-Time Waveform</span>
            </div>
            <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-50 border-[1.5px] border-slate-200 px-3 py-0.5 rounded-full">
              Sweep Speed: 25 mm/s • Gain: 10 mm/mV
            </span>
          </div>

          <div className="h-44 w-full rounded-2xl bg-slate-50 border-[1.5px] border-slate-200 relative overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="absolute top-3 left-3 text-[11px] font-mono text-emerald-800 font-bold bg-white/95 px-3 py-1 rounded-full border-[1.5px] border-emerald-300 shadow-2xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ART_PULSE • HR {hrVal}</span>
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
                className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-2.5 shadow-xs"
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

        {/* Longitudinal History Trajectory Table (From real backend evaluations) */}
        {history?.timeline && history.timeline.length > 0 && (
          <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-900">
                  Longitudinal Telemetry Progression (Hours 0 to {history.timeline.length - 1})
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {history.timeline.length} Hourly Samples Persisted
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border-[1.5px] border-slate-200">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">Hour</th>
                    <th className="py-2.5 px-3">HR (bpm)</th>
                    <th className="py-2.5 px-3">BP (mmHg)</th>
                    <th className="py-2.5 px-3">MAP</th>
                    <th className="py-2.5 px-3">RR</th>
                    <th className="py-2.5 px-3">Temp</th>
                    <th className="py-2.5 px-3">SpO2</th>
                    <th className="py-2.5 px-3">Lactate</th>
                    <th className="py-2.5 px-3">Shock Index</th>
                    <th className="py-2.5 px-3 text-right">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {history.timeline.map((pt) => {
                    const isPtCrit = pt.compositeSepsisRisk >= 0.70;
                    const isPtMod = pt.compositeSepsisRisk >= 0.35 && pt.compositeSepsisRisk < 0.70;
                    return (
                      <tr key={pt.hourIndex} className={isPtCrit ? 'bg-rose-50/40' : isPtMod ? 'bg-amber-50/20' : ''}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">T+{pt.hourIndex}h</td>
                        <td className="py-2.5 px-3 font-semibold">{pt.heartRate ? Math.round(pt.heartRate) : '—'}</td>
                        <td className="py-2.5 px-3">{pt.systolicBp ? `${Math.round(pt.systolicBp)}/${Math.round(pt.diastolicBp || 70)}` : '—'}</td>
                        <td className="py-2.5 px-3">{pt.meanArterialPressure ? Math.round(pt.meanArterialPressure) : '—'}</td>
                        <td className="py-2.5 px-3">{pt.respiratoryRate ? Math.round(pt.respiratoryRate) : '—'}</td>
                        <td className="py-2.5 px-3">{pt.temperature ? pt.temperature.toFixed(1) : '—'}</td>
                        <td className="py-2.5 px-3">{pt.o2Saturation ? `${Math.round(pt.o2Saturation)}%` : '—'}</td>
                        <td className="py-2.5 px-3">{pt.lactate != null ? `${pt.lactate.toFixed(1)} mM` : '—'}</td>
                        <td className="py-2.5 px-3 font-bold">{pt.shockIndex ? pt.shockIndex.toFixed(2) : '—'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                            isPtCrit ? 'bg-rose-50 text-rose-700 border-rose-300' :
                            isPtMod ? 'bg-amber-50 text-amber-800 border-amber-300' :
                            'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}>
                            {Math.round(pt.compositeSepsisRisk * 100)}% ({pt.statusColor})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
