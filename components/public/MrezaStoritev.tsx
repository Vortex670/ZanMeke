import { ArrowUpRight, Camera, Check, Monitor, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { JAMSTVO, KORAKI, STORITVE, type Storitev } from "@/lib/podatki";
import { cn } from "@/lib/utils";

// ============================================================================
// <MrezaStoritev /> — kaj delam, v nesimetrični mreži
// ----------------------------------------------------------------------------
// Dve ENAKI kartici drug ob drugem sta povedali, da sta obe stvari enako
// velika in enako pomembna — kar ni res. Spletna stran je glavno delo in
// glavni znesek; fotografija je pot do nje in pogosto prvi korak.
//
// Zato mreža po mestih in ne po stolpcih: spletna stran zavzame tri petine
// in dve vrstici, fotografija dve petini, pod njo pa stoji potek dela. Oko
// tako dobi vrstni red brez ene same besede o prioriteti.
//
// Celotna kartica je povezava. Gumb v kartici, ki je sama povezava, je
// dvakrat ista pot — puščica v kotu pove isto in ne krade prostora.
// ============================================================================

const IKONA = { splet: Monitor, foto: Camera } as const;

function KarticaStoritve({
  storitev,
  velika = false,
}: {
  storitev: Storitev;
  velika?: boolean;
}) {
  const Ikona = IKONA[storitev.kljuc];

  return (
    <Link
      href="/ponudba"
      className={cn(
        "border-crta bg-ploskev group p-s3 sm:p-s4 relative flex flex-col overflow-hidden rounded-2xl border",
        "hover:border-poudarek transition-[border-color,transform] duration-300 hover:-translate-y-1",
        velika ? "lg:col-span-3" : "lg:col-span-2",
      )}
    >
      {/* Sij se prižge ob miški — barva znamke, ne nova barva. */}
      <span
        aria-hidden
        className="bg-poudarek/8 pointer-events-none absolute -top-24 -right-24 size-56 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="gap-s2 flex items-start justify-between">
        <Ikona className="text-poudarek size-7 shrink-0" strokeWidth={1.5} aria-hidden />
        <ArrowUpRight
          className="text-bledo group-hover:text-poudarek size-5 shrink-0 transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          strokeWidth={1.8}
          aria-hidden
        />
      </div>

      <h3 className={cn("mt-s3", velika ? "type-h1" : "type-h2")}>{storitev.naslov}</h3>
      <p className={cn("text-mirno mt-s2 mera", velika ? "type-lead" : "type-body")}>
        {storitev.povzetek}
      </p>

      <ul className="mt-s3 gap-s1 grid">
        {storitev.tocke.map((t) => (
          <li key={t} className="type-small text-mirno flex items-start gap-2">
            <Check
              className="text-poudarek mt-0.5 size-4 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
            {t}
          </li>
        ))}
      </ul>

      <div className="pt-s4 mt-auto">
        <p
          className={cn(
            "font-naslov stevilke border-crta-mehka pt-s4 border-t",
            velika ? "type-h2" : "type-h3",
          )}
        >
          {storitev.cenaOd}
        </p>
      </div>
    </Link>
  );
}

/**
 * Potek dela — štiri postaje v štirih stolpcih.
 *
 * Vodoravno in ne navpično: štiri postaje ena pod drugo so seznam, štiri
 * druga ob drugi so pot. Oko gre po njih v isti smeri, kot teče delo, in na
 * prvi pogled vidi, koliko korakov je — kar je pri ponudbi, ki stane
 * tisočaka, prvo vprašanje.
 */
function PasPoteka() {
  return (
    <div className="pt-s2 lg:col-span-5">
      <p className="type-poglavje text-poudarek">Kako gre</p>
      <ol className="mt-s3 gap-s3 grid sm:grid-cols-2 lg:grid-cols-4">
        {KORAKI.map((k, i) => (
          <li key={k.naslov} className="border-crta-mehka pt-s2 border-t">
            <span aria-hidden className="type-label text-poudarek stevilke block">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="type-h3 mt-s1 block">{k.naslov}</span>
            <span className="type-small text-mirno mt-s1 block">{k.opis}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Jamstvo v eni vrstici.
 *
 * Na domači strani NE dobi svojega odseka — tam so štirje in to je pravilo.
 * Dobi pa vrstico pod cenama, ker je prav tam vprašanje, ki ga sproži cena:
 * kaj, če ne dela. Celo besedilo in pogoji so na /ponudba.
 */
function VrsticaJamstva() {
  return (
    <div className="border-poudarek/40 bg-poudarek-mehko/50 p-s3 gap-s2 flex flex-wrap items-center rounded-2xl border border-dashed lg:col-span-5">
      <ShieldCheck
        className="text-poudarek size-5 shrink-0"
        strokeWidth={1.6}
        aria-hidden
      />
      <p className="type-body min-w-0 flex-1">
        <span className="font-medium">{JAMSTVO.naslov}:</span>{" "}
        <span className="text-mirno">{JAMSTVO.obljuba}</span>
      </p>
      <Link
        href="/ponudba"
        className="type-label text-poudarek gap-s1 inline-flex items-center hover:underline"
      >
        Pogoji
        <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}

export function MrezaStoritev({
  potek = true,
  jamstvo = true,
}: {
  potek?: boolean;
  jamstvo?: boolean;
}) {
  return (
    <div className="gap-s2 grid lg:grid-cols-5">
      <KarticaStoritve storitev={STORITVE[0]} velika />
      <KarticaStoritve storitev={STORITVE[1]} />
      {jamstvo ? <VrsticaJamstva /> : null}
      {potek ? <PasPoteka /> : null}
    </div>
  );
}
