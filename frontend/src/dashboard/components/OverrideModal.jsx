import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export default function OverrideModal({
  isOpen,
  onClose,
  onSubmit
}) {
  const [category, setCategory] = useState('Alternative Etiology Identified (e.g. Post-op shivering, cardiogenic)');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      category,
      notes: notes.trim() || 'No additional clinician notes entered.'
    });
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4 bg-slate-900/40 transition-all">
      <div
        className="rounded-3xl max-w-md w-full p-6 border-[1.5px] border-slate-200 bg-white shadow-2xl transition-all space-y-4"
      >

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-[1.5px] border-slate-100">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <span className="p-1.5 rounded-xl bg-rose-50 border-[1.5px] border-rose-200 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <span>Clinical Override &amp; Disagreement</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-[#EDF3FA] dark:bg-[#101C30] flex items-center justify-center text-[#556D8A] dark:text-[#8BA1BD] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#DFEAF5] dark:hover:bg-[#172A47] transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="text-xs space-y-4 font-sans">
          <p className="text-xs font-medium leading-relaxed text-slate-600">
            Document clinical rationale for disagreeing with or modifying the agent's alert assessment. This will be signed and recorded in the immutable audit trail:
          </p>

          <div>
            <label className="block text-[11px] font-mono text-slate-500 mb-1.5 font-bold uppercase tracking-wider">
              Override Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border-[1.5px] border-slate-200 rounded-2xl p-3 text-xs bg-white text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs font-sans cursor-pointer"
            >
              <option>Alternative Etiology Identified (e.g. Post-op shivering, cardiogenic)</option>
              <option>Medication Confounder Verified (Vasopressor titration)</option>
              <option>Transient Artifact / Sensor Dislodgement</option>
              <option>Clinical Plan Already Initiated (Fluids &amp; Cultures drawn)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-500 mb-1.5 font-bold uppercase tracking-wider">
              Attending Clinical Justification
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter specific clinical rationale or alternative diagnostic hypothesis..."
              rows={3}
              className="w-full border-[1.5px] border-slate-200 rounded-2xl p-3 text-xs bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs resize-none font-sans font-medium"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t-[1.5px] border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-white dark:bg-[#101C30] hover:bg-[#F0F5FA] dark:hover:bg-[#172A47] text-[#334155] dark:text-[#CBD5E1] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full border-[1.5px] border-rose-600 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Record Override in Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
