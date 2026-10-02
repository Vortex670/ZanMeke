import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { FadeIn } from "@/components/motion/fade-in";
import { HEADER_ACTION_SLOT } from "@/components/admin/chrome";
import { cn } from "@/lib/utils";
import { IconCircle } from "@/components/ui/IconCircle";

/**
 * AdminSection — KANONSKA top-level sekcijska kartica za VSE admin strani.
 *
 * **April 2026 — ena komponenta za vse:** uporablja jo `/admin`,
 * `/admin/analytics`, `/admin/profil`, `/admin/nastavitve`,
 * `/admin/sporocila`, `/admin/mnenja`, `/admin/bookings`.
 *
 * **Vizualni vzorec** (NESPREMENLJIV, 1:1 zanmeke `AdminSection`):
 *   - Wrapper: `bg-surface rounded-2xl border border-chrome-line
 *     shadow-(--shadow-card)` (`bg-danger/3 border-danger/15` pri `danger`)
 *   - Header: `h-10 w-10` icon-in-circle (`bg-accent/15 text-accent`,
 *     `bg-danger/15 text-danger` v danger varianti) levo
 *   - Opcijski eyebrow: `type-label` (mono, verzalke)
 *   - h2 title: `text-text type-h3 font-semibold`
 *   - Opcijska description: `text-muted type-small leading-relaxed`
 *   - Opcijska action slot desno (Badge counter, gumbi)
 *   - `collapsible` doda `<details>/<summary>` chevron toggle
 *
 * **Padding:** `p-5 sm:p-6`. Body content pod headerjem ima `gap-4`.
 * **Icon size:** `<Icon className="h-5 w-5" />`.
 *
 * Ne ustvarjaj lokalnih variantov te komponente. Če manjka prop, ga dodaj
 * SEM, ne v lokalno kopijo.
 */

type AdminSectionProps = {
  /** Lucide ikona (h-5 w-5). Pojavi se v krogu (h-10 w-10 bg-accent/15). */
  icon: ReactNode;
  /** Glavni naslov (h2, type-lead/xl). */
  title: string;
  /** Opcijska kratka razlaga pod naslovom (text-muted, type-small). */
  description?: string;
  /**
   * Opcijski uppercase eyebrow nad naslovom — uporabljaj ga le pri
   * collapsible sekcijah, kjer pomaga skenirati kontekst (npr. "IDENTITETA"
   * nad "Osebni podatki").
   */
  eyebrow?: string;
  /**
   * Opcijska desna content slot (npr. Badge counter, akcijski gumb).
   * Pri collapsible varianti pride PRED chevron-om.
   */
  action?: ReactNode;
  /** Collapsible toggle z chevron-om (desno). */
  collapsible?: boolean;
  /** Privzeto stanje collapsible sekcije. */
  defaultOpen?: boolean;
  /**
   * Danger varianta — `bg-danger/5` ozadje + `bg-danger/15 text-danger`
   * krog. Uporabi za destruktivne sekcije ("Nevarno območje").
   */
  danger?: boolean;
  /** Anchor id za skok-povezave (npr. `?#osebni-podatki`). */
  id?: string;
  /** Extra utility klase za FadeIn wrapper (npr. `h-full` za grid alignment). */
  className?: string;
  /** Vsebina sekcije. */
  children: ReactNode;
};

export function AdminSection({
  icon,
  title,
  description,
  eyebrow,
  action,
  collapsible = false,
  defaultOpen = false,
  danger = false,
  id,
  className,
  children,
}: AdminSectionProps) {
  // **April 2026**: BREZ `overflow-hidden` na collapsible variantu — sicer
  // popoverji znotraj sekcije (DatePicker, dropdowns, ipd.) se obrezujejo
  // proti rounded rob-om. Native `<details>` itak nima transition animacije,
  // zato overflow-hidden ni potreben za clean open/close. Padding apliciramo
  // na <summary> (collapsible) ali na section direktno (static).
  const wrapperClass = cn(
    "rounded-2xl border shadow-(--shadow-card)",
    danger ? "bg-danger/3 border-danger/15" : "bg-surface border-chrome-line",
    collapsible ? null : "p-5 sm:p-6",
  );

  const iconTone = danger ? "bg-danger/15 text-danger" : "bg-accent/15 text-accent";

  const eyebrowClass = cn(
    "type-eyebrow font-semibold",
    danger ? "text-danger/80" : "text-subtle",
  );

  const HeaderContent = (
    <>
      <IconCircle tone="none" size="sm" className={iconTone}>
        {icon}
      </IconCircle>
      {/* `basis-40` + `flex-wrap` na glavi: na telefonu gredo akcije (značka,
          gumbi) v svojo vrstico pod naslov, namesto da stisnejo besedilo v
          stolpec po eno besedo. */}
      <div className="min-w-0 flex-1 basis-40 space-y-1">
        {eyebrow ? <p className={eyebrowClass}>{eyebrow}</p> : null}
        <h2 className="text-text type-lead font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-muted type-small hidden leading-relaxed sm:block">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className={HEADER_ACTION_SLOT}>{action}</div> : null}
    </>
  );

  if (collapsible) {
    return (
      <FadeIn className={cn("flex h-full", className)}>
        <section id={id} className={cn("w-full", wrapperClass)}>
          <details open={defaultOpen} className="group">
            <summary
              className={cn(
                "flex cursor-pointer flex-wrap items-start gap-4 p-5 sm:p-6",
                "list-none select-none [&::-webkit-details-marker]:hidden",
                "rounded-2xl",
                "hover:bg-text/2 transition-colors",
              )}
            >
              {HeaderContent}
              <span
                aria-hidden
                className={cn(
                  "bg-text/4 text-subtle mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full",
                  "transition-colors",
                  danger
                    ? "group-hover:bg-danger/15 group-hover:text-danger"
                    : "group-hover:bg-accent/15 group-hover:text-accent",
                )}
              >
                <ChevronDown
                  className="size-4 transition-transform duration-(--dur-fast) group-open:rotate-180"
                  strokeWidth={1.8}
                />
              </span>
            </summary>
            {/* Content area — `flex flex-col gap-4` daje gap med
                AdminSubSection-i (sicer so nabite eno na drugo). */}
            <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6 sm:pb-6">
              {children}
            </div>
          </details>
        </section>
      </FadeIn>
    );
  }

  return (
    <FadeIn className={cn("flex h-full", className)}>
      <section
        id={id}
        className={cn("flex h-full w-full flex-col gap-4", wrapperClass)}
      >
        <header className="flex flex-wrap items-start gap-4">{HeaderContent}</header>
        {children}
      </section>
    </FadeIn>
  );
}
