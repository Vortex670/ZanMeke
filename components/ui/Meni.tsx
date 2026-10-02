"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// ============================================================================
// <Meni /> — spustni meni
// ----------------------------------------------------------------------------
// En primitiv za vse spustne menije (uporabnik, obvestila, dejanja v
// seznamih). Prej je imel vsak svoj `useState` in svoje zapiranje ob kliku
// zunaj — in vsak je imel svojo napako.
//
// KAJ MORA SPUSTNI MENI ZNATI, da ni nadloga:
//
// 1. Zapre se ob kliku ZUNAJ in ob tipki Pobeg.
// 2. Ob zaprtju vrne žarišče na gumb — sicer tipkovnica po zaprtju pristane
//    na vrhu strani in se je treba do mesta vrniti s tabulatorjem.
// 3. Ob kliku v meniju se zapre sam. Meni, ki ostane odprt nad vsebino, ki
//    se je pravkar spremenila, zakriva prav tisto, kar si naredil.
// 4. Ima `aria-expanded` in `role="menu"`, da bralnik zaslona pove, da gre
//    za meni in ali je odprt.
//
// Meni se odpre POD sprožilcem in poravnan na desni rob, ker vsi naši meniji
// stojijo v desnem kotu glave; levo poravnavo doda `poravnava="levo"`.
// ============================================================================

export function Meni({
  sprozilec,
  children,
  poravnava = "desno",
  sirina = "w-64",
  naziv,
}: {
  /** Gumb, ki meni odpre. Dobi `aria-expanded` od tod. */
  sprozilec: (lastnosti: {
    "aria-expanded": boolean;
    "aria-haspopup": "menu";
    "aria-controls": string;
    onClick: () => void;
  }) => ReactNode;
  children: ReactNode;
  poravnava?: "levo" | "desno";
  sirina?: string;
  naziv: string;
}) {
  const [odprt, nastavi] = useState(false);
  const koren = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!odprt) return;

    const naKlik = (e: MouseEvent) => {
      if (!koren.current?.contains(e.target as Node)) nastavi(false);
    };
    const naTipko = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      nastavi(false);
      // Žarišče nazaj na gumb, ki je meni odprl (pravilo 2).
      koren.current?.querySelector("button")?.focus();
    };

    document.addEventListener("mousedown", naKlik);
    document.addEventListener("keydown", naTipko);
    return () => {
      document.removeEventListener("mousedown", naKlik);
      document.removeEventListener("keydown", naTipko);
    };
  }, [odprt]);

  return (
    <div ref={koren} className="relative">
      {sprozilec({
        "aria-expanded": odprt,
        "aria-haspopup": "menu",
        "aria-controls": id,
        onClick: () => nastavi((v) => !v),
      })}

      {odprt ? (
        <div
          id={id}
          role="menu"
          aria-label={naziv}
          // Klik kjer koli v meniju ga zapre (pravilo 3).
          onClick={() => nastavi(false)}
          className={cn(
            "border-chrome-line bg-surface absolute top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border",
            "shadow-[0_18px_48px_-18px_rgba(15,21,19,0.35)]",
            poravnava === "desno" ? "right-0" : "left-0",
            sirina,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Ena vrstica v meniju.
 *
 * Z `href` je povezava, brez njega gumb — in oboje je videti enako. To ni
 * kozmetika: povezava, ki je videti kot gumb, se ne da odpreti v novem
 * zavihku, gumb, ki je videti kot povezava, pa obljublja, da nekam pelje.
 * Tu je razlika v tem, kar komponenta res izriše.
 */
export function MeniVrstica({
  href,
  children,
  className,
  ...rest
}: { href?: string } & Omit<React.ComponentProps<"button">, "ref">) {
  const razred = cn(
    "type-small text-text hover:bg-text/5 flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-55",
    "[&>svg]:text-subtle [&>svg]:size-4 [&>svg]:shrink-0",
    className,
  );

  if (href) {
    return (
      <Link href={href} role="menuitem" className={razred}>
        {children}
      </Link>
    );
  }

  return (
    <button {...rest} role="menuitem" className={razred}>
      {children}
    </button>
  );
}

/** Tanka črta med skupinami vrstic. */
export function MeniLocnica() {
  return <div role="separator" className="bg-chrome-line h-px" />;
}
