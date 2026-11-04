import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  X,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Loader2,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { clinicalApi } from '../../services/api';

export default function ReassignDoctorModal({
  isOpen,
  onClose,
  patient,
  onDoctorReassigned
}) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const patientId = patient?.patientId || patient?.id;
  const patientName = patient?.patientName || patient?.fullName || patientId;
  const currentDoctorName = patient?.attendingDoctor?.fullName || patient?.attendingDoctorName || 'Dr. Mohammad Munawar, MD';

  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const loadDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        const res = await clinicalApi.fetchRegisteredDoctors();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setDoctors(res.data);
          // Set current or first doctor
          if (patient?.attendingDoctor?.id) {
            setSelectedDoctorId(String(patient.attendingDoctor.id));
          } else {
            setSelectedDoctorId(String(res.data[0].id));
          }
        } else {
          setErrorMsg('No registered doctors found in the database.');
        }
      } catch (err) {
        setErrorMsg('Failed to load registered doctors list.');
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setErrorMsg('Please select a doctor to assign.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const docIdNum = parseInt(selectedDoctorId, 10);
      const res = await clinicalApi.reassignDoctor(patientId, docIdNum);
      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      const assignedDoc = res.data?.attendingDoctor || doctors.find(d => String(d.id) === String(selectedDoctorId));
      setSuccessMsg(`Attending Doctor successfully updated to Dr. ${assignedDoc?.fullName || 'Assigned Doctor'}!`);

      if (onDoctorReassigned) {
        onDoctorReassigned(res.data);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reassign doctor.');
      setIsSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find(d => String(d.id) === String(selectedDoctorId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-white dark:bg-[#0D1524] rounded-3xl border border-slate-200 dark:border-[#1E2D44] shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-[#F1F5FA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-[#1E2D44] flex items-center justify-between bg-slate-50/80 dark:bg-[#0A111E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700/60 flex items-center justify-center shadow-sm">
              <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F1F5FA] leading-tight">
                Assign Attending Doctor
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {patientName} ({patientId})
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
        <form onSubmit={handleReassign} className="p-6 space-y-4">
          
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

          {/* Current Assignment */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#142036] border border-slate-200/80 dark:border-[#1E2D44] text-xs space-y-1">
            <div className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500">
              Current Attending Physician
            </div>
            <div className="font-semibold text-slate-800 dark:text-[#F1F5FA] text-sm">
              {currentDoctorName}
            </div>
          </div>

          {/* Select New Attending Doctor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Select New Attending Doctor</span>
              {isLoadingDoctors && <Loader2 className="w-3 h-3 animate-spin text-teal-600 dark:text-teal-400" />}
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              disabled={isLoadingDoctors || doctors.length === 0}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-[#1E2D44] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/40 transition bg-white dark:bg-[#080E18] text-slate-800 dark:text-[#F1F5FA] font-medium"
            >
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id} className="bg-white dark:bg-[#0D1524] text-slate-800 dark:text-[#F1F5FA]">
                  {doc.fullName || doc.username} — {doc.specialty || doc.department || 'Attending'} ({doc.email}) [{doc.shiftStatus || 'ON_DUTY'}]
                </option>
              ))}
            </select>

            {/* Doctor Info Card */}
            {selectedDoctor && (
              <div className="mt-3 p-3 rounded-2xl bg-teal-50/80 dark:bg-[#142036] border border-teal-200/80 dark:border-[#1E2D44] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-[#F1F5FA]">
                    {selectedDoctor.fullName || selectedDoctor.username}
                  </div>
                  <div className="text-[11px] font-mono text-teal-800 dark:text-teal-300 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />
                    {selectedDoctor.email}
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600/40">
                  {selectedDoctor.shiftStatus || 'ON_DUTY'}
                </span>
              </div>
            )}
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
              Future Emergency Sepsis Alerts for this patient will be automatically routed to this doctor.
            </p>
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
              disabled={isSubmitting || isLoadingDoctors || !selectedDoctorId}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-white" />
                  <span>Update Attending Doctor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
