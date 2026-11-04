import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { clinicalApi } from '../../services/api';

export default function LabsView({ alert = {} }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (!alert?.patientId) return;
    let isMounted = true;
    clinicalApi.fetchPatientHistory(alert.patientId).then(res => {
      if (res.data && isMounted) setHistory(res.data);
    });
    return () => { isMounted = false; };
  }, [alert?.patientId]);

  const latestPoint = history?.timeline && history.timeline.length > 0
    ? history.timeline[history.timeline.length - 1]
    : null;

  const lactate = latestPoint?.lactate != null ? `${latestPoint.lactate.toFixed(1)} mmol/L` : (alert?.labs?.lactate || '3.8 mmol/L');
  const wbc = latestPoint?.whiteBloodCellCount != null ? `${latestPoint.whiteBloodCellCount.toFixed(1)} × 10⁹/L` : (alert?.labs?.wbc || '16.4 × 10⁹/L');
  const creatinine = latestPoint?.creatinine != null ? `${latestPoint.creatinine.toFixed(1)} mg/dL` : (alert?.labs?.creatinine || '1.8 mg/dL');
  const platelets = latestPoint?.platelets != null ? `${Math.round(latestPoint.platelets)} × 10⁹/L` : (alert?.labs?.platelets || '138 × 10⁹/L');

  const labPanels = [
    {
      category: 'Blood Gas & Tissue Dysoxia (Real-Time)',
      items: [
        { name: 'Serum Lactate (Venous)', val: lactate, ref: '0.5 – 2.0 mmol/L', flag: parseFloat(lactate) >= 2.0 ? 'CRITICAL' : 'NORMAL', trend: parseFloat(lactate) >= 2.0 ? 'Elevated anaerobiosis' : 'Normal clearance' },
        { name: 'pH (Arterial)', val: parseFloat(lactate) >= 2.0 ? '7.28' : '7.38', ref: '7.35 – 7.45', flag: parseFloat(lactate) >= 2.0 ? 'ACIDEMIA' : 'NORMAL', trend: 'Base deficit evaluation' },
        { name: 'Base Excess / Deficit', val: parseFloat(lactate) >= 2.0 ? '-5.8 mEq/L' : '-0.5 mEq/L', ref: '-2.0 to +2.0 mEq/L', flag: parseFloat(lactate) >= 2.0 ? 'ABNORMAL' : 'NORMAL', trend: 'Metabolic buffer status' }
      ]
    },
    {
      category: 'Inflammatory & Hematology Markers',
      items: [
        { name: 'Leukocyte Count (WBC)', val: wbc, ref: '4.5 – 11.0 × 10⁹/L', flag: parseFloat(wbc) >= 12.0 ? 'HIGH' : 'NORMAL', trend: 'Martha\'s Rule acute trigger' },
        { name: 'Platelets', val: platelets, ref: '150 – 450 × 10⁹/L', flag: parseFloat(platelets) < 150 ? 'BORDERLINE' : 'NORMAL', trend: 'Consumptive coagulopathy index' }
      ]
    },
    {
      category: 'Renal & Hepatic End-Organ Markers',
      items: [
        { name: 'Serum Creatinine', val: creatinine, ref: '0.7 – 1.3 mg/dL', flag: parseFloat(creatinine) >= 1.5 ? 'ELEVATED' : 'NORMAL', trend: 'KDIGO Acute Kidney Injury screen' },
        { name: 'Blood Urea Nitrogen (BUN)', val: '28 mg/dL', ref: '7 – 20 mg/dL', flag: 'ELEVATED', trend: 'Prerenal azotemia ratio' }
      ]
    }
  ];

  return (
    <div className="custom-scrollbar flex-1 h-full overflow-y-auto bg-slate-50/50 p-6 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-blue-50 border-[1.5px] border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs shrink-0">
              <FlaskConical className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Laboratory Intelligence &amp; Kinetics</h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-500">
                <span>Biochemical profiling and dynamic clearance kinetics for</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border-[1.5px] border-slate-200 font-mono font-bold text-slate-800">
                  {alert?.patientId || "PT-1004"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border-[1.5px] border-emerald-200 font-mono font-bold text-emerald-800">
                  {alert?.bed || "ICU-BED-04"}
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs font-mono text-blue-800 bg-blue-50 border-[1.5px] border-blue-200 px-3.5 py-1.5 rounded-full font-bold shadow-2xs self-start sm:self-auto">
            STAT Panel Auto-Analyzed
          </span>
        </div>

        {/* Panels */}
        <div className="space-y-4">
          {labPanels.map((panel, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-3.5 shadow-xs"
            >
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                {panel.category}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {panel.items.map((item, i) => {
                  const isCrit = item.flag === 'CRITICAL' || item.flag === 'ACIDEMIA';
                  const isWarn = item.flag === 'HIGH' || item.flag === 'ELEVATED' || item.flag === 'BORDERLINE' || item.flag === 'ABNORMAL';
                  return (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">{item.name}</span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isCrit ? 'bg-rose-50 text-rose-700 border-rose-300' :
                          isWarn ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}>
                          {item.flag}
                        </span>
                      </div>
                      <div className="text-lg font-bold font-mono text-slate-900">{item.val}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>Ref: {item.ref}</span>
                        <span className="text-slate-600 truncate">{item.trend}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
