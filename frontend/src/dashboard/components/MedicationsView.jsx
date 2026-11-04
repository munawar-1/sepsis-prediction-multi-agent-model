import React, { useState, useEffect } from 'react';
import {
  Pill,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileCheck,
  Plus,
  Droplets,
  Activity,
  X
} from 'lucide-react';
import { clinicalApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function MedicationsView({ alert = {} }) {
  const { isDoctor, isNurse } = useAuth();
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [signingOrderId, setSigningOrderId] = useState(null);

  // Standalone Medication Logging Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [medCategory, setMedCategory] = useState('MEDICATION'); // MEDICATION, FLUID, GLUCOSE
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medRoute, setMedRoute] = useState('IV');
  const [fluidVolume, setFluidVolume] = useState('');
  const [glucoseVal, setGlucoseVal] = useState('');
  const [isSubmittingMed, setIsSubmittingMed] = useState(false);
  const [medSuccessMsg, setMedSuccessMsg] = useState(null);
  const [medErrorMsg, setMedErrorMsg] = useState(null);

  const loadData = async () => {
    if (!alert?.patientId) return;
    try {
      const [ordersRes, profRes] = await Promise.all([
        clinicalApi.fetchPatientOrders(alert.patientId),
        clinicalApi.fetchPatientProfile(alert.patientId)
      ]);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (profRes.data) setProfile(profRes.data);
    } catch (e) {
      console.warn('Failed to load medications/orders:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [alert?.patientId]);

  const handleSignOrder = async (orderId) => {
    setSigningOrderId(orderId);
    try {
      const res = await clinicalApi.signOrder(orderId, { notes: 'Authorized by attending intensivist via flight deck' });
      if (res.data) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'SIGNED' } : o));
      }
    } catch (e) {
      alert('Failed to sign order: ' + e.message);
    } finally {
      setSigningOrderId(null);
    }
  };

  const handleAdministerOrder = async (orderId) => {
    try {
      const res = await clinicalApi.administerOrder(orderId, { notes: 'Bedside nurse IV administration verified' });
      if (res.data) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ADMINISTERED' } : o));
      }
    } catch (e) {
      alert('Failed to administer order: ' + e.message);
    }
  };

  const handleSaveStandaloneMed = async (e) => {
    e.preventDefault();
    setMedErrorMsg(null);
    setMedSuccessMsg(null);

    let name = medName.trim();
    if (medCategory === 'FLUID' && !name) {
      name = 'Lactated Ringer\'s Bolus';
    } else if (medCategory === 'GLUCOSE' && !name) {
      name = 'Point-of-Care Blood Glucose';
    }

    if (!name && !glucoseVal && !fluidVolume) {
      setMedErrorMsg('Please enter a medication, fluid, or glucose value.');
      return;
    }

    setIsSubmittingMed(true);
    try {
      const payload = {
        medicationName: name,
        dosage: medDosage.trim(),
        route: medRoute.trim(),
        category: medCategory,
        fluidVolumeMl: fluidVolume ? parseFloat(fluidVolume) : null,
        glucoseValue: glucoseVal ? parseFloat(glucoseVal) : null
      };

      const res = await clinicalApi.logStandaloneMedication(alert.patientId, payload);
      if (res.error) {
        setMedErrorMsg(res.error);
      } else {
        setMedSuccessMsg('Successfully charted entry! Included in live AI multi-agent evaluations.');
        await loadData();
        setTimeout(() => {
          setIsModalOpen(false);
          setMedSuccessMsg(null);
          setMedName('');
          setMedDosage('');
          setFluidVolume('');
          setGlucoseVal('');
        }, 1200);
      }
    } catch (err) {
      setMedErrorMsg(err.message || 'Failed to record entry');
    } finally {
      setIsSubmittingMed(false);
    }
  };

  const activeMeds = profile?.activeMedications || [];

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
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Medications &amp; Sepsis Bundle Orders</h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-500">
                <span>Active inpatient infusions and physician authorization queue for</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border-[1.5px] border-slate-200 font-mono font-bold text-slate-800">
                  {alert?.patientId || 'PT-9042'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border-[1.5px] border-emerald-200 font-mono font-bold text-emerald-800">
                  {alert?.bed || 'ICU-BED-04'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="h-9 px-4 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Med / Fluid / POC</span>
            </button>
            <span className="text-xs font-mono text-purple-800 bg-purple-50 border-[1.5px] border-purple-200 px-3 py-1.5 rounded-full font-bold shadow-2xs self-start sm:self-auto">
              Surviving Sepsis Protocol
            </span>
          </div>
        </div>

        {/* Active Inpatient Medications */}
        <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-600" />
              Active Inpatient Infusions &amp; Administered Drugs
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Quick Chart Entry</span>
            </button>
          </div>

          {activeMeds.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No continuous infusions or administered medications charted yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeMeds.map((med, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{med}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Factor in AI Deterioration Models</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Sepsis Bundle Action Orders */}
        <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Sepsis-3 Bundle Physician Authorization Worklist
            </h2>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              {orders.length} Recommended Actions
            </span>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-500" />
                <p className="text-xs font-semibold">No pending sepsis action orders for this patient.</p>
              </div>
            ) : (
              orders.map((o) => {
                const isSigned = o.status === 'SIGNED' || o.status === 'APPROVED' || o.status === 'ADMINISTERED' || o.status === 'EXECUTED';
                const isAdministered = o.status === 'ADMINISTERED' || o.status === 'EXECUTED';
                return (
                  <div
                    key={o.id}
                    className="p-4 rounded-2xl border-[1.5px] border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {o.priority || 'STAT'}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{o.actionName}</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">Code: {o.orderCode} • Category: {o.category}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isSigned && isDoctor && (
                        <button
                          onClick={() => handleSignOrder(o.id)}
                          disabled={signingOrderId === o.id}
                          className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Authorize &amp; Sign</span>
                        </button>
                      )}

                      {isSigned && !isAdministered && isNurse && (
                        <button
                          onClick={() => handleAdministerOrder(o.id)}
                          className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify Administered</span>
                        </button>
                      )}

                      {isAdministered && (
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Administered
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Standalone Medication Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Chart Medication, Fluid, or POC Test</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Asynchronous entry for {alert?.patientId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStandaloneMed} className="p-5 space-y-4">
              {medSuccessMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{medSuccessMsg}</span>
                </div>
              )}
              {medErrorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{medErrorMsg}</span>
                </div>
              )}

              {/* Category selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Entry Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'MEDICATION', label: 'Medication', icon: Pill },
                    { id: 'FLUID', label: 'Fluid Bolus', icon: Droplets },
                    { id: 'GLUCOSE', label: 'POC Glucose', icon: Activity }
                  ].map(cat => {
                    const Icon = cat.icon;
                    const isSelected = medCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMedCategory(cat.id)}
                        className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {medCategory === 'MEDICATION' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Medication Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Albuterol 2.5mg Inhalation Nebulizer, Norepinephrine"
                      value={medName}
                      onChange={e => setMedName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 text-xs focus:outline-hidden focus:border-purple-500 font-medium"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Dosage</label>
                      <input
                        type="text"
                        placeholder="e.g. 2.5mg, 1g IV"
                        value={medDosage}
                        onChange={e => setMedDosage(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 text-xs focus:outline-hidden focus:border-purple-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Route</label>
                      <input
                        type="text"
                        placeholder="e.g. Nebulizer, IV, PO"
                        value={medRoute}
                        onChange={e => setMedRoute(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 text-xs focus:outline-hidden focus:border-purple-500 font-medium"
                      />
                    </div>
                  </div>
                </>
              )}

              {medCategory === 'FLUID' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Fluid Crystalloid / Colloid</label>
                    <input
                      type="text"
                      placeholder="e.g. Lactated Ringer's, 0.9% Normal Saline, Albumin 5%"
                      value={medName}
                      onChange={e => setMedName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 text-xs focus:outline-hidden focus:border-purple-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Volume Administered (mL)</label>
                    <input
                      type="number"
                      step="50"
                      placeholder="e.g. 500, 1000"
                      value={fluidVolume}
                      onChange={e => setFluidVolume(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 text-xs focus:outline-hidden focus:border-purple-500 font-mono font-bold"
                    />
                  </div>
                </>
              )}

              {medCategory === 'GLUCOSE' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Point-of-Care Blood Glucose (mg/dL)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 142"
                    value={glucoseVal}
                    onChange={e => setGlucoseVal(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-300 text-xs focus:outline-hidden focus:border-purple-500 font-mono font-bold"
                    required
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMed}
                  className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmittingMed ? 'Recording...' : 'Save & Update AI Context'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
