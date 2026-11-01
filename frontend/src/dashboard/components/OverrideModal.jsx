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
    <div className="fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4 bg-[#334155]/20 transition-all">
      <div className="rounded-3xl max-w-md w-full p-5 border border-[#E2E8F0] bg-white shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 text-rose-600 font-display font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Clinical Override / Disagreement</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#334155] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="py-3 text-xs space-y-3 font-sans">
          <p className="text-xs leading-relaxed text-[#475569]">
            Document clinical rationale for disagreeing with or modifying the agent's alert assessment for the electronic medical audit trail:
          </p>

          <div>
            <label className="block text-[11px] font-mono text-[#64748B] mb-1 font-medium">
              Override Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-xl p-2.5 text-xs bg-[#F8FAFC] text-[#334155] focus:outline-none focus:border-[#99F6E4] focus:ring-2 focus:ring-[#99F6E4]/40 transition-all shadow-2xs"
            >
              <option>Alternative Etiology Identified (e.g. Post-op shivering, cardiogenic)</option>
              <option>Medication Confounder Verified (Vasopressor titration)</option>
              <option>Transient Artifact / Sensor Dislodgement</option>
              <option>Clinical Plan Already Initiated (Fluids &amp; Cultures drawn)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#64748B] mb-1 font-medium">
              Attending Clinical Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter specific clinical rationale or alternative diagnostic hypothesis..."
              rows={3}
              className="w-full border border-[#E2E8F0] rounded-xl p-2.5 text-xs bg-[#F8FAFC] text-[#334155] placeholder-[#64748B] focus:outline-none focus:border-[#99F6E4] focus:ring-2 focus:ring-[#99F6E4]/40 transition-all shadow-2xs resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-[#64748B] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              Record Override in Audit Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
