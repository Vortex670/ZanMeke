import "server-only";

import { Image as PdfImage, StyleSheet, Text, View } from "@react-pdf/renderer";

import { PdfDocument, PdfNote, pdfNoteTextStyle } from "@/lib/pdf/components";
import { formatDate, formatIban, formatMoney } from "@/lib/pdf/format";
import {
  color,
  font,
  leading,
  page,
  registerPdfFonts,
  space,
  tracking,
  type as typeScale,
} from "@/lib/pdf/theme";
import type { NastavitveStanje } from "@/lib/nastavitve/queries";
import { upnSklicIzpis } from "@/lib/racuni/upn";
import { STRAN } from "@/lib/podatki";

// ============================================================================
// lib/racuni/pdf.tsx — račun in predračun
// ----------------------------------------------------------------------------
// POSTAVITEV JE DVOKOLONSKA in to je bistvo te datoteke.
//
// Prej je bil dokument en sam stolpec: vse je stalo v zgornji tretjini,
// spodnji dve tretjini pa sta bili prazni. Račun za eno storitev nima dovolj
// vrstic, da bi napolnil A4 — in list, ki se konča pri tretjini, je videti
// odrezan, ne zračen.
//
// Zato gre vsebina levo (stranki, postavke, vsote), plačilo pa v POLNO
// KARTICO na desni, ki teče čez vso višino. Kartica nosi znesek, rok, IBAN,
// sklic in UPN kodo — torej vse, kar stranka potrebuje, da plača — in ker je
// obarvana ploskev, ima stran navpično os tudi takrat, ko je postavka ena
// sama. Razmerje stolpcev je zlati rez (φ), isti kot na strani.
//
// Tipografija in barve so s strani: naslov v Newsreaderju, besedilo v Public
// Sansu, številke v Archivu, poudarek `#0f5d4c`.
//
// TRI STVARI, KI SE JIH NE SME SPREMENITI, ne da bi prej pogledal zakon:
//
//  1. RAZČLENITEV DDV. Kadar je izdajatelj zavezanec, mora račun po 82. členu
//     ZDDV-1 pokazati davčno osnovo, stopnjo in znesek davka. En sam skupni
//     znesek ni veljaven račun zavezanca. `znesekCentov` je BRUTO — to je
//     znesek, ki ga stranka plača in ki ga zaračuna Stripe — zato se osnova
//     računa nazaj iz njega in ne obratno.
//  2. KLAVZULA O OPROSTITVI, kadar izdajatelj NI zavezanec. Brez nje račun
//     ni popoln dokument.
//  3. PLAČAN RAČUN NE PROSI ZA PLAČILO. Na plačanem ni UPN kode, ni »Za
//     plačilo« in ni roka — tak dokument je potrdilo in ne poziv. Stranka, ki
//     dobi plačan račun s kodo za nakazilo, plača drugič.
// ============================================================================

registerPdfFonts();

// ----------------------------------------------------------------------------
// Besedila listine
// ----------------------------------------------------------------------------
// Listina brez stavkov je izpisek iz baze. Prejemnik mora iz nje razbrati
// troje: kaj drži v rokah, kaj naj naredi in na koga se obrne — in to v
// povedih, ne iz polj. Isti razdelki kot na second-home.hr (opomba, pravna
// vrstica, zaključek), le da tam živijo v prevodih, tu pa kot konstante,
// ker je ta stran enojezična.
// ----------------------------------------------------------------------------

const BESEDILA = {
  opomba: {
    naslov: "Opomba",
    predracun:
      "Predračun ni davčni dokument in ne služi kot dokazilo o plačilu. Po prejetem plačilu prejmete račun.",
    neplacan: (sklic: string) =>
      `Znesek nakažite do navedenega roka in v sklic vpišite ${sklic}. Plačate lahko tudi s kartico po povezavi, ki ste jo prejeli po e-pošti.`,
    placan:
      "Hvala za plačilo. Ta račun je potrdilo o prejetem plačilu — nakazila ni treba izvesti.",
  },
  /** Elektronsko izdana listina žiga in podpisa po zakonu ne potrebuje. */
  pravno: "Listina je izdana elektronsko in je veljavna brez žiga in podpisa.",
  zakljucek: {
    predracun: {
      naslov: "Hvala za povpraševanje.",
      telo: "Ko je plačilo na računu, se delo začne. Za vprašanja mi pišite ali pokličite — odgovorim isti dan.",
    },
    placan: {
      naslov: "Hvala za sodelovanje.",
      telo: "Ko boste potrebovali spremembo, novo stran ali fotografije, veste, kje me najdete.",
    },
    odprt: {
      naslov: "Hvala za zaupanje.",
      telo: "Za vprašanja o tej listini ali o projektu mi pišite ali pokličite — odgovorim isti dan.",
    },
  },
} as const;

