import type { ReactNode } from "react";

import { HEADER_ACTION_SLOT } from "@/components/admin/chrome";
import { cn } from "@/lib/utils";
import { IconCircle } from "@/components/ui/IconCircle";

/**
 * SectionHeader — "plain" sekcijski header BREZ card wrapperja.
 *
 * **April 2026 redesign**: razlika od `AdminSection` je, da ta NE renderira
 * card-a okrog vsebine. Uporabljaš ga, ko hočeš:
 *   - icon-in-circle + h2 title + description ZGORAJ
 *   - vsebino spodaj (StatCard tile-i ali per-item kartice) DIREKTNO na
 *     page bg-ju, vsaka kartica = svoja "svetla kartica na temno ozadje"
 *
 * Glavna prednost: ni nested kartic (kartica-na-kartico). Vsaka StatCard
 * ali list-item kartica je samostojna lifted kartica direktno na page bg.
 *
 * **Uporaba**:
 * ```tsx
 * <SectionHeader icon={<Inbox className="h-5 w-5" />} title="Akcijska vrsta" description="..." />
 * <Stagger className="grid grid-cols-4 gap-4">
 *   <StatCard ... />
 *   <StatCard ... />
 * </Stagger>
 * ```
 *
 * Header layout je IDENTIČEN kot v `AdminSection` (h-10 icon krog,
 * h2 type-lead/xl, text-muted description), le brez wrapper card-a.
 */
export function SectionHeader({
  icon,
  title,
  description,
  action,
  danger = false,
  className,
}: {
  /** Lucide ikona (h-5 w-5). Pojavi se v krogu (h-10 w-10 bg-accent/15). */
  icon: ReactNode;
  title: string;
  description?: string;
  /** Opcijska desna akcija (Badge counter, gumb). */
  action?: ReactNode;
  /** Danger varianta (bg-danger/15 text-danger ikona) — kot v AdminSection. */
  danger?: boolean;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start gap-4", className)}>
      <IconCircle
        tone="none"
        size="sm"
        className={cn(danger ? "bg-danger/15 text-danger" : "bg-accent/15 text-accent")}
      >
        {icon}
      </IconCircle>
      <div className="min-w-0 flex-1 basis-40">
        <h2 className="text-text type-lead font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-muted type-small mt-1 hidden leading-relaxed sm:block">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className={HEADER_ACTION_SLOT}>{action}</div> : null}
    </header>
  );
}
