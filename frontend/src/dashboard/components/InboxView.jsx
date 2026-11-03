import React, { useEffect, useRef } from 'react';
import {
  Inbox,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  ChevronRight,
  Check,
  CheckCircle2,
  Activity,
  FlaskConical,
  Pill
} from 'lucide-react';

const AGENT_ICON_MAP = {
  vitals: Activity,
  lab: FlaskConical,
  meds: Pill,
};

export default function InboxView({
  alerts,
  currentFilter,
  onSetFilter,
  searchQuery,
  onSearchChange,
  onSelectAlert,
  onSimulateAlert
}) {
  const canvasRef = useRef(null);

  // Multi-Agent Signal Flow Animation Engine (Emerald on Daylight Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const numParticles = 14;

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        sourceIndex: i % 3,
        progress: Math.random(),
        speed: 0.007 + Math.random() * 0.006,
        radius: 1.5 + Math.random() * 1.2
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      const leftX = 24;
      const sourceNodes = [
        { y: h * 0.22, label: "VITALS", color: "#10B981" },
        { y: h * 0.50, label: "LAB",    color: "#2563EB" },
        { y: h * 0.78, label: "MEDS",   color: "#7C3AED" }
      ];

      const targetX = w - 32;
      const targetY = h * 0.5;

      // Draw connection curves with soft border color
      sourceNodes.forEach(node => {
        ctx.beginPath();
        ctx.moveTo(leftX, node.y);
        ctx.bezierCurveTo(
          leftX + (targetX - leftX) * 0.45,
          node.y,
          leftX + (targetX - leftX) * 0.55,
          targetY,
          targetX,
          targetY
        );
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Flowing particles
      particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.sourceIndex = Math.floor(Math.random() * 3);
        }

        const src = sourceNodes[p.sourceIndex];
        const t = p.progress;
        const p0 = { x: leftX, y: src.y };
        const p1 = { x: leftX + (targetX - leftX) * 0.45, y: src.y };
        const p2 = { x: leftX + (targetX - leftX) * 0.55, y: targetY };
        const p3 = { x: targetX, y: targetY };

        const cx = 3 * (p1.x - p0.x);
        const bx = 3 * (p2.x - p1.x) - cx;
        const ax = p3.x - p0.x - cx - bx;

        const cy = 3 * (p1.y - p0.y);
        const by = 3 * (p2.y - p1.y) - cy;
        const ay = p3.y - p0.y - cy - by;

        const x = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
        const y = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;

        ctx.beginPath();
        ctx.arc(x, y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = src.color;
        ctx.fill();
      });

      // Source indicator dots
      sourceNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(leftX, node.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
      });

      // Target convergence dot
      ctx.beginPath();
      ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#10B981";
      ctx.fill();

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Filtered Alerts
  const filteredAlerts = alerts.filter(item => {
    if (currentFilter === 'unread' && item.isReviewed) return false;
    if (currentFilter === 'high' && item.priority !== 'CRITICAL' && item.priority !== 'HIGH') return false;
    if (currentFilter === 'reviewed' && !item.isReviewed) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchPatient = item.patientId.toLowerCase().includes(q);
      const matchBed = item.bed.toLowerCase().includes(q);
      const matchHeadline = item.headline.toLowerCase().includes(q);
      const matchAgent = item.agent.toLowerCase().includes(q);
      return matchPatient || matchBed || matchHeadline || matchAgent;
    }
    return true;
  });

  const activeCount = alerts.length;
  const criticalCount = alerts.filter(a => a.priority === 'CRITICAL' && !a.isReviewed).length;
  const awaitingCount = alerts.filter(a => !a.isReviewed).length;

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto bg-white text-slate-900">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b-[1.5px] border-slate-200 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Triage &amp; Surveillance</h1>
          <p className="text-xs text-slate-500 font-medium">Real-time sepsis surveillance queue for ICU Ward 3B</p>
        </div>
        <button
          onClick={onSimulateAlert}
          className="h-9 px-4 rounded-full border-[1.5px] border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-mono text-emerald-800 flex items-center gap-1.5 shrink-0 transition-all duration-200 cursor-pointer font-bold shadow-2xs active:scale-95"
          title="Simulate incoming real-time alert"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
          <span>Simulate Alert</span>
        </button>
      </div>

      {/* KPI Cards Row (Clean White Surfaces with Soft Shadows & 1.5px Borders) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        
        {/* Active Patients */}
        <div
          className="rounded-3xl p-4 flex items-center justify-between border-[1.5px] border-slate-200 bg-white shadow-2xs"
        >
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Total Under Surveillance
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-slate-900">
              {activeCount}
            </div>
            <div className="text-xs mt-0.5 text-slate-600 font-semibold">
              ICU Ward 3B Beds
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-[1.5px] border-slate-200 bg-slate-50 flex items-center justify-center text-emerald-600 shadow-2xs">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        {/* Critical Alerts */}
        <div
          className="rounded-3xl p-4 flex items-center justify-between border-[1.5px] border-rose-300 bg-rose-50 shadow-2xs"
        >
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-rose-700 font-bold">
              Critical Sepsis Alerts
            </div>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
              {criticalCount}
            </div>
            <div className="text-xs mt-0.5 text-rose-700/90 font-bold">
              Immediate bedside review
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-[1.5px] border-rose-300 bg-white flex items-center justify-center text-rose-600 shadow-2xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Awaiting Review */}
        <div
          className="rounded-3xl p-4 flex items-center justify-between border-[1.5px] border-amber-300 bg-amber-50 shadow-2xs"
        >
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-800 font-bold">
              Awaiting Review
            </div>
            <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
              {awaitingCount}
            </div>
            <div className="text-xs mt-0.5 text-amber-800 font-semibold">
              High / Moderate severity
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-[1.5px] border-amber-300 bg-white flex items-center justify-center text-amber-600 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Consensus Canvas Card */}
        <div
          className="rounded-3xl p-3 flex flex-col justify-between border-[1.5px] border-slate-200 bg-white shadow-2xs"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 text-slate-900 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Consensus Engine
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border-[1.5px] border-emerald-300">
              Triple Sync
            </span>
          </div>
          <div className="w-full h-12 rounded-2xl border-[1.5px] border-slate-200 bg-slate-50 relative overflow-hidden flex items-center justify-center shadow-2xs">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono mt-1 text-slate-500 font-semibold">
            <span>Vitals • Labs • Meds</span>
            <span className="text-emerald-700 font-bold">Live Stream</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls (Pill-shaped) */}
      <div
        className="rounded-full p-2 mb-4 flex flex-wrap items-center justify-between gap-3 border-[1.5px] border-slate-200 bg-[#F9FAFB] shadow-2xs"
      >
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-full border-[1.5px] border-slate-200 bg-white shadow-2xs">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'unread', label: 'Unreviewed' },
            { id: 'high', label: 'Critical / High' },
            { id: 'reviewed', label: 'Acknowledged' }
          ].map((tab) => {
            const isActive = currentFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSetFilter(tab.id)}
                className={`h-8 px-4 rounded-full text-xs transition-all duration-200 ease-in-out flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold border-[1.5px] border-emerald-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold border-[1.5px] border-transparent'
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cylindrical Search Input */}
        <div className="flex items-center gap-2 flex-1 max-w-md mr-1">
          <div className="relative w-full flex items-center">
            <div className="absolute left-3.5 pointer-events-none flex items-center justify-center text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Patient ID (e.g. PT-9042), bed, or agent..."
              className="w-full h-9 border-[1.5px] border-slate-300 rounded-full pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 shadow-2xs font-sans"
            />
          </div>
        </div>
      </div>

      {/* Patient Alerts Table */}
      <div
        className="flex-1 rounded-3xl border-[1.5px] border-slate-200 overflow-hidden flex flex-col bg-white shadow-sm"
      >
        <div className="grid grid-cols-12 px-5 py-3 border-b-[1.5px] border-slate-200 text-[10px] font-mono uppercase tracking-wider bg-slate-50 text-slate-500 font-bold">
          <div className="col-span-3">Patient &amp; Location</div>
          <div className="col-span-5">Clinical Finding &amp; Trajectory</div>
          <div className="col-span-2">Responsible Agent</div>
          <div className="col-span-1 text-center">Priority</div>
          <div className="col-span-1 text-right">Time / Action</div>
        </div>

        <div className="custom-scrollbar divide-y divide-slate-100 overflow-y-auto flex-1">
          {filteredAlerts.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-500" />
              <p className="text-sm font-bold text-slate-900">No alerts matching active criteria</p>
              <p className="text-xs mt-1 text-slate-500 font-medium">Adjust search parameters or select 'All Alerts'</p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const isCritical = alert.priority === 'CRITICAL';
              const isHigh = alert.priority === 'HIGH';
              const AgentIcon = AGENT_ICON_MAP[alert.agentKey] || Activity;

              return (
                <div
                  key={alert.id}
                  onClick={() => onSelectAlert(alert.id)}
                  className="grid grid-cols-12 px-5 py-3.5 cursor-pointer transition-all duration-200 ease-in-out items-center hover:bg-slate-50/80 group"
                >
                  {/* Patient & Location */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-2 flex justify-center">
                      {!alert.isReviewed ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Unreviewed" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" title="Reviewed" />
                      )}
                    </div>
                    <div>
                      <div className="font-mono text-xs font-bold flex items-center gap-2 text-slate-900">
                        {alert.patientId}
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border-[1.5px] border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs">
                          {alert.bed}
                        </span>
                      </div>
                      <div className="text-[11px] truncate max-w-[200px] mt-0.5 text-slate-500 font-medium">
                        {alert.admissionDiagnosis}
                      </div>
                    </div>
                  </div>

                  {/* Headline & Summary */}
                  <div className="col-span-5 pr-4">
                    <div className="text-xs font-bold truncate transition-colors text-slate-900 group-hover:text-emerald-700">
                      {alert.headline}
                    </div>
                    <div className="text-[11px] truncate mt-0.5 text-slate-500 font-medium">
                      {alert.summary}
                    </div>
                  </div>

                  {/* Responsible Agent */}
                  <div className="col-span-2">
                    <div className="text-xs flex items-center gap-1.5 font-semibold text-slate-800">
                      <AgentIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate">{alert.agent}</span>
                    </div>
                    <div className="text-[10px] font-mono mt-0.5 text-slate-400 font-medium">
                      Confidence 96.4%
                    </div>
                  </div>

                  {/* Priority Pill (Cylindrical) */}
                  <div className="col-span-1 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border-[1.5px] shadow-2xs ${
                      isCritical
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : isHigh
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}>
                      {alert.priority}
                    </span>
                  </div>

                  {/* Time / Open Action */}
                  <div className="col-span-1 text-right flex items-center justify-end gap-2">
                    <span className="text-[11px] font-mono font-semibold text-slate-400">
                      {alert.timestamp}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
