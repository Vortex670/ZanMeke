"use client";

import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { ActiveIndicator } from "@/components/motion/ActiveIndicator";
import { Button } from "@/components/ui/Button";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// ============================================================================
// <TimeRangeChips> — segmented control za time range izbiro (standard §20.1)
// ----------------------------------------------------------------------------
// 1:1 port zanmeke `components/admin/statistike/TimeRangeChips.tsx` (kanon).
// URL-driven: nastavi ?range=X v query string, page re-renders s svežimi podatki.
//   • Outer: bg-surface/70 ring-1 rounded-full pill (h-9), `relative`
//   • Active chip: dark gradient pill = `ActiveIndicator` (GSAP), ki drsi
//     med čipi (x, width) — nadomestek Motion `layoutId`
//   • Inactive chips: muted text, hover state
// Labele pridejo iz strežnika (t()) — SH admin je i18n.
// ============================================================================

export type TimeRangeValue = "today" | "24h" | "7d" | "30d" | "90d" | "365d";

export type TimeRangeOption = { value: TimeRangeValue; label: string };

type Props = {
  current: TimeRangeValue;
  options: readonly TimeRangeOption[];
  ariaLabel: string;
};

export function TimeRangeChips({ current, options, ariaLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setRange(range: TimeRangeValue) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("range", range);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex h-9 items-center gap-0.5 rounded-full p-0.5",
        // Na telefonu vrstica dejanj v `AdminPage` vsem otrokom vsili
        // `w-full` — pravilno za gumbe, za segmentni preklopnik pa pomeni,
        // da se raztegne čez zaslon, vsebina pa ostane zbrana levo in za
        // njo zeva prazen pas. Če že dobi celo širino, naj jo tudi uporabi:
        // trije enaki deli, kot je pri segmentnih preklopnikih običaj.
        "max-sm:w-full",
        "bg-surface/70 ring-border/60 ring-1 backdrop-blur-sm",
        "shadow-sm",
        isPending && "opacity-70",
      )}
    >
      {/* Aktivna pilula — en element, ki drsi na aktivni čip (x, width).
          Prvi otrok, čipi so `relative` → izrisani nad njo. */}
      <ActiveIndicator
        activeKey={current}
        className={cn(
          "rounded-full",
          "from-text via-text to-text/85 bg-linear-to-b",
          "shadow-pressed",
          "ring-text/8 ring-1",
        )}
      />
      {options.map((r) => {
        const isActive = current === r.value;
        return (
          <Button
            key={r.value}
            type="button"
            variant="ghost"
            size="sm"
            role="tab"
            aria-selected={isActive}
            data-indicator-key={r.value}
            onClick={() => setRange(r.value)}
            className={cn(
              "relative h-8 rounded-full bg-transparent px-3.5 hover:bg-transparent",
              "max-sm:flex-1",
              "type-small tracking-tight",
              isActive ? "text-bg hover:text-bg" : "text-muted hover:text-text",
            )}
          >
            <span className="text-shadow-hairline relative">{r.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
