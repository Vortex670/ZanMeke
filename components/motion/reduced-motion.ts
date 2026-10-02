/** Medijska poizvedba za zmanjšano gibanje — ista v CSS-u in GSAP `matchMedia`. */
export const REDUCED_MQ = "(prefers-reduced-motion: reduce)";

/** `true`, če uporabnik želi manj animacij (varno tudi na strežniku → false). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MQ).matches;
}
