import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Stethoscope
} from 'lucide-react';

export default function RecordsView({ alert }) {
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
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Records &amp; Flowsheet</h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-500">
                <span>Electronic medical record &amp; admission summary for</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border-[1.5px] border-slate-200 font-mono font-bold text-slate-800">
                  {alert.patientId}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border-[1.5px] border-emerald-200 font-mono font-bold text-emerald-800">
                  {alert.bed}
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-white border-[1.5px] border-slate-200 text-slate-700 font-bold shadow-2xs self-start sm:self-auto">
            EHR ID: EHR-2026-9042A
          </span>
        </div>

        {/* Patient Demographic Card */}
        <div
          className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-xs"
        >
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Patient ID</span>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{alert.patientId}</div>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Age / Gender</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{alert.age || 68} yo • {alert.gender || 'Male'}</div>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400">ICU Location</span>
            <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">{alert.bed} • MICU Ward 3B</div>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400">ICU Length of Stay</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">Day {alert.icuDay || 3} of Admission</div>
          </div>
        </div>

        {/* Clinical History & Admission Reason */}
        <div
          className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-3.5 shadow-xs"
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            Admission Diagnosis &amp; Clinical Course
          </h2>
          <div className="text-xs text-slate-600 leading-relaxed space-y-2.5">
            <p className="p-3.5 rounded-2xl bg-slate-50 border-[1.5px] border-slate-200 font-semibold text-slate-800">
              Primary Diagnosis: {alert.admissionDiagnosis || 'Acute Hypoxemic Respiratory Failure secondary to Community-Acquired Pneumonia with Septic Surveillance'}
            </p>
            <p className="font-medium text-slate-600">
              Patient was transferred from Emergency Department 72 hours ago. Intubation avoided via High-Flow Nasal Cannula (HFNC). Developed worsening tachypnea and tachycardia over the past 4 hours. Laboratory studies confirm acute worsening of metabolic acidemia and rising serum lactate.
            </p>
          </div>
        </div>

        {/* Clinical Flowsheet Highlights */}
        <div
          className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-4 shadow-xs"
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Hourly Clinical Flowsheet Summary
          </h2>

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
                </tr>
              </thead>
              <tbody className="divide-y-[1.5px] divide-slate-100 text-slate-700">
                <tr className="bg-rose-50/70 font-bold text-rose-700">
                  <td className="py-3 px-3.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Now (T-0)
                  </td>
                  <td className="py-3 px-3.5">118</td>
                  <td className="py-3 px-3.5">88/54</td>
                  <td className="py-3 px-3.5">65</td>
                  <td className="py-3 px-3.5">26</td>
                  <td className="py-3 px-3.5">38.9</td>
                  <td className="py-3 px-3.5">92%</td>
                  <td className="py-3 px-3.5">3.8</td>
                </tr>
                <tr className="hover:bg-slate-50/60 font-medium">
                  <td className="py-3 px-3.5 text-slate-400 font-semibold">T-1h</td>
                  <td className="py-3 px-3.5">107</td>
                  <td className="py-3 px-3.5">94/58</td>
                  <td className="py-3 px-3.5">70</td>
                  <td className="py-3 px-3.5">24</td>
                  <td className="py-3 px-3.5">38.4</td>
                  <td className="py-3 px-3.5">93%</td>
                  <td className="py-3 px-3.5">3.2</td>
                </tr>
                <tr className="hover:bg-slate-50/60 font-medium">
                  <td className="py-3 px-3.5 text-slate-400 font-semibold">T-2h</td>
                  <td className="py-3 px-3.5">96</td>
                  <td className="py-3 px-3.5">102/64</td>
                  <td className="py-3 px-3.5">76</td>
                  <td className="py-3 px-3.5">22</td>
                  <td className="py-3 px-3.5">37.8</td>
                  <td className="py-3 px-3.5">95%</td>
                  <td className="py-3 px-3.5">2.6</td>
                </tr>
                <tr className="hover:bg-slate-50/60 font-medium">
                  <td className="py-3 px-3.5 text-slate-400 font-semibold">T-4h</td>
                  <td className="py-3 px-3.5">84</td>
                  <td className="py-3 px-3.5">112/68</td>
                  <td className="py-3 px-3.5">82</td>
                  <td className="py-3 px-3.5">18</td>
                  <td className="py-3 px-3.5">37.1</td>
                  <td className="py-3 px-3.5">96%</td>
                  <td className="py-3 px-3.5">1.9</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
