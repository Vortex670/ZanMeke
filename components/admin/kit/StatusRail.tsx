import { cn } from "@/lib/utils";

// ============================================================================
// <StatusRail> — navpični trak ob levem robu vrstice, ki nosi STANJE.
// ----------------------------------------------------------------------------
//   ┃ ← ta trak
//   ┃  vsebina vrstice
//
// Barva pride iz `lib/admin/status.ts` (pet pomenov), širina iz žetona
// `--rail-w`. Vrstica, ki trak nosi, mora biti `relative overflow-hidden`.
//
// Ista datoteka na zanmeke.com (`components/admin/StatusRail.tsx`).
// ============================================================================

/** Ton traku — pomen, ne barva. Preslikavo dela `lib/admin/status.ts`. */
export type AdminListRowTone =
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "neutral";

/**
 * Edina preslikava tona v barvo traku. Ista imena kot `BadgeVariant`, zato
 * značka in trak v isti vrstici nikoli ne moreta povedati dvojega.
 */
export const RAIL_TONE: Record<AdminListRowTone, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  muted: "bg-muted",
  neutral: "bg-border-strong",
};

/**
 * Ton → barva besedila in ikone. Isti pomen kot trak, druga vloga: statusna
 * ikona v vrstici, števec v glavi odseka.
 */
export const TONE_TEXT: Record<AdminListRowTone, string> = {
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  muted: "text-muted",
  neutral: "text-muted",
};

export function StatusRail({
  tone = "neutral",
  className,
}: {
  tone?: AdminListRowTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-0 left-0 z-10 w-(--rail-w)",
        RAIL_TONE[tone],
        className,
      )}
    />
  );
}
