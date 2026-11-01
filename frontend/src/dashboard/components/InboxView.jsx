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
  ShieldCheck
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

  // Multi-Agent Signal Flow Animation Engine (Soft Mint / Teal on Daylight Canvas)
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
        { y: h * 0.22, label: "VITALS", color: "#0D9488" },
        { y: h * 0.50, label: "LAB",    color: "#0284C7" },
        { y: h * 0.78, label: "MEDS",   color: "#7E22CE" }
      ];

      const targetX = w - 38;
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
        ctx.strokeStyle = '#E2E8F0';
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
      ctx.fillStyle = "#0D9488";
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
    <div className="h-full flex flex-col p-6 overflow-y-auto bg-white text-[#334155]">
      {/* Clinical Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl p-4 flex items-center justify-between border border-[#E2E8F0] bg-[#F8FAFC] shadow-2xs">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#64748B]">
              Active Alerts
            </div>
            <div className="text-2xl font-display font-bold mt-1 text-[#334155]">
              {activeCount}
            </div>
            <div className="text-[11px] mt-0.5 text-[#64748B]">
              ICU Ward 3B Patients
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#0D9488] shadow-2xs">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl p-4 flex items-center justify-between border border-rose-200 bg-rose-50 shadow-2xs">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-rose-700">
              Critical Sepsis Alerts
            </div>
            <div className="text-2xl font-display font-bold text-rose-600 mt-1">
              {criticalCount}
            </div>
            <div className="text-[11px] mt-0.5 text-rose-600">
              Immediate intervention review
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl border border-rose-200 bg-white flex items-center justify-center text-rose-600 shadow-2xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl p-4 flex items-center justify-between border border-amber-200 bg-amber-50 shadow-2xs">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-800">
              Awaiting Review
            </div>
            <div className="text-2xl font-display font-bold text-amber-700 mt-1">
              {awaitingCount}
            </div>
            <div className="text-[11px] mt-0.5 text-amber-700">
              High &amp; Moderate convergence
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl border border-amber-200 bg-white flex items-center justify-center text-amber-600 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* AI Consensus Engine Canvas Card */}
        <div className="rounded-2xl p-3 flex flex-col justify-between border border-[#E2E8F0] bg-[#F8FAFC] shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 text-[#475569]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
              Consensus Engine
            </div>
            <span className="text-[10px] font-mono font-semibold text-[#0D9488]">
              Triple Sync
            </span>
          </div>
          <div className="w-full h-14 rounded-xl border border-[#E2E8F0] bg-white relative overflow-hidden flex items-center justify-center shadow-2xs">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono mt-1 text-[#64748B]">
            <span>Vitals • Lab • Meds</span>
            <span className="text-[#0D9488] font-semibold">Live Ingestion</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3 border border-[#E2E8F0] bg-[#F8FAFC] shadow-2xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[#E2E8F0] bg-white">
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
                className={`h-8 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4] font-bold shadow-2xs'
                    : 'text-[#64748B] hover:text-[#334155] hover:bg-[#F1F5F9]'
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Simulate Alert */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full flex items-center">
            <div className="absolute left-3 pointer-events-none flex items-center justify-center text-[#64748B]">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Patient ID (e.g. PT-9042), bed, or agent..."
              className="w-full h-8 border border-[#E2E8F0] rounded-xl pl-9 pr-3 text-xs bg-white text-[#334155] placeholder-[#64748B] focus:outline-none focus:border-[#99F6E4] focus:ring-2 focus:ring-[#99F6E4]/40 transition-all shadow-2xs"
            />
          </div>
          <button
            onClick={onSimulateAlert}
            className="h-8 px-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F0FDFA] hover:border-[#99F6E4] text-xs font-mono text-[#0D9488] flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-2xs font-semibold"
            title="Simulate incoming real-time alert"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Simulate Alert</span>
          </button>
        </div>
      </div>

      {/* Alerts Table / List */}
      <div className="flex-1 rounded-2xl border border-[#E2E8F0] overflow-hidden flex flex-col bg-white shadow-2xs">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-[#E2E8F0] text-[11px] font-mono uppercase tracking-wider bg-[#F8FAFC] text-[#64748B]">
          <div className="col-span-3">Patient &amp; Location</div>
          <div className="col-span-5">Clinical Finding &amp; Concern</div>
          <div className="col-span-2">Responsible Agent</div>
          <div className="col-span-1 text-center">Priority</div>
          <div className="col-span-1 text-right">Time / Action</div>
        </div>

        {/* Alert Items Container */}
        <div className="divide-y divide-[#E2E8F0] overflow-y-auto flex-1">
          {filteredAlerts.length === 0 ? (
            <div className="py-16 text-center text-[#64748B]">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#0D9488]" />
              <p className="text-sm font-medium text-[#334155]">No alerts matching active criteria</p>
              <p className="text-xs mt-1 text-[#64748B]">Adjust search parameters or select 'All Alerts'</p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              let priorityBadge = null;
              let priorityBorder = 'border-l-3 border-transparent';

              if (alert.priority === 'CRITICAL') {
                priorityBadge = (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border border-rose-200 bg-rose-50 text-rose-700">
                    CRITICAL
                  </span>
                );
                priorityBorder = 'border-l-3 border-rose-500';
              } else if (alert.priority === 'HIGH') {
                priorityBadge = (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border border-amber-200 bg-amber-50 text-amber-700">
                    HIGH
                  </span>
                );
                priorityBorder = 'border-l-3 border-amber-500';
              } else {
                priorityBadge = (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border border-[#E2E8F0] bg-[#F1F5F9] text-[#475569]">
                    MODERATE
                  </span>
                );
                priorityBorder = 'border-l-3 border-slate-300';
              }

              const AgentIcon = AGENT_ICON_MAP[alert.agentKey] || Activity;

              return (
                <div
                  key={alert.id}
                  onClick={() => onSelectAlert(alert.id)}
                  className={`grid grid-cols-12 px-5 py-3.5 cursor-pointer transition-all items-center ${priorityBorder} hover:bg-[#F8FAFC] group`}
                >
                  {/* Patient & Bed */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-2 flex justify-center">
                      {!alert.isReviewed ? (
                        <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" title="Unreviewed" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-[#64748B]" title="Reviewed" />
                      )}
                    </div>
                    <div>
                      <div className="font-mono text-xs font-semibold flex items-center gap-2 text-[#334155]">
                        {alert.patientId}
                        <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-md border border-[#CCFBF1] bg-[#F0FDFA] text-[#0D9488]">
                          {alert.bed}
                        </span>
                      </div>
                      <div className="text-[11px] truncate max-w-[200px] mt-0.5 text-[#64748B]">
                        {alert.admissionDiagnosis}
                      </div>
                    </div>
                  </div>

                  {/* Headline & Concern */}
                  <div className="col-span-5 pr-4">
                    <div className="text-xs font-semibold truncate transition-colors text-[#334155] group-hover:text-[#0D9488]">
                      {alert.headline}
                    </div>
                    <div className="text-[11px] truncate mt-0.5 text-[#64748B]">
                      {alert.summary}
                    </div>
                  </div>

                  {/* Agent */}
                  <div className="col-span-2">
                    <div className="text-xs flex items-center gap-1.5 font-medium text-[#475569]">
                      <AgentIcon className="w-3.5 h-3.5 text-[#0D9488]" />
                      <span className="truncate">{alert.agent}</span>
                    </div>
                    <div className="text-[10px] font-mono mt-0.5 text-[#64748B]">
                      Confidence 96.4%
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="col-span-1 text-center">
                    {priorityBadge}
                  </div>

                  {/* Time & Open action */}
                  <div className="col-span-1 text-right flex items-center justify-end gap-2">
                    <span className="text-[11px] font-mono text-[#64748B]">
                      {alert.timestamp}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0D9488] transition-transform group-hover:translate-x-0.5" />
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
