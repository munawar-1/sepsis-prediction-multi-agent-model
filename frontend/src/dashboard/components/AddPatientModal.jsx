import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  X,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  BedDouble,
  ShieldAlert,
  Sparkles,
  Loader2,
  FileText,
  Pill,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clinicalApi } from '../../services/api';

const ALL_ICU_BEDS = [
  'ICU-BED-01',
  'ICU-BED-02',
  'ICU-BED-03',
  'ICU-BED-04',
  'ICU-BED-05',
  'ICU-BED-06',
  'ICU-BED-07',
  'ICU-BED-08'
];

export default function AddPatientModal({
  isOpen,
  onClose,
  beds = [],
  initialBedNumber = null,
  onPatientAdmitted
}) {
  const { user, isNurse } = useAuth();

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('MALE');
  const [patientId, setPatientId] = useState('');
  const [mrn, setMrn] = useState('');
  const [icuBedNumber, setIcuBedNumber] = useState('');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [attendingDoctorId, setAttendingDoctorId] = useState('');
  const [medicationsInput, setMedicationsInput] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Doctor List & Async States
  const [doctors, setDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Identify occupied beds
  const occupiedBedMap = React.useMemo(() => {
    const map = {};
    beds.forEach(b => {
      const isOcc = Boolean(b.occupied ?? b.isOccupied ?? (b.patientId && String(b.patientId).trim().length > 0));
      if (isOcc && b.bedNumber) {
        map[b.bedNumber.toUpperCase()] = b;
      }
    });
    return map;
  }, [beds]);

  // Load available registered doctors whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Pick first available vacant bed by default, or initialBedNumber
    if (initialBedNumber) {
      setIcuBedNumber(initialBedNumber.toUpperCase());
    } else {
      const firstVacant = ALL_ICU_BEDS.find(b => !occupiedBedMap[b]);
      if (firstVacant) {
        setIcuBedNumber(firstVacant);
      }
    }

    // Fetch registered doctors
    const loadDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        const res = await clinicalApi.fetchRegisteredDoctors();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setDoctors(res.data);
          // Set first doctor as default if none selected
          setAttendingDoctorId(prev => prev || String(res.data[0].id));
        } else {
          setErrorMsg('No registered doctors found in the database. Please verify system users.');
        }
      } catch (err) {
        setErrorMsg('Failed to load registered doctors list from server.');
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, [isOpen, initialBedNumber, occupiedBedMap]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Required Field Validations
    if (!firstName.trim()) {
      setErrorMsg('Patient first name is required.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMsg('Patient last name is required.');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 0 || ageNum > 125) {
      setErrorMsg('Please enter a valid patient age (1 - 125).');
      return;
    }
    if (!icuBedNumber) {
      setErrorMsg('Please select an ICU bed.');
      return;
    }
    if (occupiedBedMap[icuBedNumber.toUpperCase()]) {
      const occ = occupiedBedMap[icuBedNumber.toUpperCase()];
      setErrorMsg(`Bed ${icuBedNumber} is already occupied by ${occ.patientName || occ.patientId}. Please choose a vacant bed.`);
      return;
    }
    if (!primaryDiagnosis.trim()) {
      setErrorMsg('Primary admission diagnosis is required.');
      return;
    }
    if (!attendingDoctorId) {
      setErrorMsg('Please assign an attending physician from the registered doctor directory.');
      return;
    }

    // Parse active medications
    const activeMedications = medicationsInput
      .split(/[\n,;]+/)
      .map(m => m.trim())
      .filter(m => m.length > 0);

    const admitPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: ageNum,
      gender,
      patientId: patientId.trim() || null,
      mrn: mrn.trim() || null,
      icuBedNumber: icuBedNumber.toUpperCase(),
      primaryDiagnosis: primaryDiagnosis.trim(),
      attendingDoctorId: parseInt(attendingDoctorId, 10),
      activeMedications,
      clinicalNotes: clinicalNotes.trim() || `Admitted to ${icuBedNumber} via Nurse Portal by ${user?.fullName || 'Bedside Nurse'}`
    };

    setIsSubmitting(true);
    try {
      const res = await clinicalApi.admitPatient(admitPayload);
      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`Patient ${res.data?.fullName || firstName + ' ' + lastName} (${res.data?.patientId || 'ID Assigned'}) successfully admitted to ${icuBedNumber}!`);
      
      if (onPatientAdmitted) {
        onPatientAdmitted(res.data);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Admission failed. Verify Spring Boot connection.');
      setIsSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find(d => String(d.id) === String(attendingDoctorId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/50 via-white to-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shadow-2xs">
              <UserPlus className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">
                Admit New ICU Patient
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Nurse Bedside Registration &amp; Attending Physician Assignment
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

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-slate-700">
          
          {/* Alerts / Feedback */}
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

          {/* Section 1: Demographics */}
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-800 mb-2.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              1. Patient Demographics &amp; Identifiers
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-slate-50/50 focus:bg-white text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Taylor"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-slate-50/50 focus:bg-white text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="125"
                  placeholder="e.g. 68"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-slate-50/50 focus:bg-white text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-slate-50/50 focus:bg-white text-slate-800"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other / Non-Binary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient ID <span className="text-[10px] text-slate-400 font-normal">(Optional, Auto-generated)</span>
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated e.g. PT-9042"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-slate-50/50 focus:bg-white text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  MRN <span className="text-[10px] text-slate-400 font-normal">(Optional, Auto-generated)</span>
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated e.g. MRN-2026-9042"
                  value={mrn}
                  onChange={(e) => setMrn(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-slate-50/50 focus:bg-white text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bed Allocation & Diagnosis */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-800 mb-2.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              2. ICU Bed Allocation &amp; Clinical Diagnosis
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Assigned ICU Bed <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] font-mono text-slate-400">8 Bed Ward</span>
                </label>
                <select
                  required
                  value={icuBedNumber}
                  onChange={(e) => setIcuBedNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-slate-50/50 focus:bg-white text-slate-800 font-mono"
                >
                  <option value="">-- Select Vacant Bed --</option>
                  {ALL_ICU_BEDS.map((bed) => {
                    const occ = occupiedBedMap[bed];
                    return (
                      <option
                        key={bed}
                        value={bed}
                        disabled={Boolean(occ)}
                        className={occ ? 'text-slate-400 bg-slate-50' : 'text-slate-800 font-semibold'}
                      >
                        {bed} {occ ? `(Occupied: ${occ.patientName || occ.patientId})` : '• VACANT (Ready)'}
                      </option>
                    );
                  })}
                </select>
                {occupiedBedMap[icuBedNumber] ? (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Bed {icuBedNumber} is occupied. Please select an available bed.
                  </p>
                ) : icuBedNumber ? (
                  <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Bed {icuBedNumber} is available for immediate admission.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Admission Diagnosis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Pancreatitis with SIRS"
                  value={primaryDiagnosis}
                  onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-slate-50/50 focus:bg-white text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Registered Doctor Assignment */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-800 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                3. Attending Physician Assignment (Registered Doctors)
              </span>
              {isLoadingDoctors && (
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                  Fetching doctors...
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Attending Doctor <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={attendingDoctorId}
                onChange={(e) => setAttendingDoctorId(e.target.value)}
                disabled={isLoadingDoctors || doctors.length === 0}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-slate-50/50 focus:bg-white text-slate-800 font-medium disabled:opacity-50"
              >
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.fullName || doc.username} — {doc.specialty || doc.department || 'Attending Physician'} ({doc.email}) [{doc.shiftStatus || 'ON_DUTY'}]
                  </option>
                ))}
              </select>

              {/* Selected Doctor Summary Card */}
              {selectedDoctor && (
                <div className="mt-2.5 p-3 rounded-2xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      Dr
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {selectedDoctor.fullName || selectedDoctor.username}
                      </div>
                      <div className="text-[11px] text-teal-800 font-mono">
                        {selectedDoctor.email} • {selectedDoctor.specialty || 'Critical Care'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {selectedDoctor.shiftStatus || 'ON_DUTY'}
                  </span>
                </div>
              )}
              <p className="text-[10px] text-slate-500 mt-1">
                Emergency Sepsis Alert emails will route directly to this doctor's verified registered email address.
              </p>
            </div>
          </div>

          {/* Section 4: Medications & Admission Notes */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-800 mb-2.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              4. Active Medications &amp; Admission Notes
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Active Medications / IV Infusions</span>
                  <span className="text-[10px] text-slate-400 font-normal">Comma or newline separated</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Norepinephrine 0.08 mcg/kg/min, Vancomycin 1.5g IV q12h, Plasma-Lyte 150 mL/hr"
                  value={medicationsInput}
                  onChange={(e) => setMedicationsInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-slate-50/50 focus:bg-white text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nurse Admission Notes &amp; Bedside Observations
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Direct transfer from Emergency Department. Peripheral line intact. Patient alert but tachypneic."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition bg-slate-50/50 focus:bg-white text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Bottom Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
              disabled={isSubmitting || isLoadingDoctors || Boolean(occupiedBedMap[icuBedNumber])}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Admitting Patient...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-white" />
                  <span>Admit &amp; Initialize Bed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
