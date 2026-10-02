import { AdminPage } from "@/components/admin/shell/AdminPage";
import { zahtevajPrijavo } from "@/lib/auth/straza";
import { ZANIMANJE_NAPIS } from "@/lib/kontakt/validation";
import { zadnjaSporocila } from "@/lib/sporocila/queries";

// ============================================================================
// /admin/sporocila — vsa povpraševanja
// ----------------------------------------------------------------------------
// Vsaka vrstica ima telefonsko številko kot povezavo: s te strani se kliče, ne
// prepisuje. To je edino dejanje, ki pri povpraševanju kaj spremeni.
//
// Če obvestilo po e-pošti ni odšlo, to pri vrstici piše. Povpraševanje se
// shrani tudi takrat, ko pošta odpove — izgubiti ga ne smeva, ker je edina
// stvar, zaradi katere stran stoji.
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

export default async function Sporocila() {
  const uporabnik = await zahtevajPrijavo();
  const vsa = await zadnjaSporocila(200);

  return (
    <AdminPage
      uporabnik={uporabnik}
      oznaka="Stranke"
      naslov="Sporočila"
      opis="Povpraševanja z obrazca. Shranijo se tudi, kadar pošta ne gre skozi."
    >
      {vsa.length === 0 ? (
        <p className="type-small text-muted border-border bg-surface rounded-2xl border border-dashed p-(--s4) text-center">
          Zaenkrat nič.
        </p>
      ) : (
        <ul className="grid gap-(--s1)">
          {vsa.map((s) => (
            <li
              key={s.id}
              className="bg-surface rounded-2xl p-(--s3) shadow-(--shadow-card)"
            >
              <div className="gap-s1 flex flex-wrap items-baseline">
                <span className="type-h3">{s.ime}</span>
                {s.podjetje ? (
                  <span className="type-small text-muted">{s.podjetje}</span>
                ) : null}
                <span className="type-micro text-subtle ml-auto">
                  {CAS.format(s.createdAt)}
                </span>
              </div>

              <p className="type-eyebrow text-accent mt-(--s1)">
                {ZANIMANJE_NAPIS[s.zanimanje]}
              </p>
              <p className="type-small text-muted mera mt-(--s1)">{s.sporocilo}</p>

              <div className="mt-(--s2) flex flex-wrap items-center gap-(--s1)">
                <a
                  href={`tel:${s.telefon.replace(/\s/g, "")}`}
                  className="type-eyebrow bg-accent text-accent-fg rounded-full px-4 py-2 tabular-nums"
                >
                  <span className="stevilke">{s.telefon}</span>
                </a>
                {s.epota ? (
                  <a
                    href={`mailto:${s.epota}`}
                    className="type-eyebrow border-border rounded-full border px-4 py-2"
                  >
                    {s.epota}
                  </a>
                ) : null}
                {!s.poslano ? (
                  <span className="type-micro text-subtle">
                    obvestilo po e-pošti ni odšlo
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
