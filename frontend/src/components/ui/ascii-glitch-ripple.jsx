import React, { useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

// Reference character pool from VengeanceUI ASCII Glitch Ripple
const DEFAULT_CHARS = '.,·-─~+:;=*π""┐┌┘┴┬╗╔╝╚╬╠╣╩╦║········□!?&#$@0123456789*';
const WAVE_THRESH = 3.2;
const CHAR_MULT = 3;
const ANIM_STEP = 36;
const WAVE_BUF = 4;

export function AsciiGlitchRipple({
  children,
  as = 'span',
  className = '',
  dur = 850,
  chars = DEFAULT_CHARS,
  preserveSpaces = true,
  spread = 1.1,
  glitchColor,
  style = {},
  ...props
}) {
  const Component = as;
  const containerRef = useRef(null);
  const animIdRef = useRef(null);
  const isHoveredRef = useRef(false);
  const wavesRef = useRef([]);
  const charSlotsRef = useRef([]);

  const { isDark } = useTheme();
  const activeGlitchColor = glitchColor || (isDark ? '#35D6C5' : '#0D7679');

  const textString = typeof children === 'string' ? children : String(children ?? '');

  // Parse text into words and spaces to preserve 100% natural word wrapping and layout flow
  const tokenStructure = useMemo(() => {
    if (!textString) return [];
    const tokens = textString.split(/(\s+)/);
    let globalIndex = 0;
    return tokens.map((token) => {
      const isSpace = /^\s+$/.test(token);
      const charsList = token.split('').map((char) => ({
        char,
        index: globalIndex++
      }));
      return { isSpace, token, charsList };
    });
  }, [textString]);

  const totalChars = textString.length;

  // Restore all character slots back to original readable text
  const restoreAllCharacters = () => {
    charSlotsRef.current.forEach((slot) => {
      if (!slot) return;
      if (slot.origEl) slot.origEl.style.visibility = 'visible';
      if (slot.scrambleEl) slot.scrambleEl.style.display = 'none';
    });
  };

  // Immediate cleanup on unmount
  useEffect(() => {
    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
      wavesRef.current = [];
    };
  }, []);

  // Restore if text changes dynamically
  useEffect(() => {
    restoreAllCharacters();
  }, [textString]);

  const startAnimationLoop = () => {
    if (animIdRef.current) return;

    const animate = () => {
      const now = performance.now();

      // Evict completed waves
      wavesRef.current = wavesRef.current.filter((w) => now - w.startTime < dur);

      // If no waves remaining or cursor has left, stop and restore immediately
      if (wavesRef.current.length === 0 || !isHoveredRef.current) {
        restoreAllCharacters();
        animIdRef.current = null;
        return;
      }

      // Compute character scrambling for active waves
      for (let i = 0; i < totalChars; i++) {
        const slot = charSlotsRef.current[i];
        if (!slot) continue;

        let shouldScramble = false;
        let scrambleChar = '';

        for (const w of wavesRef.current) {
          const age = now - w.startTime;
          const prog = Math.min(age / dur, 1.0);
          const dist = Math.abs(i - w.center);
          const maxDist = Math.max(w.center, totalChars - w.center - 1);
          const rad = (prog * (maxDist + WAVE_BUF)) / spread;

          if (dist <= rad) {
            const intensity = rad - dist;
            // Scramble only at the active ripple wavefront
            if (intensity > 0 && intensity <= WAVE_THRESH) {
              shouldScramble = true;
              const charIdx = (dist * CHAR_MULT + Math.floor(age / ANIM_STEP)) % chars.length;
              scrambleChar = chars[charIdx];
              break;
            }
          }
        }

        if (shouldScramble && slot.origChar !== ' ') {
          if (slot.origEl) slot.origEl.style.visibility = 'hidden';
          if (slot.scrambleEl) {
            slot.scrambleEl.textContent = scrambleChar;
            slot.scrambleEl.style.display = 'block';
          }
        } else {
          if (slot.origEl) slot.origEl.style.visibility = 'visible';
          if (slot.scrambleEl) slot.scrambleEl.style.display = 'none';
        }
      }

      animIdRef.current = requestAnimationFrame(animate);
    };

    animIdRef.current = requestAnimationFrame(animate);
  };

  const getCharIndexFromEvent = (e) => {
    const el = containerRef.current;
    if (!el || totalChars === 0) return 0;

    // Direct check: elementFromPoint on character spans
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const closestCharSpan = target?.closest('[data-char-idx]');
    if (closestCharSpan) {
      const idx = parseInt(closestCharSpan.getAttribute('data-char-idx'), 10);
      if (!isNaN(idx)) return Math.max(0, Math.min(idx, totalChars - 1));
    }

    // Fallback: estimate from bounding rect
    const rect = el.getBoundingClientRect();
    if (!rect.width) return 0;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return Math.floor(ratio * (totalChars - 1));
  };

  const handlePointerEnter = (e) => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    isHoveredRef.current = true;
    const center = getCharIndexFromEvent(e);
    wavesRef.current = [{ center, startTime: performance.now(), id: Math.random() }];
    startAnimationLoop();
  };

  const handlePointerMove = (e) => {
    if (!isHoveredRef.current) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const newCenter = getCharIndexFromEvent(e);
    const lastWave = wavesRef.current[wavesRef.current.length - 1];
    if (!lastWave || Math.abs(newCenter - lastWave.center) >= 2) {
      // Keep only most recent waves to prevent visual mud
      wavesRef.current = [
        ...wavesRef.current.slice(-1),
        { center: newCenter, startTime: performance.now(), id: Math.random() }
      ];
      if (!animIdRef.current) {
        startAnimationLoop();
      }
    }
  };

  const handlePointerLeave = () => {
    isHoveredRef.current = false;
    if (animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
    }
    wavesRef.current = [];
    restoreAllCharacters();
  };

  // Register slot refs
  const registerSlot = (idx, origChar, origEl, scrambleEl) => {
    charSlotsRef.current[idx] = { origChar, origEl, scrambleEl };
  };

  return (
    <Component
      ref={containerRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={className}
      style={{
        position: 'relative',
        cursor: props.onClick || as === 'a' ? 'pointer' : 'default',
        userSelect: 'none',
        ...style
      }}
      aria-label={textString}
      {...props}
    >
      {tokenStructure.map((tokenObj, tIdx) => {
        if (tokenObj.isSpace) {
          return (
            <span key={tIdx} style={{ whiteSpace: 'pre' }}>
              {tokenObj.token}
            </span>
          );
        }

        return (
          <span
            key={tIdx}
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap'
            }}
          >
            {tokenObj.charsList.map(({ char, index }) => (
              <span
                key={index}
                data-char-idx={index}
                ref={(node) => {
                  if (node) {
                    registerSlot(index, char, node.children[0], node.children[1]);
                  }
                }}
                style={{
                  display: 'inline-block',
                  position: 'relative',
                  whiteSpace: 'pre'
                }}
              >
                <span style={{ display: 'inline-block', transition: 'none' }}>
                  {char}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'none',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    color: activeGlitchColor,
                    fontWeight: 'inherit',
                    fontFamily: 'inherit',
                    lineHeight: 'inherit'
                  }}
                />
              </span>
            ))}
          </span>
        );
      })}
    </Component>
  );
}

export default AsciiGlitchRipple;
