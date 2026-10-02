"use client";

import type { ReactNode } from "react";
import { useId } from "react";

import { cn } from "@/lib/utils/cn";

// ============================================================================
// Primitivi obrazca — Polje, Vnos, Besedilo, Gumb
// ----------------------------------------------------------------------------
// V `app/` in drugih komponentah ni surovega <input>, <textarea>, <label> ali
// <button>. Razlog ni lepota: ko se enkrat spremeni videz napake ali fokusni
// obroč, se mora spremeniti NA ENEM MESTU. Drugače se vsak obrazec sčasoma
// razlikuje od sosednjega in stran izgubi občutek celote.
//
// Napaka polja je povezana z vnosom prek `aria-describedby`, polje pa dobi
// `aria-invalid` — bralnik zaslona tako napako prebere, ne samo pokaže.
// ============================================================================

type PoljeProps = {
  oznaka: string;
  napaka?: string;
  namig?: string;
  obvezno?: boolean;
  children: (lastnosti: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => ReactNode;
};

export function Polje({ oznaka, napaka, namig, obvezno, children }: PoljeProps) {
  const id = useId();
  const idNapake = `${id}-napaka`;
  const idNamiga = `${id}-namig`;
  const opisi = [napaka ? idNapake : null, namig ? idNamiga : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="gap-s1 grid">
      <label htmlFor={id} className="type-label text-mirno">
        {oznaka}
        {obvezno ? <span className="text-poudarek"> *</span> : null}
      </label>

      {children({
        id,
        "aria-invalid": Boolean(napaka),
        "aria-describedby": opisi || undefined,
      })}

      {namig && !napaka ? (
        <p id={idNamiga} className="type-micro text-bledo">
          {namig}
        </p>
      ) : null}
      {napaka ? (
        <p id={idNapake} className="type-micro text-poudarek">
          {napaka}
        </p>
      ) : null}
    </div>
  );
}

const OSNOVA =
  "border-crta bg-ploskev text-crnilo placeholder:text-bledo type-body w-full rounded-[2px] border px-3 py-2.5 transition-colors aria-[invalid=true]:border-poudarek";

export function Vnos({ className, ...rest }: React.ComponentProps<"input">) {
  return <input {...rest} className={cn(OSNOVA, className)} />;
}

export function Besedilo({ className, ...rest }: React.ComponentProps<"textarea">) {
  return <textarea {...rest} className={cn(OSNOVA, "min-h-36 resize-y", className)} />;
}

/**
 * Past za bote.
 *
 * Polje, ki ga človek ne vidi in bot izpolni. Brez tega javni obrazec v
 * nekaj dneh postane vir neželene pošte, s katero se nihče ne ukvarja, in
 * sporočilo prave stranke se v njej izgubi.
 */
export function Past() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="podjetje-url">Ne izpolnjujte</label>
      <input id="podjetje-url" name="podjetjeUrl" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

/**
 * Izbira v obliki pilule — radio, ki je videti kot gumb.
 *
 * Radio je skrit (`sr-only`), ne pa odstranjen: tipkovnica in bralnik zaslona
 * se po skupini premikata s puščicami, kakor po vsakem drugem radiu. Videz
 * nosi okvir pilule prek `has-checked:`.
 */
export function Pilula({
  ime,
  vrednost,
  napis,
  privzeto,
}: {
  ime: string;
  vrednost: string;
  napis: string;
  privzeto?: boolean;
}) {
  return (
    <label className="type-body border-crta has-checked:border-poudarek has-checked:bg-poudarek-mehko has-checked:text-poudarek cursor-pointer rounded-full border px-4 py-2 transition-colors">
      <input
        type="radio"
        name={ime}
        value={vrednost}
        defaultChecked={privzeto}
        className="sr-only"
      />
      {napis}
    </label>
  );
}
