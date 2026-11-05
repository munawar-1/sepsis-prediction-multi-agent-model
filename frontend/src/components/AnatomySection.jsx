import React, { useEffect, useRef } from 'react';

export default function AnatomySection() {
  const stage = useRef(null);
  useEffect(() => {
    const host = stage.current;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const abort = new AbortController();
    let renderer, loading = false, visible = false;
    async function update() {
      const shouldDraw = visible && !document.hidden && !motion.matches;
      if (renderer) {
        renderer.setActive(shouldDraw);
        host.dataset.ready = String(!motion.matches && renderer.available());
      } else if (shouldDraw && !loading && !navigator.connection?.saveData && (navigator.deviceMemory || 8) >= 4) {
        loading = true;
        try {
          const { createAtlas } = await import('./anatomyRenderer');
          if (abort.signal.aborted) return;
          renderer = await createAtlas(host, abort.signal);
          if (renderer) update();
        } catch { /* Keep the reference illustration visible if graphics or decoding is unavailable. */ }
      }
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(host);
    motion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      abort.abort(); observer.disconnect(); renderer?.dispose();
      motion.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return <section className="cine-anatomy">
    <div className="cine-label">02 / ANATOMICAL STUDY</div>
    <div className="cine-anatomy-layout">
      <div><small>FIG. 01 · ANTERIOR VIEW</small>
        <h2>At the center,<br/>a patient.</h2>
        <p>Heart rate, respiration, and laboratory findings describe different parts of the same patient. HourZero brings those observations together for review.</p>
        <div className="cine-credit">Anatomical study adapted from <a href="https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html">BodyParts3D</a>, © The Database Center for Life Science. <a href="/assets/anatomy-credits.txt">Model sources and licenses</a>.</div>
      </div>
      <div ref={stage} className="cine-anatomy-view" role="img" aria-label="Full-body anatomical study with translucent skin, ribs, lungs and illuminated heart">
        <img loading="lazy" src="/assets/anatomy-poster.webp" alt=""/><canvas aria-hidden="true"/>
      </div>
    </div>
  </section>;
}
