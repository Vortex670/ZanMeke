import { AlertTriangle, Check, Minus } from "lucide-react";

import { ObrazecNastavitev } from "@/components/admin/nastavitve/ObrazecNastavitev";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { getNastavitve } from "@/lib/nastavitve/queries";
import { STRAN } from "@/lib/podatki";
import { jeStripePripravljen, jeStripeTestni } from "@/lib/stripe/client";

// ============================================================================
// /admin/nastavitve — kaj je priklopljeno
// ----------------------------------------------------------------------------
// Ne nastavitve v smislu drsnikov in kljukic. Stran odgovarja na eno
// vprašanje, ki se postavi vsakič, ko kaj ne dela: ALI JE TA STORITEV SPLOH
// PRIKLOPLJENA? Brez tega se vsaka napaka začne z brskanjem po `.env.local`
// na strežniku, do katerega s telefona ni dostopa.
//
// VREDNOSTI KLJUČEV TU NE PIŠEJO — niti skrajšane. Pove se samo, ali ključ
// obstaja. Zaslon administracije je v restavraciji pogosto obrnjen tako, da
// ga vidi pol lokala, in ključ, ki ga kdo prepiše, je ključ, ki je ušel.
// ============================================================================

export const dynamic = "force-dynamic";

/** Ključ je priklopljen, če obstaja in ni prazen. Vrednosti ne beremo drugam. */
function jePriklopljen(ime: string): boolean {
  return Boolean(process.env[ime]?.trim());
}

/**
 * Storitev ima lahko OBVEZNE in DODATNE ključe.
 *
 * Ločnica ni kozmetična. Stripe brez podpisne skrivnosti vse opravi — račun
 * nastane, stranka plača — le potrditev plačila ne pride sama. Če bi bil tak
 * primer prikazan enako kot »ni priklopljeno«, bi stran lagala in bi se za
 * njo iskala napaka, ki je ni.
 */
const STORITVE: Array<{
  ime: string;
  obvezni: string[];
  dodatni?: string[];
  cemu: string;
  /** Kaj natanko ne dela, dokler manjkajo dodatni ključi. */
  brezDodatnih?: string;
}> = [
  {
    ime: "Podatkovna baza",
    obvezni: ["DATABASE_URL"],
    cemu: "Povpraševanja, prijava, statistika in računi. Brez nje stran ne dela.",
  },
  {
    ime: "Pošta (Resend)",
    obvezni: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
    cemu: "Obvestilo o novem povpraševanju in povezava za ponastavitev gesla.",
  },
  {
    ime: "Shramba (Cloudflare R2)",
    obvezni: ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_ENDPOINT"],
    cemu: "Nalaganje slik v urejevalnik in stran Mediji.",
    brezDodatnih: "Dokler ni, slike prihajajo iz mape v projektu — stran dela normalno.",
  },
  {
    ime: "Plačila (Stripe)",
    obvezni: ["STRIPE_SECRET_KEY"],
    dodatni: ["STRIPE_WEBHOOK_SECRET"],
    cemu: "Plačilo računa s kartico po povezavi.",
    brezDodatnih:
      "Brez podpisne skrivnosti plačila tečejo, a se račun ne označi za plačanega sam — podpis dobiš po objavi strani.",
  },
];

export default async function Nastavitve() {
  const nastavitve = await getNastavitve();

  return (
    <AdminPage
      eyebrow="Nastavitve"
      title="Kaj je priklopljeno"
      description="Katere storitve stran uporablja in ali imajo ključ. Vrednosti ključev tu namenoma ne pišejo."
    >
      {/* Podatki izdajatelja PRVI: to je edino na tej strani, kar urednik
          res vpisuje. Seznam storitev je pregled stanja, ne delo. */}
      <ObrazecNastavitev zacetne={nastavitve} />

      <section className="border-chrome-line bg-surface mt-(--s4) rounded-2xl border p-(--s3)">
        <h2 className="type-eyebrow text-subtle">Storitve</h2>
        <ul className="divide-chrome-line mt-(--s1) divide-y">
          {STORITVE.map((s) => {
            const manjkaObveznih = s.obvezni.filter((k) => !jePriklopljen(k));
            const manjkaDodatnih = (s.dodatni ?? []).filter((k) => !jePriklopljen(k));

            const stanje: "ok" | "delno" | "ne" =
              manjkaObveznih.length > 0
                ? "ne"
                : manjkaDodatnih.length > 0
                  ? "delno"
                  : "ok";

            return (
              <li key={s.ime} className="flex items-start gap-(--s2) py-3">
                <span
                  aria-hidden
                  className={
                    stanje === "ok"
                      ? "bg-success/15 text-success mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full"
                      : stanje === "delno"
                        ? "bg-warning/15 text-warning mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full"
                        : "bg-text/6 text-subtle mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full"
                  }
                >
                  {stanje === "ok" ? (
                    <Check className="size-4" strokeWidth={2.2} />
                  ) : stanje === "delno" ? (
                    <AlertTriangle className="size-4" strokeWidth={2.2} />
                  ) : (
                    <Minus className="size-4" strokeWidth={2.2} />
                  )}
                </span>

                <span className="min-w-0">
                  <span className="type-small text-text block font-semibold">
                    {s.ime}
                    {stanje === "delno" ? (
                      <span className="text-warning"> · delno</span>
                    ) : null}
                  </span>
                  <span className="type-micro text-muted block">{s.cemu}</span>

                  {manjkaObveznih.length > 0 ? (
                    <span className="type-micro text-subtle mt-0.5 block">
                      Manjka: {manjkaObveznih.join(", ")}
                      {s.brezDodatnih ? ` — ${s.brezDodatnih}` : ""}
                    </span>
                  ) : manjkaDodatnih.length > 0 ? (
                    <span className="type-micro text-subtle mt-0.5 block">
                      Manjka: {manjkaDodatnih.join(", ")}
                      {s.brezDodatnih ? ` — ${s.brezDodatnih}` : ""}
                    </span>
                  ) : null}

                  {/* Pri Stripu je način tisto, kar je treba videti na prvi
                      pogled: preizkusni ključ pomeni, da plačila niso prava. */}
                  {s.ime.startsWith("Plačila") && jeStripePripravljen() ? (
                    <span
                      className={
                        jeStripeTestni()
                          ? "type-micro text-warning mt-0.5 block font-semibold"
                          : "type-micro text-success mt-0.5 block font-semibold"
                      }
                    >
                      {jeStripeTestni()
                        ? "PREIZKUSNI ključ — plačila niso prava."
                        : "ŽIVI ključ — plačila so prava."}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-chrome-line bg-surface mt-(--s3) rounded-2xl border p-(--s3)">
        <h2 className="type-eyebrow text-subtle">Stran</h2>
        <dl className="mt-(--s2) grid gap-(--s2) sm:grid-cols-2">
          {[
            ["Ime", STRAN.ime],
            ["Domena", STRAN.domena],
            ["Telefon", STRAN.telefon],
            ["E-pošta", STRAN.epota],
            ["Kraj", `${STRAN.kraj}, ${STRAN.obmocje}`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="type-micro text-subtle">{k}</dt>
              <dd className="type-small">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="type-micro text-subtle mt-(--s2)">
          Ti podatki živijo v `lib/podatki.ts` in se uporabijo povsod — v glavi, nogi,
          pošti in strukturiranih podatkih za Google. Sprememba na enem mestu velja za
          vse.
        </p>
      </section>
    </AdminPage>
  );
}
