"use client";

import { useRef, type ReactNode } from "react";

import { gsap, useGSAP } from "@/components/motion/gsap/register";
import { prefersReducedMotion } from "@/components/motion/reduced-motion";

// ============================================================================
// <OdhodHeroja /> — uvodni zaslon se ob drsenju umakne
// ----------------------------------------------------------------------------
// Vsebina se med drsenjem skozi hero rahlo dvigne in zbledi. Učinek je
// majhen nalašč: naloga ni, da bi ga kdo opazil, ampak da prehod iz temnega
// uvoda v svetlo stran ne pride kot rez.
//
// `scrub` pomeni, da gibanje vodi DRSNIK in ne ura: ko se ustavi prst, se
// ustavi tudi vsebina. Animacija, ki po ustavitvi drsenja še teče naprej,
// se bere kot zatikanje strani.
//
// Premika se samo `y` in `opacity` — obe lastnosti teče na grafični kartici
// in ne sprožita preračuna postavitve. Z `height` ali `margin` bi se pri
// vsakem kadru prerisala cela stran.
//
// Kdor ima v sistemu zmanjšano gibanje, ne dobi ničesar; vsebina stoji.
// Začetno stanje je NEDOTAKNJENO — brez JavaScripta je hero tak, kot mora
// biti, in ne prosojen.
// ============================================================================

export function OdhodHeroja({
  children,
  className,
}: {
  children: ReactNode;
  /** Uvod zavzame cel zaslon, zato mora ovoj rasti z njim. */
  className?: string;
}) {
  const koren = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = koren.current;
      if (!el || prefersReducedMotion()) return;

      const odsek = el.closest("section") ?? el;
      const sprozilec = gsap.to(el, {
        y: -64,
        opacity: 0.25,
        ease: "none",
        scrollTrigger: {
          trigger: odsek,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      return () => {
        sprozilec.scrollTrigger?.kill();
        sprozilec.kill();
      };
    },
    { scope: koren },
  );

  return (
    <div ref={koren} className={className}>
      {children}
    </div>
  );
}
