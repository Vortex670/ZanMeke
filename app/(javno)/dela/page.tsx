import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

import { Odsek } from "@/components/public/Odsek";
import { OkvirBrskalnika } from "@/components/public/OkvirBrskalnika";
import { GumbPovezava } from "@/components/ui/Gumb";
import { BatchReveal } from "@/components/motion/BatchReveal";
import { Stik } from "@/components/public/Stik";
import { getVidniBloki } from "@/lib/domov/queries";
import { JsonLd } from "@/components/seo/JsonLd";
import { drobtineLd } from "@/lib/seo/jsonLd";

// ============================================================================
// /dela — dve strani, ki danes tečeta
// ----------------------------------------------------------------------------
// Primer dela ni posnetek zaslona. Kdor se odloča, hoče vedeti troje: kaj je
// bilo narobe, kaj sem naredil in kaj se je spremenilo. Posnetek pove samo,
// kakšne barve je bilo.
//
// Zato vsak primer stoji na teh treh točkah in se konča s povezavo na ŽIVO
// stran. Živa stran je edini dokaz, ki ga ni mogoče narisati.
// ============================================================================

// Vsebina je v bazi in se osveži ob shranjevanju odseka.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dela",
  description:
    "Spletne strani, ki danes delajo: Gostilnica Plus v Sevnici in Second Home v Dalmaciji. Kaj je bilo narobe, kaj sem naredil in kaj se je spremenilo.",
  alternates: { canonical: "/dela" },
};

type Primer = {
  ime: string;
  url: string;
  slika: string;
  kraj: string;
  leto: string;
  tezava: string;
  naredil: string[];
  izid: string[];
};

const PRIMERI: Primer[] = [
  {
    ime: "Gostilnica Plus",
    url: "https://gostilnica-plus.si",
    slika: "/dela/gostilnica-plus.png",
    kraj: "Sevnica",
    leto: "2026",
    tezava:
      "Dnevno malico je vsak dan nekdo prepisal na Facebook, gostje pa so vseeno klicali in vprašali, kaj je danes. Naročila so se sprejemala po telefonu, med gnečo, s pomotami pri ceni. Ure zaposlenih so se vodile na list papirja.",
    naredil: [
      "Jedilnik in tedensko ponudbo, ki ju osebje ureja samo, brez klica meni",
      "Dnevne malice z e-pošto gostom in listom za na mizo",
      "Spletno naročanje s cenami, kakršne so na davčni blagajni",
      "Urnik, izmene in evidenco delovnega časa z izvozom za računovodstvo",
      "Fotografije jedi in prostora",
    ],
    izid: [
      "Malica je na strani in v poštnih predalih gostov ob osmih zjutraj",
      "Naročilo pride zapisano, s pravo ceno, brez klica",
      "Evidenca ur gre računovodkinji z enim klikom — CSV in list za mapo",
    ],
  },
  {
    ime: "Second Home",
    url: "https://second-home.hr",
    slika: "/dela/second-home.png",
    kraj: "Ražanj, Dalmacija",
    leto: "2026",
    tezava:
      "Trije apartmaji so se oddajali prek portalov, ki vzamejo provizijo, koledar pa se je vodil ročno — dvojne rezervacije so bile vprašanje časa.",
    naredil: [
      "Stran v štirih jezikih s koledarjem za vsak apartma posebej",
      "Rezervacije z računom in plačilom",
      "Sezonske cene in najkrajše bivanje po obdobjih",
      "Admin, kjer se vse vodi na enem mestu",
    ],
    izid: [
      "Gost rezervira naravnost, brez provizije portalu",
      "Koledar enega apartmaja ne blokira drugih dveh",
      "Računi in potrdila nastanejo sami",
    ],
  },
];

