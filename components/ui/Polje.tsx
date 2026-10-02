"use client";

import { Eye, EyeOff } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

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
    // `content-start` JE BISTVENO. Brez njega mreža raztegne svoje vrstice
    // čez vso višino celice, in ker ima eno polje pod sabo namig, sosednje
    // pa ne, se v sosednjem prazen prostor razdeli vnosu — ta zraste za
    // nekaj pikslov in dva vnosa v isti vrstici nista enako visoka.
    <div className="gap-s1 grid content-start">
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

// VIŠINA JE FIKSNA, tako kot pri gumbih (`h-12`): vnos, gumb in pilula so v
// istem obrazcu in morajo stati v isti vrsti. Višina iz oblazinjenja je
// odvisna od pisave in se med polji razlikuje za piksel ali dva — dovolj, da
// se vidi.
const OSNOVA =
  "border-crta bg-ploskev text-crnilo placeholder:text-bledo type-body h-12 w-full rounded-[2px] border px-3 transition-colors aria-[invalid=true]:border-poudarek";

export function Vnos({ className, ...rest }: React.ComponentProps<"input">) {
  return <input {...rest} className={cn(OSNOVA, className)} />;
}

export function Besedilo({ className, ...rest }: React.ComponentProps<"textarea">) {
  // Besedilo raste: `h-auto` povozi fiksno višino iz `OSNOVA`, `py-3` vrne
  // navpično oblazinjenje, ki ga pri enovrstičnem vnosu opravi `h-12`.
  return (
    <textarea
      {...rest}
      className={cn(OSNOVA, "h-auto min-h-36 resize-y py-3", className)}
    />
  );
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
    <label className="type-body border-crta has-checked:border-poudarek has-checked:bg-poudarek-mehko has-checked:text-poudarek inline-flex h-10 cursor-pointer items-center rounded-full border px-4 transition-colors">
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

/**
 * Vnos z ikono v polju.
 *
 * Ikona ni okras: pri dveh poljih brez oznak bi bilo treba brati, katero je
 * katero. Kljuc in ovojnica se prepoznata brez branja.
 */
export function VnosZIkono({
  ikona,
  className,
  ...rest
}: { ikona: ReactNode } & React.ComponentProps<"input">) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="text-bledo pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
      >
        {ikona}
      </span>
      <input {...rest} className={cn(OSNOVA, "pl-10", className)} />
    </div>
  );
}

/**
 * Geslo z gumbom za prikaz.
 *
 * Brez njega človek z dolgim geslom tipka na slepo in se zmoti — pri prijavi,
 * kjer napaka ne pove, KJE se je zmotil. Gumb je `type="button"`, sicer bi ob
 * pritisku oddal obrazec.
 */
export function VnosGeslo({
  ikona,
  className,
  ...rest
}: { ikona?: ReactNode } & React.ComponentProps<"input">) {
  const [vidno, nastavi] = useState(false);

  return (
    <div className="relative">
      {ikona ? (
        <span
          aria-hidden
          className="text-bledo pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        >
          {ikona}
        </span>
      ) : null}
      <input
        {...rest}
        type={vidno ? "text" : "password"}
        className={cn(OSNOVA, ikona && "pl-10", "pr-11", className)}
      />
      <button
        type="button"
        onClick={() => nastavi((v) => !v)}
        aria-label={vidno ? "Skrij geslo" : "Pokaži geslo"}
        className="text-bledo hover:text-crnilo absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 transition-colors"
      >
        {vidno ? (
          <EyeOff className="size-4" strokeWidth={1.8} aria-hidden />
        ) : (
          <Eye className="size-4" strokeWidth={1.8} aria-hidden />
        )}
      </button>
    </div>
  );
}

/** Kljukica z besedilom in razlago pod njim. */
/**
 * Kljukica.
 *
 * Deluje v obeh načinih: v obrazcu brez stanja (`privzeto`, vrednost prebere
 * strežniško dejanje ob oddaji) in v izračunu, kjer vrednost živi v stanju
 * (`izbrano` + `naIzbiro`). Dve ločeni komponenti za isto obliko bi pomenili
 * dva kraja, kjer se spremeni videz kljukice — in sčasoma dva videza.
 */
export function Kljukica({
  ime,
  napis,
  razlaga,
  privzeto,
  izbrano,
  naIzbiro,
}: {
  ime: string;
  napis: string;
  razlaga?: string;
  privzeto?: boolean;
  /** Krmiljeno stanje; kadar je podano, `privzeto` ne velja. */
  izbrano?: boolean;
  naIzbiro?: (izbrano: boolean) => void;
}) {
  const krmiljeno = izbrano !== undefined;

  return (
    <label className="group gap-s1 grid cursor-pointer grid-cols-[1.15rem_1fr] items-start">
      <input
        type="checkbox"
        name={ime}
        {...(krmiljeno
          ? { checked: izbrano, onChange: (e) => naIzbiro?.(e.target.checked) }
          : { defaultChecked: privzeto })}
        className="border-crta text-poudarek accent-poudarek mt-0.5 size-[1.15rem] rounded-[3px]"
      />
      <span>
        <span className="type-body block">{napis}</span>
        {razlaga ? (
          <span className="type-micro text-bledo mt-0.5 block">{razlaga}</span>
        ) : null}
      </span>
    </label>
  );
}
