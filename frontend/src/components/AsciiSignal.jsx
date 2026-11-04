import React, { useEffect, useRef } from 'react';

/**
 * Lead II Clinical ECG Waveform Generator
 * Produces recognizable physiological deflections:
 * - P wave: smooth, rounded atrial depolarization
 * - PR segment: isoelectric baseline
 * - Q wave: small downward deflection
 * - R wave: sharp, tall ventricular depolarization spike
 * - S wave: sharp downward plunge below baseline
 * - ST segment: isoelectric baseline
 * - T wave: broader, smooth ventricular repolarization wave
 * - TP segment: isoelectric interval before next cardiac cycle
 *
 * Returns y-offset relative to baseline (negative is upward in canvas coordinates).
 */
function getEcgY(u, amplitude) {
  // u is normalized [0, 1) representing one complete cardiac cycle
  if (u < 0.12) {
    return 0; // Isoelectric baseline
  } else if (u < 0.22) {
    // P wave: rounded deflection
    const t = (u - 0.12) / 0.10;
    return -amplitude * 0.15 * Math.sin(t * Math.PI);
  } else if (u < 0.28) {
    return 0; // PR interval
  } else if (u < 0.31) {
    // Q wave: small downward dip
    const t = (u - 0.28) / 0.03;
    return amplitude * 0.08 * Math.sin(t * Math.PI);
  } else if (u < 0.35) {
    // R peak upstroke: steep spike
    const t = (u - 0.31) / 0.04;
    return -amplitude * 0.95 * t;
  } else if (u < 0.39) {
    // R peak downstroke into S trough
    const t = (u - 0.35) / 0.04;
    return -amplitude * 0.95 + t * (amplitude * 0.95 + amplitude * 0.25);
  } else if (u < 0.42) {
    // S wave recovery to baseline
    const t = (u - 0.39) / 0.03;
    return amplitude * 0.25 * (1 - t);
  } else if (u < 0.48) {
    return 0; // ST segment
  } else if (u < 0.64) {
    // T wave: smooth, slightly asymmetric upward wave
    const t = (u - 0.48) / 0.16;
    return -amplitude * 0.25 * Math.sin(Math.pow(t, 0.92) * Math.PI);
  } else {
    return 0; // TP isoelectric interval
  }
}

export default function AsciiSignal({ light }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animFrame = 0;
    let isVisible = false;
    let lastTimestamp = 0;
    let offset = 0;

    // Movement speed: pixels per second moving from right to left
    const SPEED = 78;

    function draw(currentOffset) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Hospital patient monitor coordinate grid
      const minorGridSpacing = 16;
      const majorGridSpacing = 64;

      ctx.lineWidth = 1;

      // Minor grid
      ctx.strokeStyle = light ? 'rgba(13, 118, 121, 0.045)' : 'rgba(53, 214, 197, 0.045)';
      ctx.beginPath();
      for (let x = 0; x <= width; x += minorGridSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += minorGridSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Major grid
      ctx.strokeStyle = light ? 'rgba(13, 118, 121, 0.10)' : 'rgba(53, 214, 197, 0.10)';
      ctx.beginPath();
      for (let x = 0; x <= width; x += majorGridSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += majorGridSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Calculate ECG cycle and baseline geometry
      const baselineY = Math.round(height * 0.54);
      const amplitude = Math.min(52, Math.max(34, height * 0.36));
      // Cardiac cycle width in pixels (represents 1 heart beat ~ 72 bpm)
      const cycleWidth = Math.max(160, Math.min(220, Math.round(width * 0.34)));

      // Draw continuous medical ECG waveform
      ctx.beginPath();
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = light ? '#0D7679' : '#35D6C5';

      if (!light) {
        ctx.shadowColor = 'rgba(53, 214, 197, 0.45)';
        ctx.shadowBlur = 4;
      } else {
        ctx.shadowBlur = 0;
      }

      // Sample continuously across visible canvas pixels
      for (let x = 0; x <= width; x++) {
        // As currentOffset increases, the wave moves from right to left
        const pos = (x + currentOffset) % cycleWidth;
        const u = (pos < 0 ? pos + cycleWidth : pos) / cycleWidth;
        const y = baselineY + getEcgY(u, amplitude);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow for next frame
    }

    function animate(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      offset += SPEED * delta;
      draw(offset);

      animFrame = requestAnimationFrame(animate);
    }

    function sync() {
      cancelAnimationFrame(animFrame);
      if (!isVisible || document.hidden) return;

      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      if (motionQuery.matches) {
        // Display static waveform for reduced motion preference
        draw(0);
      } else {
        lastTimestamp = 0;
        animFrame = requestAnimationFrame(animate);
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      sync();
    });

    const resizeObserver = new ResizeObserver(sync);
    observer.observe(canvas);
    resizeObserver.observe(canvas);

    const handleMotionChange = () => sync();
    const handleVisibilityChange = () => sync();

    motionQuery.addEventListener('change', handleMotionChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animFrame);
      observer.disconnect();
      resizeObserver.disconnect();
      motionQuery.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [light]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Real-time ECG Lead II telemetry waveform"
      role="img"
      style={{
        display: 'block',
        width: '100%',
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    />
  );
}
