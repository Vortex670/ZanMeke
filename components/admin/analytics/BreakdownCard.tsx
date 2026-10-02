import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * `<BreakdownCard />` — kartica "Top N" z deležem: eyebrow naslov + vrstice,
 * kjer je delež (`share`, 0–100 %) narisan kot bar v ozadju vrstice, desno
 * pa absolutna vrednost in %. Bar je relativen na največji delež v kartici
 * (prva vrstica = polna širina).
 *
 * Uporaba: razčlenitev prometa na `/admin` (strani, vstopne strani, viri,
 * države). Server-rendered, brez JS.
 */
export type BreakdownRow = {
  /** Stabilen ključ vrstice (path, host, koda države …). */
  key: string;
  /** Prikazan label — privzeto `key`. */
  label?: ReactNode;
  /** Opcijski prefiks (emoji zastavica ipd.). */
  prefix?: string;
  value: number;
  /** Delež v % (0–100). */
  share: number;
};

type Props = {
  title: string;
  rows: BreakdownRow[];
  emptyText: string;
  /** Format številke (privzeto `String`). */
  formatValue?: (value: number) => string;
  className?: string;
};

export function BreakdownCard({
  title,
  rows,
  emptyText,
  formatValue,
  className,
}: Props) {
  const maxShare = Math.max(rows[0]?.share ?? 0, 1);
  return (
    <div
      className={cn(
        "bg-surface flex h-full flex-col rounded-2xl p-5 shadow-(--shadow-card) sm:p-6",
        className,
      )}
    >
      <h3 className="text-subtle type-eyebrow mb-4 font-semibold">{title}</h3>

      {rows.length === 0 ? (
        <p className="text-subtle type-small py-6 text-center">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-1" role="list">
          {rows.map((row) => {
            const barWidth = Math.min((row.share / maxShare) * 100, 100);
            return (
              <li key={row.key} className="relative">
                <span
                  aria-hidden
                  className="bg-accent/10 absolute inset-y-0 left-0 rounded-md"
                  style={{ width: `${barWidth}%` }}
                />
                <div className="type-small relative flex items-center justify-between gap-3 px-2 py-1.5">
                  <span className="text-text flex min-w-0 items-center gap-2">
                    {row.prefix ? (
                      <span aria-hidden className="type-body shrink-0 leading-none">
                        {row.prefix}
                      </span>
                    ) : null}
                    <span className="truncate">{row.label ?? row.key}</span>
                  </span>
                  <span className="text-muted type-small shrink-0 tabular-nums">
                    {formatValue ? formatValue(row.value) : row.value}
                    <span className="text-subtle ml-2 inline-block w-9 text-right">
                      {row.share} %
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
