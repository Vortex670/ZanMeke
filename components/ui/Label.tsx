"use client";

import { forwardRef, type LabelHTMLAttributes } from "react";

import { useFieldContext } from "@/components/ui/field-context";
import { cn } from "@/lib/utils";

// ============================================================================
// <Label> — oznaka polja: verzalke, drobna stopnja, razmaknjene črke.
// ----------------------------------------------------------------------------
// `htmlFor` vzame iz konteksta `Field`, zato ga na klicnem mestu skoraj nikoli
// ni treba pisati. Izrecni `htmlFor` premaga kontekst — rabijo ga polja, ki
// niso v `Field` (sestavljalnik sporočila, urejevalnik cen po mesecih).
//
// Ista datoteka na obeh projektih; razlikujejo se samo barvni žetoni.
// ============================================================================

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  /** Skrij oznako vizualno, a jo ohrani za bralnik zaslona. */
  srOnly?: boolean;
  /** Zvezdica za obvezno polje; sicer se prevzame iz konteksta. */
  required?: boolean;
};

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { children, className, srOnly = false, required, htmlFor, ...props },
  ref,
) {
  const ctx = useFieldContext();
  const isRequired = required ?? ctx?.required ?? false;

  return (
    <label
      ref={ref}
      htmlFor={htmlFor ?? ctx?.id}
      className={cn(
        "text-text type-micro font-medium tracking-wide uppercase",
        ctx?.disabled && "opacity-50",
        srOnly && "sr-only",
        className,
      )}
      {...props}
    >
      {children}
      {isRequired ? (
        <span aria-hidden className="text-danger ml-1">
          *
        </span>
      ) : null}
    </label>
  );
});
