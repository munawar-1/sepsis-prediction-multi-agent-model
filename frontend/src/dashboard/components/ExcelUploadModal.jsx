import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Play,
  FileCheck,
  RefreshCw,
  Info,
  Sparkles
} from 'lucide-react';
import { clinicalApi } from '../../services/api';
import { DEMO_FLOWSHEET_ROWS, downloadDemoWorkbookFile } from '../data/demoFlowsheetData';

export default function ExcelUploadModal({
  isOpen,
  onClose,
  onBatchLoaded,
  onStartSimulation,
  autoLoadDemo = false
}) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [validationSummary, setValidationSummary] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestionProgress, setIngestionProgress] = useState(0);
  const [ingestionStatusText, setIngestionStatusText] = useState('');
  const [batchId, setBatchId] = useState(() => `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`);

  // Parse and validate rows from JSON objects
  const parseAndValidateJsonRows = (jsonData, customName = 'uploaded_file.xlsx') => {
    let validCount = 0;
    let invalidCount = 0;
    const patientSet = new Set();
    const maxHours = {};

    const evaluatedRows = jsonData.map((row, idx) => {
      const errors = [];
      const pid = String(row.patient_id || row.PatientId || row.patientId || '').trim();
      const patientName = String(row.patient_name || row.PatientName || row.name || row.fullName || '').trim();
      const age = parseInt(row.age ?? row.Age, 10);
      const gender = String(row.gender || row.Gender || row.sex || '').trim();
      const diagnosis = String(row.diagnosis || row.Diagnosis || row.primaryDiagnosis || '').trim();

      const hr = parseFloat(row.hr || row.HR || row.heart_rate);
      const sbp = parseFloat(row.sbp || row.SBP || row.systolic_bp);
      const dbp = parseFloat(row.dbp || row.DBP || row.diastolic_bp);
      const rr = parseFloat(row.rr || row.RR || row.respiratory_rate);
      const temp = parseFloat(row.temp || row.Temp || row.temperature);
      const spo2 = parseFloat(row.spo2 || row.SpO2 || row.o2sat);
      const hour = parseInt(row.hour_index ?? row.HourIndex ?? row.hour ?? idx, 10);

      if (!pid) errors.push('Missing patient_id');
      if (isNaN(hr) || hr < 20 || hr > 300) errors.push(`HR invalid (${hr})`);
      if (isNaN(sbp) || sbp < 30 || sbp > 300) errors.push(`SBP invalid (${sbp})`);
      if (isNaN(dbp) || dbp < 10 || dbp > 200) errors.push(`DBP invalid (${dbp})`);
      if (isNaN(rr) || rr < 4 || rr > 80) errors.push(`RR invalid (${rr})`);
      if (isNaN(temp) || temp < 25 || temp > 45) errors.push(`Temp invalid (${temp})`);
      if (isNaN(spo2) || spo2 < 0 || spo2 > 100) errors.push(`SpO2 invalid (${spo2})`);

      if (pid) {
        patientSet.add(pid);
        maxHours[pid] = Math.max(maxHours[pid] || 0, hour);
      }

      const isValid = errors.length === 0;
      if (isValid) validCount++; else invalidCount++;

      const medsStr = row.medications || row.meds || row.active_medications || '';
      const medsArray = medsStr ? String(medsStr).split(',').map(s => s.trim()) : [];

      return {
        rowNumber: idx + 2,
        patientId: pid,
        patientName: patientName || undefined,
        age: !isNaN(age) ? age : undefined,
        gender: gender || undefined,
        diagnosis: diagnosis || undefined,
        hourIndex: hour,
        hr,
        sbp,
        dbp,
        resp: rr,
        temp,
        o2sat: spo2,
        lactate: row.lactate !== undefined && row.lactate !== null && !isNaN(parseFloat(row.lactate)) ? parseFloat(row.lactate) : null,
        wbc: row.wbc !== undefined && row.wbc !== null && !isNaN(parseFloat(row.wbc)) ? parseFloat(row.wbc) : null,
        creatinine: row.creatinine !== undefined && row.creatinine !== null && !isNaN(parseFloat(row.creatinine)) ? parseFloat(row.creatinine) : null,
        platelets: row.platelets !== undefined && row.platelets !== null && !isNaN(parseFloat(row.platelets)) ? parseFloat(row.platelets) : null,
        activeMedications: medsArray,
        isValid,
        errors
      };
    });

    setFileName(customName);
    setParsedRows(evaluatedRows);
    setValidationSummary({
      totalRows: evaluatedRows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      uniquePatients: patientSet.size,
      patientList: Array.from(patientSet),
      maxHourIndex: Math.max(...Object.values(maxHours), 0)
    });
  };

  const handleLoadDemoFlowsheet = () => {
    setIsProcessing(true);
    try {
      parseAndValidateJsonRows(DEMO_FLOWSHEET_ROWS, 'HourZero_Demo_Flowsheet.xlsx');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (autoLoadDemo) {
        handleLoadDemoFlowsheet();
      }
    } else {
      // Clear when closed if needed
    }
  }, [isOpen, autoLoadDemo]);

  if (!isOpen) return null;

  // Download Demo / Template (.xlsx)
  const handleDownloadTemplate = () => {
    downloadDemoWorkbookFile();
  };

  // Parse & Validate uploaded Excel file
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        parseAndValidateJsonRows(jsonData, file.name);
      } catch (err) {
        alert('Failed to parse Excel file: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Load into Hourly Simulation Player
  const handleLoadToSimulation = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (onStartSimulation) {
      onStartSimulation({
        batchId,
        rows: validRows,
        summary: validationSummary
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl border-[1.5px] border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-[1.5px] border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border-[1.5px] border-emerald-300 flex items-center justify-center text-emerald-700 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">ICU Flowsheet Report Ingestion</h2>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {batchId}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Load or upload multi-hour ICU telemetry flowsheets for live multi-agent surveillance and sepsis early warning.
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
          
          {/* Quick Demo & File Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Action 1: Pre-populated Demo Flowsheet */}
            <div className="p-4 rounded-2xl border-[1.5px] border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-700">Recommended Demo</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    4 Patients • 6 Hours
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 mt-1">Load Canonical ICU Demo Flowsheet</h3>
                <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                  Includes Eleanor Vance (Septic Shock progression), Arthur Pendelton (Albuterol confounder / Skeptic suppression), Marcus Brody (Post-CABG recovery), and Clara Oswald (Resolving DKA).
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleLoadDemoFlowsheet}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Load Demo Data</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="py-2 px-3 rounded-xl border-[1.5px] border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Download HourZero_Demo_Flowsheet.xlsx"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Download .xlsx</span>
                </button>
              </div>
            </div>

            {/* Action 2: Manual File Upload */}
            <div className="p-4 rounded-2xl border-[1.5px] border-slate-200 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Custom Upload</span>
                <h3 className="text-xs font-bold text-slate-900 mt-1">Upload Your Own .xlsx File</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                  Select any standardized hospital ICU flowsheet (.xlsx or .xls). Verifies clinical bounds and demographic columns in-browser before simulation.
                </p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate">{fileName && fileName !== 'HourZero_Demo_Flowsheet.xlsx' ? `Loaded: ${fileName}` : 'Choose Custom File...'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Validation Summary Card */}
          {validationSummary && (
            <div className="p-4 rounded-2xl bg-white border-[1.5px] border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  File Validation Summary ({fileName})
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  {validationSummary.uniquePatients} Patients • {validationSummary.totalRows} Hourly Ticks
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Total Rows</span>
                  <div className="text-lg font-mono font-bold text-slate-900">{validationSummary.totalRows}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-mono uppercase text-emerald-600 font-bold">Valid &amp; Ingestable</span>
                  <div className="text-lg font-mono font-bold text-emerald-800">{validationSummary.validRows}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] font-mono uppercase text-rose-600 font-bold">Errors / Rejected</span>
                  <div className="text-lg font-mono font-bold text-rose-800">{validationSummary.invalidRows}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 font-semibold mr-1">Detected Patients:</span>
                {validationSummary.patientList.map(pid => (
                  <span key={pid} className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {pid}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Table Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Preview Parsed Telemetry Rows</span>
                <span className="text-[10px] font-mono text-slate-500">Showing first 8 of {parsedRows.length} rows</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border-[1.5px] border-slate-200 bg-white">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Patient &amp; Name</th>
                      <th className="py-2.5 px-3">Hour</th>
                      <th className="py-2.5 px-3">HR / BP</th>
                      <th className="py-2.5 px-3">Lactate</th>
                      <th className="py-2.5 px-3">Medications</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 8).map(r => (
                      <tr key={r.rowNumber} className={r.isValid ? 'hover:bg-slate-50/50' : 'bg-rose-50/40'}>
                        <td className="py-2 px-3 text-slate-400">#{r.rowNumber}</td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900">{r.patientId}</span>
                          {r.patientName && <span className="text-slate-500 ml-1.5 font-sans font-medium text-[10px]">({r.patientName})</span>}
                        </td>
                        <td className="py-2 px-3">T+{r.hourIndex}h</td>
                        <td className="py-2 px-3">{r.hr} / {r.sbp}/{r.dbp}</td>
                        <td className="py-2 px-3">{r.lactate != null ? `${r.lactate} mmol/L` : '—'}</td>
                        <td className="py-2 px-3 truncate max-w-[160px] text-slate-600">{r.activeMedications.join(', ') || '—'}</td>
                        <td className="py-2 px-3 text-right">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-bold" title={r.errors.join('; ')}>
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t-[1.5px] border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border-[1.5px] border-[#D0DFEF] dark:border-[#1E2D44] bg-white dark:bg-[#101C30] hover:bg-[#F0F5FA] dark:hover:bg-[#172A47] text-[#334155] dark:text-[#CBD5E1] font-bold text-xs cursor-pointer shadow-2xs"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={parsedRows.length === 0 || isProcessing}
                onClick={handleLoadToSimulation}
                className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-40"
                title="Hold rows in memory and dispatch sequentially hour-by-hour through the telemetry endpoint"
              >
                <Play className="w-3.5 h-3.5 text-white" />
                <span>Queue Simulation (Hold &amp; Step Hourly)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
