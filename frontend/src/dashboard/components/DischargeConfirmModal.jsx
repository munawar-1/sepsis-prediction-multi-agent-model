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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 via-white to-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shadow-2xs">
              <LogOut className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Discharge ICU Patient
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Release Bed &amp; Finalize Clinical Disposition
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmDischarge} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in slide-in-from-top-1">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in slide-in-from-top-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Patient Card Summary */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900">{patientName}</span>
                <span className="text-xs font-mono text-slate-500 ml-2">({patientId})</span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {bedNumber}
              </span>
            </div>
            {patient.admissionDiagnosis && (
              <p className="text-xs text-slate-600 font-medium">
                Diagnosis: <span className="italic">{patient.admissionDiagnosis}</span>
              </p>
            )}
          </div>

          {/* Clinical Safeguard Note */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Clinical Action Confirmation:</strong> Discharging this patient will immediately vacate <strong>{bedNumber}</strong>, making it available for new ICU admissions. Active telemetry polling and emergency sepsis email alerts will stop, while all historical vitals, labs, and orders remain permanently preserved in hospital EHR archives.
            </div>
          </div>

          {/* Disposition Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Discharge / Disposition Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Patient stabilized; transferred to Step-Down Telemetry Unit (Ward 4A). Lactate normalized to 1.1 mmol/L. Vasopressors successfully weaned."
              value={dischargeNotes}
              onChange={(e) => setDischargeNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-slate-50/50 focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
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
