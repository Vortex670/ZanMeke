"use client";

import { useRef } from "react";

import { gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsap/register";
import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import { DUR, EASE } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

// ============================================================================
// <SteviloNaraste /> — število se ob prvem pogledu prišteje do svoje vrednosti
// ----------------------------------------------------------------------------
// Uporabno SAMO tam, kjer je število sporočilo: 307 mnenj, ocena 4,4, leto
// 1991. Pri ceni ali uri je to motnja — cena, ki se vrti, je cena, ki je
// gost dvakrat prebere, preden ji verjame.
//
// Vrednost je v HTML-u ŽE KONČNA. Animacija jo ob vstopu prestavi na
// začetek in pripelje nazaj; če se JavaScript ne naloži, gost vidi pravo
// številko in ne ničle. Isto velja za bralnike zaslona — ti berejo vsebino,
// ne vmesnih stanj.
//
// `once: true`: število, ki se ob vsakem drsenju znova zavrti, je igrača.
// ============================================================================

export function SteviloNaraste({
  vrednost,
  decimalk = 0,
  className,
}: {
  vrednost: number;
  /** Koliko decimalk izpisati — ocena 4,4 ima eno, število mnenj nobene. */
  decimalk?: number;
  className?: string;
}) {
  const el = useRef<HTMLSpanElement>(null);

  const izpis = (n: number) =>
    decimalk > 0 ? n.toFixed(decimalk).replace(".", ",") : String(Math.round(n));

  useGSAP(
    () => {
      const vozlisce = el.current;
      if (!vozlisce || prefersReducedMotion()) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      const stanje = { n: 0 };

      const sprozilec = ScrollTrigger.create({
        trigger: vozlisce,
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.to(stanje, {
            n: vrednost,
            duration: DUR.cinematic,
            ease: EASE.out,
            onUpdate: () => {
              vozlisce.textContent = izpis(stanje.n);
            },
            onComplete: () => {
              vozlisce.textContent = izpis(vrednost);
            },
          });
        },
      });

      // Do vstopa naj piše 0 — a le, če je sprožilec res nastal; sicer
      // ostane prava vrednost iz strežnika.
      vozlisce.textContent = izpis(0);

      return () => {
        sprozilec.kill();
        vozlisce.textContent = izpis(vrednost);
      };
    },
    { dependencies: [vrednost, decimalk] },
  );

  return (
    <span ref={el} className={cn(className)}>
      {izpis(vrednost)}
    </span>
  );
}
