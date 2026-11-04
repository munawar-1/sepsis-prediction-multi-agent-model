import React, { useState } from 'react';
import {
  Stethoscope,
  X,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Heart,
  Gauge,
  Wind,
  Thermometer,
  Activity,
  FlaskConical,
  Pill,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clinicalApi } from '../../services/api';

const VITAL_RANGES = {
  hr: { min: 20, max: 300, unit: 'bpm', label: 'Heart Rate' },
  sbp: { min: 30, max: 300, unit: 'mmHg', label: 'Systolic BP' },
  dbp: { min: 10, max: 200, unit: 'mmHg', label: 'Diastolic BP' },
  rr: { min: 4, max: 80, unit: '/min', label: 'Respiratory Rate' },
  temp: { min: 25.0, max: 45.0, unit: '°C', label: 'Temperature' },
  spo2: { min: 0, max: 100, unit: '%', label: 'SpO2 Oxygen Sat' },
  lactate: { min: 0.1, max: 35.0, unit: 'mmol/L', label: 'Lactate' },
  wbc: { min: 0.5, max: 100.0, unit: '×10⁹/L', label: 'WBC' },
  creatinine: { min: 0.1, max: 20.0, unit: 'mg/dL', label: 'Creatinine' },
  platelets: { min: 5, max: 1500, unit: '×10⁹/L', label: 'Platelets' }
};

