"use client";

import { useId, type HTMLAttributes, type ReactNode } from "react";

import {
  FieldContext,
  type FieldContextValue,
  useFieldContext,
} from "@/components/ui/field-context";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";

/**
 * Field + Label + FieldHint + FieldError — kompoziter za forme.
 *
 * Namen: razbremenimo programerja od ročnega `htmlFor` in `aria-describedby`
 * povezovanja. Context pove vsem otrokom skupni `id` in opcijski
 * `errorId`/`hintId`, ki ju Input/Textarea/Select/Checkbox pobere skozi
 * `useFieldContext()`.
 *
 * Uporaba (priporočena):
 *
 * ```tsx
 * <Field error={form.fieldErrors.email}>
 *   <Label>E-pošta</Label>
 *   <Input type="email" name="email" required />
 *   <FieldHint>Poslali bomo povezavo za potrditev.</FieldHint>
 * </Field>
 * ```
 *
 * Context stavi:
 *   - Label → avtomatsko `htmlFor` iz konteksta
 *   - Input → `id`, `aria-describedby` (hint + error), `aria-invalid` ob napaki
 *   - FieldError → id, role="alert" za takojšnjo SR najavo
 *   - FieldHint → id, da ga Input referenceira
 *
 * Zakaj `useId()` namesto ročnega name-based id-ja:
 *   - unikaten per mount (ne prekrivanja, če isti field render-amo 2x)
 *   - stabilno med SSR in hidracijo (React garant-a)
 *   - ne zanašamo se na `name` atribut (ki je za form-data, ne DOM)
 */

// ------------------------------------------------------------------
// Field
// ------------------------------------------------------------------

type FieldProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * Oznaka polja. Krajša oblika namesto otroka `<Label>`; oboje deluje,
   * `<Label>` kot otrok ima prednost, kadar rabiš svojo postavitev.
   */
  label?: ReactNode;
  /** Element desno od oznake — števec znakov, gumb »predlagaj z AI«. */
  labelAddon?: ReactNode;
  /** `id` kontrole, kadar je v polju več kot ena. */
  htmlFor?: string;
  /**
   * Napaka polja — string ali seznam (`fieldErrors.email` iz `useActionForm`
   * gre noter neposredno; prikaže se prvi vnos). Nastavi `aria-invalid` +
   * `aria-describedby` na otroku in izriše sporočilo pod poljem.
   */
  error?: string | string[] | null;
  /** Če je podano, se pod inputom izriše FieldHint (ali zgoraj, glej `hintPosition`). */
  hint?: ReactNode;
  /** Eksplicitno označi vse otroke kot onemogočene. */
  disabled?: boolean;
  /** Označi polje kot obvezno — Label pokaže "*", Input dobi `required`. */
  required?: boolean;
  /** V praksi vedno pod inputom; lahko pa daš hint pred labelom za zelo
   *  dolgo razlago (redko). */
  hintPosition?: "below" | "above";
  children: ReactNode;
};

export function Field({
  label,
  labelAddon,
  htmlFor,
  error: errorProp,
  hint,
  disabled = false,
  required = false,
  hintPosition = "below",
  className,
  children,
  ...rest
}: FieldProps) {
  const error = Array.isArray(errorProp) ? errorProp[0] : errorProp;
  const generatedId = useId();
  // Izrecni `htmlFor` premaga generiranega — rabijo ga polja z več kot eno
  // kontrolo (cena + valuta, datum + ura).
  const id = htmlFor ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const ctx: FieldContextValue = {
    id,
    hintId,
    errorId,
    hasError: Boolean(error),
    hasHint: Boolean(hint),
    disabled,
    required,
  };

  return (
    <FieldContext.Provider value={ctx}>
      <div className={cn("flex w-full flex-col gap-1.5", className)} {...rest}>
        {label || labelAddon ? (
          <div className="flex items-center justify-between gap-3">
            {label ? <Label required={required}>{label}</Label> : <span />}
            {labelAddon}
          </div>
        ) : null}
        {hint && hintPosition === "above" ? <FieldHint>{hint}</FieldHint> : null}
        {children}
        {hint && hintPosition === "below" && !error ? (
          <FieldHint>{hint}</FieldHint>
        ) : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    </FieldContext.Provider>
  );
}

// ------------------------------------------------------------------
// FieldHint — opcijski pomožni tekst pod poljem (npr. "Brez presledkov")
// ------------------------------------------------------------------

type FieldHintProps = HTMLAttributes<HTMLParagraphElement>;

export function FieldHint({ children, className, ...props }: FieldHintProps) {
  const ctx = useFieldContext();
  return (
    <p id={ctx?.hintId} className={cn("text-muted type-micro", className)} {...props}>
      {children}
    </p>
  );
}

// ------------------------------------------------------------------
// FieldError — napaka, prebrana na glas takoj (role="alert")
// ------------------------------------------------------------------

type FieldErrorProps = HTMLAttributes<HTMLParagraphElement>;

export function FieldError({ children, className, ...props }: FieldErrorProps) {
  const ctx = useFieldContext();
  return (
    <p
      id={ctx?.errorId}
      role="alert"
      className={cn(
        "text-danger type-micro flex items-start gap-1 font-medium",
        className,
      )}
      {...props}
    >
      {/* Ikono dodamo, ker Playbook zahteva "barva + ikona za status,
          nikoli samo barva" (a11y: daltonizem). Uporabljamo inline SVG
          namesto lucide, ker je manjši bundle hit pri vsaki formi. */}
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        fill="none"
        className="mt-px h-3.5 w-3.5 shrink-0"
      >
        <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
        <path
          d="M8 4v4M8 11.5h.01"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span>{children}</span>
    </p>
  );
}

// ------------------------------------------------------------------
// Pomožne za komponente, ki hočejo Field context brez uporabe <Field>
// ------------------------------------------------------------------

/**
 * Vrne props-e (id, aria-describedby, aria-invalid, required, disabled),
 * ki jih Input/Textarea/Select/Checkbox razširi. Če ni Field konteksta,
 * vrne prazne vrednosti (komponenta deluje tudi samostojno).
 */

// Zaradi zgodovine uvozov je `Label` dosegljiv tudi od tu.
export { Label };
export { useFieldContext, useFieldProps } from "@/components/ui/field-context";
