import React from 'react';
import {
  FlaskConical
} from 'lucide-react';

export default function LabsView({ alert }) {
  const labPanels = [
    {
      category: 'Blood Gas & Metabolic Dysoxia',
      items: [
        { name: 'Serum Lactate (Venous)', val: alert.labs?.lactate || '3.8 mmol/L', ref: '0.5 – 2.0 mmol/L', flag: 'CRITICAL', trend: '+0.42 mmol/L/hr accumulation' },
        { name: 'pH (Arterial)', val: '7.28', ref: '7.35 – 7.45', flag: 'ACIDEMIA', trend: 'Worsening uncompensated' },
        { name: 'Base Excess / Deficit', val: '-5.8 mEq/L', ref: '-2.0 to +2.0 mEq/L', flag: 'ABNORMAL', trend: 'Progressive metabolic debt' },
        { name: 'Bicarbonate (HCO3)', val: '18 mEq/L', ref: '22 – 28 mEq/L', flag: 'LOW', trend: 'Buffer reserve consumption' }
      ]
    },
    {
      category: 'Inflammatory & Hematology Markers',
      items: [
        { name: 'Leukocyte Count (WBC)', val: alert.labs?.wbc || '16.4 × 10⁹/L', ref: '4.5 – 11.0 × 10⁹/L', flag: 'HIGH', trend: 'Left shift with 14% bands' },
        { name: 'Platelets', val: alert.labs?.platelets || '138 × 10⁹/L', ref: '150 – 450 × 10⁹/L', flag: 'BORDERLINE', trend: 'Consumptive delta (-22k/24h)' },
        { name: 'Procalcitonin (PCT)', val: '4.8 ng/mL', ref: '< 0.5 ng/mL', flag: 'CRITICAL', trend: 'High likelihood of bacterial sepsis' },
        { name: 'C-Reactive Protein (CRP)', val: '142 mg/L', ref: '< 10 mg/L', flag: 'ELEVATED', trend: 'Acute-phase reactant surge' }
      ]
    },
    {
      category: 'Renal & Hepatic End-Organ Markers',
      items: [
        { name: 'Serum Creatinine', val: alert.labs?.creatinine || '1.8 mg/dL', ref: '0.7 – 1.3 mg/dL', flag: 'ELEVATED', trend: 'Doubled from baseline (KDIGO 2)' },
        { name: 'Blood Urea Nitrogen (BUN)', val: '38 mg/dL', ref: '7 – 20 mg/dL', flag: 'HIGH', trend: 'Prerenal azotemia pattern' },
        { name: 'Total Bilirubin', val: '1.4 mg/dL', ref: '0.2 – 1.2 mg/dL', flag: 'NORMAL', trend: 'Preserved hepatic clearance' },
        { name: 'Estimated GFR', val: '41 mL/min/1.73m²', ref: '> 90 mL/min', flag: 'LOW', trend: 'Acute filtration decline' }
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
                <span>Automated biochemical profiling and trend analysis for</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border-[1.5px] border-slate-200 font-mono font-bold text-slate-800">
                  {alert.patientId}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border-[1.5px] border-emerald-200 font-mono font-bold text-emerald-800">
                  {alert.bed}
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs font-mono text-blue-800 bg-blue-50 border-[1.5px] border-blue-200 px-3.5 py-1.5 rounded-full font-bold shadow-2xs self-start sm:self-auto">
            Last Lab Draw: 42 mins ago
          </span>
        </div>

        {/* Highlighted Sepsis Biomarker Card */}
        <div
          className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-3.5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Primary Sepsis Biomarkers</h2>
            <span className="text-xs font-mono text-rose-700 bg-rose-50 border-[1.5px] border-rose-200 px-3 py-0.5 rounded-full font-bold">
              Critical Alert Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-rose-50/70 border-[1.5px] border-rose-200 shadow-2xs">
              <div className="text-[10px] font-mono text-rose-600 uppercase font-bold">Lactate (Anaerobic Dysoxia)</div>
              <div className="text-2xl font-black font-mono text-rose-700 mt-1">3.8 mmol/L</div>
              <div className="text-xs font-medium text-rose-800/90 mt-1">Ref: 0.5–2.0 • Negative clearance</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border-[1.5px] border-amber-200 shadow-2xs">
              <div className="text-[10px] font-mono text-amber-600 uppercase font-bold">Leukocytes (WBC Response)</div>
              <div className="text-2xl font-black font-mono text-amber-700 mt-1">16.4 × 10⁹/L</div>
              <div className="text-xs font-medium text-amber-800/90 mt-1">Ref: 4.5–11.0 • 14% Immature bands</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border-[1.5px] border-amber-200 shadow-2xs">
              <div className="text-[10px] font-mono text-amber-600 uppercase font-bold">Renal Function (Creatinine)</div>
              <div className="text-2xl font-black font-mono text-amber-700 mt-1">1.8 mg/dL</div>
              <div className="text-xs font-medium text-amber-800/90 mt-1">Ref: 0.7–1.3 • KDIGO Stage 2 AKI</div>
            </div>
          </div>
        </div>

        {/* Detailed Panels */}
        <div className="space-y-4">
          {labPanels.map((panel, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-3.5 shadow-xs"
            >
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">{panel.category}</h3>
              <div className="overflow-x-auto rounded-2xl border-[1.5px] border-slate-200">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b-[1.5px] border-slate-200 text-slate-500 font-bold bg-slate-50">
                      <th className="py-3 px-3.5">Analyte</th>
                      <th className="py-3 px-3.5">Observed Value</th>
                      <th className="py-3 px-3.5">Reference Range</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5">Trend / Clinical Velocity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-[1.5px] divide-slate-100">
                    {panel.items.map((item, itemIdx) => (
                      <tr key={itemIdx} className="hover:bg-slate-50/60 font-medium">
                        <td className="py-3 px-3.5 font-bold text-slate-900 font-sans">{item.name}</td>
                        <td className="py-3 px-3.5 font-black text-slate-900">{item.val}</td>
                        <td className="py-3 px-3.5 text-slate-500">{item.ref}</td>
                        <td className="py-3 px-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border-[1.5px] tracking-wide ${
                            item.flag === 'CRITICAL' || item.flag === 'ACIDEMIA'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : item.flag === 'HIGH' || item.flag === 'ELEVATED' || item.flag === 'ABNORMAL' || item.flag === 'LOW'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {item.flag}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 font-sans text-xs">{item.trend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
