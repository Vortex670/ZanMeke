import { ArrowUpRight, Check, Clock, CreditCard, Landmark } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Odsek } from "@/components/public/Odsek";
import { GumbPlacaj } from "@/components/public/racun/GumbPlacaj";
import {
  PodatkiZaNakazilo,
  type VrsticaNakazila,
} from "@/components/public/racun/PodatkiZaNakazilo";
import { getNastavitve } from "@/lib/nastavitve/queries";
import { formatIban } from "@/lib/pdf/format";
import { STRAN } from "@/lib/podatki";
import { upnKoda } from "@/lib/racuni/qr";
import { upnSklicIzpis } from "@/lib/racuni/upn";
import { getRacunPoZetonu } from "@/lib/racuni/queries";
import { zneskovno } from "@/lib/racuni/validation";
import { jeStripePripravljen, jeStripeTestni } from "@/lib/stripe/client";

// ============================================================================
// /racun/[zeton] — plačilna stran
// ----------------------------------------------------------------------------
// Stran vidi, kdor ima povezavo. Žetona ni mogoče uganiti (32 naključnih
// bajtov), zato prijave ni — in to je namenoma: vsak korak več med računom in
// plačilom je en razlog več, da stranka odloži.
//
// STRAN IMA ENO SAMO NALOGO: da je račun plačan, preden človek zapre zavihek.
// Zato je najprej ZNESEK in rok, takoj za njim pa OBE POTI DO PLAČILA, druga
// ob drugi in enako vredni. Kartica in nakazilo nista prva in druga izbira:
// podjetje plača z nalogom, ker tako vodi knjigovodstvo, zasebnik pa s
// kartico, ker je pri roki. Kdor mora svojo pot iskati, odloži na jutri.
//
// KAR JE TU, JE SAMO ZA TO STRANKO: številka računa, kaj se plačuje in
// znesek. Nobenega seznama, nobene povezave v admin.
//
// Stran se NE PREDPOMNI in NE INDEKSIRA: vsebuje ime in znesek.
// ============================================================================

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plačilo računa",
  robots: { index: false, follow: false },
};

const DATUM = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Ljubljana",
});

const DAN = 86_400_000;

/**
 * »Čez osem dni« pove več kot »10. oktober 2026«.
 *
 * Datum je treba odšteti od danes, da se ve, ali se mudi; to je delo, ki ga
 * stran lahko opravi namesto človeka. Oboje je izpisano, ker datum potrebuje
 * računovodstvo, razdaljo pa tisti, ki plačuje.
 */
function rokPovej(zapadlost: Date): { besedilo: string; zamuja: boolean } {
  const danes = new Date();
  const dni = Math.round(
    (Date.UTC(zapadlost.getFullYear(), zapadlost.getMonth(), zapadlost.getDate()) -
      Date.UTC(danes.getFullYear(), danes.getMonth(), danes.getDate())) /
      DAN,
  );

  if (dni === 0) return { besedilo: "zapade danes", zamuja: false };
  if (dni === 1) return { besedilo: "zapade jutri", zamuja: false };
  if (dni > 1) return { besedilo: `še ${dni} dni`, zamuja: false };
  if (dni === -1) return { besedilo: "zapadlo včeraj", zamuja: true };
  return { besedilo: `zapadlo pred ${Math.abs(dni)} dnevi`, zamuja: true };
}

