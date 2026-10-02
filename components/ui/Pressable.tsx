"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Pressable — najnižji klikljiv primitiv: `<button type="button">` brez
 * vizualnega mnenja.
 *
 * **Zakaj obstaja.** `Button` in `IconButton` nosita obliko (višina, pilula,
 * barva, sence). Marsikatera klikljiva stvar pa NI gumb v pomenu oblikovnega
 * sistema — celica koledarja, sličica galerije, zavihek, kartica-izbirnik,
 * ozadje predala, vrstica menija. Prej so bile te stvari surov `<button>` z
 * ročno prepisanim fokusnim obročem (ista štiri pravila na 25 mestih). Ena
 * sprememba fokusa je pomenila 25 popravkov — natanko to, čemur se z
 * enotnimi komponentami izogibamo.
 *
 * Pressable da samo:
 *   - `type="button"` (nikoli naključni submit sredi obrazca),
 *   - kazalec in `disabled` stanje,
 *   - **fokusni obroč iz ene same definicije** (`focusRing`).
 *
 * Vso obliko poda klicatelj skozi `className`. Če potrebuješ pilulo z
 * barvo in višino, je to `Button`; če ikono v krogu, `IconButton`.
 *
 * `focusRing`:
 *   - `outside` (privzeto) — obroč 2 px stran od roba; kartice, zavihki.
 *   - `tight` — 1 px; gosti rasterji (celice koledarja).
 *   - `loose` — 4 px; elementi nad fotografijo ali brez lastnega roba.
 *   - `inset` — obroč znotraj roba; sličice in elementi, ki polnijo starša.
 *   - `none` — sam narišeš stanje fokusa (ozadje predala, ovoj slike).
 *
 * ```tsx
 * <Pressable onClick={() => open(i)} focusRing="inset" className="relative block h-full w-full">
 *   <NextImage … />
 * </Pressable>
 * ```
 */

export type PressableFocusRing = "outside" | "tight" | "loose" | "inset" | "none";

/**
 * Fokusni obroč — preslikava na razrede iz `styles/a11y.css`. Uporabljajo jo
 * `Pressable`, `Button` in `IconButton`; prej so bili trije različni (gumb z
 * `outline`, ikonski gumb z `ring`, ploskve z ročno prepisanim `outline`),
 * zato je bil fokus na istem zaslonu videti različno.
 *
 * Vrednosti so IMENA razredov, ne deklaracije — barva in debelina obroča
 * sta samo v CSS-u, ob globalnem pravilu `:focus-visible`. `outside` je
 * razred in ne prazen niz zato, ker si primitivi (npr. `IconButton`)
 * outline najprej skrijejo z `outline-hidden` in ga morajo nato vrniti.
 */
export const FOCUS_RING: Record<PressableFocusRing, string> = {
  // NI prazen niz, čeprav globalno pravilo `:focus-visible` isti obroč že da:
  // `IconButton` si outline skrije z `outline-hidden` in ga mora vrniti.
  outside: "focus-ring",
  tight: "focus-ring-tight",
  loose: "focus-ring-loose",
  inset: "focus-ring-inset",
  none: "focus-visible:outline-none",
};

type PressableProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  focusRing?: PressableFocusRing;
};

export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  function Pressable(
    { className, focusRing = "outside", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "cursor-pointer disabled:cursor-not-allowed",
          FOCUS_RING[focusRing],
          className,
        )}
        {...props}
      />
    );
  },
);
