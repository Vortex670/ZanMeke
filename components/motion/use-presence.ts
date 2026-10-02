"use client";

import { useRef, useState, type RefObject } from "react";

import { gsap, useGSAP } from "./gsap/register";
import { prefersReducedMotion } from "./reduced-motion";
import { DUR } from "./tokens";

type PresenceAnimation = gsap.core.Animation | void;

export type PresenceOptions<T extends HTMLElement> = {
  /** Vstopna animacija — teče takoj po tem, ko je element v DOM-u. */
  enter: (el: T) => PresenceAnimation;
  /** Izhodna animacija — element ostane v DOM-u, dokler se ne konča. */
  exit: (el: T) => PresenceAnimation;
  /**
   * `false` → element, ki je prisoten že ob prvem izrisu (npr. SSR pasica),
   * NE dobi vstopne animacije (kot `initial={false}`). Privzeto `true`.
   */
  initial?: boolean;
};

/**
 * usePresence — nadomestek `AnimatePresence`: element ostane v DOM-u med
 * izhodno animacijo. Vrne `mounted` (ali naj se element izriše) in `ref`,
 * ki ga pripneš na animirani element.
 *
 * `prefers-reduced-motion`: vstop/izhod sta samo kratka zatemnitev
 * (`DUR.reduced`, 150 ms), brez premikov (§9 pravilo 6).
 *
 * Uporaba:
 *   const { mounted, ref } = usePresence<HTMLDivElement>(open, {
 *     enter: (el) => gsap.fromTo(el, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: DUR.fast, ease: EASE.out }),
 *     exit: (el) => gsap.to(el, { y: 16, opacity: 0, duration: DUR.fast, ease: EASE.out }),
 *   });
 *   return mounted ? <div ref={ref}>…</div> : null;
 */
export function usePresence<T extends HTMLElement>(
  open: boolean,
  options: PresenceOptions<T>,
): { mounted: boolean; ref: RefObject<T | null> } {
  const ref = useRef<T>(null);
  const [mounted, setMounted] = useState(open);
  const firstRun = useRef(true);

  // Odpiranje: element vstopi v DOM v istem izrisu (setState med izrisom).
  if (open && !mounted) setMounted(true);

  useGSAP(
    () => {
      const isInitial = firstRun.current;
      firstRun.current = false;
      const el = ref.current;
      if (!el) return;

      gsap.killTweensOf(el);

      if (open) {
        if (isInitial && options.initial === false) return;
        if (prefersReducedMotion()) {
          gsap.fromTo(
            el,
            { opacity: 0 },
            { opacity: 1, duration: DUR.reduced, clearProps: "opacity" },
          );
          return;
        }
        options.enter(el);
        return;
      }

      if (!mounted) return;
      const done = () => setMounted(false);
      if (prefersReducedMotion()) {
        gsap.to(el, { opacity: 0, duration: DUR.reduced, onComplete: done });
        return;
      }
      const anim = options.exit(el);
      if (anim) anim.eventCallback("onComplete", done);
      else done();
    },
    { dependencies: [open, mounted] },
  );

  return { mounted, ref };
}