export default async function Dela() {
  const vidni = await getVidniBloki("dela");
  const vsebina = new Map(vidni.map((x) => [x.def.kljuc, x.data]));
  const b = (kljuc: string) => vsebina.get(kljuc) ?? {};
  const viden = (kljuc: string) => vsebina.has(kljuc);
  const uvod = b("uvod");
  const stik = b("stik");

  return (
    <>
      {/* ── Uvod ──────────────────────────────────────────────────────── */}
      <Odsek plast="temna" sirina="sirok" visina={false} as="section" sij>
        <div className="uvod-y">
          <p className="type-poglavje text-poudarek">{uvod.oznaka || "Dela"}</p>
          <h1 className="type-display mt-s3 max-w-[16ch]">
            {uvod.naslov || "Dve strani, ki danes delata."}
          </h1>
          <p className="type-lead text-mirno mt-s3 mera">
            {uvod.uvod ||
              "Obe sta moji: postavil sem ju zase in ju vsak dan vodim. Pri vsaki piše, kaj je bilo narobe, kaj sem naredil in kaj se je spremenilo — in obe lahko odprete, ker živita."}
          </p>
        </div>
      </Odsek>

      {/* ISTA PLAST RAZKRITIJ kot na domači strani: odseki vstopijo, ko
          prideš do njih, vsak po enkrat in vsi po istem pragu. */}
      <BatchReveal izbirnik="section">
        {viden("primeri")
          ? PRIMERI.map((p, i) => (
              <Odsek
                key={p.ime}
                plast={i % 2 === 0 ? "svetla" : "mehka"}
                sirina="sirok"
                as="section"
              >
                {/* Glava primera: številka, kje in kdaj, ime — in pot na ŽIVO
                    stran. Odprta stran je močnejši dokaz od vsega, kar tu
                    piše, zato mora biti vidna. */}
                <div className="gap-s3 flex flex-wrap items-end justify-between">
                  <div className="min-w-0">
                    <p className="type-poglavje text-bledo gap-s1 flex flex-wrap items-center">
                      <span className="text-poudarek stevilke">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        {p.kraj} · {p.leto}
                      </span>
                      <span aria-hidden className="text-bledo/40">
                        ·
                      </span>
                      <span>lastni projekt</span>
                    </p>
                    <h2 className="type-h1 mt-s2">{p.ime}</h2>
                  </div>

                  <GumbPovezava
                    href={p.url}
                    videz="obris"
                    ikona={<ArrowUpRight aria-hidden />}
                  >
                    Odpri stran
                  </GumbPovezava>
                </div>

                {/* POSNETEK ČEZ VSO ŠIRINO VSEBNIKA in ne ob besedilu. Prej je
                    stal v polovici stolpca, visok nekaj sto pikslov, in se na
                    njem ni dalo videti ničesar — kar je pri dokazu najslabše,
                    kar se mu lahko zgodi. */}
                <figure className="mt-s4">
                  <OkvirBrskalnika
                    slika={p.slika}
                    alt={`Spletna stran ${p.ime}`}
                    domena={p.url.replace("https://", "")}
                    prednostno={i === 0}
                    vProstoru={false}
                  />
                </figure>

                {/* Tri postaje v treh stolpcih: kaj je bilo narobe, kaj sem
                    naredil, kaj se je spremenilo. Izid ima svojo ploskev —
                    je edini del, ki ga bralec res išče. */}
                <div className="mt-s4 gap-s3 grid lg:grid-cols-3">
                  <div>
                    <p className="type-poglavje text-bledo">Kaj je bilo narobe</p>
                    <p className="type-body text-mirno mt-s2">{p.tezava}</p>
                  </div>

                  <div>
                    <p className="type-poglavje text-bledo">Kaj sem naredil</p>
                    <ul className="mt-s2 gap-s1 grid">
                      {p.naredil.map((n) => (
                        <li
                          key={n}
                          className="type-body text-mirno gap-s1 grid grid-cols-[1rem_1fr]"
                        >
                          <span aria-hidden className="text-bledo">
                            ·
                          </span>
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-poudarek bg-poudarek-mehko p-s3 rounded-2xl border">
                    <p className="type-poglavje text-poudarek">Kaj se je spremenilo</p>
                    <ul className="mt-s2 gap-s2 grid">
                      {p.izid.map((iz) => (
                        <li
                          key={iz}
                          className="type-body gap-s1 grid grid-cols-[1rem_1fr]"
                        >
                          <span aria-hidden className="text-poudarek">
                            →
                          </span>
                          <span>{iz}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Odsek>
            ))
          : null}

        <Stik
          naslov={stik.naslov || "Naslednja je lahko vaša."}
          uvod={
            stik.uvod ||
            "Pokličite in povem, kaj bi se pri vas spremenilo in koliko stane. Pol ure, brez obveznosti."
          }
          druga={{ href: "/ponudba", besedilo: "Poglej cene" }}
        />
      </BatchReveal>

      <JsonLd
        podatki={drobtineLd([
          { ime: "Domov", pot: "/" },
          { ime: "Dela", pot: "/dela" },
        ])}
      />
    </>
  );
}
