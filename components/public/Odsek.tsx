import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

// ============================================================================
// <Odsek /> — en vodoravni pas strani
// ----------------------------------------------------------------------------
// Vsak odsek javne strani gre skozi tu. Trije razlogi:
//
//  1 RITEM. Stran, kjer so vsi pasovi iste barve, se bere kot en dolg blok;
//    oko nima kje vdihniti in ne ve, kje se ena misel konča. `plast` menja
//    podlago, zato ima stran svetle in temne postaje.
//  2 ŠIRINA. Ploskev teče čez ves zaslon, besedilo pa ne sme — vrstica čez
//    1900 px se ne bere. Zato je ozadje vedno polno, vsebino pa omeji
//    `sirina`.
//  3 ENA VIŠINA. `odsek-y` je na enem mestu; ko se ritem spremeni, se
//    spremeni povsod hkrati.
//
// Temna ploskev ne potrebuje posebnih razredov v vsebini: `plast-temna`
// prepiše pomenske žetone (glej `app/globals.css`), zato ista kartica in
// isti gumb delujeta na svetlem in na temnem.
// ============================================================================

type Plast = "svetla" | "mehka" | "temna";
type Sirina = "ozek" | "sirok" | "poln";

const PLAST: Record<Plast, string> = {
  svetla: "plast-svetla",
  mehka: "plast-mehka",
  temna: "plast-temna",
};

const SIRINA: Record<Sirina, string> = {
  ozek: "vsebnik",
  sirok: "vsebnik-sirok",
  /** Brez vsebnika — vsebina sama poskrbi za robove (galerije, pasovi). */
  poln: "",
};

export function Odsek({
  plast = "svetla",
  sirina = "sirok",
  sij = false,
  visina = true,
  crta = false,
  as: Znacka = "section",
  className,
  vsebnikClassName,
  children,
  ...rest
}: {
  plast?: Plast;
  sirina?: Sirina;
  /**
   * Sij in zrno čez temno ploskev.
   *
   * NI PRIVZET, in to je bistvo. Sij je radialni preliv, zasidran v KOTIH
   * odseka: svetlo zgoraj levo, svetlo spodaj desno. Dva temna odseka drug
   * pod drugim sta zato dobila vsak svojega — spodnji rob prvega se je
   * posvetlil, zgornji rob drugega pa je spet začel temen, in na stiku je
   * nastala vidna vodoravna črta. Na domači strani med stikom in nogo, na
   * ponudbi med uvodom in izračunom.
   *
   * Pravilo: sij ima SAMO UVOD strani. Vsi drugi temni pasovi so ploski in
   * se zato stikajo brez šiva.
   */
  sij?: boolean;
  /** Navpični ritem; izklopi se pri pasovih, ki imajo svojo višino. */
  visina?: boolean;
  /** Tanka črta na vrhu — za dva soseda iste barve. */
  crta?: boolean;
  as?: ElementType;
  className?: string;
  vsebnikClassName?: string;
  children: ReactNode;
} & Omit<React.ComponentProps<"section">, "children" | "className">) {
  return (
    <Znacka
      {...rest}
      className={cn(
        "relative isolate",
        PLAST[plast],
        sij && "globina",
        crta && "border-crta border-t",
        className,
      )}
    >
      <div className={cn(SIRINA[sirina], visina && "odsek-y", vsebnikClassName)}>
        {children}
      </div>
    </Znacka>
  );
}

// ----------------------------------------------------------------------------
// <UvodOdseka /> — oznaka, naslov, uvod
// ----------------------------------------------------------------------------
// Številka poglavja ni okras: stran ima pet postaj in človek, ki drsi, mora
// vedeti, katera je po vrsti in koliko jih je še. Brez nje je vsak naslov
// enako daleč od konca.
// ----------------------------------------------------------------------------

export function UvodOdseka({
  stevilka,
  oznaka,
  naslov,
  uvod,
  desno,
  className,
}: {
  /** »01«, »02« … Izpiše se pred oznako. */
  stevilka?: string;
  oznaka: string;
  naslov: ReactNode;
  uvod?: string;
  /** Dejanje ali podatek na desni strani naslova (namizje). */
  desno?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "gap-s3 flex flex-col lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="max-w-3xl min-w-0">
        {/* PRAVILO 60/30/10 TUDI TU. Prej je bila cela oznaka v poudarku in
            ker ima vsak odsek svojo, se je mentol ponovil petkrat po strani
            — poudarek, ki je povsod, ni več poudarek. Barvo nosi samo
            številka; beseda je tiha. */}
        <p className="type-poglavje text-bledo gap-s1 flex items-center">
          {stevilka ? (
            <span className="text-poudarek stevilke tabular-nums">{stevilka}</span>
          ) : null}
          {oznaka}
        </p>
        <h2 className="type-h1 kineticna mt-s2">{naslov}</h2>
        {uvod ? <p className="type-lead text-mirno mt-s3 mera">{uvod}</p> : null}
      </div>
      {desno ? <div className="shrink-0">{desno}</div> : null}
    </div>
  );
}