export type RacunZaPdf = {
  vrsta: "RACUN" | "PREDRACUN";
  stevilka: string;
  stranka: string;
  podjetje: string | null;
  epota: string | null;
  opis: string;
  znesekCentov: number;
  valuta: string;
  createdAt: Date;
  zapadlost: Date | null;
  placanoAt: Date | null;
};

// ----------------------------------------------------------------------------
// Mere
// ----------------------------------------------------------------------------

/** Plačilna kartica. Širina je izbrana po QR kodi: 142 pt kode + 2 × 16 pt roba. */
const KARTICA = 174;
const PRESLEDEK = space.s4;
const LEVO = page.contentWidth - KARTICA - PRESLEDEK;

const s = StyleSheet.create({
  // ---- naslovna vrstica ----
  naslovVrstica: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: space.s4,
  },
  naslov: {
    fontFamily: font.serif,
    fontSize: 26,
    lineHeight: leading.heading,
    letterSpacing: tracking.heading,
    color: color.ink,
  },
  naslovPod: {
    fontFamily: font.mono,
    fontSize: typeScale.mono,
    color: color.muted,
    marginTop: 4,
  },

  // ---- glavni pas ----
  pas: { flexDirection: "row", flexGrow: 1 },
  levo: { width: LEVO, paddingRight: PRESLEDEK },

  // ---- oznake in vrednosti ----
  oznaka: {
    fontSize: typeScale.eyebrow,
    color: color.subtle,
    textTransform: "uppercase",
    letterSpacing: tracking.eyebrow,
    fontWeight: 500,
  },
  vrstica: { fontSize: typeScale.small, color: color.muted, lineHeight: leading.tight },
  vrsticaMono: {
    fontFamily: font.mono,
    fontSize: typeScale.small,
    color: color.muted,
    lineHeight: leading.tight,
  },
  ime: {
    fontSize: typeScale.h3,
    fontWeight: 600,
    color: color.ink,
    letterSpacing: tracking.heading,
    marginTop: 4,
    marginBottom: 3,
  },

  // ---- stranki ----
  stranki: { flexDirection: "row", marginBottom: space.s4 },
  stranka: { flex: 1, paddingRight: space.s3 },

  // ---- datumi ----
  datumi: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: color.rule,
    paddingTop: space.s2,
    marginBottom: space.s4,
  },
  datum: { flex: 1, paddingRight: space.s2 },
  datumVrednost: {
    fontFamily: font.mono,
    fontSize: typeScale.small,
    color: color.ink,
    marginTop: 3,
  },

  // ---- postavke ----
  glavaTabele: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: color.ink,
    paddingBottom: space.s1,
  },
  postavka: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: color.rule,
    paddingVertical: space.s2,
  },
  stolpecOpis: { flex: 1, paddingRight: space.s2 },
  stolpecDdv: { width: 42, textAlign: "right", paddingRight: space.s2 },
  stolpecZnesek: { width: 72, textAlign: "right" },
  opisPostavke: { fontSize: typeScale.body, color: color.ink, lineHeight: leading.tight },
  stevilkaDesno: { fontFamily: font.mono, fontSize: typeScale.mono, color: color.ink },

  // ---- vsote ----
  vsote: { marginTop: space.s3 },
  vsotaVrstica: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
    paddingVertical: 2,
  },
  vsotaOznaka: { fontSize: typeScale.small, color: color.muted, textAlign: "right" },
  vsotaOznakaSkupaj: {
    fontSize: typeScale.body,
    fontWeight: 600,
    color: color.ink,
    textAlign: "right",
  },
  vsotaSirina: { width: 110, paddingRight: space.s2 },
  vsotaZnesek: {
    width: 72,
    textAlign: "right",
    fontFamily: font.mono,
    fontSize: typeScale.mono,
    color: color.ink,
  },
  vsotaSkupaj: {
    width: 72,
    textAlign: "right",
    fontFamily: font.mono,
    fontSize: typeScale.monoLarge,
    fontWeight: 500,
    letterSpacing: tracking.number,
    color: color.accent,
  },
  crtaSkupaj: {
    borderTopWidth: 1,
    borderTopColor: color.accent,
    marginTop: space.s1,
    paddingTop: space.s2,
  },

  // ---- opomba in zaključek na dnu leve kolone ----
  opombe: { marginTop: "auto", paddingTop: space.s4 },

  zakljucek: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: 0.5,
    borderTopColor: color.rule,
    paddingTop: space.s2,
    marginTop: space.s2,
  },
  zakljucekLevo: { flex: 1, paddingRight: space.s3 },
  zakljucekNaslov: {
    fontSize: typeScale.body,
    fontWeight: 600,
    color: color.ink,
    marginBottom: 2,
  },
  zakljucekTelo: {
    fontSize: typeScale.small,
    color: color.muted,
    lineHeight: leading.tight,
  },
  zakljucekDesno: { width: 118, alignItems: "flex-end" },
  zakljucekVrstica: { fontSize: typeScale.small, color: color.ink },
  zakljucekVrsticaTiha: { fontSize: typeScale.small, color: color.muted },

  // ---- plačilna kartica ----
  kartica: {
    width: KARTICA,
    backgroundColor: color.surface,
    padding: space.s3,
    // Levi rob v barvi znamke: kartica je s tem pritrjena na stran in ne
    // lebdi kot siv pravokotnik.
    borderLeftWidth: 2,
    borderLeftColor: color.accent,
  },
  karticaZnesek: {
    fontFamily: font.mono,
    fontSize: 19,
    fontWeight: 500,
    letterSpacing: tracking.number,
    color: color.accent,
    marginTop: 4,
  },
  karticaRok: { fontSize: typeScale.small, color: color.muted, marginTop: 3 },
  karticaLocilo: {
    borderTopWidth: 0.5,
    borderTopColor: color.rule,
    marginTop: space.s3,
    paddingTop: space.s3,
  },
  /**
   * UPN koda se usede na DNO kartice.
   *
   * Kartica teče čez vso višino strani, vsebine pa ima za tretjino — če je
   * vse zbrano na vrhu, se spodaj razteza prazna siva ploskev in vrne se
   * ista luknja, le da je zdaj obarvana. S kodo na dnu ima kartica oporo
   * zgoraj in spodaj, prazno pa je v sredini, kjer ga oko bere kot zrak.
   */
  karticaVrzel: { flexGrow: 1, minHeight: space.s3 },
  karticaPolje: { marginBottom: space.s2 },
  karticaVrednost: {
    fontFamily: font.mono,
    fontSize: typeScale.small,
    color: color.ink,
    marginTop: 2,
    lineHeight: leading.tight,
  },
  qrNapis: {
    fontSize: typeScale.eyebrow,
    color: color.subtle,
    marginTop: space.s1,
    lineHeight: leading.tight,
  },
  zig: {
    alignSelf: "flex-start",
    backgroundColor: color.accent,
    color: color.paper,
    fontSize: typeScale.eyebrow,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: tracking.eyebrow,
    paddingVertical: 3,
    paddingHorizontal: space.s2,
    marginBottom: space.s2,
  },
});

