"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useBreadcrumbOverrides } from "@/components/admin/shell/BreadcrumbContext";
import { SEGMENT_LABELS } from "@/lib/admin/breadcrumb-labels";
import { cn } from "@/lib/utils";

/**
 * AdminBreadcrumbs — drobtine, izpeljane iz pathname-a.
 *
 *   /admin/foto/prilipe/uredi → Admin / Galerija / Album / Uredi
 *
 * - Znani segmenti dobijo oznako iz `SEGMENT_LABELS`.
 * - Neznani segmenti (id-ji, slug-i) se pokažejo kot so (max 12 znakov),
 *   razen če jih stran povozi z `<BreadcrumbLabel>`.
 * - Vsi razen zadnjega so povezave; zadnji je trenutna stran (`aria-current`).
 *
 * Ista komponenta na obeh projektih (second-home `AdminBreadcrumbs`): v
 * `AdminTopbar` z `hidden lg:flex`, v `AdminPage` z `lg:hidden` (na telefonu
 * in tablici v glavi ni prostora).
 */

const MAX_DYNAMIC_LABEL = 12;

/**
 * Slovar segment → oznaka. Za neznane segmente (slug-i albumov, kategorij
 * ipd.) pademo nazaj na URL segment, dokler ga ne povozi `<BreadcrumbLabel>`.
 */

type Crumb = { href: string; label: string; segment: string };

function truncate(value: string): string {
  return value.length > MAX_DYNAMIC_LABEL
    ? `${value.slice(0, MAX_DYNAMIC_LABEL)}…`
    : value;
}

export function AdminBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const overrides = useBreadcrumbOverrides();

  if (!pathname.startsWith("/admin")) return null;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let acc = "";
  for (const segment of segments) {
    acc += `/${segment}`;
    const label =
      overrides[segment] ??
      SEGMENT_LABELS[segment] ??
      truncate(decodeURIComponent(segment));
    crumbs.push({ href: acc, label, segment });
  }
  // Samo »Admin« (koren) ni drobtina — ne prikažemo praznega niza.
  if (crumbs.length < 2) return null;

  return (
    <nav
      aria-label="Drobtine"
      className={cn(
        "type-small flex min-w-0 items-center gap-2 overflow-hidden sm:gap-2.5",
        className,
      )}
    >
      <ol className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li
              key={crumb.href}
              className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
            >
              {i > 0 ? (
                <span aria-hidden className="text-muted/30 shrink-0 font-light">
                  /
                </span>
              ) : null}
              {isLast ? (
                <span
                  aria-current="page"
                  className="text-text truncate font-medium tracking-tight"
                  title={crumb.label}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className={cn(
                    "text-muted hover:text-text hover:bg-foreground/4 -mx-1 inline-flex min-w-0 items-center rounded-md px-1 tracking-tight transition-colors",
                    "max-w-40 truncate",
                  )}
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
