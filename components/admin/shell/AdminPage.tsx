import { ArrowLeft } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

import { AdminPageShell } from "@/components/admin/shell/AdminPageShell";
import { FadeIn } from "@/components/motion/fade-in";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================================================
// <AdminPage> — kanonski ovoj za VSE admin podstrani.
// ----------------------------------------------------------------------------
// Vsebuje kontejner, vertikalni ritem, drobtine na ozkih zaslonih in glavo
// strani. Prej sta bili to dve komponenti (`AdminPageShell` + `AdminPageHeader`)
// in vseh 40 strani je uvažalo obe ter ju vedno postavilo skupaj — ločnica ni
// nikoli nič prihranila, uvoz pa je bilo treba pisati dvakrat.
//
//   Drobtine (samo telefon/tablica — v glavi zanje ni prostora)
//   ← Nazaj (samo podstrani, samo namizje)
//   OZNAKA
//   NASLOV (h1, `type-h2`)
//   Opis (skrit na telefonu)                              [dejanja desno]
//
// Ista datoteka na zanmeke.com (`components/admin/shell/AdminPage.tsx`).
// ============================================================================

type AdminPageProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** Širši okvir — za koledar in tabele, kjer je stolpec sicer stisnjen. */
  sirina?: "default" | "wide" | "full";
  /** Naslov strani — niz ali vozlišče (npr. »Pozdravljen, <muted>Žan</muted>«). */
  title: ReactNode;
  description?: ReactNode;
  /** Oznaka nad naslovom (npr. »Statistike · zadnjih 7 dni«). */
  eyebrow?: string;
  /** Povezava nazaj. `"/admin"` je brez učinka — to že pove stranska vrstica. */
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  /**
   * Dejanja na DNU strani, za vsebino — tam, kamor sodi brisanje.
   *
   * Brisanje je bilo v `actions`, torej v glavi: na telefonu je bil poln
   * rdeč gumb največja stvar v prvem zaslonu — nad obrazcem, nad vsebino,
   * nad »Shrani«. Najbolj nepovratno dejanje na strani je dobilo mesto
   * glavnega, in to ravno v dosegu palca.
   *
   * Zdaj stoji za vsebino in za črto: da prideš do njega, moraš mimo vsega,
   * kar zapis je.
   */
  footerActions?: ReactNode;
  children: ReactNode;
};

export function AdminPage({
  title,
  description,
  eyebrow,
  backHref,
  backLabel,
  actions,
  sirina,
  footerActions,
  children,
  className,
  ...props
}: AdminPageProps) {
  return (
    <AdminPageShell className={className} sirina={sirina} {...props}>
      <FadeIn as="header" className="space-y-4">
        {/* Povezava nazaj samo pri podstraneh — »← Admin« na vrhnjih straneh
            podvaja drobtine in stransko vrstico. */}
        {backHref && backHref !== "/admin" ? (
          <Link
            href={backHref}
            className={cn(
              "text-muted type-small inline-flex items-center gap-1.5 max-lg:hidden",
              "hover:text-text transition-colors",
              "focus-visible:rounded-sm",
            )}
          >
            <ArrowLeft className="size-4" strokeWidth={1.6} aria-hidden />
            {backLabel ?? "Admin"}
          </Link>
        ) : null}

        {/* `flex-wrap` + najmanjša širina naslova: ko dejanj ne gre več v
            isto vrstico, se prelomijo v svojo. Prej je naslov ostal brez
            prostora in se je lomil po eno besedo na vrstico. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2 sm:min-w-64 sm:flex-1">
            {eyebrow ? <p className="type-eyebrow text-muted">{eyebrow}</p> : null}
            <h1 className="type-h2 text-text font-semibold tracking-tight text-balance">
              {title}
            </h1>
            {description ? (
              <p className="type-body text-muted hidden max-w-2xl leading-relaxed text-pretty sm:block">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 sm:ml-auto sm:shrink-0",
                // Telefon: gumbi v dveh enakih stolpcih čez celo širino; zadnji
                // lihi gumb čez oba stolpca.
                "max-sm:grid max-sm:w-full max-sm:grid-cols-2 max-sm:[&>*]:w-full",
                "max-sm:[&>*:last-child:nth-child(odd)]:col-span-2",
              )}
            >
              {actions}
            </div>
          ) : null}
        </div>
      </FadeIn>

      {children}

      {/* Ločeno s črto in poravnano desno na namizju; na telefonu čez celo
          širino, ker je tam vsak gumb čez celo širino in bi bil edini pol
          gumb videti kot napaka. */}
      {footerActions ? (
        <div className="border-border/60 flex flex-col gap-2 border-t pt-(--s4) sm:flex-row sm:justify-end">
          {footerActions}
        </div>
      ) : null}
    </AdminPageShell>
  );
}
