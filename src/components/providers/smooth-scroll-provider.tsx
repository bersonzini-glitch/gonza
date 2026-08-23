"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Enables Lenis smooth scrolling only where it's a strict improvement:
 * non-touch pointers (fine pointer + hover), and only when the user
 * hasn't asked for reduced motion. On touch devices native momentum
 * scrolling is faster and more predictable, so Lenis stays off there.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // matchMedia only exists client-side, so this can't be a lazy
    // useState initializer without risking a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(!coarsePointer && !reducedMotion);
  }, []);

  if (!enabled) return <>{children}</>;

  return (
    <ReactLenis root options={{ lerp: 0.12, duration: 1.1, wheelMultiplier: 1 }}>
      {children}
    </ReactLenis>
  );
}
