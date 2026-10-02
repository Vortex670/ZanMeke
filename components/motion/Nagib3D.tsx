"use client";

import { useRef, type ReactNode } from "react";

import { gsap, useGSAP } from "@/components/motion/gsap/register";
import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import { DUR, EASE } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

// ============================================================================
// <Nagib3D /> — prava tretja os, brez 3D knjižnice
// ----------------------------------------------------------------------------
// Vsebina stoji v prostoru s `perspective` in se obrača okoli X in Y osi.
// To je isti 3D, ki ga uporablja three.js — samo da ga riše brskalnik sam,
// na GPU, in ne prinese pol megabajta WebGL motorja. Za ploskev (posnetek
// strani, kartico) je to vse, kar 3D sploh je: globina, perspektiva, luč.
// Three.js bi bil smiseln šele pri pravi geometriji — modelu, delcih,
// sceni, ki je ni mogoče sestaviti iz ploskev.
//
// TRI PRAVILA, KI DRŽIJO TO V MEJAH DOBREGA OKUSA:
//
// 1. KOT JE MAJHEN (privzeto 8°). Pri dvajsetih stopinjah je besedilo na
//    posnetku neberljivo in stran je videti kot predstavitev tehnologije.
//    Tu 3D opravlja eno nalogo: pokaže, da je stvar predmet, ki ga lahko
//    primeš.
//
// 2. SLEDI MIŠKI MEHKO. `gsap.quickTo` pelje kot proti cilju z 0,4 s
//    zamika; nagib, ki je trdo pripet na kazalec, je nervozen in se ob
//    vsakem drobnem premiku zatrese.
//
// 3. NA DOTIK IN PRI ZMANJŠANEM GIBANJU GA NI. Na telefonu kazalca ni —
//    ostane rahel nagib ob drsenju, ki ga vodi ScrollTrigger. Komu, ki ima
//    v sistemu zmanjšano gibanje, se ne premakne nič.
//
// Začetno stanje je RAVNO: v HTML-u ni nobene transformacije, zato je
// vsebina vidna in brana tudi, če se JavaScript ne naloži.
// ============================================================================

export function Nagib3D({
  children,
  /** Največji odklon v stopinjah — nad 10 postane besedilo neberljivo. */
  kot = 8,
  /** Rahel nagib, ki ga ob drsenju vodi ScrollTrigger (tudi brez miške). */
  odDrsenja = true,
  className,
}: {
  children: ReactNode;
  kot?: number;
  odDrsenja?: boolean;
  className?: string;
}) {
  const okvir = useRef<HTMLDivElement>(null);
  const ploskev = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const zunanji = okvir.current;
      const el = ploskev.current;
      if (!zunanji || !el || prefersReducedMotion()) return;

      // Drsenje: ploskev se iz rahlo nazaj nagnjene zravna, ko pride v
      // vidno polje. To je edina 3D poteza, ki jo dobi tudi telefon.
      if (odDrsenja) {
        gsap.fromTo(
          el,
          { rotationX: kot * 0.7, y: 24 },
          {
            rotationX: 0,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: zunanji,
              start: "top 85%",
              end: "top 35%",
              scrub: 0.6,
            },
          },
        );
      }

      // Kazalec: samo prave miške. `any-hover` izloči telefon in tablico,
      // kjer bi se nagib sprožil ob dotiku in tam obstal.
      if (!window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches) {
        return;
      }

      // GSAP pozna `rotationX`/`rotationY`, ne CSS imen `rotateX`/`rotateY`.
      // S CSS imeni animacija teče, a ob vsakem zagonu javi »not eligible for
      // reset« — ker jih ne zna razstaviti nazaj v posamezne lastnosti.
      const naX = gsap.quickTo(el, "rotationY", { duration: DUR.base, ease: EASE.out });
      const naY = gsap.quickTo(el, "rotationX", { duration: DUR.base, ease: EASE.out });

      const premik = (e: PointerEvent) => {
        const r = zunanji.getBoundingClientRect();
        // −1 … 1 glede na središče ploskve.
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        naX(dx * kot * 2);
        naY(-dy * kot * 2);
      };

      const nazaj = () => {
        naX(0);
        naY(0);
      };

      zunanji.addEventListener("pointermove", premik);
      zunanji.addEventListener("pointerleave", nazaj);
      return () => {
        zunanji.removeEventListener("pointermove", premik);
        zunanji.removeEventListener("pointerleave", nazaj);
      };
    },
    { dependencies: [kot, odDrsenja] },
  );

  return (
    // Perspektiva je na STARŠU, obrat na otroku: tako je žarišče pri vseh
    // otrocih isto in se ploskev ob obratu ne »povečuje«.
    <div
      ref={okvir}
      className={cn("[perspective:1200px] [transform-style:preserve-3d]", className)}
    >
      <div ref={ploskev} className="will-change-transform [transform-style:preserve-3d]">
        {children}
      </div>
    </div>
  );
}
