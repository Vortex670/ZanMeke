"use client";

import { useRef, type ReactNode } from "react";

import { gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsap/register";
import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// <Parallax /> — ozadje se premika počasneje od besedila
// ----------------------------------------------------------------------------
// Fotografija pod odsekom potuje čez zaslon nekaj počasneje kot vsebina nad
// njo. Učinek je globina: besedilo je spredaj, slika zadaj.
//
// MERA JE MAJHNA IN TO JE NAMENOMA. Osem odstotkov višine je dovolj, da se
// globina začuti, in premalo, da bi se opazilo kot animacija. Parallax, ki
// ga opaziš, je parallax, ki moti branje.
//
// `scrub: true` pomeni, da je premik vezan na POLOŽAJ drsnika in ne na čas:
// gost ga vodi sam, tudi nazaj. Ker Lenis teče na istem taktu kot GSAP, se
// slika ne trese za drsenjem.
//
// Deluje samo na kazalcu in na velikem zaslonu: na telefonu je vsak dodaten
// izris med drsenjem poraba baterije za učinek, ki ga na 6 palcih ni videti.
// ============================================================================

export function Parallax({
  children,
  /** Koliko odstotkov višine prepotuje slika. Osem je meja opaznosti. */
  moc = 8,
  className,
}: {
  children: ReactNode;
  moc?: number;
  className?: string;
}) {
  const ovoj = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const vozlisce = ovoj.current;
      if (!vozlisce || prefersReducedMotion()) return;

      const mm = gsap.matchMedia();

      // Samo od `sm` naprej (640 px): na telefonu parallaxa ne delamo.
      mm.add("(min-width: 640px)", () => {
        const anim = gsap.fromTo(
          vozlisce,
          { yPercent: -moc / 2 },
          {
            yPercent: moc / 2,
            ease: "none",
            scrollTrigger: {
              trigger: vozlisce.parentElement ?? vozlisce,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );

        return () => {
          anim.scrollTrigger?.kill();
          anim.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: ovoj, dependencies: [moc] },
  );

  return (
    <div ref={ovoj} className={cn("absolute inset-0 -z-10", className)}>
      {children}
    </div>
  );
}

/** Da `ScrollTrigger` po zamenjavi strani spet meri pravo višino. */
export function osveziParallax(): void {
  ScrollTrigger.refresh();
}
