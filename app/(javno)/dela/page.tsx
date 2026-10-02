import type { Metadata } from "next";
import Link from "next/link";

import { STRAN } from "@/lib/podatki";

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

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Dela",
  description:
    "Spletne strani, ki danes delajo: Gostilnica Plus v Sevnici in Second Home v Dalmaciji. Kaj je bilo narobe, kaj sem naredil in kaj se je spremenilo.",
  alternates: { canonical: "/dela" },
};

type Primer = {
  ime: string;
  url: string;
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
    kraj: "Sevnica",
    leto: "2026",
    tezava:
      "Dnevno malico je vsak dan nekdo prepisal na Facebook, gostje pa so vseeno klicali in vprašali, kaj je danes. Naročila so se sprejemala po telefonu, med gnečo, s pomotami pri ceni. Ure zaposlenih so se vodile na list papirja.",
    naredil: [
      "Jedilnik in tedensko ponudbo, ki ju lastnik ureja sam",
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

export default function Dela() {
  return (
    <>
      <section className="bg-obrat text-na-obratu">
        <div className="px-s2 pt-s5 pb-s4 mx-auto max-w-5xl">
          <p className="type-label text-poudarek">Dela</p>
          <h1 className="type-h1 mt-s2 max-w-[20ch]">Dve strani, ki danes delata.</h1>
          <p className="type-lead text-na-obratu/65 mt-s3 mera">
            Pri vsaki piše, kaj je bilo narobe, kaj sem naredil in kaj se je spremenilo.
            Obe lahko odprete — živi sta.
          </p>
        </div>
      </section>

      <div className="px-s2 mx-auto max-w-5xl">
        {PRIMERI.map((p, i) => (
          <section
            key={p.ime}
            className={`odsek-y ${i > 0 ? "border-crta border-t" : ""}`}
          >
            <div className="gap-s2 flex flex-wrap items-baseline">
              <h2 className="type-h2">{p.ime}</h2>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="type-label text-poudarek"
              >
                {p.url.replace("https://", "")} →
              </a>
              <span className="type-micro text-bledo ml-auto">
                {p.kraj} · {p.leto}
              </span>
            </div>

            <div className="mt-s3 gap-s4 grid sm:grid-cols-[1fr_1fr]">
              <div>
                <p className="type-label text-bledo">Kaj je bilo narobe</p>
                <p className="type-body text-mirno mt-s1">{p.tezava}</p>

                <p className="type-label text-bledo mt-s3">Kaj sem naredil</p>
                <ul className="mt-s1 gap-s1 grid">
                  {p.naredil.map((n) => (
                    <li
                      key={n}
                      className="type-body text-mirno gap-s1 grid grid-cols-[1rem_1fr]"
                    >
                      <span aria-hidden>·</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-crta bg-ploskev p-s3 border">
                <p className="type-label text-poudarek">Kaj se je spremenilo</p>
                <ul className="mt-s2 gap-s2 grid">
                  {p.izid.map((iz) => (
                    <li key={iz} className="type-body gap-s1 grid grid-cols-[1rem_1fr]">
                      <span aria-hidden className="text-poudarek">
                        →
                      </span>
                      <span>{iz}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}

        <section className="border-crta odsek-y border-t">
          <div className="border-crta bg-ploskev p-s4 border">
            <h2 className="type-h2">Naslednja je lahko vaša.</h2>
            <p className="type-body text-mirno mt-s2 mera">
              Pokličite in povem, kaj bi se pri vas spremenilo in koliko stane. Pol ure,
              brez obveznosti.
            </p>
            <div className="mt-s3 gap-s1 flex flex-wrap items-center">
              <a
                href={`tel:${STRAN.telefonKlic}`}
                className="type-label bg-poudarek text-na-obratu px-s3 rounded-full py-3"
              >
                <span className="stevilke">{STRAN.telefon}</span>
              </a>
              <Link
                href="/ponudba"
                className="type-label border-crta px-s3 rounded-full border py-3"
              >
                Poglej cene
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
