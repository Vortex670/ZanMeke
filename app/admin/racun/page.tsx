import { KeyRound, Mail, ShieldCheck, User } from "lucide-react";

import { AdminPage } from "@/components/admin/shell/AdminPage";
import { zahtevajPrijavo } from "@/lib/auth/straza";
import { prisma } from "@/lib/prisma";

// ============================================================================
// /admin/racun — moj dostop
// ----------------------------------------------------------------------------
// Ena oseba, en račun. Stran zato ne upravlja uporabnikov, ampak pove troje:
// s čim sem prijavljen, kdaj sem bil nazadnje, in katere naprave imajo odprto
// sejo. Zadnje je edino, kar se tu res uporabi — ko ostane telefon prijavljen
// nekje, kjer ne bi smel.
//
// Geslo se menja po POŠTI in ne s poljem tu: tako velja ista pot kot za
// pozabljeno geslo in se ne vzdržujeta dve. Povezavo dobiš na svoj naslov,
// kar pomeni, da kdor sede za odprt računalnik, gesla ne more zamenjati.
// ============================================================================

export const dynamic = "force-dynamic";

const CAS = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Ljubljana",
});

export default async function Racun() {
  const uporabnik = await zahtevajPrijavo();
  const [seje, podatki] = await Promise.all([
    prisma.seja.findMany({
      where: { uporabnikId: uporabnik.id, potece: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, naprava: true, createdAt: true, potece: true },
    }),
    prisma.uporabnik.findUnique({
      where: { id: uporabnik.id },
      select: { zadnjaPrijava: true, createdAt: true },
    }),
  ]);

  return (
    <AdminPage
      eyebrow="Račun"
      title="Moj dostop"
      description="Kdo sem v tej administraciji in katere naprave imajo odprto sejo."
    >
      <section className="grid gap-(--s2) lg:grid-cols-2">
        <div className="border-chrome-line bg-surface rounded-2xl border p-(--s3)">
          <h2 className="type-eyebrow text-subtle">Podatki</h2>
          <dl className="mt-(--s2) grid gap-(--s2)">
            <div className="flex items-center gap-2.5">
              <User className="text-subtle size-4" strokeWidth={1.8} aria-hidden />
              <dt className="sr-only">Ime</dt>
              <dd className="type-small">{uporabnik.ime}</dd>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="text-subtle size-4" strokeWidth={1.8} aria-hidden />
              <dt className="sr-only">E-pošta</dt>
              <dd className="type-small">{uporabnik.email}</dd>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-subtle size-4" strokeWidth={1.8} aria-hidden />
              <dt className="sr-only">Zadnja prijava</dt>
              <dd className="type-small text-muted">
                {podatki?.zadnjaPrijava
                  ? `Zadnja prijava ${CAS.format(podatki.zadnjaPrijava)}`
                  : "Brez prejšnje prijave"}
              </dd>
            </div>
          </dl>

          <div className="border-chrome-line mt-(--s3) border-t pt-(--s2)">
            <p className="type-small flex items-center gap-2.5">
              <KeyRound className="text-subtle size-4" strokeWidth={1.8} aria-hidden />
              Geslo zamenjaš prek povezave, ki pride na tvoj naslov.
            </p>
            <p className="type-micro text-subtle mt-1">
              Ista pot kot pri pozabljenem geslu — zato jo vzdržujem samo eno.
            </p>
          </div>
        </div>

        <div className="border-chrome-line bg-surface rounded-2xl border p-(--s3)">
          <h2 className="type-eyebrow text-subtle">Odprte seje</h2>
          {seje.length === 0 ? (
            <p className="type-small text-muted mt-(--s2)">
              Nobene odprte seje — kar je nenavadno, ker si prijavljen zdaj.
            </p>
          ) : (
            <ul className="divide-chrome-line mt-(--s1) divide-y">
              {seje.map((s) => (
                <li key={s.id} className="py-2.5">
                  <p className="type-small truncate">{s.naprava ?? "Neznana naprava"}</p>
                  <p className="type-micro text-subtle">
                    Prijava {CAS.format(s.createdAt)} · velja do {CAS.format(s.potece)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AdminPage>
  );
}
