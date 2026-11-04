import React, {useRef,useState} from 'react';
import gsap from 'gsap';
import {useGSAP} from '@gsap/react';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {WORKFLOW_STEPS, SIMULATION_TIMELINE} from '../utils/constants';
import {scrollTo} from '../utils/lenis';

const handoffs=[
  ['Observation','Bedside observations and the electronic record enter the same case timeline.','Telemetry + EHR'],
  ['Vitals review','Compare the rising pulse with pressure and respiratory trends.','Physiological evidence'],
  ['Sample review','Check the laboratory trend and how recently the sample was drawn.','Biochemical evidence'],
  ['Medication review','Compare the dose time with the persistence of the vital changes.','Pharmacological context'],
  ['Synthesis','Bring the three findings together with the reasons behind each assessment.','Decision engine'],
  ['Clinical review','The clinician reviews the explanation and records a decision.','Clinician handoff'],
];
const sample=SIMULATION_TIMELINE[3];
const evidenceNotes=[
  ['Intake record', 'Bedside telemetry · laboratory results · eMAR'],
  ['Bedside observation', sample.hr+' bpm · '+sample.bp+' mmHg · '+sample.resp+' breaths/min'],
  ['Sample results', 'Lactate '+sample.lactate+' mmol/L · platelets '+sample.platelets+' ×10⁹/L'],
  ['Administration record', 'Albuterol · 5 hours before review'],
  ['Evidence attached', 'Pulse drift · rising lactate · medication timing'],
  ['Review requested', 'Inspect evidence · authorize or record an override'],
];
export default function ClinicalWorkflow() {
  const root=useRef(null), pin=useRef(null);
  const [index,setIndex]=useState(0);
  useGSAP(()=>{
    const media=gsap.matchMedia();
    media.add('(min-width: 901px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)',()=>{
      pin.current=ScrollTrigger.create({trigger:root.current,pin:true,start:'top 64px',end:'+=225%',
        onUpdate:self=>setIndex(Math.min(5,Math.floor(self.progress*6)))});
      return ()=>{pin.current=null};
    });
    return ()=>media.revert();
  },{scope:root});
  function select(i) {
    if(pin.current){const {start,end}=pin.current;scrollTo(start+(end-start)*(i+.5)/6,{offset:0});}
    else setIndex(i);
  }
  return <section id="how-it-works" className="caseflow" ref={root}>
    <div className="caseflow-image"><img loading="lazy" src="/assets/stitch-patient-icu.png" alt="" style={{transform:'scale('+(1+index*.035)+') translateX('+(-index*.45)+'%)'}}/>
      <div className="flow-slip" key={index}><small>{evidenceNotes[index][0]}</small><strong>{evidenceNotes[index][1]}</strong></div></div>
    <div className="caseflow-body"><div className="plate-id">04 / Clinical workflow</div>
      <h2>From bedside<br/>to clinical review.</h2>
      <div className="handoff" key={index}><small>STEP 0{index+1} / 06</small><h3>{handoffs[index][0]}</h3><p>{handoffs[index][1]}</p></div>
      <div className="caseflow-record"><span>CASE P–10492</span><b>{handoffs[index][2]}</b></div>
    </div>
    <nav aria-label="Clinical workflow steps">{WORKFLOW_STEPS.map((s,i)=><button key={s.step} onClick={()=>select(i)} aria-pressed={index===i}><small>{s.step}</small>{s.title}</button>)}</nav>
  </section>;
}
