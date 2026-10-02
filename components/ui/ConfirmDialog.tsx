"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

/**
 * ConfirmDialog — branded potrditveni modal namesto native `window.confirm()`.
 *
 * **Zakaj obstaja:**
 *   - Native confirm() pokaže browser-specific škatlico ("localhost:3000
 *     sporoča: ..."), ki izgleda kot phishing poskus v admin UI-ju.
 *   - Naš Dialog komponent ima tokenizirane barve, dark mode, fokus-trap,
 *     ESC/backdrop close, dostopen `aria-modal` — vse to confirm() nima.
 *
 * **Uporaba:**
 *   ```tsx
 *   <ConfirmDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     title={t("deleteConfirmTitle")}
 *     description={t("deleteConfirm", { label })}
 *     confirmLabel={t("deleteLabel")}
 *     cancelLabel={t("cancel")}
 *     tone="danger"
 *     onConfirm={() => submitForm()}
 *   />
 *   ```
 *
 * `tone`:
 *   - `danger` (default za izbris) — rdeč "Izbriši" gumb + subtle icon.
 *   - `warning` (rotate, regenerate) — rumen ton + opozorilna ikona.
 *   - `neutral` — accent gumb (običajna potrditev).
 *
 * `onConfirm` je sinhrono — kliče, ki proži odpre mu delo (form.submit,
 * action call). Če je dolga async operacija, prenesi `pending` prop
 * navzven, da gumb disablat medtem ko teče.
 */

type ConfirmDialogTone = "danger" | "warning" | "neutral";

type ConfirmDialogProps = {
  open: boolean;
  /** Kanonsko zapiranje. */
  onOpenChange?: (open: boolean) => void;
  /** Starejše ime istega dogodka (zanmeke API) — zapre dialog. */
  onClose?: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  tone?: ConfirmDialogTone;
  /** Starejše ime za `tone` — `"destructive"` ≙ `tone="danger"`. */
  variant?: "default" | "destructive";
  /** Je akcija pending? Disable potrditveni gumb in pokaži spinner. */
  pending?: boolean;
  /** Starejše ime za `pending`. */
  loading?: boolean;
  /** Custom ikona v title-header-ju (override za tone ikono). */
  icon?: ReactNode;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  confirmLabel = "Potrdi",
  cancelLabel = "Prekliči",
  onConfirm,
  tone,
  variant,
  pending,
  loading,
  icon,
}: ConfirmDialogProps) {
  const resolvedTone: ConfirmDialogTone =
    tone ?? (variant === "destructive" ? "danger" : "neutral");
  const busy = pending ?? loading ?? false;
  const close = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    else if (!next) onClose?.();
  };
  const toneStyles = TONE_STYLES[resolvedTone];
  const displayIcon = icon ?? <AlertTriangle className="h-5 w-5" aria-hidden />;

  return (
    <Dialog open={open} onOpenChange={close}>
      {/* w-fit: confirm-modal naj se prilagodi dolžini naslova (Fraunces
          serif + lokalizacije kot DE „Booking.com löschen?” so daljše od
          fiksnih 520px). `min-w-[380px]` prepreči kolaps pri kratkih
          naslovih („Delete?”), `max-w-[min(calc(100vw-2rem),640px)]` pa
          preglavi, če je naslov nenormalno dolg. */}
      <DialogContent
        size="md"
        className="w-fit max-w-[min(calc(100vw-2rem),640px)] min-w-[380px]"
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              toneStyles.iconBg,
              toneStyles.iconText,
            )}
            aria-hidden
          >
            {displayIcon}
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="type-lead">{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse items-stretch justify-end gap-2 sm:flex-row sm:items-center">
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="md" disabled={busy}>
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={toneStyles.buttonVariant}
            size="md"
            onClick={onConfirm}
            disabled={busy}
            className="justify-center"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * `buttonVariant` iz Button.tsx-a: primary | secondary | ghost | link |
 * danger | outline. Warning nima lastnega variant-a — uporabimo primary
 * (accent) gumb in warning-tone nakažemo z amber ikono v header-ju.
 */
const TONE_STYLES: Record<
  ConfirmDialogTone,
  {
    iconBg: string;
    iconText: string;
    buttonVariant: "primary" | "danger";
  }
> = {
  danger: {
    iconBg: "bg-danger/10",
    iconText: "text-danger",
    buttonVariant: "danger",
  },
  warning: {
    iconBg: "bg-warning/10",
    iconText: "text-warning",
    buttonVariant: "primary",
  },
  neutral: {
    iconBg: "bg-accent/10",
    iconText: "text-accent",
    buttonVariant: "primary",
  },
};
