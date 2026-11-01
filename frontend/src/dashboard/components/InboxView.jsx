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
  Pill,
  ShieldAlert
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

  // Multi-Agent Signal Flow Animation Engine
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

      const leftX = 28;
      const sourceNodes = [
        { y: h * 0.22, label: "VITALS", color: "#14B8A6" },
        { y: h * 0.50, label: "LAB",    color: "#0EA5E9" },
        { y: h * 0.78, label: "MEDS",   color: "#A855F7" }
      ];

      const targetX = w - 38;
      const targetY = h * 0.5;

      // Draw connection curves
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
        ctx.strokeStyle = '#1F293D';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Draw flowing particles
      particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.sourceIndex = Math.floor(Math.random() * 3);
        }

        const src = sourceNodes[p.sourceIndex];
        const t = p.progress;

        const p0x = leftX, p0y = src.y;
        const p1x = leftX + (targetX - leftX) * 0.45, p1y = src.y;
        const p2x = leftX + (targetX - leftX) * 0.55, p2y = targetY;
        const p3x = targetX, p3y = targetY;

        const cx = Math.pow(1 - t, 3) * p0x + 3 * Math.pow(1 - t, 2) * t * p1x + 3 * (1 - t) * Math.pow(t, 2) * p2x + Math.pow(t, 3) * p3x;
        const cy = Math.pow(1 - t, 3) * p0y + 3 * Math.pow(1 - t, 2) * t * p1y + 3 * (1 - t) * Math.pow(t, 2) * p2y + Math.pow(t, 3) * p3y;

        ctx.beginPath();
        ctx.arc(cx, cy, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.sourceIndex === 1 ? '#38BDF8' : '#14B8A6';
        ctx.shadowColor = '#14B8A6';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Source Nodes
      sourceNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(leftX, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(leftX, node.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = '#94A3B8';
        ctx.font = '8px "JetBrains Mono"';
        ctx.textAlign = 'left';
        ctx.fillText(node.label, leftX + 10, node.y + 2.5);
      });

      // Target Node (Aegis Consensus)
      const pulse = (Math.sin(Date.now() / 250) + 1) * 2;
      ctx.beginPath();
      ctx.arc(targetX, targetY, 8 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(targetX, targetY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#14B8A6';
      ctx.fill();

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '8px "JetBrains Mono"';
      ctx.textAlign = 'right';
      ctx.fillText("AEGIS", targetX - 12, targetY + 2.5);

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
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      {/* Clinical Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
              Active Alerts
            </div>
            <div className="text-2xl font-display font-bold text-slate-100 mt-1">
              {activeCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">ICU Ward 3B Patients</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-slate-300">
            <Inbox className="w-5 h-5 text-slate-300" />
          </div>
        </div>

        <div className="bg-navy-900 border border-clinical-rose/30 rounded-xl p-4 flex items-center justify-between bg-gradient-to-r from-navy-900 to-clinical-rose-dim">
          <div>
            <div className="text-[11px] font-mono uppercase text-rose-300 tracking-wider">
              Critical Sepsis Alerts
            </div>
            <div className="text-2xl font-display font-bold text-rose-400 mt-1">
              {criticalCount}
            </div>
            <div className="text-[11px] text-rose-300/80 mt-0.5">
              Immediate intervention review
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-950/80 border border-clinical-rose/40 flex items-center justify-center text-clinical-rose">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-navy-900 border border-clinical-amber/30 rounded-xl p-4 flex items-center justify-between bg-gradient-to-r from-navy-900 to-clinical-amber-dim">
          <div>
            <div className="text-[11px] font-mono uppercase text-amber-300 tracking-wider">
              Awaiting Review
            </div>
            <div className="text-2xl font-display font-bold text-amber-400 mt-1">
              {awaitingCount}
            </div>
            <div className="text-[11px] text-amber-300/80 mt-0.5">
              High &amp; Moderate convergence
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-clinical-amber/40 flex items-center justify-center text-clinical-amber">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* AI Consensus Engine Canvas Card */}
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-clinical-teal animate-pulse" />
              AI Consensus Engine
            </div>
            <span className="text-[10px] font-mono text-clinical-teal">Triple Sync</span>
          </div>
          <div className="w-full h-16 bg-navy-950/90 rounded border border-navy-700/60 relative overflow-hidden flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1.5">
            <span>Vitals • Lab • Meds</span>
            <span className="text-clinical-teal">Dynamic Ingestion</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-lg border border-navy-700">
          <button
            onClick={() => onSetFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentFilter === 'all'
                ? 'bg-navy-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Alerts
          </button>
          <button
            onClick={() => onSetFilter('unread')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentFilter === 'unread'
                ? 'bg-navy-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unreviewed
          </button>
          <button
            onClick={() => onSetFilter('high')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentFilter === 'high'
                ? 'bg-navy-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Critical / High
          </button>
          <button
            onClick={() => onSetFilter('reviewed')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentFilter === 'reviewed'
                ? 'bg-navy-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Acknowledged
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Patient ID (e.g. PT-9042), bed, or agent..."
              className="w-full bg-navy-950 border border-navy-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-clinical-teal"
            />
          </div>
          <button
            onClick={onSimulateAlert}
            className="px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 hover:border-slate-500 text-slate-300 text-xs font-mono flex items-center gap-1.5 shrink-0 transition-colors"
            title="Simulate incoming real-time alert"
          >
            <RefreshCw className="w-3.5 h-3.5 text-clinical-teal" />
            <span>Simulate Alert</span>
          </button>
        </div>
      </div>

      {/* Alerts Table / List */}
      <div className="flex-1 bg-navy-900 border border-navy-700 rounded-xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-navy-700 text-[11px] font-mono uppercase tracking-wider text-slate-400 bg-navy-950/60">
          <div className="col-span-3">Patient &amp; Location</div>
          <div className="col-span-5">Clinical Finding &amp; Concern</div>
          <div className="col-span-2">Responsible Agent</div>
          <div className="col-span-1 text-center">Priority</div>
          <div className="col-span-1 text-right">Time / Action</div>
        </div>

        {/* Alert Items Container */}
        <div className="divide-y divide-navy-700/60 overflow-y-auto flex-1">
          {filteredAlerts.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium">No alerts matching active criteria</p>
              <p className="text-xs mt-1">Adjust search parameters or select 'All Alerts'</p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              let priorityBadge = null;
              let priorityBorder = 'border-l-2 border-transparent';

              if (alert.priority === 'CRITICAL') {
                priorityBadge = (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-clinical-rose-dim text-clinical-rose border border-clinical-rose/30">
                    CRITICAL
                  </span>
                );
                priorityBorder = 'border-l-2 border-clinical-rose';
              } else if (alert.priority === 'HIGH') {
                priorityBadge = (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-clinical-amber-dim text-clinical-amber border border-clinical-amber/30">
                    HIGH
                  </span>
                );
                priorityBorder = 'border-l-2 border-clinical-amber';
              } else {
                priorityBadge = (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-navy-800 text-slate-400 border border-navy-700">
                    MODERATE
                  </span>
                );
                priorityBorder = 'border-l-2 border-slate-600';
              }

              const AgentIcon = AGENT_ICON_MAP[alert.agentKey] || Activity;

              return (
                <div
                  key={alert.id}
                  onClick={() => onSelectAlert(alert.id)}
                  className={`grid grid-cols-12 px-5 py-3.5 hover:bg-navy-850/70 cursor-pointer transition-all items-center ${priorityBorder} group`}
                >
                  {/* Patient & Bed */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-2 flex justify-center">
                      {!alert.isReviewed ? (
                        <span className="w-2 h-2 rounded-full bg-clinical-teal animate-pulse" title="Unreviewed" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-500" title="Reviewed" />
                      )}
                    </div>
                    <div>
                      <div className="font-mono text-xs font-semibold text-slate-100 flex items-center gap-2">
                        {alert.patientId}
                        <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-navy-950 text-slate-400 border border-navy-700">
                          {alert.bed}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[190px] mt-0.5">
                        {alert.admissionDiagnosis}
                      </div>
                    </div>
                  </div>

                  {/* Headline & Concern */}
                  <div className="col-span-5 pr-4">
                    <div className="text-xs font-medium text-slate-200 group-hover:text-clinical-teal transition-colors truncate">
                      {alert.headline}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {alert.summary}
                    </div>
                  </div>

                  {/* Agent */}
                  <div className="col-span-2">
                    <div className="text-xs text-slate-300 flex items-center gap-1.5">
                      <AgentIcon className="w-3.5 h-3.5 text-clinical-teal" />
                      <span className="truncate">{alert.agent}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Confidence 96.4%
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="col-span-1 text-center">
                    {priorityBadge}
                  </div>

                  {/* Time & Open action */}
                  <div className="col-span-1 text-right flex items-center justify-end gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      {alert.timestamp}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
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