export default function NurseEntryModal({
  isOpen,
  onClose,
  patients = [],
  selectedPatientId = null,
  onTelemetrySubmitted
}) {
  const { user, isNurse, isDoctor } = useAuth();

  // Form State
  const [patientId, setPatientId] = useState(() => selectedPatientId || patients[0]?.patientId || 'PT-9042');
  const [hourIndex, setHourIndex] = useState(4);
  const [hr, setHr] = useState('112');
  const [sbp, setSbp] = useState('92');
  const [dbp, setDbp] = useState('58');
  const [rr, setResp] = useState('24');
  const [temp, setTemp] = useState('38.6');
  const [spo2, setSpo2] = useState('93');

  // Optional Labs toggle
  const [includeLabs, setIncludeLabs] = useState(false);
  const [lactate, setLactate] = useState('3.2');
  const [wbc, setWbc] = useState('15.8');
  const [creatinine, setCreatinine] = useState('1.6');
  const [platelets, setPlatelets] = useState('145');

  // Medications Quick-Add list
  const [medications, setMedications] = useState([
    { name: 'Norepinephrine', dose: '0.06 mcg/kg/min', route: 'IV Central', givenAt: '15:00' }
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');

  // Status & Validation
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen) return null;

  // Add Medication Helper
  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    setMedications(prev => [
      ...prev,
      {
        name: newMedName.trim(),
        dose: newMedDose.trim() || 'Standard Dose',
        route: 'IV',
        givenAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setNewMedName('');
    setNewMedDose('');
  };

  const handleRemoveMedication = (idx) => {
    setMedications(prev => prev.filter((_, i) => i !== idx));
  };

  // Validation
  const validate = () => {
    const errors = {};
    const numHr = parseFloat(hr);
    const numSbp = parseFloat(sbp);
    const numDbp = parseFloat(dbp);
    const numRr = parseFloat(rr);
    const numTemp = parseFloat(temp);
    const numSpo2 = parseFloat(spo2);

    if (isNaN(numHr) || numHr < VITAL_RANGES.hr.min || numHr > VITAL_RANGES.hr.max) {
      errors.hr = `Heart Rate must be between ${VITAL_RANGES.hr.min} and ${VITAL_RANGES.hr.max} bpm`;
    }
    if (isNaN(numSbp) || numSbp < VITAL_RANGES.sbp.min || numSbp > VITAL_RANGES.sbp.max) {
      errors.sbp = `Systolic BP must be between ${VITAL_RANGES.sbp.min} and ${VITAL_RANGES.sbp.max} mmHg`;
    }
    if (isNaN(numDbp) || numDbp < VITAL_RANGES.dbp.min || numDbp > VITAL_RANGES.dbp.max) {
      errors.dbp = `Diastolic BP must be between ${VITAL_RANGES.dbp.min} and ${VITAL_RANGES.dbp.max} mmHg`;
    }
    if (isNaN(numRr) || numRr < VITAL_RANGES.rr.min || numRr > VITAL_RANGES.rr.max) {
      errors.rr = `Respiratory Rate must be between ${VITAL_RANGES.rr.min} and ${VITAL_RANGES.rr.max} /min`;
    }
    if (isNaN(numTemp) || numTemp < VITAL_RANGES.temp.min || numTemp > VITAL_RANGES.temp.max) {
      errors.temp = `Temperature must be between ${VITAL_RANGES.temp.min} and ${VITAL_RANGES.temp.max} °C`;
    }
    if (isNaN(numSpo2) || numSpo2 < VITAL_RANGES.spo2.min || numSpo2 > VITAL_RANGES.spo2.max) {
      errors.spo2 = `SpO2 must be between ${VITAL_RANGES.spo2.min} and ${VITAL_RANGES.spo2.max}%`;
    }

    if (includeLabs) {
      const numLac = parseFloat(lactate);
      if (isNaN(numLac) || numLac < VITAL_RANGES.lactate.min || numLac > VITAL_RANGES.lactate.max) {
        errors.lactate = `Lactate must be between ${VITAL_RANGES.lactate.min} and ${VITAL_RANGES.lactate.max} mmol/L`;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        patientId,
        hourIndex: parseInt(hourIndex, 10),
        hr: parseFloat(hr),
        sbp: parseFloat(sbp),
        dbp: parseFloat(dbp),
        resp: parseFloat(rr),
        temp: parseFloat(temp),
        o2sat: parseFloat(spo2),
        activeMedications: medications.map(m => `${m.name} ${m.dose}`.trim())
      };

      if (includeLabs) {
        payload.lactate = parseFloat(lactate);
        payload.wbc = parseFloat(wbc);
        payload.creatinine = parseFloat(creatinine);
        payload.platelets = parseFloat(platelets);
      }

      const res = await clinicalApi.logPatientTelemetry(patientId, payload);

      if (res.error) {
        setSubmitError(res.error);
      } else {
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
          onClose();
          if (onTelemetrySubmitted) onTelemetrySubmitted(res.data);
        }, 1200);
      }
    } catch (err) {
      setSubmitError(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b-[1.5px] border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border-[1.5px] border-emerald-300 flex items-center justify-center text-emerald-700 shadow-2xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Nurse Hourly Bedside Round</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border-[1.5px] border-emerald-300">
                  {user?.role === 'DOCTOR' ? 'Attending Entry' : 'Bedside RN Workflow'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Ingest real-time bedside telemetry and trigger autonomous multi-agent sepsis evaluation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-[#EDF3FA] dark:bg-[#101C30] flex items-center justify-center text-[#556D8A] dark:text-[#8BA1BD] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#DFEAF5] dark:hover:bg-[#172A47] transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
          
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-[1.5px] border-rose-200 text-rose-800 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-[1.5px] border-emerald-200 text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">Telemetry logged successfully! AI evaluation updated.</span>
            </div>
          )}

          {/* Patient & Hour Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-slate-500 mb-1">
                Target ICU Bed / Patient
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full h-10 px-3.5 rounded-2xl border-[1.5px] border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs font-sans cursor-pointer"
              >
                {patients.map(p => (
                  <option key={p.patientId || p.id} value={p.patientId || p.id}>
                    {p.bed || p.icuBedNumber} • {p.patientId || p.id} {p.patientName ? `(${p.patientName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-slate-500 mb-1">
                ICU Hour Index
              </label>
              <input
                type="number"
                min="0"
                value={hourIndex}
                onChange={(e) => setHourIndex(e.target.value)}
                className="w-full h-10 px-3.5 rounded-2xl border-[1.5px] border-slate-300 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                placeholder="e.g. 4"
              />
            </div>
          </div>

          {/* Section 1: Hourly Vitals */}
          <div className="bg-slate-50 rounded-2xl p-4 border-[1.5px] border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Heart className="w-4 h-4 text-emerald-600" />
                <span>Bedside Physiological Vitals (Hourly Requirement)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Mandatory
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={hr}
                  onChange={(e) => setHr(e.target.value)}
                  className={`w-full h-9 px-3 rounded-xl border-[1.5px] bg-white font-mono font-bold text-slate-900 shadow-2xs ${validationErrors.hr ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  value={sbp}
                  onChange={(e) => setSbp(e.target.value)}
                  className={`w-full h-9 px-3 rounded-xl border-[1.5px] bg-white font-mono font-bold text-slate-900 shadow-2xs ${validationErrors.sbp ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  value={dbp}
                  onChange={(e) => setDbp(e.target.value)}
                  className={`w-full h-9 px-3 rounded-xl border-[1.5px] bg-white font-mono font-bold text-slate-900 shadow-2xs ${validationErrors.dbp ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">Resp Rate (/min)</label>
                <input
                  type="number"
                  value={rr}
                  onChange={(e) => setResp(e.target.value)}
                  className={`w-full h-9 px-3 rounded-xl border-[1.5px] bg-white font-mono font-bold text-slate-900 shadow-2xs ${validationErrors.rr ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className={`w-full h-9 px-3 rounded-xl border-[1.5px] bg-white font-mono font-bold text-slate-900 shadow-2xs ${validationErrors.temp ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className={`w-full h-9 px-3 rounded-xl border-[1.5px] bg-white font-mono font-bold text-slate-900 shadow-2xs ${validationErrors.spo2 ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Laboratory Panel (Optional Toggle with Forward-Fill) */}
          <div className="bg-slate-50 rounded-2xl p-4 border-[1.5px] border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800">Add New Laboratory Panel</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeLabs}
                  onChange={(e) => setIncludeLabs(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-slate-600">
                  {includeLabs ? 'New Draw Recorded' : 'Forward-Fill from Prior Draw'}
                </span>
              </label>
            </div>

            {includeLabs ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">Lactate (mmol/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={lactate}
                    onChange={(e) => setLactate(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border-[1.5px] border-slate-300 bg-white font-mono font-bold text-slate-900 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">WBC (×10⁹/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={wbc}
                    onChange={(e) => setWbc(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border-[1.5px] border-slate-300 bg-white font-mono font-bold text-slate-900 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">Creatinine (mg/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={creatinine}
                    onChange={(e) => setCreatinine(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border-[1.5px] border-slate-300 bg-white font-mono font-bold text-slate-900 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">Platelets (×10⁹/L)</label>
                  <input
                    type="number"
                    value={platelets}
                    onChange={(e) => setPlatelets(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border-[1.5px] border-slate-300 bg-white font-mono font-bold text-slate-900 shadow-2xs"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-200">
                Labs are drawn every 4–6 hours. Unchecked: The backend forwards the patient's previous lab values to calculate Martha's Rule and biochemical kinetic deterioration without duplicating blood draws.
              </p>
            )}
          </div>

          {/* Section 3: Quick-Add Active Medications */}
          <div className="bg-slate-50 rounded-2xl p-4 border-[1.5px] border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Pill className="w-4 h-4 text-purple-600" />
                <span>Active Infusions &amp; Administered Medications</span>
              </div>
              <span className="text-[10px] font-mono font-semibold text-slate-500">
                {medications.length} Active
              </span>
            </div>

            {/* List */}
            <div className="space-y-1.5">
              {medications.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                  <div>
                    <span className="font-bold text-slate-900">{m.name}</span>
                    <span className="ml-2 text-slate-600 font-mono">({m.dose})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick-Add Inputs */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Medication (e.g. Vancomycin)"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                className="flex-1 h-8 px-3 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Dose (e.g. 1g IV)"
                value={newMedDose}
                onChange={(e) => setNewMedDose(e.target.value)}
                className="w-32 h-8 px-3 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddMedication}
                className="h-8 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1 hover:bg-slate-800 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t-[1.5px] border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-white dark:bg-[#101C30] hover:bg-[#F0F5FA] dark:hover:bg-[#172A47] text-[#334155] dark:text-[#CBD5E1] text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Evaluating AI Ensemble...' : 'Commit Telemetry Round'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

