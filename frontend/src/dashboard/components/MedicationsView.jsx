import React from 'react';
import {
  Pill,
  AlertTriangle
} from 'lucide-react';

export default function MedicationsView({ alert }) {
  const activeMedications = [
    {
      name: 'Norepinephrine Bitartrate',
      category: 'Vasopressor / Alpha-1 Adrenergic Inotrope',
      dose: '0.08 mcg/kg/min IV',
      route: 'Continuous Central Line Infusion',
      status: 'Active Titration',
      statusType: 'warning',
      lastAction: 'Titrated up from 0.05 at 14:10 to maintain target MAP >= 65 mmHg',
      notes: 'Bedside nurse currently titrating against dynamic arterial line feedback.'
    },
    {
      name: 'Vancomycin Hydrochloride',
      category: 'Glycopeptide Anti-infective',
      dose: '1.25g in 250mL D5W',
      route: 'Intravenous Infusion',
      status: 'Administered',
      statusType: 'success',
      lastAction: 'Infusion completed at 08:45. Trough level ordered for 18:00',
      notes: 'Empirical Gram-positive coverage for suspected sepsis focus.'
    },
    {
      name: 'Lactated Ringer’s Solution',
      category: 'Balanced Crystalloid Volume Resuscitation',
      dose: '1000 mL bolus',
      route: 'Intravenous Rapid Pressure Infuser',
      status: 'Completed',
      statusType: 'neutral',
      lastAction: 'Finished at 13:30 (30 mL/kg Sepsis-3 bundle target initiated)',
      notes: 'Initial fluid resuscitation completed; reassessing volume responsiveness.'
    },
    {
      name: 'Metoprolol Tartrate',
      category: 'Beta-1 Adrenergic Receptor Blocker',
      dose: '50mg oral tablet',
      route: 'Enteric Feeding Tube',
      status: 'Held by Protocol',
      statusType: 'critical',
      lastAction: 'Dose held at 12:00 due to MAP < 65 mmHg',
      notes: 'CRITICAL CONVOLUTION: Medication Agent confirmed held status to ensure tachycardia reflects genuine systemic inflammation.'
    }
  ];

  return (
    <div className="custom-scrollbar flex-1 h-full overflow-y-auto bg-slate-50/50 p-6 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-purple-50 border-[1.5px] border-purple-200 text-purple-600 flex items-center justify-center shadow-2xs shrink-0">
              <Pill className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Medications &amp; Pharmacotherapy</h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-500">
                <span>Active infusions, pharmacokinetic confounders &amp; schedule for</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border-[1.5px] border-slate-200 font-mono font-bold text-slate-800">
                  {alert.patientId}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border-[1.5px] border-emerald-200 font-mono font-bold text-emerald-800">
                  {alert.bed}
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs font-mono text-purple-800 bg-purple-50 border-[1.5px] border-purple-200 px-3.5 py-1.5 rounded-full font-bold shadow-2xs self-start sm:self-auto">
            Pharmacy Verified: 14:05
          </span>
        </div>

        {/* Pharmacological Confounder Alert Banner */}
        <div className="bg-amber-50/80 border-[1.5px] border-amber-200 rounded-3xl p-5 flex items-start gap-3.5 shadow-2xs">
          <span className="p-2 rounded-2xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div className="text-xs space-y-1.5">
            <div className="font-bold text-amber-950 text-sm">Medication Agent Confounder Notice: Beta-Blockade Interaction</div>
            <p className="text-amber-850 font-medium leading-relaxed">
              Metoprolol was appropriately <strong>held</strong> due to hypotension (MAP 65 mmHg). While chronic beta-blockade can bluntingly mask tachycardic alerts in sepsis, current heart rate of 118 bpm confirms active unmasked physiological decompensation.
            </p>
          </div>
        </div>

        {/* Medications List */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Active &amp; Scheduled ICU Orders</h2>

          <div className="grid grid-cols-1 gap-4">
            {activeMedications.map((med, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-3.5 shadow-xs hover:shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{med.name}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{med.category} • {med.route}</p>
                  </div>
                  <span className={`self-start sm:self-auto text-xs font-mono px-3 py-1 rounded-full border-[1.5px] font-bold shadow-2xs ${med.statusType === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      med.statusType === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        med.statusType === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                    {med.status.toUpperCase()}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border-[1.5px] border-slate-200 text-xs font-mono font-bold text-slate-900 flex items-center justify-between">
                  <span>Current Dose / Rate: {med.dose}</span>
                  <span className="text-slate-500 text-xs font-sans font-medium">Verified in MAR</span>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 font-medium">
                  <div className="text-[11px] font-mono text-slate-400 font-bold">Last Action &amp; Administration:</div>
                  <p className="leading-relaxed">{med.lastAction}</p>
                  <p className="text-xs text-slate-500 italic pt-1">{med.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
