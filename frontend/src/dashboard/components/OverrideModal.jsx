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
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-900 border border-navy-700 rounded-xl max-w-md w-full p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-navy-700">
          <div className="flex items-center gap-2 text-rose-400 font-display font-semibold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Clinical Override / Disagreement</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="py-3 text-xs text-slate-300 space-y-3 font-sans">
          <p className="text-slate-400 text-xs leading-relaxed">
            Document rationale for disagreeing with or modifying the agent's alert assessment for the clinical governance audit trail:
          </p>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Override Reason
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-clinical-teal"
            >
              <option>Alternative Etiology Identified (e.g. Post-op shivering, cardiogenic)</option>
              <option>Medication Confounder Verified (Vasopressor titration)</option>
              <option>Transient Artifact / Sensor Dislodgement</option>
              <option>Clinical Plan Already Initiated (Fluids &amp; Cultures drawn)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Attending Clinical Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter specific clinical rationale or alternative diagnostic hypothesis..."
              rows={3}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-clinical-teal"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-navy-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-navy-700 text-slate-400 hover:text-slate-200 text-xs font-medium hover:bg-navy-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Record Override</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

