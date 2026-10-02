"use client";

import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from "react";

import { useFieldContext, useFieldProps } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

/**
 * Textarea — večvrstični tekstovni vnos.
 *
 * KANON: identičen pill-stilu Input primitiva — bg-bg/60 wrapper z
 * border-border, focus-within:border-accent, leftIcon top-left
 * (`group-focus-within:text-accent`). Match-a CampaignForm + ContactForm.
 *
 * Posebnosti:
 *   - **Auto-resize** preko CSS `field-sizing: content` (Chromium 123+, Firefox 130+).
 *     Fallback je `rows` atribut — zato ga privzeto nastavimo na 4.
 *   - Enak fokus pattern kot Input: cel wrapper se obarva na fokus, ikona
 *     v levem zgornjem kotu spremeni v accent.
 *   - **`resizable`** dovoli uporabniku ročno podaljšanje (privzeto da; pri
 *     sestavljalniku sporočil ne, ker gumb sedi v kotu).
 *
 * `shape`:
 *   - `panel` (privzeto) — `rounded-2xl`; polja v obrazcih.
 *   - `pill` — `rounded-3xl` z najmanjšo višino 48 px; sestavljalnik
 *     sporočila (klepet, odgovor na povpraševanje), kjer pilula v mirovanju
 *     izgleda kot enovrstični `Input`, ob pisanju pa raste.
 *
 * `rightAction` je interaktivni element v spodnjem desnem kotu (gumb
 * »pošlji«) — vzporedno z `Input.rightAction`. Polje samo dobi prostor
 * zanj (`pr-14`), tako da besedilo nikoli ne teče pod gumb. Prej so si
 * klepet, pomočnik in odgovor na sporočilo to pilulo napisali vsak po
 * svoje (trikrat isti ovoj, tri različne velikosti pisave).
 *
 * Uporaba:
 *   ```tsx
 *   <Textarea
 *     name="message"
 *     rows={5}
 *     maxLength={500}
 *     leftIcon={<MessageSquare className="h-4 w-4" />}
 *   />
 *
 *   <Textarea
 *     shape="pill"
 *     rows={1}
 *     resizable={false}
 *     className="max-h-32"
 *     rightAction={<Button size="icon" …>…</Button>}
 *   />
 *   ```
 */

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Ikona v levem zgornjem kotu (kot Input.leftIcon). */
  leftIcon?: ReactNode;
  /** Interaktivni element v spodnjem desnem kotu (npr. gumb »pošlji«). */
  rightAction?: ReactNode;
  /** Oblika ovoja — glej opis komponente. */
  shape?: "panel" | "pill";
  /** Eksplicitno prikaži kot invalid. */
  invalid?: boolean;
  /** Preklopi auto-resize (default true). */
  autoResize?: boolean;
  /** Ročno vlečenje za spodnji rob (default true). */
  resizable?: boolean;
  /** Ne uporabi Field konteksta. */
  ignoreFieldContext?: boolean;
  /**
   * Razredi za OVOJ, ki nosi obrobo, ozadje in zaobljenost — `className` gre
   * na samo polje znotraj njega. Potrebno povsod, kjer se mora spremeniti
   * okvir polja in ne njegova notranjost: na telefonu polje v oknu za
   * naročilo teče od roba do roba in je kvadratno, okvir pa je na ovoju.
   */
  wrapperClassName?: string;
  /**
   * Brez obrobe, ozadja in obroča — kadar polje stoji ZNOTRAJ sestavljene
   * pilule (sestavljalnik sporočila, vnos oznak) in okvir riše starš.
   */
  naked?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      className,
      leftIcon,
      rightAction,
      shape = "panel",
      invalid,
      autoResize = true,
      resizable = true,
      ignoreFieldContext,
      naked = false,
      wrapperClassName,
      rows = 4,
      ...props
    },
    ref,
  ) {
    const ctx = useFieldContext();
    const fieldProps = useFieldProps();
    const isInvalid = invalid ?? (!ignoreFieldContext && ctx?.hasError);
    const merged = ignoreFieldContext ? props : { ...fieldProps, ...props };
    const radius = shape === "pill" ? "rounded-3xl" : "rounded-2xl";

    // Wrapper drži border + bg + transitions; textarea je transparent znotraj.
    // Identičen pattern kot Input.tsx.
    const wrapperClass = cn(
      "group/pill relative",
      !naked && "bg-bg/60 border",
      radius,
      shape === "pill" && "min-h-12",
      !naked && "transition-pill hover:border-border-strong hover:bg-bg",
      !naked && "focus-within:border-accent focus-within:bg-bg",
      !naked &&
        (isInvalid ? "border-danger focus-within:border-danger" : "border-border"),
      wrapperClassName,
    );

    const baseTextarea = cn(
      "text-text type-body block w-full min-w-0 bg-transparent leading-relaxed",
      radius,
      "placeholder:text-subtle",
      "outline-none focus:outline-none focus-visible:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-60",
      "read-only:cursor-default",
      naked ? "p-0" : "py-3",
      naked ? null : leftIcon ? "pl-12" : "pl-5",
      naked ? null : rightAction ? "pr-14" : "pr-5",
      autoResize && "field-sizing-content",
      resizable ? "resize-y" : "resize-none",
      className,
    );

    return (
      <div className={wrapperClass}>
        {leftIcon ? (
          <span
            aria-hidden
            className={cn(
              "text-subtle pointer-events-none absolute top-3.5 left-5",
              "group-focus-within/pill:text-accent transition-colors duration-(--dur-fast)",
            )}
          >
            {leftIcon}
          </span>
        ) : null}
        <textarea
          ref={ref}
          rows={rows}
          className={baseTextarea}
          aria-invalid={isInvalid || undefined}
          {...merged}
        />
        {rightAction ? (
          <span className="absolute right-1 bottom-1">{rightAction}</span>
        ) : null}
      </div>
    );
  },
);
