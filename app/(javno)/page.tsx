import { ArrowRight, Clock, MapPin, Monitor, Phone } from "lucide-react";

import { BatchReveal } from "@/components/motion/BatchReveal";
import { MagnetniGumb } from "@/components/motion/MagnetniGumb";
import { OdhodHeroja } from "@/components/motion/OdhodHeroja";
import { Ozadje3D } from "@/components/motion/Ozadje3D";
import { SteviloNaraste } from "@/components/motion/SteviloNaraste";
import { MrezaStoritev } from "@/components/public/MrezaStoritev";
import { Odsek, UvodOdseka } from "@/components/public/Odsek";
import { Priporocila } from "@/components/public/Priporocila";
import { JsonLd } from "@/components/seo/JsonLd";
import { priporocilaLd } from "@/lib/seo/jsonLd";
import { OkvirBrskalnika } from "@/components/public/OkvirBrskalnika";
import { Stik } from "@/components/public/Stik";
import { VrsticaDela } from "@/components/public/dela/VrsticaDela";
import { GUMB_NA_TEMNEM, GUMB_POLNI_NA_TEMNEM, GumbPovezava } from "@/components/ui/Gumb";
import { getVidniBloki } from "@/lib/domov/queries";
import { getObjavljenaPriporocila } from "@/lib/priporocila/queries";
import { DELA, OPIS, STRAN } from "@/lib/podatki";

// ============================================================================
// Domača stran
// ----------------------------------------------------------------------------
// ŠTIRJE ODSEKI in nič več. Človek, ki te prvič vidi, ne prebere tridesetih
// povedi, da bi ugotovil, ali te pokliče. Podrobnosti so na /ponudba.
//
//   1 kdo sem in kaj delam     → uvod, obe storitvi v naslovu
//   2 katero od dvojega rabim  → mreža s ceno in potekom
//   3 je to že kdaj naredil    → žive strani čez vso širino
//   4 kako ga dobim            → telefon, velik kot naslov
//
// DVOJE delam in oboje je enako pomembno: spletne strani IN fotografijo. Na
// prvem zaslonu morata biti obe, sicer pride klic samo za eno.
//
// RITEM PLOSKEV je tisto, kar stran drži skupaj: temno — svetlo — svetlo —
// temno. Prej je bilo vse temno in dolga stran se je brala kot en sam blok,
// v katerem oko ni imelo kje vdihniti. Ploskev nastavi `<Odsek>` in z njo
// pomenske žetone, zato ista kartica deluje na obeh.
//
// Ploskve tečejo čez VES ZASLON, besedilo pa ne — vrstica, dolga čez 1900 px,
// se ne bere. Zato polno ozadje in `vsebnik` okrog besedila.
// ============================================================================

// Vsebina je v bazi, zato se stran osveži ob shranjevanju odseka
// (`revalidatePath` v `lib/domov/actions.ts`) in ne po uri. Urednik, ki
// shrani besedilo in mora čakati, misli, da shranjevanje ne dela.
export const dynamic = "force-dynamic";

/**
 * Pas dejstev iz urejenega besedila, s privzetim iz kode.
 *
 * Vsako polje ima svoj privzetek: urednik, ki popravi samo eno vrstico, ne
 * sme izgubiti drugih dveh.
 */
function dejstva(d: Record<string, string>) {
  return [
    {
      ikona: Clock,
      oznaka: "Odziv",
      vrednost: d.odziv || "Isti dan",
      pod: d.odzivPod || "pokličem nazaj",
      zivo: true,
    },
    {
      ikona: MapPin,
      oznaka: "Kje",
      vrednost: d.kje || STRAN.kraj,
      pod: d.kjePod || `po vsem ${STRAN.obmocjeV}`,
    },
    {
      ikona: Monitor,
      oznaka: "V živo",
      stevilo: DELA.filter((x) => x.stanje === "živo").length,
      vrednost: `${DELA.filter((x) => x.stanje === "živo").length} strani`,
      pod: d.zivoPod || "obe vodim sam",
    },
  ];
}

