import { Clock, Inbox, Phone, Timer } from "lucide-react";
import Link from "next/link";

import { AdminPage } from "@/components/admin/shell/AdminPage";
import { StatCard } from "@/components/admin/kit/StatCard";
import { zahtevajPrijavo } from "@/lib/auth/straza";
import { STRAN } from "@/lib/podatki";
import { stejSporocila, zadnjaSporocila } from "@/lib/sporocila/queries";

// ============================================================================
// /admin — pregled
// ----------------------------------------------------------------------------
// Pregled je OPERATIVEN: pove, ali je kaj za narediti zdaj. Analitika (koliko
// jih je bilo lani, od kod so prišli) sodi v Statistike in je tu ne bo, dokler
// ne bo česa šteti.
//
// Štiri kartice je zgornja meja — peta se vedno najde, a od pete naprej se
// nehajo brati vse. Pod njimi stojijo ZADNJA povpraševanja in ne graf: pri
// treh na teden je graf okras, seznam pa delo.
// ============================================================================

export const dynamic = "force-dynamic";

const DATUM = new Intl.DateTimeFormat("sl-SI", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Ljubljana",
});

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

  const danes = DATUM.format(new Date());
  const ime = uporabnik.ime.trim().split(" ")[0];

  return (
    <AdminPage
      uporabnik={uporabnik}
      oznaka="Pregled"
      naslov={
        <>
          Dober dan, <span className="text-accent">{ime}</span>
        </>
      }
      opis={`${danes} — kar je tu, je za narediti danes.`}
      znacke={{ "/admin/sporocila": stevila.novo }}
    >
      <section className="grid grid-cols-2 gap-(--s2) lg:grid-cols-4">
        <StatCard
          label="Nova povpraševanja"
          value={stevila.novo}
          icon={<Inbox strokeWidth={1.8} aria-hidden />}
          variant={stevila.novo > 0 ? "accent" : "neutral"}
          live={stevila.novo > 0}
          hint="Čakajo odgovor"
          href="/admin/sporocila"
        />
        <StatCard
          label="V teku"
          value={stevila.vTeku}
          icon={<Timer strokeWidth={1.8} aria-hidden />}
          hint="Pogovor se je začel"
        />
        <StatCard
          label="Vsa povpraševanja"
          value={stevila.skupaj}
          icon={<Phone strokeWidth={1.8} aria-hidden />}
          hint="Od začetka strani"
        />
        <StatCard
          label="Odzivni čas"
          value="Isti dan"
          icon={<Clock strokeWidth={1.8} aria-hidden />}
          variant="success"
          hint="Kar obljublja stran"
        />
      </section>

      <section className="mt-(--s4)">
        <div className="flex items-baseline justify-between gap-(--s2)">
          <h2 className="type-h3">Zadnja povpraševanja</h2>
          <Link href="/admin/sporocila" className="type-eyebrow text-accent">
            Vsa →
          </Link>
        </div>

        {zadnja.length === 0 ? (
          <div className="border-border bg-surface mt-(--s2) rounded-2xl border border-dashed p-(--s4) text-center">
            <p className="type-small text-muted">
              Še nobenega povpraševanja. Ko ga kdo pošlje prek obrazca, se pojavi tu — in
              na {STRAN.epota}.
            </p>
          </div>
        ) : (
          <ul className="mt-(--s2) grid gap-(--s1)">
            {zadnja.map((s) => (
              <li
                key={s.id}
                className="bg-surface gap-(--s1) rounded-2xl p-(--s3) shadow-(--shadow-card)"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="type-small text-text font-semibold">{s.ime}</span>
                  {s.podjetje ? (
                    <span className="type-micro text-subtle">{s.podjetje}</span>
                  ) : null}
                  <span className="type-micro text-subtle ml-auto">
                    {CAS.format(s.createdAt)}
                  </span>
                </div>
                <p className="type-small text-muted mt-1 line-clamp-2">{s.sporocilo}</p>
                <a
                  href={`tel:${s.telefon.replace(/\s/g, "")}`}
                  className="type-eyebrow text-accent mt-2 inline-block tabular-nums"
                >
                  {s.telefon}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminPage>
  );
}
