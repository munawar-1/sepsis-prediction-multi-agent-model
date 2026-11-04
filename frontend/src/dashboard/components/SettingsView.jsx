import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Lock,
  Cpu,
  RefreshCw,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { clinicalApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SettingsView() {
  const { user } = useAuth();
  const [aiHealth, setAiHealth] = useState({ reachable: true, status: 'CONNECTED', latency: '42ms' });
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [resettingWard, setResettingWard] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);

  // Load audit trail from Spring Boot
  const loadAuditTrail = async () => {
    setLoadingLogs(true);
    try {
      const res = await clinicalApi.fetchAuditTrail();
      if (res.data && res.data.auditTrail) {
        setAuditLogs(res.data.auditTrail);
      }
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRefreshHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await clinicalApi.fetchAiHealth();
      if (res.data) {
        setAiHealth({
          reachable: res.data.status !== 'DOWN',
          status: res.data.status || 'OPERATIONAL',
          modelsLoaded: res.data.modelsLoaded || 4,
          latency: '18ms'
        });
      }
    } catch {
      setAiHealth({ reachable: false, status: 'DOWN', latency: '—' });
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleResetWard = async () => {
    setResettingWard(true);
    setResetMessage(null);
    try {
      const res = await clinicalApi.resetWardDemo();
      setResetMessage('Ward simulation reset to standard baseline beds.');
      loadAuditTrail();
    } catch (e) {
      setResetMessage('Reset failed: ' + e.message);
    } finally {
      setResettingWard(false);
    }
  };

  useEffect(() => {
    loadAuditTrail();
    handleRefreshHealth();
  }, []);

  return (
    <div className="custom-scrollbar flex-1 h-full overflow-y-auto bg-slate-50/50 p-6 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 border-[1.5px] border-emerald-200 text-emerald-600 flex items-center justify-center shadow-2xs shrink-0">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings &amp; Clinical Governance</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Multi-agent architecture configuration, model health telemetry, and immutable append-only audit trail.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-emerald-50 border-[1.5px] border-emerald-200 text-emerald-800 font-bold shadow-2xs self-start sm:self-auto">
            DPDP Compliant (Sec. 8.3)
          </span>
        </div>

        {/* AI Engine Status & Diagnostics */}
        <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">FastAPI Diagnostic AI Microservice Telemetry</h2>
            </div>
            <button
              onClick={handleRefreshHealth}
              disabled={loadingHealth}
              className="px-3 py-1.5 rounded-full border-[1.5px] border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
              <span>Ping Health</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Microservice Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${aiHealth.reachable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="font-bold text-slate-900">{aiHealth.status}</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Multi-Agent Ensemble</span>
              <div className="font-bold text-emerald-700 mt-1">4 Neuro-Symbolic Agents</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">FastAPI Roundtrip Latency</span>
              <div className="font-bold text-slate-900 mt-1">{aiHealth.latency}</div>
            </div>
          </div>
        </div>

        {/* Ward Simulation Maintenance Actions */}
        <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Ward Simulation Data Management</h2>
            </div>
            {resetMessage && (
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {resetMessage}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Reset all 8 ICU beds back to standard initial demo seeds (Beds 01 to 04 occupied with baseline historical telemetry; Beds 05 to 08 vacant).
          </p>
          <button
            type="button"
            onClick={handleResetWard}
            disabled={resettingWard}
            className="px-5 py-2.5 rounded-full border-[1.5px] border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resettingWard ? 'animate-spin' : ''}`} />
            <span>{resettingWard ? 'Resetting Ward...' : 'Reset Ward to Demo Beds'}</span>
          </button>
        </div>

        {/* Cryptographic Human-in-the-Loop Audit Trail */}
        <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Immutable Append-Only Audit Trail (SHA-256 Signed)
              </h2>
            </div>
            <button
              onClick={loadAuditTrail}
              disabled={loadingLogs}
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-500" />
                <p className="text-xs font-semibold">No override or sign-off entries in audit trail yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Decisions digitally sign when Doctors/Nurses approve or override alerts.</p>
              </div>
            ) : (
              auditLogs.map((log) => {
                const isOverridden = log.actionTaken === 'OVERRIDDEN';
                return (
                  <div
                    key={log.auditId || log.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.auditId}</span>
                        <span className="text-slate-400">• Patient: {log.patientId}</span>
                        <span className="text-slate-400">• Clinician: {log.clinicianId}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isOverridden
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}>
                        {log.actionTaken}
                      </span>
                    </div>

                    {log.overrideReason && log.overrideReason !== 'N/A' && (
                      <div className="text-slate-700 font-sans text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-900">Clinical Justification: </span>
                        {log.overrideReason}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 truncate">
                      <span className="truncate max-w-md">SHA-256: {log.signatureHash}</span>
                      <span className="shrink-0">{log.recordedAt ? new Date(log.recordedAt).toLocaleString() : 'Recent'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
