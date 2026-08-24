"use client";

import { useEffect, useState } from "react";

type Pulse = { id: number; x: number; y: number };

/** SOTG click pulse：点击处一圈湿波，不拦截事件。 */
export function ClickPulse() {
  const [pulses, setPulses] = useState<Pulse[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let id = 0;
    const onClick = (event: MouseEvent) => {
      const next = { id: (id += 1), x: event.clientX, y: event.clientY };
      setPulses((prev) => [...prev.slice(-4), next]);
      window.setTimeout(() => {
        setPulses((prev) => prev.filter((item) => item.id !== next.id));
      }, 700);
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {pulses.map((pulse) => (
        <span
          key={pulse.id}
          className="absolute size-8 rounded-full border border-lab-primary/70 animate-[rain-pulse_0.7s_ease-out_forwards]"
          style={{ left: pulse.x, top: pulse.y }}
        />
      ))}
    </div>
  );
}
