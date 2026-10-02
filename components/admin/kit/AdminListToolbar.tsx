import type { FormEventHandler, ReactNode } from "react";

import { AdminTabs, type AdminTabItem } from "@/components/admin/kit/AdminTabs";
import { cn } from "@/lib/utils";

// ============================================================================
// <AdminListToolbar> — ENA orodna vrstica nad vsakim admin seznamom.
// ----------------------------------------------------------------------------
//   ┌──────────────────────────────────────────────────────────────┐
//   │ Zavihki (stanja / razdelki)                                  │  ← `tabs`
//   ├──────────────────────────────────────────────────────────────┤
//   │ [izbirnik] [izbirnik] [ iskanje ……………………… ] [dejanje]        │  ← `filters`
//   └──────────────────────────────────────────────────────────────┘      `search`
//                                                                         `action`
//
// Zakaj ena komponenta: postavitev, višine, razmiki in prelom vrstice so
// določeni TU, na enem mestu. Strani podajo samo VSEBINO (kateri zavihki,
// kateri izbirniki), ne pa razredov — prej je imela vsaka stran svojo
// različico (nekje mreža, nekje preliv, nekje kartica z ozadjem, gumbi
// različnih višin) in vsak popravek je bilo treba ponoviti povsod.
//
// Pravila postavitve:
//   - vse kontrole so visoke 40 px (`h-10`) — izbirniki, iskanje, gumbi;
//   - izbirniki obdržijo svojo širino, iskanje zasede preostanek vrstice,
//     zato sta levi in desni rob poravnana z zavihki in seznamom;
//   - pod `lg` se vrstica zloži navpično (na telefonu v eno vrstico ne gre);
//   - brez lastnega ozadja in okvirja — filtri stojijo na strani, ne v kartici.
//
// Ista datoteka na obeh projektih (zanmeke.com `components/admin/AdminListToolbar.tsx`).
// ============================================================================

export function AdminListToolbar({
  ariaLabel,
  tabs,
  tabsAriaLabel,
  filters,
  search,
  action,
  onSubmit,
  className,
}: {
  /** Kaj se filtrira (npr. »Filtri računov«) — a11y oznaka vrstice. */
  ariaLabel: string;
  /** Zavihki stanj/razdelkov nad vrstico. Brez njih se vrstica izriše sama. */
  tabs?: ReadonlyArray<AdminTabItem>;
  tabsAriaLabel?: string;
  /** Izbirniki (`AdminFilterSelect` ali druge kontrole). */
  filters?: ReactNode;
  /** Iskalno polje (`AdminSearch`) — raztegne se čez preostanek vrstice. */
  search?: ReactNode;
  /** Gumbi na koncu vrstice (npr. »Uporabi«, »Počisti«). */
  action?: ReactNode;
  /** Kadar je podan, je vrstica `<form>` (filtri z gumbom za oddajo). */
  onSubmit?: FormEventHandler<HTMLFormElement>;
  className?: string;
}) {
  const hasRow = Boolean(filters || search || action);

  const row = (
    <>
      {filters ? (
        // Vsaka kontrola: polna širina na telefonu, fiksna od `sm` naprej,
        // brez krčenja v vrstici. Stran ne nastavlja širin sama.
        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
            "[&>*]:w-full sm:[&>*]:w-52 lg:[&>*]:shrink-0",
          )}
        >
          {filters}
        </div>
      ) : null}
      {search ? (
        // `AdminSearch` ima privzeto fiksno širino (`sm:w-64`) — v tej
        // vrstici mora zasesti preostanek, zato jo tu povozimo.
        <div className="min-w-0 flex-1 lg:min-w-44 [&>*]:w-full [&>*]:sm:w-full [&>*]:sm:flex-1">
          {search}
        </div>
      ) : null}
      {action ? (
        <div className="flex shrink-0 items-center gap-2 max-sm:w-full max-sm:justify-end">
          {action}
        </div>
      ) : null}
    </>
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {tabs && tabs.length > 0 ? (
        // Zavihki ostanejo vidni med drsenjem, tik pod glavo.
        //
        // Seznami so na telefonu dolgi — teden malic, dan naročil — in
        // zamenjava zavihka je pogosto dejanje. Brez tega se je bilo treba
        // vrniti na vrh. Odmik je enak odmiku vsebine (`pt-20 sm:pt-24` v
        // lupini), sicer se zavihki prilepijo POD glavo in se odrežejo.
        //
        // Ozadje je nujno: brez njega bi vsebina drsela skozi zavihke.
        //
        // NA TELEFONU zavihki NISO lepljivi. Bili so, in prav tam je nastala
        // napaka, ki jo je lastnik prijavil dvakrat: pod njimi stojita
        // izbirnik razdelka in iskalno polje, ki se ob drsenju zapeljeta
        // podnje — videti je bilo, kot da polje teče skozi črto zavihka.
        // Lepljiva vrstica, pod katero je še ena vrstica kontrol, se vedno
        // enkrat prekrije; ena ravnina manj je cenejša od dveh, ki se
        // pokrivata. Od `sm` naprej je kontrol v eni vrsti in lepljivost
        // ostane.
        <div className="bg-bg z-10 -mx-1 px-1 py-1 max-sm:static sm:sticky sm:top-24">
          <AdminTabs items={tabs} ariaLabel={tabsAriaLabel ?? ariaLabel} />
        </div>
      ) : null}

      {hasRow ? (
        onSubmit ? (
          <form
            role="search"
            aria-label={ariaLabel}
            onSubmit={onSubmit}
            className="flex flex-col gap-3 lg:flex-row lg:items-center"
          >
            {row}
          </form>
        ) : (
          <div
            role="search"
            aria-label={ariaLabel}
            className="flex flex-col gap-3 lg:flex-row lg:items-center"
          >
            {row}
          </div>
        )
      ) : null}
    </div>
  );
}
