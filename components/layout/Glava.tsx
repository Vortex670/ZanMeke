import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { MobilniMeni } from "@/components/layout/MobilniMeni";
import { GUMB_POLNI_NA_TEMNEM, GumbPovezava } from "@/components/ui/Gumb";
import { getFooterPages } from "@/lib/pages/queries";
import { Znak } from "@/components/ui/Znak";
import { STRAN } from "@/lib/podatki";

// ============================================================================
// Glava strani
// ----------------------------------------------------------------------------
// Glava LEŽI NA HEROJU in nima svoje podlage. Pas čez vrh bi stran razrezal na
// dvoje in prvi zaslon bi izgubil višino; tako pa se znamka, meni in dejanje
// berejo kot del iste slike. Vsaka stran se zato začne s temnim odsekom —
// to je pravilo postavitve, ne naključje.
//
// Dejanje je ENO in ima puščico v krogu: oko gre k njej tudi takrat, kadar
// človek besedila ne bere. Telefonska številka je v njej, ker je klic edino
// dejanje, ki na tej strani kaj prinese.
//
// NA TELEFONU JE MENI V PREDALU. Dolgo je bil v drugi vrstici, ker so poti
// tri in hamburger jih skrije za dotik — za tri postavke je to načeloma
// boljše. Stalo pa je dvoje: vrstica je jemala višino prvemu zaslonu, in v
// njej ni bilo prostora za nobeno povezavo več. Predal nosi poleg treh poti
// še pravna besedila, klic in e-pošto; isti vzorec kot na gostilnica-plus.si
// in second-home.hr.
// ============================================================================

// ŠTIRJE VNOSI IN NOBENE PANOGE. Stran dela za vsako podjetje; meni, ki
// našteje dve panogi, vsem drugim pove, da niso na pravem naslovu. Panoga je
// lahko primer v besedilu, nikoli pa pot.
//
// TRI POTI IN VSE TRI SO RAZLOG ZA OBISK: kaj stane, kaj je že narejeno,
// kako do mene. Vmes sta bila »Evidenca ur« in »Izračun« — oba brezplačni
// orodji, oba odstranjena. Prvo je razumel samo delodajalec z zaposlenimi,
// drugo pa je stalo na ugibanju: »koliko klicev na dan bi odgovorila stran«
// ni številka, ki jo kdo pozna. Rezultat, zgrajen na ugibanju, se bere kot
// izmišljen — in to vzame zaupanje tudi vsemu drugemu na strani.
//
// Številk pred napisi ni več: »01 PONUDBA« je oblika menija na
// gostilnica-plus.si.
const MENI = [
  { href: "/ponudba", label: "Ponudba" },
  { href: "/dela", label: "Dela" },
  { href: "/kontakt", label: "Kontakt" },
];

export async function Glava() {
  // Pravna besedila v predal: na telefonu je noga daleč, dosegljiva pa morajo
  // biti z vsake strani. Ista poizvedba kot v nogi.
  const pravne = (await getFooterPages().catch(() => [])).map((p) => ({
    href: `/${p.slug}`,
    label: p.title,
  }));

  return (
    <header className="text-na-obratu absolute inset-x-0 top-0 z-50">
      <div className="vsebnik-sirok gap-s3 flex items-center py-4">
        <Link
          href="/"
          aria-label="Žan Meke — domov"
          className="group gap-s1 flex min-w-0 items-center leading-none"
        >
          <Znak className="text-poudarek size-7 shrink-0 transition-transform duration-500 group-hover:rotate-45 sm:size-8" />
          <span className="min-w-0">
            <span className="font-oznaka block text-[0.95rem] font-semibold tracking-[0.18em] whitespace-nowrap">
              ŽAN MEKE
            </span>
            {/* Podnapis odpade pod 420 px. Z »nowrap« se je zlil pod gumb s
                telefonsko številko in zadnja beseda je bila prerezana na
                sredi — prerezan napis bere kot pokvarjena stran. Kaj delam,
                pove uvod strani in noga; v glavi je na telefonu dovolj ime. */}
            <span className="type-micro text-na-obratu/45 mt-0.5 block whitespace-nowrap max-[420px]:hidden">
              SPLETNE STRANI · FOTOGRAFIJA
            </span>
          </span>
        </Link>

        <nav className="gap-s2 xl:gap-s3 ml-auto hidden items-center lg:flex">
          {MENI.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="type-label text-na-obratu/70 hover:text-na-obratu whitespace-nowrap transition-colors"
            >
              {m.label}
            </Link>
          ))}
        </nav>

        <div className="gap-s1 ml-auto flex items-center lg:ml-0">
          {/* Telefonska številka se na najožjih zaslonih umakne: tam sta ob
              znamki in gumbu s tremi črtami dve dejanji preveč, številka pa
              je prva stvar v predalu. */}
          <GumbPovezava
            href={`tel:${STRAN.telefonKlic}`}
            velikost="mal"
            ikona={<ArrowRight aria-hidden />}
            className={`${GUMB_POLNI_NA_TEMNEM} whitespace-nowrap max-[420px]:hidden`}
          >
            <span className="stevilke">{STRAN.telefon}</span>
          </GumbPovezava>

          <MobilniMeni povezave={MENI} pravne={pravne} />
        </div>
      </div>
    </header>
  );
}
