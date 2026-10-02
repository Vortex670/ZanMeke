"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { gsap, ScrollTrigger } from "@/components/motion/gsap/register";
import { prefersReducedMotion } from "@/components/motion/reduced-motion";

// ============================================================================
// <GladkoDrsenje /> — Lenis, povezan z GSAP
// ----------------------------------------------------------------------------
// Drsenje dobi majhno vztrajnost: kolešček ne premakne strani v skokih po
// 100 px, ampak jo popelje. Na jedilniku s tristo jedmi je to razlika med
// listanjem in cukanjem.
//
// Lenis MORA teči na istem taktu kot GSAP (`gsap.ticker`), sicer sta dve
// zanki, ki se med sabo ne poznata: animacija bi tekla po svoje in stran po
// svoje. Zato tu ni `requestAnimationFrame`, ampak `gsap.ticker.add`.
//
// `ScrollTrigger.update` ob vsakem koraku: sprožilci berejo položaj drsnika,
// Lenis pa ga premika mimo brskalnikovega dogodka `scroll`. Brez te vrstice
// bi se vstopi odsekov sprožili prepozno ali sploh ne.
//
// Kdor ima v sistemu zmanjšano gibanje, dobi navadno drsenje — vztrajnost
// je gibanje, ki ga ni naročil.
// ============================================================================

/**
 * Ali se mehko drsenje na tej napravi obnese.
 *
 * Na Macu in iPadu se kolešček sledilne ploščice premika po drobnih korakih
 * in Lenisova vztrajnost se mu prilega. Miška na Windowsih pa dela v skokih
 * po tri vrstice naenkrat: Lenis vsak skok prežveči v svoji zanki in namesto
 * gladkega drsenja se pozna zatikanje — izmerjeno na maminem računalniku,
 * Chrome/Windows. Tam brskalnik drsi sam, s kartico, in to je boljše od
 * vsega, kar bi mu dodali.
 */
function napravaZmoreMehkoDrsenje(): boolean {
  const podatki = (navigator as { userAgentData?: { platform?: string } })
    .userAgentData;
  const ploscad = podatki?.platform ?? navigator.platform ?? navigator.userAgent;
  return /mac|iphone|ipad|ipod/i.test(ploscad);
}

export function GladkoDrsenje() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!napravaZmoreMehkoDrsenje()) return;

    const lenis = new Lenis({
      // Kratka vztrajnost: dovolj, da se drsenje zgladi, premalo, da bi se
      // stran vlekla za prstom. Dolge vrednosti so na dotik neznosne.
      duration: 0.9,
      smoothWheel: true,
      // Na dotiku NE: telefon ima svoje drsenje, ki mu ljudje zaupajo, in
      // vsako vmešavanje se pozna kot zatikanje.
      syncTouch: false,
      // Kar se zgodi V OKNU, ni Lenisova stvar. Okno je svoj drsni prostor
      // in ima svoj drsnik; če mu Lenis prestreže kolešček, se namesto
      // vsebine okna premakne stran za njim. Isto velja za zatemnjeni del,
      // ker je ta ::backdrop okna in dogodek pride z okna samega.
      prevent: (node) => Boolean(node.closest?.("dialog")),
    });

    lenis.on("scroll", ScrollTrigger.update);

    // Dokler je odprto katero koli okno, Lenis MIRUJE.
    //
    // `overflow: hidden` na <html> in <body> ustavi brskalnikovo drsenje,
    // Lenisovega pa ne: ta stran premika sam, s svojo zanko, in za `overflow`
    // ne ve. Gost je izbiral v oknu, jedilnik za njim pa je tekel naprej.
    // Zato se ob odprtju ustavi, ob zaprtju pa steče nazaj — velja za vsako
    // okno na strani, ker se gleda atribut `open` na <dialog>.
    const odprtaOkna = () => document.querySelector("dialog[open]") !== null;
    const uskladi = () => (odprtaOkna() ? lenis.stop() : lenis.start());
    uskladi();
    const opazovalec = new MutationObserver(uskladi);
    opazovalec.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open"],
    });

    const korak = (cas: number) => lenis.raf(cas * 1000);
    gsap.ticker.add(korak);
    gsap.ticker.lagSmoothing(0);

    return () => {
      opazovalec.disconnect();
      gsap.ticker.remove(korak);
      lenis.destroy();
    };
  }, []);

  return null;
}
