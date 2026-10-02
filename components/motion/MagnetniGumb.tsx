"use client";

import { useRef, type ReactNode } from "react";

import { gsap, useGSAP } from "@/components/motion/gsap/register";
import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import { DUR, EASE } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

// ============================================================================
// <MagnetniGumb /> — gumb se nagne proti kazalcu
// ----------------------------------------------------------------------------
// Glavni gumb se ob približevanju miške premakne nekaj pikslov proti njej in
// se ob odmiku vrne. Učinek je, da se gumb odzove, PREDEN ga klikneš — kar
// je pri enem samem gumbu na zaslonu prijetno, pri desetih pa nadležno.
// Zato ga uporabi SAMO na glavnem dejanju odseka.
//
// Šest pikslov je meja: več in gumb bega pod kazalcem, kar oteži klik
// namesto da bi ga olajšalo.
//
// Samo tam, kjer je miška. Na dotiku ni kazalca, ki bi se mu gumb nagibal,
// in `pointerfine` je edini zanesljiv način, da to ločimo — širina zaslona
// ne pove ničesar o tem, ali gost drži prst ali miško.
// ============================================================================

export function MagnetniGumb({
  children,
  className,
  /** Koliko pikslov se sme premakniti. Šest je meja udobja. */
  doseg = 6,
}: {
  children: ReactNode;
  className?: string;
  doseg?: number;
}) {
  const ovoj = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const vozlisce = ovoj.current;
      if (!vozlisce || prefersReducedMotion()) return;

      const mm = gsap.matchMedia();

      mm.add("(hover: hover) and (pointer: fine)", () => {
        const premakni = (e: PointerEvent) => {
          const r = vozlisce.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
          const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
          gsap.to(vozlisce, {
            x: gsap.utils.clamp(-doseg, doseg, dx * doseg),
            y: gsap.utils.clamp(-doseg, doseg, dy * doseg),
            duration: DUR.fast,
            ease: EASE.out,
            overwrite: true,
          });
        };

        const vrni = () => {
          gsap.to(vozlisce, {
            x: 0,
            y: 0,
            duration: DUR.base,
            ease: EASE.spring,
            overwrite: true,
          });
        };

        vozlisce.addEventListener("pointermove", premakni);
        vozlisce.addEventListener("pointerleave", vrni);

        return () => {
          vozlisce.removeEventListener("pointermove", premakni);
          vozlisce.removeEventListener("pointerleave", vrni);
          gsap.set(vozlisce, { x: 0, y: 0 });
        };
      });

      return () => mm.revert();
    },
    { scope: ovoj, dependencies: [doseg] },
  );

  return (
    <span ref={ovoj} className={cn("inline-flex", className)}>
      {children}
    </span>
  );
}
