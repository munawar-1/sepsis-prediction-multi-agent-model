import * as XLSX from 'xlsx';

export const DEMO_FLOWSHEET_ROWS = [
  // Patient 1: Eleanor Vance (PT-9042) - Severe Sepsis Progression to Septic Shock
  { patient_id: 'PT-9042', patient_name: 'Eleanor Vance', age: 68, gender: 'Female', diagnosis: 'Septic Shock / Severe Urosepsis', hour_index: 0, hr: 84, sbp: 124, dbp: 80, rr: 16, temp: 37.0, spo2: 98, lactate: 1.3, wbc: 9.8, creatinine: 1.0, platelets: 210, medications: 'Ceftriaxone 1g IV' },
  { patient_id: 'PT-9042', patient_name: 'Eleanor Vance', age: 68, gender: 'Female', diagnosis: 'Septic Shock / Severe Urosepsis', hour_index: 1, hr: 96, sbp: 114, dbp: 72, rr: 19, temp: 37.8, spo2: 96, lactate: 1.8, wbc: 11.4, creatinine: 1.2, platelets: 195, medications: 'Ceftriaxone 1g IV' },
  { patient_id: 'PT-9042', patient_name: 'Eleanor Vance', age: 68, gender: 'Female', diagnosis: 'Septic Shock / Severe Urosepsis', hour_index: 2, hr: 108, sbp: 102, dbp: 64, rr: 22, temp: 38.3, spo2: 94, lactate: 2.6, wbc: 14.1, creatinine: 1.5, platelets: 162, medications: 'Norepinephrine 0.04 mcg/kg/min' },
  { patient_id: 'PT-9042', patient_name: 'Eleanor Vance', age: 68, gender: 'Female', diagnosis: 'Septic Shock / Severe Urosepsis', hour_index: 3, hr: 118, sbp: 88, dbp: 54, rr: 26, temp: 38.9, spo2: 92, lactate: 3.8, wbc: 16.4, creatinine: 1.8, platelets: 138, medications: 'Norepinephrine 0.08 mcg/kg/min, Vancomycin 1.25g' },
  { patient_id: 'PT-9042', patient_name: 'Eleanor Vance', age: 68, gender: 'Female', diagnosis: 'Septic Shock / Severe Urosepsis', hour_index: 4, hr: 124, sbp: 82, dbp: 48, rr: 28, temp: 39.1, spo2: 90, lactate: 4.4, wbc: 18.2, creatinine: 2.1, platelets: 120, medications: 'Norepinephrine 0.12 mcg/kg/min, Meropenem 1g' },
  { patient_id: 'PT-9042', patient_name: 'Eleanor Vance', age: 68, gender: 'Female', diagnosis: 'Septic Shock / Severe Urosepsis', hour_index: 5, hr: 130, sbp: 78, dbp: 42, rr: 30, temp: 39.3, spo2: 89, lactate: 5.1, wbc: 19.8, creatinine: 2.4, platelets: 108, medications: 'Norepinephrine 0.15 mcg/kg/min, Vasopressin 0.03 U/min' },

  // Patient 2: Arthur Pendelton (PT-8810) - COPD Bronchospasm & Albuterol Confounder (Skeptic Suppression)
  { patient_id: 'PT-8810', patient_name: 'Arthur Pendelton', age: 72, gender: 'Male', diagnosis: 'COPD Exacerbation / Bronchospasm', hour_index: 0, hr: 76, sbp: 128, dbp: 82, rr: 15, temp: 36.9, spo2: 97, lactate: 1.1, wbc: 7.9, creatinine: 0.9, platelets: 240, medications: 'Maintenance Fluids' },
  { patient_id: 'PT-8810', patient_name: 'Arthur Pendelton', age: 72, gender: 'Male', diagnosis: 'COPD Exacerbation / Bronchospasm', hour_index: 1, hr: 78, sbp: 126, dbp: 80, rr: 16, temp: 37.0, spo2: 96, lactate: 1.1, wbc: 8.0, creatinine: 0.9, platelets: 238, medications: 'Maintenance Fluids' },
  { patient_id: 'PT-8810', patient_name: 'Arthur Pendelton', age: 72, gender: 'Male', diagnosis: 'COPD Exacerbation / Bronchospasm', hour_index: 2, hr: 114, sbp: 124, dbp: 78, rr: 18, temp: 37.1, spo2: 98, lactate: 1.2, wbc: 8.1, creatinine: 0.9, platelets: 235, medications: 'Albuterol 2.5mg Inhalation Nebulizer' },
  { patient_id: 'PT-8810', patient_name: 'Arthur Pendelton', age: 72, gender: 'Male', diagnosis: 'COPD Exacerbation / Bronchospasm', hour_index: 3, hr: 106, sbp: 122, dbp: 76, rr: 16, temp: 37.0, spo2: 98, lactate: 1.2, wbc: 8.0, creatinine: 0.9, platelets: 232, medications: 'Albuterol Nebulizer Completed' },
  { patient_id: 'PT-8810', patient_name: 'Arthur Pendelton', age: 72, gender: 'Male', diagnosis: 'COPD Exacerbation / Bronchospasm', hour_index: 4, hr: 88, sbp: 125, dbp: 79, rr: 15, temp: 36.9, spo2: 99, lactate: 1.1, wbc: 7.8, creatinine: 0.9, platelets: 240, medications: 'Ipratropium 0.5mg' },
  { patient_id: 'PT-8810', patient_name: 'Arthur Pendelton', age: 72, gender: 'Male', diagnosis: 'COPD Exacerbation / Bronchospasm', hour_index: 5, hr: 75, sbp: 126, dbp: 80, rr: 14, temp: 36.8, spo2: 99, lactate: 1.0, wbc: 7.6, creatinine: 0.9, platelets: 245, medications: 'Maintenance Fluids' },

  // Patient 3: Marcus Brody (PT-4421) - Post-CABG Day 2 Hemodynamic Recovery (Stable)
  { patient_id: 'PT-4421', patient_name: 'Marcus Brody', age: 54, gender: 'Male', diagnosis: 'Post-CABG Day 2 Hemodynamic Recovery', hour_index: 0, hr: 74, sbp: 122, dbp: 78, rr: 15, temp: 36.8, spo2: 98, lactate: 1.1, wbc: 8.5, creatinine: 1.0, platelets: 215, medications: 'Aspirin 81mg, Metoprolol 25mg' },
  { patient_id: 'PT-4421', patient_name: 'Marcus Brody', age: 54, gender: 'Male', diagnosis: 'Post-CABG Day 2 Hemodynamic Recovery', hour_index: 1, hr: 72, sbp: 120, dbp: 76, rr: 14, temp: 36.8, spo2: 98, lactate: 1.0, wbc: 8.3, creatinine: 1.0, platelets: 218, medications: 'Aspirin 81mg' },
  { patient_id: 'PT-4421', patient_name: 'Marcus Brody', age: 54, gender: 'Male', diagnosis: 'Post-CABG Day 2 Hemodynamic Recovery', hour_index: 2, hr: 75, sbp: 124, dbp: 79, rr: 15, temp: 36.9, spo2: 99, lactate: 1.1, wbc: 8.4, creatinine: 1.0, platelets: 220, medications: 'Aspirin 81mg' },
  { patient_id: 'PT-4421', patient_name: 'Marcus Brody', age: 54, gender: 'Male', diagnosis: 'Post-CABG Day 2 Hemodynamic Recovery', hour_index: 3, hr: 73, sbp: 121, dbp: 77, rr: 14, temp: 36.7, spo2: 98, lactate: 1.0, wbc: 8.2, creatinine: 0.9, platelets: 222, medications: 'Aspirin 81mg' },
  { patient_id: 'PT-4421', patient_name: 'Marcus Brody', age: 54, gender: 'Male', diagnosis: 'Post-CABG Day 2 Hemodynamic Recovery', hour_index: 4, hr: 76, sbp: 125, dbp: 80, rr: 15, temp: 36.8, spo2: 99, lactate: 1.0, wbc: 8.1, creatinine: 0.9, platelets: 225, medications: 'Aspirin 81mg' },
  { patient_id: 'PT-4421', patient_name: 'Marcus Brody', age: 54, gender: 'Male', diagnosis: 'Post-CABG Day 2 Hemodynamic Recovery', hour_index: 5, hr: 71, sbp: 119, dbp: 75, rr: 14, temp: 36.8, spo2: 98, lactate: 0.9, wbc: 8.0, creatinine: 0.9, platelets: 230, medications: 'Aspirin 81mg' },

  // Patient 4: Clara Oswald (PT-3105) - Resolving Diabetic Ketoacidosis (DKA) (Stable)
  { patient_id: 'PT-3105', patient_name: 'Clara Oswald', age: 42, gender: 'Female', diagnosis: 'Resolving Diabetic Ketoacidosis (DKA)', hour_index: 0, hr: 82, sbp: 118, dbp: 74, rr: 16, temp: 37.1, spo2: 99, lactate: 1.4, wbc: 9.0, creatinine: 1.1, platelets: 260, medications: 'Insulin Glargine 20U, KCl 20mEq' },
  { patient_id: 'PT-3105', patient_name: 'Clara Oswald', age: 42, gender: 'Female', diagnosis: 'Resolving Diabetic Ketoacidosis (DKA)', hour_index: 1, hr: 80, sbp: 116, dbp: 72, rr: 16, temp: 37.0, spo2: 99, lactate: 1.3, wbc: 8.8, creatinine: 1.0, platelets: 265, medications: 'Insulin Glargine 20U' },
  { patient_id: 'PT-3105', patient_name: 'Clara Oswald', age: 42, gender: 'Female', diagnosis: 'Resolving Diabetic Ketoacidosis (DKA)', hour_index: 2, hr: 78, sbp: 119, dbp: 75, rr: 15, temp: 36.9, spo2: 98, lactate: 1.2, wbc: 8.5, creatinine: 1.0, platelets: 270, medications: 'Insulin Glargine 20U' },
  { patient_id: 'PT-3105', patient_name: 'Clara Oswald', age: 42, gender: 'Female', diagnosis: 'Resolving Diabetic Ketoacidosis (DKA)', hour_index: 3, hr: 76, sbp: 117, dbp: 73, rr: 15, temp: 36.9, spo2: 98, lactate: 1.1, wbc: 8.2, creatinine: 0.9, platelets: 272, medications: 'Insulin Glargine 20U' },
  { patient_id: 'PT-3105', patient_name: 'Clara Oswald', age: 42, gender: 'Female', diagnosis: 'Resolving Diabetic Ketoacidosis (DKA)', hour_index: 4, hr: 77, sbp: 120, dbp: 76, rr: 14, temp: 36.8, spo2: 99, lactate: 1.1, wbc: 8.0, creatinine: 0.9, platelets: 275, medications: 'Insulin Glargine 20U' },
  { patient_id: 'PT-3105', patient_name: 'Clara Oswald', age: 42, gender: 'Female', diagnosis: 'Resolving Diabetic Ketoacidosis (DKA)', hour_index: 5, hr: 74, sbp: 118, dbp: 74, rr: 14, temp: 36.8, spo2: 99, lactate: 1.0, wbc: 7.9, creatinine: 0.9, platelets: 280, medications: 'Insulin Glargine 20U' }
];

export function buildDemoWorkbook() {
  const ws = XLSX.utils.json_to_sheet(DEMO_FLOWSHEET_ROWS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'HourZero_Telemetry');
  return wb;
}

export function downloadDemoWorkbookFile() {
  const wb = buildDemoWorkbook();
  XLSX.writeFile(wb, 'HourZero_Demo_Flowsheet.xlsx');
}

