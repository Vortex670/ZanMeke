"use client";

import { createContext, useContext } from "react";

// ============================================================================
// Kontekst polja — skupni `id` in `aria-*` za oznako in kontrolo.
// ----------------------------------------------------------------------------
// V svoji datoteki, ne v `Field.tsx`, ker ga bere tudi `Label`, `Field` pa
// bere `Label` — v eni datoteki bi bil to krožni uvoz.
//
// Ista datoteka na obeh projektih.
// ============================================================================

export type FieldContextValue = {
  id: string;
  hintId: string;
  errorId: string;
  hasError: boolean;
  hasHint: boolean;
  disabled: boolean;
  required: boolean;
};

export const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

/**
 * Lastnosti za kontrolo znotraj `Field` — `id`, `aria-invalid`,
 * `aria-describedby`. Kontrola jih razgrne nase; izrecne lastnosti na klicnem
 * mestu jih premagajo, ker gredo za tem.
 */
export function useFieldProps(): {
  id?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
  "aria-describedby"?: string;
  disabled?: boolean;
} {
  const ctx = useFieldContext();
  if (!ctx) return {};
  const describedBy =
    [ctx.hasError ? ctx.errorId : null, ctx.hasHint ? ctx.hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return {
    id: ctx.id,
    "aria-invalid": ctx.hasError ? true : undefined,
    // `Field` zvezdico nad poljem že izriše, bralnik zaslona pa je ne
    // prebere kot »obvezno« — brez tega je bilo polje za slepega gosta
    // videti neobvezno, dokler obrazca ni oddal in dobil napake.
    "aria-required": ctx.required ? true : undefined,
    "aria-describedby": describedBy,
    disabled: ctx.disabled || undefined,
  };
}
