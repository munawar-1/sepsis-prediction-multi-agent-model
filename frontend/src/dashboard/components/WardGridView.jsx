import React from 'react';
import {
  Activity,
  Heart,
  Gauge,
  Wind,
  Thermometer,
  Zap,
  FlaskConical,
  ChevronRight,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BedDouble
} from 'lucide-react';

export default function WardGridView({
  beds = [],
  selectedPatientId,
  onSelectPatient,
  onOpenConsultation,
  onOpenNurseEntry
}) {
  // Sort beds: occupied critical (RED) first, then moderate (YELLOW), then stable (GREEN), then unoccupied (GREY)
  const sortedBeds = [...beds].sort((a, b) => {
    const colorWeight = { RED: 4, YELLOW: 3, GREEN: 2, GREY: 1 };
    const isOccA = Boolean(a.occupied ?? a.isOccupied ?? a.patientId);
    const isOccB = Boolean(b.occupied ?? b.isOccupied ?? b.patientId);
    const weightA = isOccA ? (colorWeight[a.triageColor] || 2) : 0;
    const weightB = isOccB ? (colorWeight[b.triageColor] || 2) : 0;
    if (weightA !== weightB) return weightB - weightA;
    // secondary sort by risk desc
    const riskA = a.compositeRisk ?? a.compositeSepsisRisk ?? 0;
    const riskB = b.compositeRisk ?? b.compositeSepsisRisk ?? 0;
    return riskB - riskA;
  });

  // Display exactly 6 ICU bed cards (exclude Bed 07 and Bed 08 as required)
  const displayBeds = sortedBeds
    .filter(bed => {
      const bNum = String(bed.bedNumber || '').toUpperCase();
      return !bNum.includes('07') && !bNum.includes('08');
    })
    .slice(0, 6);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
      {displayBeds.map((bed) => {
        const isOccupied = Boolean(bed.occupied ?? bed.isOccupied ?? (bed.patientId && String(bed.patientId).trim().length > 0));
        const isSelected = selectedPatientId === bed.patientId;
        const color = bed.triageColor || 'GREY';

        const isRed = color === 'RED';
        const isYellow = color === 'YELLOW';
        const isGreen = color === 'GREEN';

        const riskVal = bed.compositeRisk ?? bed.compositeSepsisRisk ?? 0;
        const riskPct = Math.round(riskVal * 100);

        // Well-defined, clinically distinct borders and surfaces for each triage and vacant state
        let cardStyleClasses = '';
        if (!isOccupied) {
          cardStyleClasses = 'bg-[#F8FAFC] dark:bg-[#0A1220] border-slate-300 dark:border-[#223550] hover:border-slate-400 dark:hover:border-[#2E476B] text-slate-600 dark:text-slate-400 cursor-default';
        } else if (isSelected) {
          cardStyleClasses = 'bg-white dark:bg-[#0E1726] border-emerald-500 shadow-md ring-2 ring-emerald-500/20 cursor-pointer';
        } else if (isRed) {
          cardStyleClasses = 'bg-white dark:bg-[#0E1726] border-rose-400 dark:border-rose-500/60 hover:border-rose-500 dark:hover:border-rose-400 shadow-xs hover:shadow-sm cursor-pointer';
        } else if (isYellow) {
          cardStyleClasses = 'bg-white dark:bg-[#0E1726] border-amber-400 dark:border-amber-500/60 hover:border-amber-500 dark:hover:border-amber-400 shadow-xs hover:shadow-sm cursor-pointer';
        } else {
          cardStyleClasses = 'bg-white dark:bg-[#0E1726] border-emerald-400 dark:border-emerald-500/60 hover:border-emerald-500 dark:hover:border-emerald-400 shadow-xs hover:shadow-sm cursor-pointer';
        }

        return (
          <div
            key={bed.bedNumber}
            onClick={() => {
              if (isOccupied && onSelectPatient) {
                onSelectPatient(bed.patientId);
              }
            }}
            className={`group rounded-3xl p-4.5 border-[1.5px] transition-all duration-200 flex flex-col justify-between min-h-[225px] ${cardStyleClasses}`}
          >
            {/* Bed Header */}
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#182438]">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                    !isOccupied
                      ? 'bg-slate-100 dark:bg-[#121E32] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-[#223550]'
                      : isRed
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60'
                        : isYellow
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60'
                  }`}>
                    {bed.bedNumber.replace('ICU-BED-', 'B')}
                  </span>
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 block leading-tight">
                      {bed.bedNumber}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {isOccupied ? bed.patientId : 'Available'}
                    </span>
                  </div>
                </div>

                {isOccupied ? (
                  <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border tracking-wide uppercase ${
                    isRed
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/60 animate-pulse'
                      : isYellow
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60'
                  }`}>
                    {bed.urgencyLevel || (isRed ? 'CRITICAL' : isYellow ? 'MODERATE' : 'STABLE')}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#121E32] border border-slate-300 dark:border-[#223550] px-2.5 py-0.5 rounded-full font-bold">
                    Vacant
                  </span>
                )}
              </div>

              {/* Patient Info */}
              {isOccupied ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight line-clamp-1">
                        {bed.patientName || 'Patient Record'}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium truncate max-w-[190px]">
                        {bed.age ? `${bed.age}yo • ${bed.gender || 'M'}` : 'ICU Admission'}
                      </p>
                    </div>

                    {/* Risk Badge */}
                    <div className="text-right shrink-0">
                      <div className={`text-base font-black font-mono leading-none ${
                        bed.aiEvaluated === false
                          ? 'text-sky-600 dark:text-sky-400 text-xs'
                          : (isRed ? 'text-rose-600 dark:text-rose-400' : isYellow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')
                      }`}>
                        {bed.aiEvaluated === false ? 'Awaiting Feed' : `${riskPct}%`}
                      </div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider">
                        {bed.aiEvaluated === false ? 'Static Baseline' : 'Sepsis Risk'}
                      </span>
                    </div>
                  </div>

                  {/* Vitals Strip */}
                  <div className="bg-slate-50 dark:bg-[#070D18] rounded-2xl p-2.5 border border-slate-200 dark:border-[#1A2840] grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                    <div className="flex flex-col">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">HR</span>
                      {(() => {
                        const hr = bed.latestHeartRate ?? bed.heartRate;
                        return (
                          <span className={`font-bold ${hr > 100 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {hr ? `${Math.round(hr)} bpm` : '—'}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">BP / MAP</span>
                      {(() => {
                        const mapVal = bed.latestMap ?? bed.meanArterialPressure;
                        const bpStr = bed.bloodPressure || (bed.latestSystolicBp ? `${Math.round(bed.latestSystolicBp)}/${Math.round(bed.latestDiastolicBp || 70)}` : '—');
                        return (
                          <span className={`font-bold ${mapVal && mapVal < 65 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {bpStr}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Lactate</span>
                      {(() => {
                        const lac = bed.latestLactate ?? bed.lactate;
                        return (
                          <span className={`font-bold ${lac > 2.0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {lac != null ? `${Number(lac).toFixed(1)} mM` : '—'}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Primary Diagnosis */}
                  {(bed.primaryDiagnosis || bed.admissionDiagnosis) && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 italic font-medium pt-0.5">
                      {bed.primaryDiagnosis || bed.admissionDiagnosis}
                    </p>
                  )}
                </div>
              ) : (
                <div className="my-auto py-7 text-center text-slate-500 dark:text-slate-400">
                  <BedDouble className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400 dark:text-slate-500" />
                  <span className="text-xs font-semibold block text-slate-700 dark:text-slate-300">Bed Ready for Admission</span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 block">Telemetry Offline • Standby</span>
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            {isOccupied ? (
              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#182438] flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Live Stream
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Telemetry
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            ) : (
              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#182438] flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500">
                <span>ICU Standby</span>
                <span>Unallocated</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
