"use client";

import type { ReactNode } from "react";

import { Field } from "@/components/ui/Field";
import { formatCount } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ============================================================================
// <FieldGroup> — KANONSKA ovijalka za en vnos v admin obrazcu.
// ----------------------------------------------------------------------------
//   ┌──────────────────────────────────────────────────────────┐
//   │ OZNAKA                                  95 / 120  [⚙]   │
//   │ ┌──────────────────────────────────────────────────────┐ │
//   │ │ <Input> · <Textarea> · <RichTextEditor> · <Switch>   │ │
//   │ └──────────────────────────────────────────────────────┘ │
//   │ Pomoč v eni naravni povedi.                              │
//   └──────────────────────────────────────────────────────────┘
//
// Vir resnice za oznako polja, števec znakov in pomoč. Brez nje je vsaka
// stran risala svojo oznako in svoj števec — in ti so se razlikovali.
//
// OZNAKA NIMA IKONE. Ikona v krogu pred vsako oznako je bila okras: v
// obrazcu z desetimi polji je deset barvnih krogov, ki tekmujejo z vnosi,
// oznako odrinejo in na vsaki strani pomenijo kaj drugega (»T« pred imenom).
// Ikone nosijo odseki (`AdminSection`), ne posamezna polja — z eno izjemo:
// alergeni, kjer je ikona PODATEK, ne okras.
//
// Sloni na `components/ui/Field`, zato otrok (Input, Textarea, SelectMenu,
// Checkbox) prek konteksta dobi `id`, `aria-invalid` in `aria-describedby`,
// napaka pa se izriše pod poljem. `error` sprejme tudi seznam
// (`form.fieldErrors.slug`). Če je v eni skupini VEČ vnosov, jim daj ločene
// `id`-je — sicer si delijo `id` iz konteksta.
//
// Ista datoteka na second-home.hr (`components/admin/kit/FieldGroup.tsx`).
// ============================================================================

type FieldGroupProps = {
  label: string;
  /** id kontrole, kadar je v skupini več vnosov. */
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | string[] | null;
  /** Trenutna dolžina besedila — izriše se desno od oznake. */
  charCount?: number;
  /** Dovoljena dolžina. Ob prekoračitvi gre števec v opozorilno barvo. */
  charMax?: number;
  /** Dejanje desno od oznake (npr. gumb »Predlagaj z AI«). */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function FieldGroup({
  label,
  htmlFor,
  required,
  hint,
  error,
  charCount,
  charMax,
  action,
  className,
  children,
}: FieldGroupProps) {
  const showCount = typeof charCount === "number" && typeof charMax === "number";

  return (
    <Field
      htmlFor={htmlFor}
      required={required}
      hint={hint}
      error={error}
      className={cn("gap-3", className)}
      label={<span className="inline-flex min-h-7 items-center">{label}</span>}
      labelAddon={
        showCount || action ? (
          <span className="flex shrink-0 items-center gap-3">
            {showCount ? (
              <span
                aria-live="polite"
                className={cn(
                  "text-muted type-micro tabular-nums",
                  charCount > charMax && "text-danger",
                )}
              >
                {formatCount(charCount)} / {formatCount(charMax)}
              </span>
            ) : null}
            {action}
          </span>
        ) : null
      }
    >
      {children}
    </Field>
  );
}

/**
 * Ovoj za kontrolo BREZ oznake (potrditveno polje, gumb), kadar stoji v isti
 * vrstici mreže kot `FieldGroup`.
 *
 * Polje ima nad vnosom oznako (`min-h-7` = 1,75 rem) in razmik (`gap-3` =
 * 0,75 rem); brez tega odmika se kontrola poravna z ZGORNJIM robom oznake in
 * ne z vnosom, torej previsoko. 1,75 + 0,75 = 2,5 rem = `mt-10`.
 */
export function FieldGroupAligned({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex items-center sm:mt-10", className)}>{children}</div>;
}