export default async function Domov() {
  // Odseki iz baze; kar ni urejeno, ima prazno polje in pade na privzeto
  // besedilo spodaj. Skriti odseki sem sploh ne pridejo.
  const [bloki, priporocila] = await Promise.all([
    getVidniBloki(),
    getObjavljenaPriporocila().catch(() => []),
  ]);
  const vsebina = new Map(bloki.map((b) => [b.def.kljuc, b.data]));
  const b = (kljuc: string) => vsebina.get(kljuc) ?? {};

  const hero = b("hero");
  const storitve = b("storitve");
  const dela = b("dela");
  const stik = b("stik");
  const viden = (kljuc: string) => vsebina.has(kljuc);

  return (
    <>
      {/* ── 1 · Uvod ────────────────────────────────────────────────────── */}
      {/* KOLAŽ IN NE DVA STOLPCA. Naslov levo in slika desno je postavitev,
          ki jo ima vsaka druga predstavitvena stran — in tudi
          gostilnica-plus.si. Tu naslov teče čez VSO širino, posnetek žive
          strani pa je potegnjen navzgor čezenj in čez desni rob: dve ravnini,
          ki se prekrivata, se bereta kot ena slika in ne kot dva predala. */}
      <Odsek
        plast="temna"
        sirina="poln"
        sij
        visina={false}
        as="section"
        className="uvod-zaslon"
        vsebnikClassName="flex flex-1 flex-col"
      >
        <Ozadje3D />

        <OdhodHeroja className="flex flex-1 flex-col">
          <div className="vsebnik-sirok uvod-y relative lg:min-h-[34rem]">
            <p className="type-poglavje text-poudarek mb-s3">
              {hero.oznaka || `${STRAN.kraj} · ${STRAN.obmocje}`}
            </p>

            {/* Naslov se na širokem zaslonu konča, preden se začne posnetek:
                kolaž pomeni, da se ravnini prekrivata, ne da ena požre drugo.
                Brez te meje je posnetek pokril »za gostilne in apartmaje«. */}
            <h1 className="type-hero max-w-[15ch] lg:max-w-[58%]">
              {hero.naslov || "Spletne strani, ki nekaj naredijo."}
            </h1>

            {/* Na širokem zaslonu posnetek PLAVA ob besedilu in ne stoji v
                svojem stolpcu: stolpec bi besedilo potisnil navzdol in poziv
                bi padel pod pregib. Tako ostane uvod visok en zaslon, slika
                pa se vseeno prekriva z naslovom. */}
            <div className="mt-s4 gap-s4 grid items-end lg:block">
              <div className="relative z-10 lg:max-w-[58%]">
                <p className="type-lead text-mirno mera">{hero.uvod || OPIS}</p>

                <div className="mt-s3 gap-s1 flex flex-wrap items-center">
                  <MagnetniGumb>
                    <GumbPovezava
                      href="/ponudba"
                      ikona={<ArrowRight aria-hidden />}
                      className={GUMB_POLNI_NA_TEMNEM}
                    >
                      Poglej ponudbo
                    </GumbPovezava>
                  </MagnetniGumb>
                  <GumbPovezava
                    href={`tel:${STRAN.telefonKlic}`}
                    videz="obris"
                    ikona={<Phone aria-hidden />}
                    className={GUMB_NA_TEMNEM}
                  >
                    <span className="stevilke">{STRAN.telefon}</span>
                  </GumbPovezava>
                </div>

                {/* ODVZEM TVEGANJA TAKOJ POD GUMBOM in ne na podstrani.
                    Človek, ki okleva pred klicem, ne okleva zaradi cene,
                    ampak zato, ker ne ve, k čemu ga klic zaveže. Ta stavek
                    odgovori na to, preden vprašanje nastane. */}
                <p className="type-small font-oznaka text-bledo mt-s2">
                  Pol ure pri vas, brez obveznosti. Po pogovoru veste ceno in rok.
                </p>
              </div>

              {/* DOKAZ V PRVEM ZASLONU in ne okrasna fotografija. Obiskovalec
                  v prvi sekundi vidi stran, ki danes dela — to pove več kot
                  vsak pridevnik. Na širokem zaslonu je potegnjen navzgor pod
                  naslov in čez desni rob; na telefonu stoji spodaj, ker je
                  tam naslov tisto, kar mora priti prvo. */}
              <figure className="relative max-lg:order-last lg:absolute lg:top-[22%] lg:right-[-9vw] lg:w-[42vw] lg:rotate-[-1.2deg]">
                <OkvirBrskalnika
                  slika={hero.slika || "/dela/gostilnica-plus.png"}
                  alt="Spletna stran Gostilnica Plus, ki jo je izdelal Žan Meke"
                  domena="gostilnica-plus.si"
                  prednostno
                  className="border-na-obratu/15"
                />
                <figcaption className="type-micro font-oznaka text-bledo mt-s1">
                  {hero.podnapis ||
                    "Živa stran v Sevnici — ponudba, naročanje in evidenca dela."}
                </figcaption>
              </figure>
            </div>
          </div>
        </OdhodHeroja>

        {/* Pas dejstev kot ENA VRSTICA v mono pisavi, ločena s poševnicami.
            Trije enaki stolpci so bili tabela — in ista tabela stoji pod
            uvodom gostilnice. Vrstica se bere kot vrstica stanja v orodju:
            trije podatki, nič okvirjev. */}
        <div className="border-crta relative border-t">
          <dl className="vsebnik-sirok type-micro font-oznaka gap-x-s3 flex flex-wrap items-center gap-y-1 py-3">
            {dejstva(b("dejstva")).map((d, i) => (
              <div key={d.oznaka} className="flex items-center gap-2">
                {i > 0 ? (
                  <span aria-hidden className="text-bledo/40 mr-s2">
                    /
                  </span>
                ) : null}
                <dt className="text-bledo">{d.oznaka.toLowerCase()}</dt>
                <dd className="text-crnilo flex items-center gap-1.5">
                  {d.zivo ? (
                    <span
                      aria-hidden
                      className="bg-poudarek inline-block size-1.5 rounded-full"
                    />
                  ) : null}
                  {d.stevilo !== undefined ? (
                    <>
                      <SteviloNaraste vrednost={d.stevilo} />
                      <span>strani</span>
                    </>
                  ) : (
                    d.vrednost
                  )}
                </dd>
                <dd className="text-bledo/70">{d.pod}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Odsek>

      <BatchReveal izbirnik="section">
        {/* ── 2 · Dvoje, kar delam ─────────────────────────────────────── */}
        {/* `viden` je iz `getVidniBloki`: skrit odsek v seznam sploh ne pride.
            Brez tega pogoja bi gumb »skrij« v adminu javil uspeh, stran pa bi
            ostala enaka — najslabša možna vrsta napake. */}
        {viden("storitve") ? (
          <Odsek plast="mehka" sirina="sirok">
            <UvodOdseka
              stevilka="01"
              oznaka={storitve.oznaka || "Kaj delam"}
              naslov={storitve.naslov || "Dvoje — in oboje isti človek."}
              uvod={
                storitve.uvod ||
                "Za obrt, trgovino, storitev, gostilno ali sobe za oddajo — panoga ni pogoj. Stran postavim sam in fotografije posnamem sam, zato so slike posnete za to postavitev in ne izbrane iz zaloge."
              }
            />
            <div className="mt-s4">
              <MrezaStoritev />
            </div>
          </Odsek>
        ) : null}

        {/* ── 3 · Dela ─────────────────────────────────────────────────── */}
        {viden("dela") ? (
          <Odsek plast="svetla" sirina="sirok" visina={false}>
            <div className="pt-(--section-y)">
              <UvodOdseka
                stevilka="02"
                oznaka={dela.oznaka || "Dela"}
                naslov={dela.naslov || "Kar že teče."}
                uvod={
                  dela.uvod ||
                  "Obe sem postavil zase in ju vsak dan vodim — zato vem, kaj se v praksi res zalomi in česa se iz načrta ne vidi. Pri vsaki piše, kaj podjetju vsak dan prihrani."
                }
              />
            </div>

            {/* Vrstice gredo čez VES zaslon, zato stojijo zunaj vsebnika —
                `poln` jih izstavi iz njega. Slika se izmenjuje levo/desno,
                da se dva soseda ne bereta kot tabela. */}
            <div className="mt-s4">
              {DELA.map((d, i) => (
                <VrsticaDela
                  key={d.ime}
                  delo={d}
                  stevilka={String(i + 1).padStart(2, "0")}
                  obrnjeno={i % 2 === 1}
                />
              ))}
            </div>
          </Odsek>
        ) : null}

        {/* ── Priporočila ──────────────────────────────────────────────── */}
        {/* Odseka ni, dokler ni priporočil — glej komentar v komponenti. */}
        <Priporocila seznam={priporocila} />
        {priporocila.length > 0 ? <JsonLd podatki={priporocilaLd(priporocila)!} /> : null}

        {/* ── 4 · Stik ─────────────────────────────────────────────────── */}
        <Stik
          naslov={stik.naslov || "Pokličite. Odgovorim isti dan."}
          uvod={
            stik.uvod ||
            "Pol ure pogovora pri vas, brez obveznosti. Po njem veste ceno, rok in kaj morate pripraviti."
          }
          druga={{ href: "/kontakt", besedilo: stik.druga || "Ali pišite" }}
        />
      </BatchReveal>
    </>
  );
}
