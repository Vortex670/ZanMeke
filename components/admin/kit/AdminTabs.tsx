import type { ReactNode } from "react";

import Link from "next/link";
import { CountChip } from "@/components/admin/kit/CountChip";
import { cn } from "@/lib/utils";

// ============================================================================
// <AdminTabs> — skupna underline tab primitiva za VSE admin filtre
// (1:1 prenos iz zanmeke.com, sept 2026). Nikjer v adminu ne uporabljaj
// lastnih "pill" filtrov — vsak seznam s filtri uporablja to komponento:
//   • underline (active = text + 2px črta), inactive = muted
//   • count chip desno od labela (mono, tabular-nums)
//   • opcijski tone za count chip (accent / success / warning / danger)
//   • horizontalni scroll na mobile-u (scrollbar-none)
//   • full edge-to-edge (neg. mx kompenzira AdminPageShell padding)
// ============================================================================

export type AdminTabItem = {
  href: string;
  label: string;
  active: boolean;
  count?: number;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
  /** Opcijska leading ikona / barvna pika. */
  leading?: ReactNode;
};

type Props = {
  items: ReadonlyArray<AdminTabItem>;
  ariaLabel?: string;
  /** Dodatni JSX desno od tabov (npr. iskalnik, SelectMenu). */
  rightSlot?: ReactNode;
  /** Full edge-to-edge — neg. mx kompenzacija (default: true). */
  fullBleed?: boolean;
  rightSlotAlign?: "end" | "center";
  /** Dodatne klase na ovoju (npr. zavihki apartmaja brez full-bleed). */
  className?: string;
};

const TONE_COUNT_CLASS: Record<NonNullable<AdminTabItem["tone"]>, string> = {
  default: "bg-text/6 text-muted",
  accent: "bg-accent/15 text-accent",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};

export function AdminTabs({
  items,
  ariaLabel,
  rightSlot,
  fullBleed = true,
  rightSlotAlign = "end",
  className,
}: Props) {
  return (
    // Skupen slog zavihkov v celem adminu — enak kot na straneh apartmaja
    // (tesnejši razmiki, aktiven v accentu, accent podčrta, spodnja črta
    // čez vso širino). Prej je imel vsak del admina svojo različico.
    <div
      className={cn(
        "border-border relative border-b",
        fullBleed && "-mx-4 sm:-mx-6 lg:-mx-8",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-6",
          rightSlotAlign === "center" ? "sm:items-center" : "sm:items-end",
          fullBleed && "px-4 sm:px-6 lg:px-8",
        )}
      >
        <nav
          role="tablist"
          aria-label={ariaLabel ?? "Filter"}
          className="scrollbar-none flex snap-x snap-mandatory scroll-px-4 gap-1 overflow-x-auto"
        >
          {items.map((item) => {
            const tone = item.tone ?? "default";
            const showCount = typeof item.count === "number" && item.count > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="tab"
                aria-selected={item.active}
                className={cn(
                  "group type-small relative inline-flex shrink-0 snap-start items-center gap-1.5 px-2.5 py-3 font-medium tracking-tight transition-colors sm:gap-2 sm:px-3",
                  "focus-visible:rounded-sm",
                  item.active ? "text-(--tab-active)" : "text-muted hover:text-text",
                )}
              >
                {item.leading ? (
                  <span aria-hidden className="[&>svg]:size-3.5">
                    {item.leading}
                  </span>
                ) : null}
                <span>{item.label}</span>
                {showCount ? (
                  <CountChip
                    value={item.count as number}
                    className={cn(
                      "transition-colors",
                      item.active
                        ? "bg-(--tab-active) text-(--tab-active-fg)"
                        : TONE_COUNT_CLASS[tone],
                    )}
                  />
                ) : null}
                {item.active ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-(--tab-active)"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
        {rightSlot ? (
          <div
            className={cn(
              rightSlotAlign === "end"
                ? "flex justify-end pb-3 sm:max-w-xs sm:flex-1"
                : "flex justify-end sm:w-auto",
            )}
          >
            {rightSlot}
          </div>
        ) : null}
      </div>
    </div>
  );
}
