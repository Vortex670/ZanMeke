import { Inbox, Phone, Timer } from "lucide-react";
import Link from "next/link";

import { AdminOgrodje } from "@/components/admin/AdminOgrodje";
import { zahtevajPrijavo } from "@/lib/auth/straza";
import { STRAN } from "@/lib/podatki";
import { stejSporocila, zadnjaSporocila } from "@/lib/sporocila/queries";

// ============================================================================
// /admin — pregled
// ----------------------------------------------------------------------------
// Tri številke in nič več. Pregled je operativen: pove, ali je kaj za narediti
// zdaj. Statistika (koliko jih je bilo lani) sodi drugam in je tu ne bo,
// dokler ne bo česa šteti.
//
// Pod številkami stojijo ZADNJA sporočila, ne graf: pri treh povpraševanjih na
// teden je graf okras, seznam pa delo.
// ============================================================================

export const dynamic = "force-dynamic";

const CAS = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Ljubljana",
});

export default async function Pregled() {
  const uporabnik = await zahtevajPrijavo();
  const [stevila, zadnja] = await Promise.all([stejSporocila(), zadnjaSporocila(5)]);

  const kartice = [
    { ikona: Inbox, oznaka: "Novo", vrednost: stevila.novo, pod: "čaka odgovor" },
    { ikona: Timer, oznaka: "V teku", vrednost: stevila.vTeku, pod: "v pogovoru" },
    { ikona: Phone, oznaka: "Skupaj", vrednost: stevila.skupaj, pod: "od začetka" },
  ];

  return (
    <AdminOgrodje
      uporabnik={uporabnik}
      naslov={`Dober dan, ${uporabnik.ime.split(" ")[0]}.`}
      opis="Kar je tu, je za narediti danes."
    >
      <section className="gap-s2 grid sm:grid-cols-3">
        {kartice.map((k) => (
          <div key={k.oznaka} className="border-crta bg-ploskev p-s3 border">
            <p className="type-label text-mirno flex items-center gap-2">
              <k.ikona className="size-3.5" strokeWidth={2} aria-hidden />
              {k.oznaka}
            </p>
            <p className="type-h1 font-naslov stevilke mt-s1">{k.vrednost}</p>
            <p className="type-micro text-bledo">{k.pod}</p>
          </div>
        ))}
      </section>

      <section className="mt-s4">
        <div className="flex items-baseline justify-between">
          <h2 className="type-h3">Zadnja povpraševanja</h2>
          <Link href="/admin/sporocila" className="type-label text-poudarek">
            Vsa →
          </Link>
        </div>

        {zadnja.length === 0 ? (
          <p className="type-body text-mirno mt-s2 border-crta bg-ploskev p-s3 border">
            Še nobenega povpraševanja. Ko ga kdo pošlje prek obrazca, se pojavi tu — in na{" "}
            {STRAN.epota}.
          </p>
        ) : (
          <ul className="border-crta mt-s2 border-t">
            {zadnja.map((s) => (
              <li key={s.id} className="border-crta-mehka py-s2 border-b">
                <div className="gap-s1 flex flex-wrap items-baseline">
                  <span className="type-body font-naslov font-semibold">{s.ime}</span>
                  {s.podjetje ? (
                    <span className="type-micro text-bledo">{s.podjetje}</span>
                  ) : null}
                  <span className="type-micro text-bledo ml-auto">
                    {CAS.format(s.createdAt)}
                  </span>
                </div>
                <p className="type-body text-mirno mt-0.5 line-clamp-2">{s.sporocilo}</p>
                <a
                  href={`tel:${s.telefon.replace(/\s/g, "")}`}
                  className="type-label text-poudarek stevilke mt-1 inline-block"
                >
                  {s.telefon}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminOgrodje>
  );
}
