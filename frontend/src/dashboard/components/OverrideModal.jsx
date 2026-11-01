import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function OverrideModal({
  isOpen,
  onClose,
  onSubmit
}) {
  const { isDark } = useTheme();
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
    <div className={`fixed inset-0 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all ${
      isDark ? 'bg-black/75' : 'bg-slate-900/40'
    }`}>
      <div className={`rounded-xl max-w-md w-full p-5 border shadow-2xl transition-all ${
        isDark ? 'bg-[#0D121D] border-[#1F293D]' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-[#1F293D]' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2 text-rose-500 font-display font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Clinical Override / Disagreement</span>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="py-3 text-xs space-y-3 font-sans">
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Document clinical rationale for disagreeing with or modifying the agent's alert assessment for the electronic medical audit trail:
          </p>

          <div>
            <label className={`block text-[11px] font-mono mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Override Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full border rounded-lg p-2 text-xs focus:outline-none transition-all ${
                isDark
                  ? 'bg-[#070A0F] border-[#1F293D] text-slate-200 focus:border-teal-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-600'
              }`}
            >
              <option>Alternative Etiology Identified (e.g. Post-op shivering, cardiogenic)</option>
              <option>Medication Confounder Verified (Vasopressor titration)</option>
              <option>Transient Artifact / Sensor Dislodgement</option>
              <option>Clinical Plan Already Initiated (Fluids &amp; Cultures drawn)</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-mono mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Attending Clinical Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter specific clinical rationale or alternative diagnostic hypothesis..."
              rows={3}
              className={`w-full border rounded-lg p-2 text-xs focus:outline-none transition-all ${
                isDark
                  ? 'bg-[#070A0F] border-[#1F293D] text-slate-200 placeholder-slate-500 focus:border-teal-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-600'
              }`}
            />
          </div>

          {/* Action buttons */}
          <div className={`pt-2 flex items-center justify-end gap-2 border-t ${
            isDark ? 'border-[#1F293D]' : 'border-slate-100'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#1F293D] text-slate-400 hover:text-slate-200 hover:bg-[#131B2A]'
                  : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
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
