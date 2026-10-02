"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { useFieldContext, useFieldProps } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

/**
 * Input — enovrstičen tekstovni vnos. **KANONSKI PILL STYLE**.
 *
 * Match-a footer NewsletterForm + public ContactForm vzorec:
 *   - `h-12 rounded-lg` — blago zaobljen pravokotnik, enak jezik kot gumbi
 *     in kartice. Pilula je bila edina okrogla stvar med kvadratnimi gumbi.
 *   - `bg-bg/60` z hover `bg-bg` (subtle interactive feedback).
 *   - `border border-border` z hover `border-border-strong`.
 *   - Focus-within → border-accent (skozi peer/group selektor v wrapperju,
 *     ali direktno na inputu pri "no icon" varianti).
 *   - Leading icon (h-4 w-4) absolute pri `left-5`, input dobi `pl-12`.
 *   - Trailing icon (h-4 w-4) absolute pri `right-5`, input dobi `pr-12`.
 *   - Font 16px (type-body) — preprečuje iOS safari auto-zoom na focus.
 *
 * Integracija s Field:
 *   Komponenta avtomatsko prevzame `id`, `aria-describedby`, `aria-invalid`,
 *   `required`, `disabled` iz `<Field>` konteksta. Deluje pa tudi samostojno.
 *
 * Uporaba:
 *   ```tsx
 *   <Input type="email" name="email" leftIcon={<Mail className="h-4 w-4" />} />
 *   ```
 *
 * Variants: NIČ. En sam stil za vse — admin in public. Če potrebujete drugačen
 * vizualni pattern, je to bug v UX dizajnu, ne v kodi. Razpravo začnite v
 * `references/design-system.md`.
 */

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  /** Ikona pred vnosnim poljem (npr. search, lock). */
  leftIcon?: ReactNode;
  /** Ikona za vnosnim poljem (npr. currency, unit). */
  rightIcon?: ReactNode;
  /** Če je true, eksplicitno prikaži kot invalid (override Field konteksta). */
  invalid?: boolean;
  /** Skrij defaultno obnašanje iz Field konteksta (redko). */
  ignoreFieldContext?: boolean;
  /**
   * Razredi za OVOJ, ki nosi obrobo, ozadje, VIŠINO in ŠIRINO — `className`
   * gre na samo polje znotraj njega.
   *
   * Brez tega je `className="h-14 w-20"` naredil 56 px polje v 48 px ovoju
   * in številke so padle iz škatle. Isto kot pri `Textarea`.
   */
  wrapperClassName?: string;
  /** Interaktivni element na desni (npr. gumb »počisti«). Parnost z zanmeke. */
  rightAction?: ReactNode;
  /** Velikost pilule — `sm` (36 px) v gostih vrsticah filtrov, `md` (48 px)
   *  privzeto, `lg` (56 px) javni obrazci. */
  inputSize?: "sm" | "md" | "lg";
  /**
   * Brez obrobe, ozadja in obroča — kadar polje stoji ZNOTRAJ sestavljene
   * pilule (iskalna vrstica z gumbom, vnos oznak) in okvir riše starš.
   */
  naked?: boolean;
};

