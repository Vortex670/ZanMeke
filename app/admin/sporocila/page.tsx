import { AdminOgrodje } from "@/components/admin/AdminOgrodje";
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
    <AdminOgrodje
      uporabnik={uporabnik}
      naslov="Sporočila"
      opis="Povpraševanja z obrazca. Shranijo se tudi, kadar pošta ne gre skozi."
    >
      {vsa.length === 0 ? (
        <p className="type-body text-mirno border-crta bg-ploskev p-s3 border">
          Zaenkrat nič.
        </p>
      ) : (
        <ul className="gap-s2 grid">
          {vsa.map((s) => (
            <li key={s.id} className="border-crta bg-ploskev p-s3 border">
              <div className="gap-s1 flex flex-wrap items-baseline">
                <span className="type-h3">{s.ime}</span>
                {s.podjetje ? (
                  <span className="type-body text-mirno">{s.podjetje}</span>
                ) : null}
                <span className="type-micro text-bledo ml-auto">
                  {CAS.format(s.createdAt)}
                </span>
              </div>

              <p className="type-label text-poudarek mt-s1">
                {ZANIMANJE_NAPIS[s.zanimanje]}
              </p>
              <p className="type-body text-mirno mt-s1 mera">{s.sporocilo}</p>

              <div className="mt-s2 gap-s2 flex flex-wrap items-center">
                <a
                  href={`tel:${s.telefon.replace(/\s/g, "")}`}
                  className="type-label bg-poudarek text-na-obratu rounded-full px-4 py-2"
                >
                  <span className="stevilke">{s.telefon}</span>
                </a>
                {s.epota ? (
                  <a
                    href={`mailto:${s.epota}`}
                    className="type-label border-crta rounded-full border px-4 py-2"
                  >
                    {s.epota}
                  </a>
                ) : null}
                {!s.poslano ? (
                  <span className="type-micro text-bledo">
                    obvestilo po e-pošti ni odšlo
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminOgrodje>
  );
}
