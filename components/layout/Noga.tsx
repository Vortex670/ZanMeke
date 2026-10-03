import { ArrowUpRight, Camera, Monitor } from "lucide-react";

import { GumbPiskotki } from "@/components/analytics/GumbPiskotki";
import Link from "next/link";

import {
  IkonaFacebook,
  IkonaGoogle,
  IkonaInstagram,
  IkonaLinkedin,
} from "@/components/ui/IkoneOmrezij";
import { getNastavitve } from "@/lib/nastavitve/queries";
import { getFooterPages } from "@/lib/pages/queries";
import { STRAN } from "@/lib/podatki";
import { tiho } from "@/lib/tiho";

// ============================================================================
// Noga
// ----------------------------------------------------------------------------
// Noga je zadnja priložnost za klic in prvi kraj, kamor gre človek, ki išče
// številko. Štirje pasovi, od zgoraj navzdol vedno tišji:
//
//   1 STIK — e-pošta in telefon kot veliki povezavi, ne kot gumba.
//   2 TRIJE STOLPCI — strani, kaj delam, kje delam.
//   3 ZNAMKA čez vso širino, odrezana ob spodnjem robu.
//   4 DROBNI PAS — leto, pravna besedila, dejavnost.
//
// ZNAMKA JE SPODAJ in ne zgoraj. Zgoraj je bila okras pred vsebino; spodaj
// je podpis za njo — in ker se izreže ob robu zaslona, se stran konča, kot
// se konča plakat, in ne, kot se konča seznam.
//
// Česar tu ni: ponovljenega poziva k dejanju z gumbi. Vsaka stran se konča s
// pasom `Stik`, kjer je številka največja stvar na zaslonu. Dva enaka poziva
// drug pod drugim nista dvakrat močnejša, ampak dvakrat manj resna.
//
// Kraji so OBČINE POSAVJA. Prvi zapis je imel zraven Laško in Trebnje, dve
// vrstici nižje pa »po vsem Posavju«; kdor pozna okolico, tako neujemanje
// opazi takoj — in to je prva stvar, ki vzame zaupanje.
// ============================================================================

const STORITVI = [
  { ikona: Monitor, label: "Izdelava spletnih strani" },
  { ikona: Camera, label: "Fotografija za podjetja" },
];

