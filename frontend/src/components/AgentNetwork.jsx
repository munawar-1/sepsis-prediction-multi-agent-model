import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollTo } from '../utils/lenis';
import { EvidenceVisual, scenes } from './EvidenceVisuals';

gsap.registerPlugin(ScrollTrigger);
const desktop = '(min-width: 901px) and (min-height: 610px) and (prefers-reduced-motion: no-preference)';

export default function AgentNetwork() {
  const root = useRef(null), viewport = useRef(null), trigger = useRef(null);
  const [stage,setStage] = useState(0);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add(desktop, () => {
      const box = viewport.current;
      box.scrollLeft = 0;
      const track = box.firstElementChild;
      const timeline = gsap.timeline({scrollTrigger: { trigger:root.current, pin:true, start:'top 64px',
        end:()=>'+='+Math.round(innerHeight*3.5), invalidateOnRefresh:true, scrub:.32 }});
      // Hold each composition long enough to inspect it, then translate the entire filmstrip.
      scenes.forEach((_,i) => {
        timeline.to(track,{x:()=>-i*box.clientWidth, duration:i ? .42 : 0, ease:'power1.inOut'});
        timeline.to({}, {duration:.56});
      });
      timeline.eventCallback('onUpdate',()=>{
        const position = -Number(gsap.getProperty(track,'x'))/box.clientWidth;
        setStage(Math.max(0,Math.min(3,Math.round(position))));
        root.current.style.setProperty('--read',timeline.progress());
      });
      trigger.current = timeline.scrollTrigger;
      return () => { trigger.current=null; setStage(0); };
    });
    return ()=>media.revert();
  }, {scope:root});

  function select(index) {
    const st=trigger.current;
    if(st) {
      const time=index*.98+.28;
      scrollTo(st.start+(st.end-st.start)*time/st.animation.duration(),{offset:0,duration:.7});
    } else viewport.current.scrollTo({left:index*viewport.current.clientWidth,
      behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function nativeScroll() {
    if(trigger.current) return;
    const el=viewport.current;
    setStage(Math.round(el.scrollLeft/el.clientWidth));
    root.current.style.setProperty('--read',el.scrollLeft/(3*el.clientWidth));
  }
  return <section id="intelligence" className="evidence" ref={root} aria-label="Inspect the agent evidence">
    <header className="evidence-head"><span className="plate-id">03 / Agent evidence</span>
      <span className="evidence-counter" key={stage}>PLATE 0{stage+1} <em>/ 04</em></span></header>
    <div className="evidence-window" ref={viewport} onScroll={nativeScroll}>
      <div className="evidence-track">{scenes.map((s,i)=><article key={s.name} className="evidence-scene" data-current={stage===i} aria-hidden={stage!==i}>
        <div className="evidence-copy"><small className="plate-id">{s.name} / {s.field}</small>
          <h2>{s.title}</h2><p>{s.copy}</p><div className="evidence-note"><b>{s.fact}</b><span>{s.note}</span></div>
        </div>
        <figure><EvidenceVisual index={i}/><figcaption><span>FIG. 03.{i+1}</span>{s.caption}</figcaption></figure>
      </article>)}</div>
    </div>
    <nav aria-label="Agent scenes" className="evidence-nav">{scenes.map((s,i)=>
      <button key={s.name} aria-pressed={stage===i} onClick={()=>select(i)}><small>0{i+1}</small> {s.name}</button>)}</nav>
    <div className="evidence-meter" aria-hidden="true"><i/></div>
  </section>;
}
