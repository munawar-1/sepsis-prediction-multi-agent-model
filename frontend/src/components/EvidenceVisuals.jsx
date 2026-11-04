import React from 'react';
import { SIMULATION_TIMELINE } from '../utils/constants';

const baseline=SIMULATION_TIMELINE[0], observation=SIMULATION_TIMELINE[3];
export const scenes=[
  {name:'Vitals',field:'Physiology',title:'Read the rhythm.',copy:'The Vitals Agent compares heart rate, blood pressure, and respiration across rolling five-minute windows. Its Random Forest model looks for signals that drift apart.',fact:'72 → 101 bpm',note:'Heart rate from admission to hour 14',caption:'Bedside telemetry · illustrative replay'},
  {name:'Labs',field:'Biochemistry',title:'Follow the sample.',copy:'The Labs Agent compares new results with earlier samples. Lactate rises while platelets fall in this case. The age of the specimen matters when interpreting either change.',fact:'1.0 → 2.1 mmol/L',note:'Serum lactate over the same interval',caption:'Paired specimen results · admission and hour 14'},
  {name:'Medication',field:'Clinical context',title:'Check the timing.',copy:'The Medication Agent checks the administration record. In this replay, a recent albuterol dose offers a possible explanation for the rising pulse. The agent compares its timing with the persistent physiological changes.',fact:'5 hours',note:'Since albuterol administration at the hour 14 review',caption:'Medication record · illustrative timing'},
  {name:'Convergence',field:'Decision support',title:'Review the evidence.',copy:'The Aegis decision engine combines the three assessments into an explanation. A clinician can inspect the evidence, authorize a response, or record a reason to override it.',fact:'3 evidence streams',note:'One assessment for clinician review',caption:'Agent synthesis · clinician retains decision authority'}
];
function Trace({d,color='var(--ink-a)',delay=0}) {
  return <g fill="none" stroke={color}><path d={d} strokeWidth="2"/><path className="signal-runner" d={d} pathLength="100" strokeDasharray="5 95" strokeWidth="4" style={{animationDelay:delay+'s'}}/></g>;
}
function Vitals() {
  return <>{['ECG · LEAD II','ARTERIAL PRESSURE','RESPIRATION'].map((label,i)=><text key={label} x="20" y={33+i*83}>{label}</text>)}
    {[0,1,2,3,4].map(i=><g key={i} transform={'translate('+i*88+',0)'}><Trace d="M20 72h19l5-4 4 5 4-2 4-22 4 36 5-18 6 5h17" delay={i*-.12}/></g>)}
    <Trace d="M20 155q12-34 22-7t37 8q11-32 20-9t38 8q12-34 22-8t37 8q11-32 20-9t38 8q12-34 22-8t37 8q11-32 20-9t38 8q12-34 22-8t32 8" color="var(--ink-b)"/>
    <Trace d="M20 240q20-38 48 0t48 0t48 0t48 0t48 0t48 0t48 0t48 0t48 0" color="var(--ink-c)"/></>;
}
function Labs() {
  return <>{[['Lactate',baseline.lactate,observation.lactate,'mmol/L',.48,1],['Platelets',baseline.platelets,observation.platelets,'×10⁹/L',1,.70],['WBC',baseline.wbc,observation.wbc,'×10⁹/L',.49,1]].map(([label,a,b,unit,f1,f2],i)=>
    <g key={label} transform={'translate(22,'+(30+i*81)+')'}><text>{label.toUpperCase()}</text>
      <text x="424" textAnchor="end">{a} → {b} {unit}</text>
      <rect y="14" width={400*f1} height="5" fill="var(--line)"/>
      <rect className="assay-bar" y="25" width={400*f2} height="10" fill={i===1?'var(--ink-c)':'var(--ink-b)'}/></g>)}</>;
}
function Medication() {
  return <><text x="24" y="32">ADMINISTRATION RECORD</text><text x="448" y="32" textAnchor="end">CASE REPLAY</text>
    <path d="M48 210H426 M53 74V215" stroke="var(--line)" fill="none"/>
    <Trace d="M54 74C128 88 169 144 250 168S356 190 416 197" color="var(--ink-c)"/>
    <path d="M54 152Q170 139 268 113T416 92" fill="none" stroke="var(--ink-a)" strokeDasharray="5 5"/>
    <circle cx="54" cy="74" r="6" fill="var(--ink-c)"/><circle cx="416" cy="92" r="6" fill="var(--ink-a)"/>
    <text x="65" y="65">DOSE</text><text x="417" y="77" textAnchor="end">PULSE TREND</text>
    <text x="48" y="240">09:00</text><text x="420" y="240" textAnchor="end">14:00 · REVIEW</text>
    <text x="48" y="264">Schematic decay · relative scale</text></>;
}
function Convergence() {
  return <>{['VITALS','LABS','MEDICATION'].map((name,i)=><g className="merge-path" key={name} style={{'--delay':i*.32+'s'}}>
    <text x="14" y={64+i*72}>{name}</text>
    <Trace d={'M112 '+(60+i*72)+' C190 '+(60+i*72)+' 180 132 230 132'} color={['var(--ink-a)','var(--ink-b)','var(--ink-c)'][i]} delay={i*-.65}/></g>)}
    <path d="M260 99l30 17v33l-30 17-30-17v-33z" fill="var(--surface)" stroke="var(--ink-a)" strokeWidth="2"/>
    <path d="M246 134h6l5-11 5 21 5-14h8" stroke="var(--ink-a)" fill="none"/><Trace d="M290 132H423"/>
    <circle cx="425" cy="132" r="8" fill="var(--ink-a)"/><text x="260" y="193" textAnchor="middle">AEGIS</text>
    <text x="425" y="166" textAnchor="middle">REVIEW</text></>;
}
const diagrams=[Vitals,Labs,Medication,Convergence];
export function EvidenceVisual({index}) {
  const Diagram=diagrams[index];
  return <svg viewBox="0 0 470 280" role="img" aria-label={scenes[index].caption}><Diagram/></svg>;
}