const SIZE = {
  sm: {
    wrap: "h-10",
    text: "type-small",
    padLeft: "pl-10",
    padLeftNone: "pl-4",
    padRight: "pr-10",
    padRightNone: "pr-4",
    iconLeft: "left-3.5",
    iconRight: "right-3.5",
    action: "right-1.5",
  },
  md: {
    wrap: "h-12",
    text: "type-body",
    padLeft: "pl-12",
    padLeftNone: "pl-5",
    padRight: "pr-12",
    padRightNone: "pr-5",
    iconLeft: "left-5",
    iconRight: "right-5",
    action: "right-2",
  },
  lg: {
    wrap: "h-14",
    text: "type-body",
    padLeft: "pl-14",
    padLeftNone: "pl-6",
    padRight: "pr-14",
    padRightNone: "pr-6",
    iconLeft: "left-6",
    iconRight: "right-6",
    action: "right-2.5",
  },
} as const;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    type = "text",
    leftIcon,
    rightIcon,
    rightAction,
    invalid,
    ignoreFieldContext,
    wrapperClassName,
    inputSize = "md",
    naked = false,
    ...props
  },
  ref,
) {
  const s = SIZE[inputSize];
  const hasRight = Boolean(rightIcon || rightAction);
  const ctx = useFieldContext();
  const fieldProps = useFieldProps();
  const isInvalid = invalid ?? (!ignoreFieldContext && ctx?.hasError);

  if (naked) {
    return (
      <input
        ref={ref}
        // `type` je razstavljen iz `props`, zato ga je treba podati NAZAJ.
        // Brez tega je vsako golo polje `text`: na telefonu ni tipkovnice z
        // afno, brskalnik ne preveri oblike naslova in `inputmode` je
        // napačen. Ujeto pri obrazcu za novičnik.
        type={type}
        aria-invalid={isInvalid || undefined}
        className={cn(
          "text-text placeholder:text-subtle w-full min-w-0 bg-transparent outline-hidden",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...(ignoreFieldContext ? props : { ...fieldProps, ...props })}
      />
    );
  }

  // Merge user-supplied props with context props; user wins.
  const merged = ignoreFieldContext ? props : { ...fieldProps, ...props };

  // Ovoj drži obrobo, ozadje in prehode; polje je znotraj prosojno, zato
  // `focus-within` obarva CEL okvir in ne le besedila.
  //
  // Oblika je blago zaobljen pravokotnik in ne pilula: gumbi, kartice in
  // tabele v tem projektu so kvadratni, okrogla polja pa so med njimi
  // izstopala kot tujek.
  const wrapperClass = cn(
    "group/pill bg-bg/60 relative rounded-lg border",
    "transition-pill",
    "hover:border-border-strong hover:bg-bg",
    "focus-within:border-accent focus-within:bg-bg",
    isInvalid ? "border-danger focus-within:border-danger" : "border-border",
    s.wrap,
    wrapperClassName,
  );

  const baseInput = cn(
    "text-text block h-full w-full min-w-0 rounded-lg bg-transparent leading-none",
    s.text,
    // Placeholder je namerno manj kontrasten — je hint, ne label.
    "placeholder:text-subtle",
    // Override globalnega a11y.css `:focus-visible { outline: 2px accent }` —
    // sicer dvojni border (pill border-accent + native outline).
    "outline-none focus:outline-none focus-visible:outline-none",
    // Disabled / read-only — ton ozadja (berljivost), ne opacity teksta.
    "disabled:cursor-not-allowed disabled:opacity-60",
    "read-only:cursor-default",
    // Padding glede na (no)icons.
    leftIcon ? s.padLeft : s.padLeftNone,
    hasRight ? s.padRight : s.padRightNone,
    className,
  );

  return (
    <div className={wrapperClass}>
      {leftIcon ? (
        <span
          aria-hidden
          className={cn(
            "text-subtle pointer-events-none absolute top-1/2 inline-flex -translate-y-1/2 items-center justify-center leading-none",
            "group-focus-within/pill:text-accent transition-colors duration-(--dur-fast)",
            s.iconLeft,
          )}
        >
          {leftIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        type={type}
        className={baseInput}
        aria-invalid={isInvalid || undefined}
        {...merged}
      />
      {rightAction ? (
        <span className={cn("absolute top-1/2 -translate-y-1/2", s.action)}>
          {rightAction}
        </span>
      ) : rightIcon ? (
        <span
          aria-hidden
          className={cn(
            "text-subtle pointer-events-none absolute top-1/2 inline-flex -translate-y-1/2 items-center justify-center leading-none",
            s.iconRight,
          )}
        >
          {rightIcon}
        </span>
      ) : null}
    </div>
  );
});
