import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
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
  LayoutGrid,
  ListFilter,
  Stethoscope,
  FileSpreadsheet,
  Download,
  Upload,
  Sparkles
} from 'lucide-react';
import WardGridView from './WardGridView';
import SimulationControls from './SimulationControls';

const AGENT_ICON_MAP = {
  vitals: Activity,
  lab: FlaskConical,
  meds: Pill,
};

export default function InboxView({
  alerts = [],
  beds = [],
  currentFilter,
  onSetFilter,
  searchQuery,
  onSearchChange,
  onSelectAlert,
  onSelectPatient,
  onOpenNurseRound,
  onOpenExcelUpload,
  onOpenDemoFlowsheet,
  onDownloadDemoFlowsheet,
  onRefreshRoster,
  isRefreshing = false,
  simulationProps = {}
}) {
  const { isDark } = useTheme();
  const { isDoctor, isNurse } = useAuth();
  const canvasRef = useRef(null);

  // View Tab: 'grid' (Ward Overview Grid) vs 'list' (Alerts Queue)
  const [activeTab, setActiveTab] = useState('grid');

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

      const leftX = 24;
      const sourceNodes = [
        { y: h * 0.22, label: "VITALS", color: "#10B981" },
        { y: h * 0.50, label: "LAB",    color: "#2563EB" },
        { y: h * 0.78, label: "MEDS",   color: "#7C3AED" }
      ];

      const targetX = w - 32;
      const targetY = h * 0.5;

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
        ctx.strokeStyle = isDark ? '#1E2D44' : '#E5E7EB';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

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

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  // Filtered Alerts & Beds based on search query
  const filteredAlerts = alerts.filter(a => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (a.patientId && a.patientId.toLowerCase().includes(q)) ||
                    (a.bed && a.bed.toLowerCase().includes(q)) ||
                    (a.patientName && a.patientName.toLowerCase().includes(q)) ||
                    (a.headline && a.headline.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (currentFilter === 'unread') return !a.isReviewed;
    if (currentFilter === 'high') return a.priority === 'CRITICAL' || a.priority === 'HIGH';
    if (currentFilter === 'reviewed') return a.isReviewed;
    return true;
  });

  const filteredBeds = beds.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (b.patientId && b.patientId.toLowerCase().includes(q)) ||
           (b.bedNumber && b.bedNumber.toLowerCase().includes(q)) ||
           (b.patientName && b.patientName.toLowerCase().includes(q));
  });

  // KPI Metrics
  const criticalCount = alerts.filter(a => a.priority === 'CRITICAL' && !a.isReviewed).length;
  const awaitingCount = alerts.filter(a => !a.isReviewed).length;
  const occupiedCount = beds.filter(b => Boolean(b.occupied ?? b.isOccupied ?? (b.patientId && String(b.patientId).trim().length > 0))).length;

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar text-slate-900">
      
      {/* Simulation Controls Strip */}
      <SimulationControls {...simulationProps} />

      {/* Top Action Header & Quick Entry Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              ICU Ward Surveillance &amp; Triage
            </h1>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border-[1.5px] border-emerald-300">
              {occupiedCount} / {beds.length || 8} Beds Occupied
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time multi-agent early warning for sepsis hypoperfusion and occult organ deterioration.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Refresh Roster Button */}
          <button
            type="button"
            onClick={onRefreshRoster}
            disabled={isRefreshing}
            className="h-9 px-3 rounded-full border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-white dark:bg-[#0D1524] hover:bg-[#F0F5FA] dark:hover:bg-[#142036] text-[#334155] dark:text-[#CBD5E1] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Poll Backend for Latest Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-[#64748B] dark:text-[#768CA8]'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Nurse Entry Form Modal Button */}
          {isNurse ? (
            <button
              type="button"
              onClick={onOpenNurseRound}
              className="h-9 px-3.5 rounded-full border-[1.5px] border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-[#0E2A2A] hover:bg-emerald-100 dark:hover:bg-[#143636] text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Log Nurse Bedside Hourly Vitals & Labs"
            >
              <Stethoscope className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Log Hourly Round</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="h-9 px-3.5 rounded-full border-[1.5px] border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#131E30] text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center gap-1.5 opacity-60 cursor-not-allowed shadow-2xs"
              title="Bedside telemetry rounds are logged by Bedside Nursing (ROLE_NURSE)"
            >
              <Stethoscope className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>Log Round (Nurse Only)</span>
            </button>
          )}

          {/* Demo Flowsheet Pre-fill Button */}
          <button
            type="button"
            onClick={onOpenDemoFlowsheet}
            className="h-9 px-3.5 rounded-full border-[1.5px] border-emerald-400/60 dark:border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Load Pre-populated 4-Patient 6-Hour Demo Flowsheet"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Demo</span>
          </button>

          {/* Download Demo Flowsheet Button */}
          <button
            type="button"
            onClick={onDownloadDemoFlowsheet}
            className="h-9 px-3 rounded-full border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-white dark:bg-[#0D1524] hover:bg-[#F0F5FA] dark:hover:bg-[#142036] text-[#334155] dark:text-[#CBD5E1] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Download Aegis_ICU_Demo_Flowsheet.xlsx"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Excel Report Upload Modal Button */}
          <button
            type="button"
            onClick={onOpenExcelUpload}
            className="h-9 px-3.5 rounded-full bg-[#0F172A] dark:bg-[#14223A] hover:bg-[#1E293B] dark:hover:bg-[#1B2F50] border border-[#334155] dark:border-[#243B60] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Upload Multi-Hour Flowsheet Report (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Upload Flowsheet .xlsx</span>
          </button>
        </div>
      </div>

      {/* Empty State Banner when 0 patients are admitted */}
      {occupiedCount === 0 && (
        <div className="rounded-3xl p-5 border-[1.5px] border-dashed border-emerald-400/50 dark:border-emerald-500/30 bg-emerald-500/5 dark:bg-[#0B1A24] flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5FA]">
                  Ward Surveillance Ready — No Active Patients Loaded
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Clean 0-Patient Ward
                </span>
              </div>
              <p className="text-xs text-[#5B718E] dark:text-[#8BA1BD] mt-1 max-w-2xl leading-relaxed">
                All 8 ICU beds are clean and ready for admission. No hardcoded or mock patient records are active. Launch the canonical 4-patient 6-hour demo flowsheet or upload your own clinical flowsheet (.xlsx) to begin live multi-agent AI surveillance.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenDemoFlowsheet}
              className="h-9 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Launch Demo Flowsheet</span>
            </button>
            <button
              type="button"
              onClick={onOpenExcelUpload}
              className="h-9 px-3.5 rounded-full border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-white dark:bg-[#0D1524] hover:bg-[#F0F5FA] dark:hover:bg-[#142036] text-[#334155] dark:text-[#CBD5E1] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Upload Custom .xlsx</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Critical Sepsis Alerts */}
        <div className="rounded-3xl p-4 flex items-center justify-between border-[1.5px] border-rose-300 dark:border-rose-900/60 bg-[#FFF5F6] dark:bg-[#1A0D18] shadow-2xs transition-all duration-200">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-rose-800 dark:text-rose-400 font-bold">
              Critical Sepsis Alerts
            </div>
            <div className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-300 mt-1">
              {criticalCount}
            </div>
            <div className="text-xs mt-0.5 text-rose-700/90 dark:text-rose-400/90 font-bold">
              Immediate bedside review
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-[1.5px] border-rose-300 dark:border-rose-800/60 bg-white dark:bg-[#2D0F1E] flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-2xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Awaiting Review */}
        <div className="rounded-3xl p-4 flex items-center justify-between border-[1.5px] border-amber-300 dark:border-amber-900/60 bg-[#FFFBEB] dark:bg-[#1B150A] shadow-2xs transition-all duration-200">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-800 dark:text-amber-400 font-bold">
              Awaiting Review
            </div>
            <div className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-300 mt-1">
              {awaitingCount}
            </div>
            <div className="text-xs mt-0.5 text-amber-800 dark:text-amber-400 font-semibold">
              High / Moderate severity
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-[1.5px] border-amber-300 dark:border-amber-800/60 bg-white dark:bg-[#2E1F0D] flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Consensus Canvas Card */}
        <div className="rounded-3xl p-3 flex flex-col justify-between border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-white dark:bg-[#0D1524] shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 text-[#0F172A] dark:text-[#F1F5FA] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Consensus Engine
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-[1.5px] border-emerald-300 dark:border-emerald-800/60">
              Triple Sync
            </span>
          </div>
          <div className="w-full h-12 rounded-2xl border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-[#F1F6FB] dark:bg-[#0B1528] relative overflow-hidden flex items-center justify-center shadow-2xs">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono mt-1 text-[#64748B] dark:text-[#768CA8] font-semibold">
            <span>Vitals • Labs • Meds</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">FastAPI Connected</span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs & Search Row */}
      <div className="rounded-full p-2 flex flex-wrap items-center justify-between gap-3 border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-[#F1F6FB] dark:bg-[#080E18] shadow-2xs">
        
        {/* Toggle between Ward Grid and Alerts Table */}
        <div className="flex items-center gap-1 p-1 rounded-full border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-white dark:bg-[#0D1524] shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`h-8 px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'grid'
                ? 'bg-emerald-50 dark:bg-[#0E2A2A] text-emerald-800 dark:text-emerald-300 border-[1.5px] border-emerald-300 dark:border-emerald-500/40 shadow-2xs'
                : 'bg-transparent text-[#5B718E] dark:text-[#7A91AD] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#DFEAF5] dark:hover:bg-[#14223A]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Ward Heatmap (8 Beds)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`h-8 px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-emerald-50 dark:bg-[#0E2A2A] text-emerald-800 dark:text-emerald-300 border-[1.5px] border-emerald-300 dark:border-emerald-500/40 shadow-2xs'
                : 'bg-transparent text-[#5B718E] dark:text-[#7A91AD] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#DFEAF5] dark:hover:bg-[#14223A]'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Clinical Alerts Queue</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 max-w-md mr-1">
          <div className="relative w-full flex items-center">
            <div className="absolute left-3.5 pointer-events-none flex items-center justify-center text-[#64748B] dark:text-[#768CA8]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search patient token (e.g. PT-9042), bed, or diagnosis..."
              className="w-full h-9 border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] rounded-full pl-10 pr-4 text-xs font-medium text-[#0F172A] dark:text-[#F1F5FA] placeholder:text-[#64748B] dark:placeholder:text-[#768CA8] bg-white dark:bg-[#0D1524] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs font-sans"
            />
          </div>
        </div>
      </div>

      {/* Main View Area: Ward Overview Grid OR Alerts Queue */}
      {activeTab === 'grid' ? (
        <div className="flex-1">
          <WardGridView
            beds={filteredBeds}
            onSelectPatient={onSelectPatient}
          />
        </div>
      ) : (
        /* Alerts Table */
        <div className="flex-1 rounded-3xl border-[1.5px] border-slate-200 overflow-hidden flex flex-col bg-white shadow-sm">
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
                <p className="text-sm font-bold text-slate-900">No alerts matching criteria</p>
                <p className="text-xs mt-1 text-slate-500 font-medium">All ICU patients are currently compensated.</p>
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
                    className={`grid grid-cols-12 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors cursor-pointer group ${
                      !alert.isReviewed ? 'bg-slate-50/40' : ''
                    }`}
                  >
                    <div className="col-span-3 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        isCritical ? 'bg-rose-500 animate-pulse' : isHigh ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 font-mono">
                          {alert.patientId}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {alert.bed}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {alert.patientName || `${alert.age}yo • ${alert.gender}`}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-5 pr-4">
                      <div className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {alert.headline}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                        {alert.summary}
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                        <AgentIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 truncate">
                        {alert.agent}
                      </span>
                    </div>

                    <div className="col-span-1 text-center">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border tracking-wide uppercase ${
                        isCritical ? 'bg-rose-50 text-rose-700 border-rose-300' :
                        isHigh ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}>
                        {alert.priority}
                      </span>
                    </div>

                    <div className="col-span-1 text-right flex items-center justify-end gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        {alert.timestamp || 'Live'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
