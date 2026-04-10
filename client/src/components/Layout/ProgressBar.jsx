import { useEffect, useState } from "react";

export default function ProgressBar({ active }) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf;
    let fadeTimeout;

    if (active) {
      setVisible(true);
      setWidth(0);

      // Animate to ~85% quickly, then slow down (never reaches 100 until done)
      const start = performance.now();
      function step(now) {
        const elapsed = now - start;
        // Fast initial progress, then asymptotically approaches 85
        const progress = 85 * (1 - Math.exp(-elapsed / 2000));
        setWidth(progress);
        raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    } else if (visible) {
      // Complete the bar instantly then fade out
      cancelAnimationFrame(raf);
      setWidth(100);
      fadeTimeout = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fadeTimeout);
    };
  }, [active]); // eslint-disable-line

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full bg-violet-500 transition-all duration-200 ease-out"
        style={{
          width: `${width}%`,
          opacity: width >= 100 ? 0 : 1,
          transition: width >= 100 ? "width 0.15s ease-out, opacity 0.3s ease-out 0.1s" : "width 0.2s ease-out",
          boxShadow: "0 0 6px rgba(139, 92, 246, 0.6)",
        }}
      />
    </div>
  );
}
