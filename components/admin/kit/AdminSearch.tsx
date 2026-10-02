"use client";

import { Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Input } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/IconButton";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SEARCH_MAX } from "@/lib/validation/filters";

/**
 * AdminSearch — KANONSKO iskalno polje admin seznamov (standard §11, §20.1).
 *
 * Ena sama komponenta za vse sezname; zanmeke.com ima 1:1 dvojnico v
 * `components/admin/AdminSearch.tsx` (brez i18n, ker je stran enojezična).
 *
 *   • `type="search"`, lupa levo, gumb × desno (ko je kaj vpisano);
 *   • zakasnitev 300 ms po zadnjem tipku → `router.replace`, brez gumba »Išči«;
 *   • stanje živi izključno v URL-ju (`?q=`) — deljivo in preživi osvežitev;
 *   • ostali parametri (zavihek, filtri) ostanejo, `page` se resetira;
 *   • stoji v ISTI vrstici kot čipi/izbirniki, nikoli v svoji kartici.
 *
 * GET filter, zato brez `useActionForm` in brez toasta (standard §4).
 *
 * `placeholder` in `label` podaja klicatelj (strežniška stran prek
 * `getTranslations`), ker se besedilo razlikuje od seznama do seznama; sama
 * komponenta prevaja le oznako gumba za brisanje (`admin.search.clear`).
 */

const DEBOUNCE_MS = 300;
/** Najdaljša poizvedba — varovalo pred predolgim `LIKE` vzorcem. */
/** Meja je v shemi filtrov, da je enaka tu in na strežniku. */
export const ADMIN_SEARCH_MAX = SEARCH_MAX;

type Props = {
  /** Trenutna vrednost iz URL-ja (`searchParams.q`). */
  value: string;
  /** Besedilo v praznem polju — povej, KAJ se išče. */
  placeholder: string;
  /** aria-label polja (npr. »Išči sporočila«). */
  label: string;
  /** Ime parametra, če seznam ne uporablja `q`. */
  param?: string;
  /** Pot brez jezikovnega prefiksa; privzeto trenutna. */
  basePath?: string;
  /** Dodatni parametri, ki se ob novi poizvedbi zavržejo. */
  resetParams?: readonly string[];
  /** Velikost polja — `sm` v gostih vrsticah filtrov. */
  inputSize?: "sm" | "md";
  className?: string;
};

export function AdminSearch({
  value,
  placeholder,
  label,
  param = "q",
  basePath,
  resetParams,
  inputSize = "sm",
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();
  // Zadnja poizvedba, ki je šla v URL — stanje (ne referenca), ker ga
  // beremo tudi med izrisom pri popravku ob spremembi lastnosti.
  const [lastPushed, setLastPushed] = useState(value);

  // Zunanja sprememba URL-ja (»Počisti filtre«, menjava zavihka) se pozna v
  // polju. Popravek stanja ob spremembi lastnosti se dela med izrisom, ne v
  // učinku — tako ni kaskadnega ponovnega izrisa (React: »Adjusting state
  // when a prop changes«). Lastne objave (`lastPushed`) polja ne povozijo,
  // da med zakasnitvijo natipkani znaki ne izginejo.
  const [seenValue, setSeenValue] = useState(value);
  if (seenValue !== value) {
    setSeenValue(value);
    if (value !== lastPushed) {
      setLastPushed(value);
      setDraft(value);
    }
  }

  useEffect(() => {
    const next = draft.trim().slice(0, ADMIN_SEARCH_MAX);
    if (next === lastPushed) return;

    const timer = setTimeout(() => {
      setLastPushed(next);
      const sp = new URLSearchParams(params.toString());
      if (next) sp.set(param, next);
      else sp.delete(param);
      sp.delete("page");
      sp.delete("stran");
      for (const key of resetParams ?? []) sp.delete(key);
      const qs = sp.toString();
      startTransition(() => {
        router.replace(`${basePath ?? pathname}${qs ? `?${qs}` : ""}`, {
          scroll: false,
        });
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draft, lastPushed, param, params, pathname, basePath, resetParams, router]);

  return (
    // `data-admin-search` označi polje, da ga `AdminListToolbar` raztegne
    // čez preostanek vrstice — ne glede na to, kje v vrstici stoji.
    <div
      data-admin-search
      className={cn("min-w-0 flex-1 sm:w-64 sm:flex-none", className)}
    >
      <Input
        type="search"
        name={param}
        inputSize={inputSize}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        maxLength={ADMIN_SEARCH_MAX}
        leftIcon={<Search className="size-4" strokeWidth={1.7} aria-hidden />}
        ignoreFieldContext
        rightAction={
          draft ? (
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              label="Počisti iskanje"
              onClick={() => setDraft("")}
              className="hover:bg-text/6 text-muted hover:text-text size-6 rounded-full"
            >
              <X className="size-3.5" strokeWidth={1.8} aria-hidden />
            </IconButton>
          ) : undefined
        }
        className={cn(pending && "opacity-70")}
      />
    </div>
  );
}
