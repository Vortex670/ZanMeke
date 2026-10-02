import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Zlivanje razredov — zadnji zmaga, brez podvojenih Tailwind utility-jev. */
export function cn(...vhod: ClassValue[]): string {
  return twMerge(clsx(vhod));
}

/**
 * Števila s slovenskimi tisočicami.
 *
 * Isto ime in isti rezultat kot na gostilnica-plus.si in second-home.hr —
 * `StatCard` in druge skupne komponente ga kličejo neposredno, zato se ne
 * sme razlikovati niti po ločilu.
 */
export function formatCount(value: number): string {
  return value.toLocaleString("sl-SI");
}
