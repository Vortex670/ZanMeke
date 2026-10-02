import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

// ============================================================================
// <EmptyState> — vsebinski nadomestek, kadar seznam nima zapisov.
// ----------------------------------------------------------------------------
// Nikjer v adminu ne piši lastnega »prazno« bloka — uporabi tega.
//
// Pravila (standard §11.3):
//   1. Pojasni, ZAKAJ je prazno (ne samo »Ni podatkov«).
//   2. Predlagaj naslednji korak (povezava ali gumb v `action`).
//   3. Ikona je neobvezna, na seznamih jo uporabljamo.
//
// Ploskve NIMA: skoraj vedno stoji znotraj `AdminSection`, kartica v kartici
// pa je šum. Kadar stoji sama (stran brez odseka), vklopi `surface`.
//
// Ista datoteka na obeh projektih; razlikujejo se samo barvni žetoni.
// ============================================================================

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  /** Manj navpičnega prostora — za vgradnjo v kartico ali tabelo. */
  compact?: boolean;
  /** `inline` — ena vrstica (ikona + besedilo) za prazne odseke. */
  variant?: "block" | "inline";
  /** Nariše lastno ploskev — samo kadar blok ne stoji v odseku. */
  surface?: boolean;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
  variant = "block",
  surface = false,
  className,
  ...props
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "text-muted type-small flex items-center justify-center gap-3 px-4 py-4",
          className,
        )}
        {...props}
      >
        {icon ? (
          <span
            aria-hidden
            className="bg-text/5 text-subtle ring-border/60 inline-flex size-8 shrink-0 items-center justify-center rounded-full ring-1 [&>svg]:size-4"
          >
            {icon}
          </span>
        ) : null}
        <span className="text-pretty">
          <span className="text-text font-medium">{title}</span>
          {description ? <span className="text-muted"> · {description}</span> : null}
        </span>
        {action ? <span className="ml-2">{action}</span> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        surface && "border-chrome-line bg-surface rounded-xl border",
        compact ? "px-4 py-8" : "px-6 py-16",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div
          aria-hidden
          className={cn(
            "text-subtle bg-text/5 mb-4 inline-flex items-center justify-center rounded-full",
            compact ? "size-12 [&>svg]:size-5" : "size-16 [&>svg]:size-6",
          )}
        >
          {icon}
        </div>
      ) : null}

      <h3
        className={cn(
          "text-text font-semibold text-balance",
          compact ? "type-body" : "type-lead",
        )}
      >
        {title}
      </h3>

      {description ? (
        <p
          className={cn(
            "text-muted mt-2 max-w-md text-pretty",
            compact ? "type-small" : "type-small sm:type-body",
          )}
        >
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
