import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let instance;
let preference;
const tick = time => instance?.raf(time * 1000);
const easing = t => Math.min(1, 1.001 - Math.pow(2, -10 * t));

function syncScrolling() {
  if (preference.matches) {
    gsap.ticker.remove(tick);
    instance?.destroy();
    instance = null;
  } else if (!instance) {
    instance = new Lenis({ duration: 1.2, easing, smoothWheel: true });
    instance.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
  }
}

export function initLenis() {
  if (typeof window === 'undefined') return null;
  if (!preference) {
    preference = window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)');
    preference.addEventListener('change', syncScrolling);
    syncScrolling();
  }
  return instance;
}

export function scrollTo(target, options = {}) {
  const offset = options.offset ?? -80;
  if (instance) {
    instance.scrollTo(target, { duration: 1.4, easing, offset, ...options });
    return;
  }
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (element == null) return;
  const top = typeof element === 'number' ? element : window.scrollY + element.getBoundingClientRect().top + offset;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
}

export function destroyLenis() {
  preference?.removeEventListener('change', syncScrolling);
  preference = null;
  gsap.ticker.remove(tick);
  instance?.destroy();
  instance = null;
}
