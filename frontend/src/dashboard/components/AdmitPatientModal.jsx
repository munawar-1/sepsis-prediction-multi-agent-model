import React, { useState } from 'react';
import {
  UserPlus,
  X,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Bed,
  Stethoscope,
  Pill,
  FileText
} from 'lucide-react';
import { clinicalApi } from '../../services/api';

export default function AdmitPatientModal({
  isOpen,
  onClose,
  beds = [],
  onPatientAdmitted
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('MALE');
  const [icuBedNumber, setIcuBedNumber] = useState(() => {
    const emptyBed = beds.find(b => b.status === 'AVAILABLE' || b.status === 'EMPTY' || b.triageColor === 'GREY');
    return emptyBed ? emptyBed.bedNumber : 'ICU-BED-05';
  });
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [medications, setMedications] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim() || !age || !primaryDiagnosis.trim()) {
      setErrorMsg('Please fill in all mandatory fields (Name, Age, Bed, Diagnosis).');
      return;
    }

    setIsSubmitting(true);
    try {
      const medsArray = medications
        ? medications.split(',').map(m => m.trim()).filter(Boolean)
        : [];

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: parseInt(age, 10),
        gender,
        icuBedNumber,
        primaryDiagnosis: primaryDiagnosis.trim(),
        activeMedications: medsArray,
        clinicalNotes: clinicalNotes.trim()
      };

      const res = await clinicalApi.admitPatient(payload);
      if (res.data) {
        if (onPatientAdmitted) {
          onPatientAdmitted(res.data);
        }
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to admit patient into ICU bed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Admission failed. Check Spring Boot backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border-[1.5px] border-emerald-300 flex items-center justify-center text-emerald-700 shadow-2xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Admit Patient to ICU Bed</h2>
              <p className="text-[11px] text-slate-500 font-medium">Bedside Nursing / Attending Physician Bed Admission</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Eleanor"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Vance"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Age *</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="68"
                min="0"
                max="120"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Target ICU Bed *</label>
              <select
                value={icuBedNumber}
                onChange={(e) => setIcuBedNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
              >
                {['ICU-BED-01', 'ICU-BED-02', 'ICU-BED-03', 'ICU-BED-04', 'ICU-BED-05', 'ICU-BED-06', 'ICU-BED-07', 'ICU-BED-08'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Admission Diagnosis *</label>
            <input
              type="text"
              value={primaryDiagnosis}
              onChange={(e) => setPrimaryDiagnosis(e.target.value)}
              placeholder="e.g. Severe Urosepsis / Septic Shock Risk"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Active Medications (Comma-separated)</label>
            <input
              type="text"
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="e.g. Ceftriaxone 1g IV, Norepinephrine 0.04 mcg/kg/min"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Admission Clinical Notes</label>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Admitted from Emergency Dept with acute tachypnea, fever, and altered perfusion."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Admitting...' : 'Confirm Admission'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
