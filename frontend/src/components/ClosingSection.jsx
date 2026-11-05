import React,{useRef} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {useTheme} from '../context/ThemeContext';
import {scrollTo} from '../utils/lenis';
import {useLandingReveals} from './cineMotion';
import AsciiSignal from './AsciiSignal';

export default function ClosingSection({onOpenFlightDeck}){
  const root=useRef(null), {isDark}=useTheme();
  useLandingReveals(root);
  function magnet(e){
    if(!matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)').matches)return;
    const rect=e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx',((e.clientX-rect.left)/rect.width-.5)*10+'px');
    e.currentTarget.style.setProperty('--my',((e.clientY-rect.top)/rect.height-.5)*8+'px');
  }
  return <section className="signal-end" ref={root}>
    <div className="signal-end-copy"><small className="plate-id">07 / Clinical handoff</small>
      <h2>The next decision<br/>belongs to the clinician.</h2>
      <div className="end-actions"><button className="end-primary" onClick={onOpenFlightDeck} onPointerMove={magnet}
        onPointerLeave={e=>{e.currentTarget.style.removeProperty('--mx');e.currentTarget.style.removeProperty('--my')}}>Launch Clinical Flight Deck <ArrowUpRight size={16}/></button>
        <button className="end-link" onClick={()=>scrollTo('#clinical-review')}>Explore the review</button></div></div>
    <figure className="ascii-instrument"><figcaption>OUTPUT / SIGNAL TRACE</figcaption><AsciiSignal light={!isDark}/><small>HourZero · RESEARCH PLATFORM</small></figure>
  </section>;
}
