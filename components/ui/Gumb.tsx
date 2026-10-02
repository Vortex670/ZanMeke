import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// ============================================================================
// <Gumb /> in <GumbPovezava /> — edina gumba na strani
// ----------------------------------------------------------------------------
// VIŠINA JE FIKSNA in ne izhaja iz vsebine. To je bistvo: polni gumb ima
// ikono v krogu, obrobni je nima, in če bi se višina računala iz vsebine, bi
// bil polni za štiri piksle višji od sosednjega. Dva gumba drug ob drugem,
// visoka vsak svoje, sta prva stvar, ki jo oko opazi kot površnost.
//
// Troje različic in nič več: `polni` za glavno dejanje, `obris` za drugo
// možnost, `tih` za tretjo. Na enem zaslonu je en sam polni gumb — če sta
// dva, nobeden ni glavni.
//
// `ikona` se pri polnem gumbu izriše v krogu, pri ostalih kot navadna ikona:
// krog je znak dejanja, ne okras, in na obrobnem gumbu bi tekmoval z obrobo.
//
// V `app/` in drugih komponentah ni surovega `<button>` ali gumbu podobne
// povezave. Ko se spremeni višina, radij ali obnašanje ob pritisku, se
// spremeni tu — in povsod.
// ============================================================================

type Videz = "polni" | "obris" | "tih";
type Velikost = "sr" | "mal";

const VIDEZ: Record<Videz, string> = {
  polni: "bg-poudarek text-na-poudarku hover:opacity-90",
  obris: "border-crta border hover:border-crnilo text-crnilo",
  tih: "text-poudarek hover:opacity-80",
};

/** Obrobni gumb na temni ploskvi — druga obroba, isti razred višine. */
export const GUMB_NA_TEMNEM =
  "border-na-obratu/25 text-na-obratu hover:bg-na-obratu/10 hover:border-na-obratu/40";

/**
 * POLNI gumb na temni ploskvi (hero, noga).
 *
 * Temna ploskev je temna v obeh temah, poudarek pa ne: v svetli temi je
 * temno zelen in gumb na temnem herojo se zlije z ozadjem (razmerje
 * 2,37 : 1). Zato ima tu svojo svetlo različico, enako v obeh temah.
 *
 * Krog z ikono dobi svojo prosojnost znova, ker osnovni razred računa z
 * drugo barvo besedila.
 */
export const GUMB_POLNI_NA_TEMNEM =
  "bg-poudarek-obrat text-na-poudarku-obrat hover:opacity-90 " +
  "[&>span:first-child]:bg-na-poudarku-obrat/15";

const VELIKOST: Record<Velikost, string> = {
  sr: "h-12 px-5 gap-2.5",
  mal: "h-10 px-4 gap-2",
};

// OBLIKA JE PODPIS. Okrogla pilula z ikono v krogu je oblika gumba na
// gostilnica-plus.si; ista oblika tu je pomenila, da sta strani na prvi
// pogled ena. Tu je gumb pravokotnik z majhnim radijem in napisom v mono
// pisavi — bliže gumbu v orodju kot gumbu na jedilniku.
const OSNOVA =
  "type-label inline-flex shrink-0 items-center justify-center rounded-md transition-[opacity,border-color,transform] " +
  "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100";

type Skupno = {
  videz?: Videz;
  velikost?: Velikost;
  /** Izriše se pred besedilom; pri polnem gumbu v krogu. */
  ikona?: ReactNode;
  className?: string;
  children: ReactNode;
};

function sestavi(videz: Videz, velikost: Velikost, className?: string) {
  return cn(OSNOVA, VELIKOST[velikost], VIDEZ[videz], className);
}

function Vsebina({ ikona, children }: { ikona?: ReactNode; children: ReactNode }) {
  if (!ikona) return <>{children}</>;

  // Ikona je ZA napisom in brez kroga. Puščica na koncu bere kot smer, krog
  // pred napisom pa je okras — in ravno tisti okras, ki ga ima gumb na
  // gostilnici.
  return (
    <>
      {children}
      <span aria-hidden className="inline-flex [&>svg]:size-4">
        {ikona}
      </span>
    </>
  );
}

export function Gumb({
  videz = "polni",
  velikost = "sr",
  ikona,
  className,
  children,
  ...rest
}: Skupno & Omit<React.ComponentProps<"button">, "children">) {
  return (
    <button {...rest} className={sestavi(videz, velikost, className)}>
      <Vsebina ikona={ikona}>{children}</Vsebina>
    </button>
  );
}

export function GumbPovezava({
  videz = "polni",
  velikost = "sr",
  ikona,
  className,
  children,
  href,
  ...rest
}: Skupno & { href: string } & Omit<React.ComponentProps<"a">, "href" | "children">) {
  const razred = sestavi(videz, velikost, className);
  const vsebina = <Vsebina ikona={ikona}>{children}</Vsebina>;

  // Zunanji naslov, telefon in sidro gredo skozi navadno sidro: `Link` je za
  // poti te strani, vse drugo prepustimo brskalniku.
  const zunanja =
    href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");

  if (zunanja) {
    return (
      <a
        {...rest}
        href={href}
        className={razred}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {vsebina}
      </a>
    );
  }

  return (
    <Link href={href} className={razred}>
      {vsebina}
    </Link>
  );
}

// ----------------------------------------------------------------------------
// <GumbIkona /> — okrogel gumb brez besedila
// ----------------------------------------------------------------------------
// Samo za dejanja, ki jih ikona res pove sama: zapri, na vrh, naprej. Vsak
// tak gumb MORA imeti `aria-label`, ker brez besedila bralnik zaslona ne
// pove ničesar — zato je `naziv` obvezen in ne neobvezen.
// ----------------------------------------------------------------------------

const IKONA_VELIKOST: Record<Velikost, string> = {
  sr: "size-12 [&>svg]:size-5",
  mal: "size-10 [&>svg]:size-4",
};

const IKONA_VIDEZ: Record<Videz, string> = {
  polni: "bg-poudarek text-na-poudarku hover:scale-[1.04]",
  obris: "border-crta bg-ploskev text-crnilo hover:border-poudarek border",
  tih: "text-mirno hover:text-crnilo",
};

export function GumbIkona({
  naziv,
  videz = "polni",
  velikost = "sr",
  className,
  children,
  ...rest
}: {
  /** Kaj gumb naredi — za bralnik zaslona in namig. */
  naziv: string;
  videz?: Videz;
  velikost?: Velikost;
  className?: string;
  children: ReactNode;
} & Omit<React.ComponentProps<"button">, "children">) {
  return (
    <button
      {...rest}
      aria-label={naziv}
      title={naziv}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-[transform,border-color,color,opacity]",
        "active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55",
        IKONA_VELIKOST[velikost],
        IKONA_VIDEZ[videz],
        className,
      )}
    >
      {children}
    </button>
  );
}