export default async function PlacilnaStran({
  params,
  searchParams,
}: {
  params: Promise<{ zeton: string }>;
  searchParams: Promise<{ placano?: string }>;
}) {
  const [{ zeton }, { placano }] = await Promise.all([params, searchParams]);
  const racun = await getRacunPoZetonu(zeton);
  if (!racun) notFound();

  const jePlacan = racun.stanje === "PLACAN";
  const vObdelavi = !jePlacan && Boolean(placano);
  const odprt = !jePlacan && !vObdelavi;
  const jePredracun = racun.vrsta === "PREDRACUN";
  const naslovListine = jePredracun ? "Predračun" : "Račun";

  // NAKAZILO JE DRUGA POT IN NE DRUGOTNA. Stran je doslej ponujala samo
  // kartico; kdor je hotel IBAN, ga je moral iskati v PDF-ju — in to je bil
  // en korak preveč prav v trenutku, ko je bil pripravljen plačati.
  const n = odprt ? await getNastavitve().catch(() => null) : null;
  const sklic = upnSklicIzpis(racun.stevilka);

  const qr = n?.iban
    ? await upnKoda({
        iban: n.iban,
        imePrejemnika: n.izdajateljIme,
        ulica: n.izdajateljUlica,
        posta: n.izdajateljPosta,
        znesekCentov: racun.znesekCentov,
        sklic: racun.stevilka,
        namen: `${jePredracun ? "Predracun" : "Racun"} ${racun.stevilka}`,
        rok: racun.zapadlost,
      }).catch(() => null)
    : null;

  const vrstice: VrsticaNakazila[] = n?.iban
    ? [
        {
          oznaka: "Prejemnik",
          prikaz: n.izdajateljIme,
          vrednost: n.izdajateljIme,
        },
        {
          oznaka: "IBAN",
          prikaz: formatIban(n.iban),
          // Banke sprejmejo oboje, a presledki se pri lepljenju ponekod
          // zataknejo — v odložišče gre strnjena oblika.
          vrednost: n.iban.replace(/\s/g, ""),
        },
        { oznaka: "Sklic", prikaz: sklic, vrednost: sklic.replace(/\s/g, "") },
        {
          oznaka: "Znesek",
          prikaz: zneskovno(racun.znesekCentov, racun.valuta),
          vrednost: (racun.znesekCentov / 100).toFixed(2),
        },
      ]
    : [];

  const rok = racun.zapadlost ? rokPovej(racun.zapadlost) : null;

  return (
    <>
      {/* ── Uvod: kdo, koliko, do kdaj ───────────────────────────────────── */}
      <Odsek plast="temna" sirina="ozek" visina={false} sij className="uvod-y">
        <p className="type-label text-poudarek">
          {naslovListine} {racun.stevilka}
        </p>

        <h1 className="type-h1 stevilke mt-s2">
          {zneskovno(racun.znesekCentov, racun.valuta)}
        </h1>

        <p className="type-lead text-mirno mera mt-s2">{racun.opis}</p>

        <dl className="gap-s3 mt-s4 flex flex-wrap">
          <div>
            <dt className="type-micro text-bledo">Za</dt>
            {/* Ime podjetja se KONČA S PIKO (»d.o.o.«) in stavek, ki ga
                vsebuje, dobi dve. Zato stoji v svojem polju in ne v povedi. */}
            <dd className="type-body mt-0.5">{racun.podjetje ?? racun.stranka}</dd>
          </div>
          {racun.zapadlost && rok ? (
            <div>
              <dt className="type-micro text-bledo">Rok plačila</dt>
              <dd className="type-body mt-0.5">
                {DATUM.format(racun.zapadlost)}
                <span
                  className={`type-micro ml-2 ${odprt && rok.zamuja ? "text-poudarek" : "text-bledo"}`}
                >
                  {jePlacan ? "" : rok.besedilo}
                </span>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="type-micro text-bledo">Izdal</dt>
            <dd className="type-body mt-0.5">
              {n?.izdajateljIme ?? `${STRAN.ime} · ${STRAN.kraj}`}
            </dd>
          </div>
          {racun.stanje !== "OSNUTEK" ? (
            <div>
              <dt className="type-micro text-bledo">Listina</dt>
              <dd className="mt-0.5">
                {/* PDF se odpre v zavihku in se ne prenese: kdor ga potrebuje
                    za knjiženje, ga shrani sam, vsem drugim pa ne pristane
                    v mapi Prenosi. */}
                <a
                  href={`/racun/${racun.zeton}/pdf`}
                  target="_blank"
                  rel="noopener"
                  className="type-body text-poudarek inline-flex items-center gap-1 underline underline-offset-4"
                >
                  {naslovListine} v PDF
                  <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </Odsek>

      {/* ── Plačilo ──────────────────────────────────────────────────────── */}
      <Odsek plast="svetla" sirina="ozek">
        {jePlacan ? (
          <Stanje
            ikona={<Check className="size-5" strokeWidth={2.4} aria-hidden />}
            naslov={`Plačano${racun.placanoAt ? ` · ${DATUM.format(racun.placanoAt)}` : ""}`}
          >
            Hvala. Listina zgoraj je potrdilo za vaše knjigovodstvo — če potrebujete
            karkoli drugega, pokličite {STRAN.telefon}.
          </Stanje>
        ) : vObdelavi ? (
          // Vrnitev s Stripove blagajne še NI potrdilo. Potrdi webhook, ta pa
          // pride v nekaj sekundah — zato tu piše, kaj se dogaja, in ne
          // »plačano«, kar bi bilo lahko neresnično.
          <Stanje
            ikona={<Clock className="size-5" strokeWidth={2} aria-hidden />}
            naslov="Plačilo je oddano"
          >
            Potrdilo pride po e-pošti, ta stran pa se posodobi, ko banka potrdi — navadno
            v nekaj sekundah. Zavihka vam ni treba imeti odprtega.
          </Stanje>
        ) : (
          <div className="gap-s3 grid md:grid-cols-2">
            {/* ── S kartico ─────────────────────────────────────────────── */}
            <Pot
              ikona={<CreditCard className="size-5" strokeWidth={1.8} aria-hidden />}
              oznaka="Takoj"
              naslov="S kartico"
              opis="Plačilo je knjiženo v trenutku, potrdilo pride po e-pošti."
            >
              {jeStripePripravljen() ? (
                <>
                  {/* TRI DEJSTVA IN NE OKRAS. Kartica brez njih je ob kartici
                      s kodo in štirimi vrsticami podatkov prazna ploskev z
                      gumbom na dnu — in prazno polje bere kot »tu nekaj
                      manjka«, ne kot mirna izbira. */}
                  <ul className="gap-s1 type-small text-mirno mb-s3 grid">
                    {[
                      "Visa, Mastercard in Maestro",
                      "Apple Pay in Google Pay",
                      "Potrdilo po e-pošti takoj po plačilu",
                    ].map((v) => (
                      <li key={v} className="flex items-baseline gap-2">
                        <Check
                          className="text-poudarek size-3.5 shrink-0 translate-y-0.5"
                          strokeWidth={2.2}
                          aria-hidden
                        />
                        {v}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <GumbPlacaj zeton={racun.zeton} />
                    <p className="type-micro text-bledo mt-s2">
                      Blagajno vodi Stripe — podatki o kartici ne gredo skozi to stran.
                      {jeTestni()}
                    </p>
                  </div>
                </>
              ) : (
                <p className="type-small text-mirno">
                  Kartično plačilo trenutno ni na voljo. Uporabite nakazilo ali pokličite{" "}
                  {STRAN.telefon}.
                </p>
              )}
            </Pot>

            {/* ── Z nakazilom ───────────────────────────────────────────── */}
            <Pot
              ikona={<Landmark className="size-5" strokeWidth={1.8} aria-hidden />}
              oznaka="UPN · e-banka"
              naslov="Z nakazilom"
              opis="Skenirajte kodo in nalog je izpolnjen sam."
            >
              {n?.iban ? (
                <div className="gap-s2 flex flex-wrap items-start">
                  {qr ? (
                    <figure className="shrink-0">
                      {/* Koda stoji na BELEM, tudi v temni temi. Mirna cona
                          je del slike, a modri telefona ne išče roba kode,
                          ampak kontrast — temna ploskev okoli bele kode je
                          ravno toliko dvoumna, da iskanje traja. */}
                      <Image
                        src={qr}
                        alt={`UPN koda za plačilo računa ${racun.stevilka}`}
                        width={176}
                        height={176}
                        unoptimized
                        className="rounded-lg bg-white"
                      />
                      <figcaption className="type-micro text-bledo mt-1.5 max-w-[176px]">
                        Skenirajte z mobilno banko.
                      </figcaption>
                    </figure>
                  ) : null}

                  <div className="min-w-[14rem] flex-1">
                    <PodatkiZaNakazilo vrstice={vrstice} />
                    <p className="type-micro text-bledo mt-s1 px-2">
                      Klik na vrstico jo kopira.
                      {n.banka ? ` Banka: ${n.banka}.` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="type-small text-mirno">
                  Pokličite {STRAN.telefon} in podatke za nakazilo vam pošljem po e-pošti.
                </p>
              )}
            </Pot>
          </div>
        )}

        {/* ── Pomoč ────────────────────────────────────────────────────── */}
        <p className="type-small text-mirno border-crta-mehka mt-s4 pt-s3 border-t">
          Vprašanje o tej listini?{" "}
          <a
            href={`tel:${STRAN.telefonKlic}`}
            className="text-crnilo stevilke underline underline-offset-4"
          >
            {STRAN.telefon}
          </a>{" "}
          ali{" "}
          <a
            href={`mailto:${STRAN.epota}?subject=${encodeURIComponent(`${naslovListine} ${racun.stevilka}`)}`}
            className="text-crnilo underline underline-offset-4"
          >
            {STRAN.epota}
          </a>
          . Odgovorim isti dan.
        </p>
      </Odsek>
    </>
  );
}

/** Preizkusni način je opozorilo zame, ne drobni tisk za stranko. */
function jeTestni() {
  return jeStripeTestni() ? " Trenutno je vklopljen preizkusni način." : "";
}

// ----------------------------------------------------------------------------
// <Pot /> — ena pot do plačila
// ----------------------------------------------------------------------------
// Kartici sta ENAKO VELIKI in imata enako zgradbo: ikona, oznaka, naslov,
// stavek, dejanje. Dve poti, ki izgledata različno, nista dve enakovredni
// možnosti, ampak priporočilo in opomba — in kdor ne zna plačati po
// priporočeni, misli, da je naredil nekaj narobe.
// ----------------------------------------------------------------------------

function Pot({
  ikona,
  oznaka,
  naslov,
  opis,
  children,
}: {
  ikona: React.ReactNode;
  oznaka: string;
  naslov: string;
  opis: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-crta bg-ploskev p-s3 flex flex-col rounded-2xl border">
      <div className="gap-s1 flex items-center">
        <span className="text-poudarek">{ikona}</span>
        <span className="type-label text-bledo">{oznaka}</span>
      </div>
      <h2 className="type-h3 mt-s1">{naslov}</h2>
      <p className="type-small text-mirno mt-1">{opis}</p>
      {/* Otroci so SVOJ STOLPEC in ne blok, potisnjen na dno. Ko je bil cel
          blok pod `mt-auto`, je seznam dejstev zdrsnil z njim in vrh kartice
          je ostal prazen; zdaj se na dno usede samo tisto, kar si tega
          izrecno želi — gumb. */}
      <div className="mt-s3 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// <Stanje /> — plačano / v obdelavi
// ----------------------------------------------------------------------------
// Ko je plačilo opravljeno, poti do plačila ni več — ostane samo sporočilo.
// Dve sivi kartici pod njim bi vabili k drugemu plačilu istega računa.
// ----------------------------------------------------------------------------

function Stanje({
  ikona,
  naslov,
  children,
}: {
  ikona: React.ReactNode;
  naslov: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-crta bg-ploskev p-s3 gap-s2 mera flex items-start rounded-2xl border">
      <span className="text-poudarek mt-0.5 shrink-0">{ikona}</span>
      <div className="min-w-0">
        <p className="type-h3">{naslov}</p>
        <p className="type-small text-mirno mt-1">{children}</p>
      </div>
    </div>
  );
}
