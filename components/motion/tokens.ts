/**
 * Tokeni gibanja (standard §9.2) — ISTE vrednosti kot CSS v
 * `styles/tokens.css` (`--dur-*`, `--ease-*`). V TS komponentah nikoli
 * ročnih sekund ali krivulj: vedno `DUR.*`, `EASE.*`, `STAGGER`.
 *
 * Trajanja v sekundah (GSAP), CSS ima milisekunde. Preslikava na žetone:
 *   `fast` 0,2 = `--dur-fast` · `base` 0,4 = `--dur-base` ·
 *   `slow` 0,8 = `--dur-slow` · `reduced` 0,15 = `--dur-quick`
 * `cinematic` (1,2 s — števci, uvodna animacija; §9.1 »kinematično
 * 900–1400 ms«) namenoma NIMA para v CSS-u: tako dolg prehod v CSS-u ne
 * nastopi. Ne zamenjaj ga z `--dur-swap` (700 ms, menjava fotografije).
 *
 * CSS ima še korake, ki jih GSAP ne rabi (`--dur-instant`,
 * `--dur-smooth`, `--dur-reveal`, `--dur-swap`) — tu jih namenoma ni,
 * dokler jih kakšna GSAP animacija res ne potrebuje.
 */
export const DUR = {
  fast: 0.2,
  base: 0.4,
  slow: 0.8,
  reduced: 0.15,
  cinematic: 1.2,
} as const;

/**
 * Krivulje: `out` ≈ `--ease-out cubic-bezier(0.22,1,0.36,1)`,
 * `inOut` ≈ `--ease-in-out cubic-bezier(0.65,0,0.35,1)`, `luxury` za
 * uredniške razkritja, `spring` ≈ `--ease-spring` (preboj čez cilj, §19).
 */
export const EASE = {
  out: "power3.out",
  inOut: "power2.inOut",
  luxury: "expo.out",
  spring: "back.out(1.7)",
} as const;

/** Zamik med elementi v zaporedju (60–100 ms po §9.1). */
export const STAGGER = 0.08;
