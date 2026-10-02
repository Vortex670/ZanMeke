import { Save } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * AdminSaveBar — KANONSKA akcijska vrstica pod vsakim admin obrazcem.
 *
 * Ista komponenta na vseh treh projektih (na second-home.hr je še pod imenom
 * `ApartmentSaveBar`, ker je tam nastala). Vzorec z zanmeke.com: gumb
 * "Shrani" je **sticky na dnu** takoj, ko ima forma neshranjene spremembe,
 * da admin nikoli ne skrola iskat gumba. Ko ni sprememb, je vrstica
 * navadna inline vrstica z ločilom (brez sticky-ja, brez šuma).
 *
 * Struktura:
 *   [leading slot / dirty hint]                [Prekliči] [Shrani]
 *
 * A11y: `aria-live="polite"` na hint-u, gumbi so pravi `<Button>` primitivi.
 */
type AdminSaveBarProps = {
  /** Ali ima forma neshranjene spremembe (sproži sticky + omogoči gumba). */
  dirty: boolean;
  /** Ali action trenutno teče. */
  pending: boolean;
  /** Reset na začetne vrednosti. */
  onReset: () => void;
  saveLabel: string;
  savingLabel: string;
  cancelLabel: string;
  /** Kratek stavek, ko so spremembe neshranjene (npr. "Neshranjene spremembe"). */
  dirtyHint?: string;
  /** Opcijski levi slot (npr. števec izpolnjenosti, auto-translate checkbox). */
  leading?: ReactNode;
  /** Če `false`, vrstica nikoli ne postane sticky (npr. v dialogih). */
  sticky?: boolean;
  className?: string;
};

export function AdminSaveBar({
  dirty,
  pending,
  onReset,
  saveLabel,
  savingLabel,
  cancelLabel,
  dirtyHint,
  leading,
  sticky = true,
  className,
}: AdminSaveBarProps) {
  const floating = sticky && dirty;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        floating
          ? cn(
              "sticky bottom-4 z-(--z-sticky) rounded-2xl px-4 py-3",
              "bg-surface/95 supports-backdrop-filter:bg-surface/80 backdrop-blur-md",
              "border-accent/30 border shadow-lg",
            )
          : "border-border/60 border-t pt-5",
        className,
      )}
    >
      <div className="text-muted type-small flex min-w-0 flex-1 flex-wrap items-center gap-3 max-sm:basis-full">
        {leading}
        {dirty && dirtyHint ? (
          <span
            className="text-accent inline-flex items-center gap-1.5 font-medium"
            aria-live="polite"
          >
            <span aria-hidden className="bg-accent h-1.5 w-1.5 rounded-full" />
            {dirtyHint}
          </span>
        ) : null}
      </div>
      {/* Telefon: oba gumba čez celo širino v dveh enakih stolpcih — isti
          vzorec kot dejanja v glavi strani (`AdminPage`). Prej sta visela
          ob desnem robu, vsak svoje širine: »Shrani« je meril 107 px na
          375 px zaslonu in je bil ob palcu najtežje zadeti gumb na strani,
          čeprav je edini, zaradi katerega si obrazec odprl. */}
      <div
        className={cn(
          "ml-auto flex shrink-0 items-center gap-2",
          "max-sm:grid max-sm:w-full max-sm:grid-cols-2 max-sm:*:w-full",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onReset}
          disabled={pending || !dirty}
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          leftIcon={<Save className="h-4 w-4" aria-hidden />}
          disabled={pending || !dirty}
          loading={pending}
        >
          {pending ? savingLabel : saveLabel}
        </Button>
      </div>
    </div>
  );
}
