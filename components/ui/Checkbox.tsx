"use client";

import { Check } from "lucide-react";
import { type InputHTMLAttributes, type ReactNode, type Ref, useId } from "react";

import { useFieldContext } from "@/components/ui/field-context";
import { cn } from "@/lib/utils";

// ============================================================================
// <Checkbox> — peer-driven custom-styled checkbox z label-om in hint-om
// ----------------------------------------------------------------------------
// Uporaba:
//   <Checkbox name="remember" checked={...} onChange={...}>Zapomni si me</Checkbox>
//   <Checkbox name="x" hint="Daljši opis...">Label</Checkbox>
//
// hint:
//   • kratek (1 vrstica) → render-an inline desno od label-a
//   • daljši → render-an pod label-om (block, muted)
//
// Avto-heuristika: če `hint` string ima >40 znakov, gre BELOW. Lahko force-aš
// s hintInline={true|false}.
// ============================================================================

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  /** Oznaka desno od kvadratka. Brez nje je kvadratek sam (množična izbira);
   *  takrat mu daj `aria-label`. */
  children?: ReactNode;
  hint?: ReactNode;
  /** Sili položaj pomoči: `true` = ob oznaki, `false` = pod njo. Privzeto samodejno. */
  hintInline?: boolean;
  /** Izrecno označi napako; sicer se prevzame iz `Field` konteksta. */
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
};

function inferInline(hint: ReactNode): boolean {
  if (typeof hint === "string") return hint.length <= 40;
  return false;
}

export function Checkbox({
  id: idProp,
  className,
  children,
  hint,
  hintInline,
  invalid,
  disabled,
  ref,
  ...rest
}: CheckboxProps) {
  const ctx = useFieldContext();
  const generatedId = useId();
  const id = idProp ?? ctx?.id ?? generatedId;
  const isInline = hint == null ? false : (hintInline ?? inferInline(hint));
  const describedBy =
    ctx && (ctx.hasError || ctx.hasHint)
      ? [ctx.hasError ? ctx.errorId : null, ctx.hasHint ? ctx.hintId : null]
          .filter(Boolean)
          .join(" ")
      : undefined;
  const isInvalid = invalid ?? ctx?.hasError;

  return (
    <label
      htmlFor={id}
      className={cn(
        // `relative` je KRITIČEN: sr-only input je position:absolute.
        "group relative flex cursor-pointer items-start gap-3 py-1",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        className="peer sr-only top-0 left-0"
        {...rest}
      />
      <span
        aria-hidden
        className={cn(
          "peer-checked:bg-foreground peer-checked:border-foreground peer-focus-visible:ring-ring mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 [&_svg]:opacity-0 peer-checked:[&_svg]:opacity-100",
          isInvalid ? "border-danger" : "border-border",
        )}
      >
        <Check
          strokeWidth={2.5}
          className="text-background size-3 transition-opacity"
          aria-hidden
        />
      </span>
      {children || hint ? (
        <span className="min-w-0 flex-1">
          <span className="inline-flex flex-wrap items-baseline gap-x-2">
            <span className="text-text type-small font-medium select-none">
              {children}
            </span>
            {hint && isInline ? (
              <span className="text-muted type-micro">{hint}</span>
            ) : null}
          </span>
          {hint && !isInline ? (
            <span className="text-muted/80 type-micro mt-0.5 block leading-relaxed">
              {hint}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
}
