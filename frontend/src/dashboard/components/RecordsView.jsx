import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Stethoscope,
  User,
  Calendar,
  Pill,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { clinicalApi } from '../../services/api';

export default function RecordsView({ alert = {} }) {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!alert?.patientId) return;
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [profRes, histRes] = await Promise.all([
          clinicalApi.fetchPatientProfile(alert.patientId),
          clinicalApi.fetchPatientHistory(alert.patientId)
        ]);
        if (isMounted) {
          if (profRes.data) setProfile(profRes.data);
          if (histRes.data) setHistory(histRes.data);
        }
      } catch (e) {
        console.warn('Failed to load patient records:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [alert?.patientId]);

  const p = profile || {};
  const timeline = history?.timeline || [];

  return (
    <div className="custom-scrollbar flex-1 h-full overflow-y-auto bg-slate-50/50 p-6 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 border-[1.5px] border-emerald-200 text-emerald-600 flex items-center justify-center shadow-2xs shrink-0">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Electronic Patient Record &amp; Flowsheet</h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-500">
                <span>Direct Spring Boot electronic health record for</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border-[1.5px] border-slate-200 font-mono font-bold text-slate-800">
                  {alert?.patientId || "PT-1004"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border-[1.5px] border-emerald-200 font-mono font-bold text-emerald-800">
                  {alert?.bed || "ICU-BED-04"}
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-white border-[1.5px] border-slate-200 text-slate-700 font-bold shadow-2xs self-start sm:self-auto">
            MRN: {p.mrn || 'MRN-2026-9042'}
          </span>
        </div>

        {/* Patient Demographic Card */}
        <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-xs">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Full Name</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {p.fullName || alert.patientName || 'Vikram Mehta'}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Age / Gender</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {p.age || alert.age || 68} yo • {p.gender || alert.gender || 'MALE'}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Assigned Bed</span>
            <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
              {p.icuBedNumber || alert.bed} • MICU Ward 3B
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Care Team</span>
            <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
              {p.attendingDoctorName || 'Dr. Sharma'} (MD) / {p.primaryNurseName || 'Nurse Priya'} (RN)
            </div>
          </div>
        </div>

        {/* Clinical History & Admission Reason */}
        <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-3.5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            Admission Diagnosis &amp; Clinical Notes
          </h2>
          <div className="text-xs text-slate-600 leading-relaxed space-y-2.5">
            <p className="p-3.5 rounded-2xl bg-slate-50 border-[1.5px] border-slate-200 font-semibold text-slate-800">
              Primary Diagnosis: {p.primaryDiagnosis || alert.admissionDiagnosis || 'Acute Respiratory Failure secondary to Severe Pneumonia'}
            </p>
            <p className="font-medium text-slate-600">
              {p.clinicalNotes || 'Admitted to ICU bed. Serial vitals and arterial line telemetry monitored continuously. Multi-agent early sepsis surveillance active.'}
            </p>
          </div>
        </div>

        {/* Active Medications List */}
        {p.activeMedications && p.activeMedications.length > 0 && (
          <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-600" />
              Recorded Active Medications &amp; Infusions
            </h2>
            <div className="flex flex-wrap gap-2">
              {p.activeMedications.map((med, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs"
                >
                  {med}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hourly Clinical Flowsheet Table */}
        <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Longitudinal Hourly Clinical Flowsheet
            </h2>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              {timeline.length} Hourly Observations
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border-[1.5px] border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b-[1.5px] border-slate-200 text-slate-500 font-bold bg-slate-50">
                  <th className="py-3 px-3.5">Hour</th>
                  <th className="py-3 px-3.5">HR (bpm)</th>
                  <th className="py-3 px-3.5">NIBP (mmHg)</th>
                  <th className="py-3 px-3.5">MAP</th>
                  <th className="py-3 px-3.5">RR (/min)</th>
                  <th className="py-3 px-3.5">Temp (°C)</th>
                  <th className="py-3 px-3.5">SpO2</th>
                  <th className="py-3 px-3.5">Lactate</th>
                  <th className="py-3 px-3.5 text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y-[1.5px] divide-slate-100 text-slate-700">
                {timeline.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-6 text-center text-slate-400">
                      Loading electronic flowsheet entries...
                    </td>
                  </tr>
                ) : (
                  timeline.map((row) => (
                    <tr key={row.hourIndex} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3.5 font-bold text-slate-900">Hour {row.hourIndex}</td>
                      <td className="py-3 px-3.5 font-semibold">{row.heartRate ? Math.round(row.heartRate) : '—'}</td>
                      <td className="py-3 px-3.5">{row.systolicBp ? `${Math.round(row.systolicBp)}/${Math.round(row.diastolicBp || 70)}` : '—'}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">{row.meanArterialPressure ? Math.round(row.meanArterialPressure) : '—'}</td>
                      <td className="py-3 px-3.5">{row.respiratoryRate ? Math.round(row.respiratoryRate) : '—'}</td>
                      <td className="py-3 px-3.5">{row.temperature ? row.temperature.toFixed(1) : '—'}</td>
                      <td className="py-3 px-3.5">{row.o2Saturation ? `${Math.round(row.o2Saturation)}%` : '—'}</td>
                      <td className="py-3 px-3.5 font-bold">{row.lactate != null ? `${row.lactate.toFixed(1)} mM` : '—'}</td>
                      <td className="py-3 px-3.5 text-right font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                          row.compositeSepsisRisk >= 0.70 ? 'bg-rose-50 text-rose-700 border-rose-300' :
                          row.compositeSepsisRisk >= 0.35 ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}>
                          {Math.round(row.compositeSepsisRisk * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
