import gsap from 'gsap';
import {useGSAP} from '@gsap/react';

export function useLandingReveals(ref) {
  useGSAP(()=>{
    const media=gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)',()=>{
      const main=ref.current.closest('main');
      for(const section of main.querySelectorAll('#problem, .cine-anatomy, #clinical-review, #simulation, .signal-end')){
        const heading=section.querySelector('h2');
        const label=section.querySelector('.eyebrow-tag,.plate-id,.cine-label');
        const desc=heading.parentElement.querySelector('p');
        gsap.from([label,heading,desc].filter(Boolean),{y:22,opacity:0,duration:.72,stagger:.12,
          scrollTrigger:{trigger:heading,start:'top 94%',once:true}});
      }
      for(const visual of main.querySelectorAll('.problem-photo,.cine-anatomy-view,#simulation .ui-panel')){
        gsap.from(visual,{clipPath:'inset(0% 12% 12% 0%)',duration:1,ease:'power2.out',
          scrollTrigger:{trigger:visual,start:'top 90%',once:true}});
      }
      const alert=main.querySelector('#clinical-review .ui-panel');
      gsap.from(alert.children,{x:18,opacity:.25,stagger:.11,duration:.65,
        scrollTrigger:{trigger:alert,start:'top 83%',once:true}});
      gsap.from(main.querySelectorAll('.caseflow nav button'),{y:13,stagger:.07,
        scrollTrigger:{trigger:main.querySelector('.caseflow nav'),start:'top 95%',once:true}});
      gsap.from(ref.current.querySelectorAll('.end-actions button,.ascii-instrument'),{y:18,opacity:0,stagger:.12,
        scrollTrigger:{trigger:ref.current,start:'top 85%',once:true}});
    });
    return ()=>media.revert();
  },{scope:ref});
}
