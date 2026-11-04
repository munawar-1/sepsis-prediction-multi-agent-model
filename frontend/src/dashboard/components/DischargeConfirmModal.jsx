import React, { useState } from 'react';
import {
  LogOut,
  X,
  AlertTriangle,
  CheckCircle2,
  BedDouble,
  ShieldCheck,
  Loader2,
  Clock,
  FileText
} from 'lucide-react';
import { clinicalApi } from '../../services/api';

export default function DischargeConfirmModal({
  isOpen,
  onClose,
  patient,
  onDischargeSuccess
}) {
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen || !patient) return null;

  const patientId = patient.patientId || patient.id;
  const patientName = patient.patientName || patient.fullName || patientId;
  const bedNumber = patient.bedNumber || patient.icuBedNumber || patient.bed || 'ICU Bed';

  const handleConfirmDischarge = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await clinicalApi.dischargePatient(patientId, dischargeNotes);
      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`Patient ${patientName} (${patientId}) successfully discharged. Bed ${bedNumber} is now freed!`);
      
      if (onDischargeSuccess) {
        onDischargeSuccess(res.data);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Discharge request failed. Verify backend connectivity.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#0D1524] rounded-3xl border border-slate-200 dark:border-[#1E2D44] shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-[#F1F5FA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-[#1E2D44] flex items-center justify-between bg-slate-50/80 dark:bg-[#0A111E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/60 flex items-center justify-center shadow-sm">
              <LogOut className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F1F5FA] leading-tight">
                Discharge ICU Patient
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Release Bed &amp; Finalize Clinical Disposition
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#142036] transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmDischarge} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Patient Card Summary */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#142036] border border-slate-200/80 dark:border-[#1E2D44] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-[#F1F5FA]">{patientName}</span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-2">({patientId})</span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700/60">
                {bedNumber}
              </span>
            </div>
            {patient.admissionDiagnosis && (
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Diagnosis: <span className="italic">{patient.admissionDiagnosis}</span>
              </p>
            )}
          </div>

          {/* Clinical Safeguard Note */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-600/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Clinical Action Confirmation:</strong> Discharging this patient will immediately vacate <strong>{bedNumber}</strong>, making it available for new ICU admissions. Active telemetry polling and emergency sepsis email alerts will stop, while all historical vitals, labs, and orders remain permanently preserved in hospital EHR archives.
            </div>
          </div>

          {/* Disposition Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Discharge / Disposition Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Patient stabilized; transferred to Step-Down Telemetry Unit (Ward 4A). Lactate normalized to 1.1 mmol/L. Vasopressors successfully weaned."
              value={dischargeNotes}
              onChange={(e) => setDischargeNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-[#1E2D44] focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-900/40 transition bg-white dark:bg-[#080E18] text-slate-800 dark:text-[#F1F5FA] placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-[#1E2D44]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-[#1E2D44] bg-white dark:bg-[#142036] hover:bg-slate-50 dark:hover:bg-[#1B2B48] text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing Discharge...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 text-white" />
                  <span>Confirm Discharge &amp; Free Bed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
