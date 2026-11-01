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
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
  const { isDark } = useTheme();
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
        { y: h * 0.22, label: "VITALS", color: isDark ? "#14B8A6" : "#0D9488" },
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
        ctx.strokeStyle = isDark ? '#1F293D' : '#E2E8F0';
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

        const source = sourceNodes[p.sourceIndex];
        const t = p.progress;

        const p0 = { x: leftX, y: source.y };
        const p1 = { x: leftX + (targetX - leftX) * 0.45, y: source.y };
        const p2 = { x: leftX + (targetX - leftX) * 0.55, y: targetY };
        const p3 = { x: targetX, y: targetY };

        const cx = 3 * (p1.x - p0.x);
        const bx = 3 * (p2.x - p1.x) - cx;
        const ax = p3.x - p0.x - cx - bx;

        const cy = 3 * (p1.y - p0.y);
        const by = 3 * (p2.y - p1.y) - cy;
        const ay = p3.y - p0.y - cy - by;

        const xt = ax * (t ** 3) + bx * (t ** 2) + cx * t + p0.x;
        const yt = ay * (t ** 3) + by * (t ** 2) + cy * t + p0.y;

        ctx.beginPath();
        ctx.arc(xt, yt, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = source.color;
        ctx.shadowColor = source.color;
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

        ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
        ctx.font = '8px "JetBrains Mono"';
        ctx.textAlign = 'left';
        ctx.fillText(node.label, leftX + 10, node.y + 2.5);
      });

      // Target Node (Aegis Consensus)
      const pulse = (Math.sin(Date.now() / 250) + 1) * 2;
      ctx.beginPath();
      ctx.arc(targetX, targetY, 8 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(20, 184, 166, 0.4)' : 'rgba(13, 148, 136, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(targetX, targetY, 6, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#14B8A6' : '#0D9488';
      ctx.fill();

      ctx.fillStyle = isDark ? '#E2E8F0' : '#0F172A';
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
  }, [isDark]);

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
    <div className={`h-full flex flex-col p-6 overflow-y-auto transition-colors duration-200 ${
      isDark ? 'bg-[#070A0F] text-slate-200' : 'bg-[#F4F6F9] text-slate-800'
    }`}>
      {/* Clinical Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-xl p-4 flex items-center justify-between border transition-all ${
          isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div>
            <div className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Active Alerts
            </div>
            <div className={`text-2xl font-display font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {activeCount}
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ICU Ward 3B Patients
            </div>
          </div>
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
            isDark ? 'bg-[#131B2A] border-[#1F293D] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className={`rounded-xl p-4 flex items-center justify-between border transition-all ${
          isDark
            ? 'bg-[#0D121D] border-rose-900/50 bg-gradient-to-r from-[#0D121D] to-rose-950/20'
            : 'bg-rose-50 border-rose-200 shadow-xs'
        }`}>
          <div>
            <div className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
              Critical Sepsis Alerts
            </div>
            <div className="text-2xl font-display font-bold text-rose-500 mt-1">
              {criticalCount}
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-rose-300/80' : 'text-rose-600'}`}>
              Immediate intervention review
            </div>
          </div>
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
            isDark ? 'bg-rose-950/80 border-rose-800/60 text-rose-400' : 'bg-white border-rose-200 text-rose-600 shadow-2xs'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className={`rounded-xl p-4 flex items-center justify-between border transition-all ${
          isDark
            ? 'bg-[#0D121D] border-amber-900/50 bg-gradient-to-r from-[#0D121D] to-amber-950/20'
            : 'bg-amber-50 border-amber-200 shadow-xs'
        }`}>
          <div>
            <div className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              Awaiting Review
            </div>
            <div className="text-2xl font-display font-bold text-amber-500 mt-1">
              {awaitingCount}
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-amber-300/80' : 'text-amber-600'}`}>
              High &amp; Moderate convergence
            </div>
          </div>
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
            isDark ? 'bg-amber-950/80 border-amber-800/60 text-amber-400' : 'bg-white border-amber-200 text-amber-600 shadow-2xs'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* AI Consensus Engine Canvas Card */}
        <div className={`rounded-xl p-3 flex flex-col justify-between border relative overflow-hidden transition-all ${
          isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <div className={`text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Consensus Engine
            </div>
            <span className={`text-[10px] font-mono font-semibold ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>
              Triple Sync
            </span>
          </div>
          <div className={`w-full h-16 rounded border relative overflow-hidden flex items-center justify-center ${
            isDark ? 'bg-[#05080E] border-[#1F293D]' : 'bg-slate-50 border-slate-200'
          }`}>
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
          <div className={`flex justify-between items-center text-[10px] font-mono mt-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>Vitals • Lab • Meds</span>
            <span className={isDark ? 'text-teal-400' : 'text-teal-700'}>Dynamic Ingestion</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3 border transition-all ${
        isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        {/* Filter Tabs */}
        <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
          isDark ? 'bg-[#070A0F] border-[#1F293D]' : 'bg-slate-100 border-slate-200'
        }`}>
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
                className={`h-8 px-3.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isActive
                    ? (isDark
                        ? 'bg-[#122338] text-teal-400 border border-teal-500/50 font-bold shadow-xs'
                        : 'bg-white text-teal-800 border border-teal-300 font-bold shadow-xs')
                    : (isDark
                        ? 'text-slate-300 hover:text-white hover:bg-[#111C2E]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60')
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Simulate Alert */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full flex items-center">
            <div className={`absolute left-3 pointer-events-none flex items-center justify-center ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Patient ID (e.g. PT-9042), bed, or agent..."
              className={`w-full h-8 border rounded-lg pl-9 pr-3 text-xs focus:outline-none transition-all ${
                isDark
                  ? 'bg-[#070A0F] border-[#1F293D] text-slate-100 placeholder-slate-500 focus:border-teal-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:bg-white'
              }`}
            />
          </div>
          <button
            onClick={onSimulateAlert}
            className={`h-8 px-3 rounded-lg border text-xs font-mono flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-2xs ${
              isDark
                ? 'bg-[#131B2A] border-[#1F293D] hover:border-slate-500 text-slate-200'
                : 'bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
            title="Simulate incoming real-time alert"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            <span>Simulate Alert</span>
          </button>
        </div>
      </div>

      {/* Alerts Table / List */}
      <div className={`flex-1 rounded-xl border overflow-hidden flex flex-col transition-all ${
        isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className={`grid grid-cols-12 px-5 py-3 border-b text-[11px] font-mono uppercase tracking-wider ${
          isDark ? 'bg-[#070A0F]/80 border-[#1F293D] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className="col-span-3">Patient &amp; Location</div>
          <div className="col-span-5">Clinical Finding &amp; Concern</div>
          <div className="col-span-2">Responsible Agent</div>
          <div className="col-span-1 text-center">Priority</div>
          <div className="col-span-1 text-right">Time / Action</div>
        </div>

        {/* Alert Items Container */}
        <div className={`divide-y overflow-y-auto flex-1 ${
          isDark ? 'divide-[#1F293D]/60' : 'divide-slate-100'
        }`}>
          {filteredAlerts.length === 0 ? (
            <div className={`py-16 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No alerts matching active criteria</p>
              <p className="text-xs mt-1">Adjust search parameters or select 'All Alerts'</p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              let priorityBadge = null;
              let priorityBorder = 'border-l-3 border-transparent';

              if (alert.priority === 'CRITICAL') {
                priorityBadge = (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    isDark
                      ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                      : 'bg-rose-100 text-rose-800 border-rose-200'
                  }`}>
                    CRITICAL
                  </span>
                );
                priorityBorder = 'border-l-3 border-rose-500';
              } else if (alert.priority === 'HIGH') {
                priorityBadge = (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                    isDark
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    HIGH
                  </span>
                );
                priorityBorder = 'border-l-3 border-amber-500';
              } else {
                priorityBadge = (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                    isDark
                      ? 'bg-[#131B2A] text-slate-400 border-[#1F293D]'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    MODERATE
                  </span>
                );
                priorityBorder = 'border-l-3 border-slate-400';
              }

              const AgentIcon = AGENT_ICON_MAP[alert.agentKey] || Activity;

              return (
                <div
                  key={alert.id}
                  onClick={() => onSelectAlert(alert.id)}
                  className={`grid grid-cols-12 px-5 py-3.5 cursor-pointer transition-all items-center ${priorityBorder} group ${
                    isDark
                      ? 'hover:bg-[#131B2A]/70'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Patient & Bed */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-2 flex justify-center">
                      {!alert.isReviewed ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Unreviewed" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-400" title="Reviewed" />
                      )}
                    </div>
                    <div>
                      <div className={`font-mono text-xs font-semibold flex items-center gap-2 ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {alert.patientId}
                        <span className={`text-[10px] font-normal px-1.5 py-0.2 rounded border ${
                          isDark
                            ? 'bg-[#070A0F] text-slate-400 border-[#1F293D]'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {alert.bed}
                        </span>
                      </div>
                      <div className={`text-[11px] truncate max-w-[200px] mt-0.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {alert.admissionDiagnosis}
                      </div>
                    </div>
                  </div>

                  {/* Headline & Concern */}
                  <div className="col-span-5 pr-4">
                    <div className={`text-xs font-semibold truncate transition-colors ${
                      isDark
                        ? 'text-slate-200 group-hover:text-teal-400'
                        : 'text-slate-900 group-hover:text-teal-700'
                    }`}>
                      {alert.headline}
                    </div>
                    <div className={`text-[11px] truncate mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {alert.summary}
                    </div>
                  </div>

                  {/* Agent */}
                  <div className="col-span-2">
                    <div className={`text-xs flex items-center gap-1.5 font-medium ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      <AgentIcon className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                      <span className="truncate">{alert.agent}</span>
                    </div>
                    <div className={`text-[10px] font-mono mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Confidence 96.4%
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="col-span-1 text-center">
                    {priorityBadge}
                  </div>

                  {/* Time & Open action */}
                  <div className="col-span-1 text-right flex items-center justify-end gap-2">
                    <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {alert.timestamp}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-transform group-hover:translate-x-0.5" />
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