/**
 * Razčlenitev bruto zneska na osnovo in davek.
 *
 * Zaokrožuje se DAVEK in ne osnova: osnova je potem razlika in vsota se vedno
 * izide na cent. Pri obratnem vrstnem redu se pri nekaterih zneskih seštevek
 * razlikuje od bruta za en cent — in to je prvo, kar računovodkinja opazi.
 */
function razclenitev(brutoCentov: number, stopnja: number) {
  const davek = Math.round((brutoCentov * stopnja) / (100 + stopnja));
  return { osnova: brutoCentov - davek, davek };
}

/** Davčna številka zavezanca gre na račun s predpono SI. */
function idZaDdv(davcna: string): string {
  const golo = davcna.replace(/\s/g, "");
  return /^SI/i.test(golo) ? golo.toUpperCase() : `SI${golo}`;
}

function Polje({ oznaka, children }: { oznaka: string; children: string }) {
  return (
    <View style={s.karticaPolje}>
      <Text style={s.oznaka}>{oznaka}</Text>
      <Text style={s.karticaVrednost}>{children}</Text>
    </View>
  );
}

export function RacunPdf({
  racun,
  n,
  qr,
}: {
  racun: RacunZaPdf;
  n: NastavitveStanje;
  /** PNG UPN kode kot data URL; `null`, kadar je ni mogoče sestaviti. */
  qr: string | null;
}) {
  const jePredracun = racun.vrsta === "PREDRACUN";
  const jePlacan = Boolean(racun.placanoAt);
  const vrsta = jePredracun ? "Predračun" : "Račun";

  // `formatMoney` sprejme CENTE in deli sam. Deljenje tu je pomenilo 8,95 €
  // namesto 895,00 € — napačen znesek na računu je najdražja napaka, ki jo ta
  // datoteka lahko naredi.
  const denar = (centov: number) => formatMoney(centov, racun.valuta);
  const znesek = denar(racun.znesekCentov);
  const sklic = upnSklicIzpis(racun.stevilka);
  const { osnova, davek } = razclenitev(racun.znesekCentov, n.stopnjaDdv);
  const davcnaNaListini = n.zavezanecZaDdv
    ? `ID za DDV: ${idZaDdv(n.davcnaStevilka)}`
    : n.davcnaStevilka
      ? `Davčna št.: ${n.davcnaStevilka}`
      : null;

  // Katera poved gre v opombo in kateri zaključek — stanje listine odloči
  // oboje. Plačan račun se ne zahvaljuje za povpraševanje in predračun ne
  // potrjuje plačila.
  const opombaBesedilo = jePlacan
    ? BESEDILA.opomba.placan
    : jePredracun
      ? BESEDILA.opomba.predracun
      : BESEDILA.opomba.neplacan(sklic);

  const zakljucek = jePlacan
    ? BESEDILA.zakljucek.placan
    : jePredracun
      ? BESEDILA.zakljucek.predracun
      : BESEDILA.zakljucek.odprt;

  const pravnaVrstica = [
    n.izdajateljIme,
    n.izdajateljUlica,
    n.izdajateljPosta,
    davcnaNaListini,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PdfDocument
      title={`${vrsta} ${racun.stevilka}`}
      author={n.izdajateljIme}
      subject={racun.opis}
      header={{
        issuer: n.izdajateljIme,
        tagline: "Spletne strani · Fotografija",
        docType: vrsta,
        docNumber: racun.stevilka,
      }}
      footer={{ legal: pravnaVrstica, iban: n.iban ? formatIban(n.iban) : null }}
    >
      <View style={s.naslovVrstica}>
        <View>
          <Text style={s.naslov}>{vrsta}</Text>
          <Text style={s.naslovPod}>
            {racun.stevilka} · izdan {formatDate(racun.createdAt)}
          </Text>
        </View>
      </View>

      <View style={s.pas}>
        {/* ── LEVO: kdo komu, kaj in koliko ─────────────────────────────── */}
        <View style={s.levo}>
          <View style={s.stranki}>
            <View style={s.stranka}>
              <Text style={s.oznaka}>Izdajatelj</Text>
              <Text style={s.ime}>{n.izdajateljIme}</Text>
              <Text style={s.vrstica}>{n.izdajateljUlica}</Text>
              <Text style={s.vrstica}>{n.izdajateljPosta}</Text>
              <Text style={s.vrstica}>{n.izdajateljDrzava}</Text>
              {davcnaNaListini ? (
                <Text style={s.vrsticaMono}>{davcnaNaListini}</Text>
              ) : null}
              {n.maticnaStevilka ? (
                <Text style={s.vrsticaMono}>Matična št.: {n.maticnaStevilka}</Text>
              ) : null}
            </View>

            <View style={s.stranka}>
              <Text style={s.oznaka}>Kupec</Text>
              <Text style={s.ime}>{racun.podjetje ?? racun.stranka}</Text>
              {racun.podjetje ? <Text style={s.vrstica}>{racun.stranka}</Text> : null}
              {racun.epota ? <Text style={s.vrstica}>{racun.epota}</Text> : null}
            </View>
          </View>

          <View style={s.datumi}>
            <View style={s.datum}>
              <Text style={s.oznaka}>Datum izdaje</Text>
              <Text style={s.datumVrednost}>{formatDate(racun.createdAt)}</Text>
            </View>
            {/* Datum opravljene storitve je na računu obvezen podatek; pri
                enkratni storitvi je enak datumu izdaje in se ne izmišlja. */}
            <View style={s.datum}>
              <Text style={s.oznaka}>Datum storitve</Text>
              <Text style={s.datumVrednost}>{formatDate(racun.createdAt)}</Text>
            </View>
            <View style={s.datum}>
              <Text style={s.oznaka}>Sklic</Text>
              <Text style={s.datumVrednost}>{sklic}</Text>
            </View>
          </View>

          <View style={s.glavaTabele}>
            <Text style={[s.oznaka, s.stolpecOpis]}>Postavka</Text>
            {n.zavezanecZaDdv ? <Text style={[s.oznaka, s.stolpecDdv]}>DDV</Text> : null}
            <Text style={[s.oznaka, s.stolpecZnesek]}>
              {n.zavezanecZaDdv ? "Neto" : "Znesek"}
            </Text>
          </View>

          <View style={s.postavka}>
            <Text style={[s.opisPostavke, s.stolpecOpis]}>{racun.opis}</Text>
            {n.zavezanecZaDdv ? (
              <Text style={[s.stevilkaDesno, s.stolpecDdv]}>{n.stopnjaDdv} %</Text>
            ) : null}
            <Text style={[s.stevilkaDesno, s.stolpecZnesek]}>
              {n.zavezanecZaDdv ? denar(osnova) : znesek}
            </Text>
          </View>

          <View style={s.vsote}>
            {n.zavezanecZaDdv ? (
              <>
                <View style={s.vsotaVrstica}>
                  <Text style={[s.vsotaOznaka, s.vsotaSirina]}>Neto (brez DDV)</Text>
                  <Text style={s.vsotaZnesek}>{denar(osnova)}</Text>
                </View>
                <View style={s.vsotaVrstica}>
                  <Text style={[s.vsotaOznaka, s.vsotaSirina]}>DDV {n.stopnjaDdv} %</Text>
                  <Text style={s.vsotaZnesek}>{denar(davek)}</Text>
                </View>
              </>
            ) : null}
            <View style={[s.vsotaVrstica, s.crtaSkupaj]}>
              <Text style={[s.vsotaOznakaSkupaj, s.vsotaSirina]}>
                {jePlacan ? "Plačano" : "Za plačilo"}
              </Text>
              <Text style={s.vsotaSkupaj}>{znesek}</Text>
            </View>
          </View>

          <View style={s.opombe}>
            <PdfNote title={BESEDILA.opomba.naslov}>
              <Text style={pdfNoteTextStyle}>{opombaBesedilo}</Text>
              {/* Klavzula je OBVEZNA, kadar izdajatelj ni zavezanec za DDV —
                  brez nje račun ni popoln dokument. */}
              {!n.zavezanecZaDdv && n.klavzulaBrezDdv ? (
                <Text style={[pdfNoteTextStyle, { marginTop: space.s1 }]}>
                  {n.klavzulaBrezDdv}
                </Text>
              ) : null}
              <Text style={[pdfNoteTextStyle, { marginTop: space.s1 }]}>
                {BESEDILA.pravno}
              </Text>
            </PdfNote>

            <View style={s.zakljucek}>
              <View style={s.zakljucekLevo}>
                <Text style={s.zakljucekNaslov}>{zakljucek.naslov}</Text>
                <Text style={s.zakljucekTelo}>{zakljucek.telo}</Text>
              </View>
              <View style={s.zakljucekDesno}>
                {n.epota ? <Text style={s.zakljucekVrstica}>{n.epota}</Text> : null}
                {n.telefon ? <Text style={s.zakljucekVrstica}>{n.telefon}</Text> : null}
                <Text style={s.zakljucekVrsticaTiha}>{STRAN.domena}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── DESNO: plačilna kartica ───────────────────────────────────── */}
        <View style={s.kartica}>
          {jePlacan ? <Text style={s.zig}>Plačano</Text> : null}

          <Text style={s.oznaka}>{jePlacan ? "Znesek" : "Za plačilo"}</Text>
          <Text style={s.karticaZnesek}>{znesek}</Text>
          {jePlacan ? (
            <Text style={s.karticaRok}>{formatDate(racun.placanoAt!)}</Text>
          ) : racun.zapadlost ? (
            <Text style={s.karticaRok}>do {formatDate(racun.zapadlost)}</Text>
          ) : null}

          {jePlacan ? (
            <>
              <View style={s.karticaVrzel} />
              <View style={s.karticaLocilo}>
                <Polje oznaka="Sklic">{sklic}</Polje>
                {n.iban ? <Polje oznaka="Nakazano na">{formatIban(n.iban)}</Polje> : null}
              </View>
            </>
          ) : (
            <>
              <View style={s.karticaLocilo}>
                {n.iban ? <Polje oznaka="IBAN">{formatIban(n.iban)}</Polje> : null}
                {n.bic ? <Polje oznaka="SWIFT / BIC">{n.bic}</Polje> : null}
                {n.banka ? <Polje oznaka="Banka">{n.banka}</Polje> : null}
                <Polje oznaka="Sklic">{sklic}</Polje>
                <Polje oznaka="Način plačila">Nakazilo ali kartica (Stripe)</Polje>
              </View>

              <View style={s.karticaVrzel} />

              {qr ? (
                <View style={s.karticaLocilo}>
                  <PdfImage src={qr} style={{ width: 142, height: 142 }} />
                  <Text style={s.qrNapis}>
                    UPN koda — skenirajte z mobilno banko in znesek je vpisan sam.
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </View>
    </PdfDocument>
  );
}