export async function Noga() {
  // Pravna besedila iz baze. Padec poizvedbe NE SME vzeti noge — brez
  // telefonske številke na dnu je stran videti pokvarjena, brez povezave na
  // piškotke pa le nepopolna.
  const [pravne, n] = await Promise.all([
    getFooterPages().catch(tiho("noga: pravne strani", [])),
    getNastavitve().catch(tiho("noga: nastavitve", null)),
  ]);

  // Ikona se pokaže samo, če je povezava vpisana v nastavitvah. Ikona, ki
  // pelje na prazen profil, je slabša od ikone, ki je ni.
  const omrezja = [
    { ikona: IkonaInstagram, naziv: "Instagram", url: n?.instagramUrl },
    { ikona: IkonaFacebook, naziv: "Facebook", url: n?.facebookUrl },
    { ikona: IkonaLinkedin, naziv: "LinkedIn", url: n?.linkedinUrl },
    { ikona: IkonaGoogle, naziv: "Google", url: n?.googleUrl },
  ].filter((o): o is { ikona: typeof IkonaInstagram; naziv: string; url: string } =>
    Boolean(o.url),
  );

  return (
    <footer
      // Brez `globina`: sij ima samo uvod strani. Noga stoji tik pod stikom,
      // ki je prav tako temen, in dva sija drug pod drugim sta na stiku
      // naredila vidno vodoravno črto.
      className="plast-temna relative isolate overflow-hidden"
    >
      {/* ── 1 · Stik ───────────────────────────────────────────────────── */}
      <div className="vsebnik-sirok pt-s5 pb-s4 gap-s4 grid lg:grid-cols-[1fr_1.4fr_0.8fr]">
        <div>
          <p className="type-poglavje text-bledo">Kako do mene</p>

          <a
            href={`tel:${STRAN.telefonKlic}`}
            // NOGA JE NASLOV, NE POZIV. Številka je bila `type-h2` — enako
            // velika kot naslov odseka in enako velika kot ista številka v
            // odseku »Stik«, ki stoji 343 px više. Isti podatek dvakrat v
            // istem zaslonu in dvakrat v isti velikosti se ne bere kot
            // poudarek, ampak kot nered. Dejanje je v »Stiku«, tu je
            // podatek, h kateremu se človek vrne.
            className="type-h3 stevilke text-crnilo decoration-poudarek mt-s2 group flex items-center gap-3 underline-offset-[0.15em] hover:underline"
          >
            {STRAN.telefon}
            <ArrowUpRight
              className="size-[0.6em] shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.6}
              aria-hidden
            />
          </a>
          <a
            href={`mailto:${STRAN.epota}`}
            className="type-body text-mirno hover:text-crnilo mt-s1 block transition-colors"
          >
            {STRAN.epota}
          </a>

          <p className="type-small text-bledo mt-s3 mera">
            Delam sam, zato veste, kdo dvigne telefon. Če ne dvignem, sem pri stranki —
            pokličem nazaj isti dan.
          </p>
        </div>

        <div>
          <p className="type-poglavje text-bledo">Kaj delam</p>
          <ul className="mt-s2 gap-s1 grid">
            {STORITVI.map((s) => (
              <li key={s.label} className="type-body text-mirno flex items-center gap-2">
                <s.ikona
                  className="text-poudarek size-4 shrink-0"
                  strokeWidth={1.6}
                  aria-hidden
                />
                {s.label}
              </li>
            ))}
          </ul>

          <p className="type-small text-bledo mt-s3 mera">
            Oboje isti človek: stran postavim sam in fotografije posnamem sam.
          </p>
        </div>

        <div>
          <p className="type-poglavje text-bledo">Drugje</p>

          {omrezja.length > 0 ? (
            <ul className="mt-s2 gap-s1 flex flex-wrap">
              {omrezja.map((o) => (
                <li key={o.naziv}>
                  <a
                    href={o.url}
                    target="_blank"
                    rel="me noopener noreferrer"
                    aria-label={o.naziv}
                    title={o.naziv}
                    className="border-crta text-mirno hover:border-poudarek hover:text-crnilo inline-flex size-11 items-center justify-center rounded-full border transition-colors"
                  >
                    <o.ikona className="size-4" strokeWidth={1.6} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="type-small text-bledo mt-s2">
              Najhitreje po telefonu ali e-pošti.
            </p>
          )}

          <p className="type-small text-bledo mt-s3 mera">
            Na prvi pogovor pridem k vam. Po {STRAN.obmocjeV} poti ne zaračunam.
          </p>
        </div>
      </div>

      {/* ── 2 · Znamka ─────────────────────────────────────────────────── */}
      {/* Odrezana ob spodnjem robu (`-mb` + `overflow-hidden` na nogi): napis
          se ne konča, ampak izteče iz strani. Zato je tudi `select-none` in
          `aria-hidden` — to je ploskev, ne besedilo. */}
      <div className="vsebnik-sirok -mb-[0.14em] overflow-hidden">
        <p
          aria-hidden
          className="font-naslov text-crnilo/8 text-[clamp(4rem,15vw,13rem)] leading-[0.8] tracking-tighter select-none"
        >
          Žan Meke<span className="text-poudarek/40">.</span>
        </p>
      </div>

      {/* ── 3 · Drobni pas ─────────────────────────────────────────────── */}
      <div className="border-crta border-t">
        <div className="vsebnik-sirok py-s2 gap-s2 flex flex-wrap items-center">
          <p className="type-micro text-bledo">
            © {new Date().getFullYear()} {STRAN.ime} · {STRAN.domena}
          </p>

          {/* Piškotki, zasebnost, pogoji — v drobnem pasu in ne med stranmi
              zgoraj. Tja gre človek po informacijo, sem po pravilo. */}
          {pravne.length > 0 ? (
            <ul className="type-micro gap-s2 flex flex-wrap items-center">
              {pravne.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/${s.slug}`}
                    className="type-micro text-bledo hover:text-crnilo transition-colors"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Izbiro o piškotkih je mogoče kadarkoli spremeniti — gumb pas
              odpre znova. */}
          <GumbPiskotki className="type-micro text-bledo hover:text-crnilo transition-colors" />

          <p className="type-micro text-bledo/70 ml-auto">
            Izdelava spletnih strani in fotografija · {STRAN.kraj}, {STRAN.obmocje}
          </p>
        </div>
      </div>
    </footer>
  );
}
