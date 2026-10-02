"use client";

import { useSyncExternalStore } from "react";

import { REDUCED_MQ } from "@/components/motion/reduced-motion";

// ============================================================================
// useReducedMotionSafe — ali uporabnik želi manj gibanja
// ----------------------------------------------------------------------------
// Bralo se je iz `motion/react` (framer). Zaradi te ene vrstice je paket
// ostajal v odvisnostih, čeprav standard §9 zahteva GSAP in nič drugega —
// zdaj poizveduje naravnost pri brskalniku.
//
// `useSyncExternalStore` je tu nujen in ne okras: na strežniku in ob PRVEM
// izrisu vrne `false`, sicer bi se strežniški in odjemalčev izris
// razlikovala (hydration mismatch) pri vsakem, ki ima zmanjšano gibanje
// vklopljeno. Naročnina posluša medijsko poizvedbo, zato sprememba med
// obiskom takoj zaleže.
// ============================================================================

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mq = window.matchMedia(REDUCED_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(
    subscribe,
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(REDUCED_MQ).matches,
    () => false,
  );
}
