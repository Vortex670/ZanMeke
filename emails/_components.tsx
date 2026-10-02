import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

// ============================================================================
// emails/_components.tsx — skupno ogrodje vseh sporočil
// ----------------------------------------------------------------------------
// Poštni odjemalci ne poznajo CSS spremenljivk, mrež ne razumejo enako in
// Gmail odreže `<style>`. Zato so barve tu zapisane kot šestnajstiške
// vrednosti (iste kot žetoni v `styles/tokens.css`, le prevedene) in
// postavitev je ena sama kolona.
//
// Nič temne teme: Gmail in Outlook si jo naredita sama, po svoje, in vsak
// poskus, da bi jima govorili drugače, se konča z belim besedilom na beli
// podlagi.
// ============================================================================

// BARVE POŠTE SO NEVTRALNO SIVE, ne tople.
//
// Kremna podlaga je v poslovnem pismu videti kot vabilo na poroko; ta stran
// prodaja delo in ne vzdušja, zato je paleta siva.
//
// Barv je malo nalašč — ena poudarna in šest sivih. Poštni odjemalci
// (Outlook, Gmail) marsikatero pravilo CSS prezrejo; kar preživi povsod, so
// polne ploskve in robovi, zato jih je treba porabiti premišljeno.
export const barva = {
  papir: "#ffffff",
  /** Zunaj kartice — malo temnejše od papirja, da se kartica vidi kot kartica. */
  ozadje: "#f4f4f5",
  /** Noga: svetlejša od zunanjega ozadja. */
  noga: "#fafafa",
  crnilo: "#18181b",
  priduseno: "#52525b",
  drobno: "#a1a1aa",
  crta: "#e4e4e7",
  poudarek: "#0f5d4c",
  poudarekTemno: "#0b4a3c",
  /** Stanja v znački: potrjeno, v čakanju, odpovedano. */
  uspehPloskev: "#e2efe9",
  uspehCrnilo: "#0b4a33",
  cakanjePloskev: "#f6edde",
  cakanjeCrnilo: "#6b4610",
  napakaPloskev: "#f7e6e2",
  napakaCrnilo: "#7a2117",
} as const;

const pisava =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Pisava znamke — ista kot na strani (Outfit, polkrepko).
 *
 * Gmail spletne pisave zavrže in vzame prvo iz rezerve; Apple Mail in
 * Outlook za Mac jo naložita. Zato napis ne stoji na pisavi, ampak na
 * geometriji: velike črke, polkrepko in ŠIROK razmik 0,2 em — tak, kot ga
 * ima napis v glavi strani. Prej je imel razmik NEGATIVEN in je bil isti
 * napis v pošti stisnjen, na strani pa razprt.
 */
const pisavaZnamke = `Outfit, ${pisava}`;

export type PodpisHise = {
  ime: string;
  /** Drobni napis pod imenom. Prazno pomeni, da ga ni. */
  podnapis?: string;
  naslov: string;
  telefon: string;
  spletnaStran: string;
  email?: string;
  /** Profila v nogi. Prazno polje pomeni, da povezave ni. */
  facebook?: string;
  instagram?: string;
};

export const PRIVZETA_HISA: PodpisHise = {
  ime: "Žan Meke",
  podnapis: "Spletne strani · Fotografija",
  naslov: "Sevnica, Posavje",
  telefon: "041 401 521",
  spletnaStran: "zanmeke.com",
  email: "info@zanmeke.com",
};

/**
 * Ovoj sporočila: glava z imenom hiše, vsebina, noga s kontaktom.
 *
 * `odjavaUrl` je OBVEZEN za vse, kar gre naročnikom novičnika — brez njega
 * pošta ni skladna z GDPR in konča v neželeni.
 */
export function PostniOvoj({
  predogled,
  hisa = PRIVZETA_HISA,
  odjavaUrl,
  razlog,
  children,
}: {
  /** Vrstica, ki jo odjemalec pokaže ob zadevi. */
  predogled: string;
  hisa?: PodpisHise;
  /**
   * Povezava za odjavo. Obvezna za vse, kar gre naročnikom novic.
   *
   * Pri sporočilih, ki so posledica gostovega dejanja (potrditev rezervacije,
   * odgovor na vprašanje), je NE dodajamo: odjava od novic tam ne pomeni nič
   * in gosta zavede, da bi si z njo odpovedal potrdilo o rezervaciji.
   */
  odjavaUrl?: string;
  /** Zakaj je gost to sporočilo dobil. Brez tega ugiba, kdo mu piše. */
  razlog?: string;
  children: ReactNode;
}) {
  // Ali je ob znamki kaj desno; po tem se odloči poravnava glave.
  const imaOmrezja = Boolean(hisa.facebook || hisa.instagram);

  return (
    <Html lang="sl">
      <Head>
        {/* Brez tega Apple Mail in Outlook sporočilo sama obrneta v temno
            različico: belo besedilo postavita na belo podlago in rdeč pas
            spremenita v blato. S tema dvema vrsticama povesta, da je
            sporočilo svetlo in naj ga pustita pri miru. */}
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        {/* Odjemalci, ki spletne pisave znajo (Apple Mail, Outlook za Mac),
            dobijo isto pisavo kot stran. Gmail jo zavrže in vzame sistemsko
            — zato napis stoji na razmiku in teži, ne na pisavi. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font --
            To ni stran, ampak predloga za e-pošto: `_document.js` tu ne
            obstaja in pravilo meri na nekaj drugega. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@600&display=swap"
        />
      </Head>
      <Preview>{predogled}</Preview>
      {/* Gmail za predogledno vrstico pripne še začetek sporočila — torej
          ime in podnapis znamke — in prejemnik v nabiralniku vidi znamko namesto
          tistega, kar mu povemo. Ti nevidni znaki napolnijo prostor do
          konca, zato se predogled konča tam, kjer ga končamo mi. */}
      <div
        style={{
          display: "none",
          overflow: "hidden",
          lineHeight: "1px",
          opacity: 0,
          maxHeight: 0,
          maxWidth: 0,
        }}
      >
        {"\u200c\u00a0".repeat(60)}
      </div>
      <Body
        style={{
          backgroundColor: barva.ozadje,
          fontFamily: pisava,
          margin: 0,
          padding: 0,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* ── GLAVA ──
            Barvni pas gre od roba do roba zaslona in ne samo čez kartico.
            Pošta brez glave je videti kot obvestilo sistema; pas čez vso
            širino pove, kdo piše, še preden gost prebere prvo besedo, in je
            hkrati edino mesto, kjer se vidi znamka, če odjemalec slik ne
            naloži.

            `Section` je pri react-emailu tabela s stoodstotno širino, zato
            stoji NAD kartico in ne v njej; ime hiše pa je poravnano na isti
            šeststopikovni stolpec kot vsebina pod njim. */}
        <Section style={{ backgroundColor: barva.poudarek }}>
          <Container
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              width: "100%",
              padding: "24px 28px",
            }}
          >
            <Row>
              {/* Levo napis, desno omrežji. Na ozkem zaslonu se stolpca
                  ne prelomita — zato sta napisa kratka in poravnana vsak
                  na svoj rob, tako kot v glavi strani. */}
              {/* BREZ OMREŽIJ JE ZNAMKA NA SREDINI.
                  Enake širine napisa in podnapisa se na gostilnici doseže z
                  razmikom med črkami: »Plus« ima štiri znake, »Od leta 1991«
                  dvanajst, in razmerje se da uloviti. Pri »ŽAN MEKE« in
                  »SPLETNE STRANI · FOTOGRAFIJA« (osem proti osemindvajsetim)
                  ta račun ne izide — podnapis bi moral imeti negativen
                  razmik. Sredinska poravnava je tu preprostejša in zdrži
                  vsako dolžino napisa. */}
              <Column
                style={{
                  verticalAlign: "middle",
                  textAlign: imaOmrezja ? "left" : "center",
                }}
              >
                {/* Napisa sta ENAKO ŠIROKA: tega ne naredi poravnava,
                    ampak razmik med črkami — podnapis je tretjino velikosti
                    napisa in ima nekoliko širši razmik. Negativni desni
                    odmik pobere sled za zadnjo črko, sicer bi bil napis
                    navidez zamaknjen v levo.

                    Oboje PRIDE IZ PODPISA HIŠE. Prej je bilo vžgano v kodo
                    (»Plus«, »Od leta 1991«) in se je iz gostilnice preneslo
                    na to stran — v Žanovi pošti je pisalo ime tuje hiše. */}
                <Text
                  style={{
                    margin: 0,
                    fontFamily: pisavaZnamke,
                    fontSize: "28px",
                    lineHeight: "30px",
                    fontWeight: 600,
                    letterSpacing: "5.6px",
                    // Negativni odmik pobere sled za zadnjo črko — potreben
                    // je samo pri levi poravnavi; na sredini bi napis
                    // zamaknil.
                    marginRight: imaOmrezja ? "-5.6px" : "0",
                    color: "#ffffff",
                    textTransform: "uppercase",
                  }}
                >
                  {hisa.ime}
                </Text>
                {hisa.podnapis ? (
                  <Text
                    style={{
                      margin: "6px 0 0",
                      fontFamily: pisavaZnamke,
                      fontSize: "9.5px",
                      lineHeight: "13px",
                      fontWeight: 600,
                      letterSpacing: "2.1px",
                      marginRight: imaOmrezja ? "-2.1px" : "0",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {hisa.podnapis}
                  </Text>
                ) : null}
              </Column>

              {/* Omrežji ob znamki, kadar sta vpisani. Kraj v podnapisu ne
                  stoji — napis bi raztegnil čez širino imena; naslov je v
                  nogi, kjer ga prejemnik tudi išče. */}
              {hisa.facebook || hisa.instagram ? (
                <Column style={{ verticalAlign: "middle", textAlign: "right" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      lineHeight: "18px",
                      letterSpacing: "0.4px",
                      color: "rgba(255,255,255,0.75)",
                    }}
                  >
                    {hisa.facebook ? (
                      <Link
                        href={hisa.facebook}
                        style={{
                          color: "rgba(255,255,255,0.88)",
                          textDecoration: "none",
                        }}
                      >
                        Facebook
                      </Link>
                    ) : null}
                    {hisa.facebook && hisa.instagram ? (
                      <span style={{ color: "rgba(255,255,255,0.45)" }}>{"  ·  "}</span>
                    ) : null}
                    {hisa.instagram ? (
                      <Link
                        href={hisa.instagram}
                        style={{
                          color: "rgba(255,255,255,0.88)",
                          textDecoration: "none",
                        }}
                      >
                        Instagram
                      </Link>
                    ) : null}
                  </Text>
                </Column>
              ) : null}
            </Row>
          </Container>
        </Section>

        <Container style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
          {/* ── VSEBINA ──
              Zgoraj brez zaobljenih vogalov: kartica se drži pasu nad sabo,
              zato med njima ni črte, ki bi ju razdvojila. */}
          <Section
            style={{
              backgroundColor: barva.papir,
              padding: "34px 28px 36px",
            }}
          >
            {children}
          </Section>

          {/* ── NOGA ──
              Trije bloki, ločeni z zrakom in ne z okvirji: kdo piše, kako
              ga dosežeš in zakaj si sporočilo dobil. Povezave do omrežij
              stojijo tu in ne v glavi — v glavi bi vlekle stran od tistega,
              zaradi česar je sporočilo prišlo. */}
          <Section
            style={{
              backgroundColor: barva.noga,
              padding: "24px 28px 26px",
              borderRadius: "0 0 12px 12px",
              borderTop: `1px solid ${barva.crta}`,
            }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: "11px",
                lineHeight: "16px",
                letterSpacing: "1.6px",
                textTransform: "uppercase",
                fontWeight: 700,
                color: barva.poudarek,
              }}
            >
              {hisa.ime}
            </Text>
            <Text
              style={{
                margin: "8px 0 0",
                fontSize: "14px",
                lineHeight: "22px",
                color: barva.priduseno,
              }}
            >
              {hisa.naslov}
            </Text>
            <Text
              style={{
                margin: "2px 0 0",
                fontSize: "14px",
                lineHeight: "22px",
                color: barva.priduseno,
              }}
            >
              <Link
                href={`tel:${hisa.telefon.replace(/\s/g, "")}`}
                style={{
                  color: barva.poudarek,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {hisa.telefon}
              </Link>
              {hisa.email ? (
                <>
                  <span style={{ color: barva.drobno }}>{"  ·  "}</span>
                  <Link
                    href={`mailto:${hisa.email}`}
                    style={{ color: barva.poudarek, textDecoration: "none" }}
                  >
                    {hisa.email}
                  </Link>
                </>
              ) : null}
            </Text>

            <Text
              style={{
                margin: "14px 0 0",
                fontSize: "14px",
                lineHeight: "22px",
                color: barva.priduseno,
              }}
            >
              <Link
                href={`https://www.${hisa.spletnaStran}`}
                style={{ color: barva.priduseno, textDecoration: "underline" }}
              >
                {hisa.spletnaStran}
              </Link>
              {/* Omrežji sta v glavi ob znamki; tu bi bili drugič na istem
                  zaslonu in noga je namenjena naslovu in kontaktu. */}
            </Text>

            {/* Zakaj je sporočilo prišlo. Pri novicah je zraven še odjava —
                privolitev mora biti enako lahko preklicati, kot jo je dati. */}
            {odjavaUrl || razlog ? (
              <>
                <Hr style={{ borderColor: barva.crta, margin: "18px 0 14px" }} />
                <Text
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    lineHeight: "19px",
                    color: barva.drobno,
                  }}
                >
                  {razlog ??
                    "To sporočilo prejemate, ker ste se prijavili na naše novice."}
                  {odjavaUrl ? (
                    <>
                      {" "}
                      <Link
                        href={odjavaUrl}
                        style={{ color: barva.drobno, textDecoration: "underline" }}
                      >
                        Odjava od novic
                      </Link>
                    </>
                  ) : null}
                </Text>
              </>
            ) : null}
          </Section>

          {/* Zrak pod kartico. Telo ga nima, ker bi sicer pas ne segel do
              robov zaslona. */}
          <Section style={{ height: "28px" }} />
        </Container>
      </Body>
    </Html>
  );
}

/** Naslov sporočila. */
export function Naslov({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        // Brez zgornjega odmika: naslov je prvi v telesu, odmik daje ovoj.
        margin: 0,
        fontSize: "26px",
        lineHeight: "33px",
        fontWeight: 700,
        letterSpacing: "-0.4px",
        color: barva.crnilo,
      }}
    >
      {children}
    </Text>
  );
}

/** Navaden odstavek. */
export function Odstavek({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        // 16 px in ne 15: pošto se bere na telefonu, kjer je 15 px že na
        // meji, Gmail na iOS pa besedilo pod 16 px sam poveča in s tem
        // podre postavitev.
        margin: "16px 0 0",
        fontSize: "16px",
        lineHeight: "26px",
        color: barva.crnilo,
      }}
    >
      {children}
    </Text>
  );
}

/** Drobni tisk pod vsebino. */
export function Drobno({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        margin: "22px 0 0",
        fontSize: "14px",
        lineHeight: "22px",
        color: barva.priduseno,
      }}
    >
      {children}
    </Text>
  );
}

/**
 * Gumb. Na sredini, ker je edino dejanje v sporočilu in ne sme biti videti
 * kot še ena povezava v besedilu.
 *
 * `<a>` s podlago in ne `<button>`: Outlook `padding` na povezavi spusti in
 * gumb se sesede v navadno besedilo, zato je razmik podvojen z `lineHeight`
 * in z višino celice. `align="center"` na tabeli poravna v vseh odjemalcih,
 * tudi v tistih, ki `text-align` na `<div>` spregledajo.
 */
export function Gumb({
  href,
  children,
  vrsta = "glavni",
}: {
  href: string;
  children: ReactNode;
  /** `stranski` je obrobljen: dejanje, ki ga večina ne bo potrebovala. */
  vrsta?: "glavni" | "stranski";
}) {
  const glavni = vrsta === "glavni";
  return (
    <Section style={{ margin: glavni ? "28px 0 0" : "12px 0 0", textAlign: "center" }}>
      <Link
        href={href}
        style={{
          backgroundColor: glavni ? barva.poudarek : "transparent",
          color: glavni ? "#ffffff" : barva.priduseno,
          border: glavni ? "none" : `1px solid ${barva.crta}`,
          fontSize: glavni ? "16px" : "14px",
          fontWeight: 600,
          textDecoration: "none",
          padding: glavni ? "15px 32px" : "11px 22px",
          borderRadius: "999px",
          display: "inline-block",
          lineHeight: "20px",
        }}
      >
        {children}
      </Link>
    </Section>
  );
}

/**
 * Podatki sporočila — dan, ura, oseb, oznaka.
 *
 * Prej je vsako sporočilo te vrstice risalo samo, kot niz odstavkov
 * »Dan: petek«. Sedem sporočil je imelo sedem svojih različic in nobena ni
 * bila poravnana — vrednosti so se začenjale vsaka na svojem mestu, ker je
 * oznaka pred njimi različno dolga.
 *
 * Tu je to tabela: oznake v levem stolpcu, vrednosti v desnem, med vrsticami
 * lasna črta. Bere se kot račun, kar tudi je — in to je tisto, kar gost v
 * potrdilu išče, preden prebere karkoli drugega.
 */
export function Podatki({
  vrstice,
  precrtano = false,
}: {
  vrstice: ReadonlyArray<[string, string]>;
  /** Odpovedana rezervacija: vrednosti so prečrtane, ne izbrisane. */
  precrtano?: boolean;
}) {
  return (
    <Section
      style={{
        margin: "26px 0 0",
        border: `1px solid ${barva.crta}`,
        borderRadius: "10px",
        backgroundColor: barva.noga,
      }}
    >
      {vrstice.map(([oznaka, vrednost], i) => (
        <Row key={oznaka}>
          <Column
            style={{
              width: "38%",
              padding: "12px 0 12px 16px",
              borderTop: i === 0 ? "none" : `1px solid ${barva.crta}`,
              verticalAlign: "top",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: "13px",
                lineHeight: "20px",
                color: barva.priduseno,
              }}
            >
              {oznaka}
            </Text>
          </Column>
          <Column
            style={{
              padding: "12px 16px 12px 0",
              borderTop: i === 0 ? "none" : `1px solid ${barva.crta}`,
              verticalAlign: "top",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: "15px",
                lineHeight: "20px",
                fontWeight: 600,
                color: barva.crnilo,
                textDecoration: precrtano ? "line-through" : "none",
              }}
            >
              {vrednost}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}

// ── Značka stanja ─────────────────────────────────────────────────────────

export type Stanje = "cakanje" | "potrjeno" | "preklicano" | "nevtralno";

const STANJE: Record<Stanje, { ploskev: string; crnilo: string }> = {
  cakanje: { ploskev: barva.cakanjePloskev, crnilo: barva.cakanjeCrnilo },
  potrjeno: { ploskev: barva.uspehPloskev, crnilo: barva.uspehCrnilo },
  preklicano: { ploskev: barva.napakaPloskev, crnilo: barva.napakaCrnilo },
  nevtralno: { ploskev: "#eceaea", crnilo: barva.priduseno },
};

/**
 * Značka nad naslovom — »POTRJENO«, »V OBDELAVI«, »ODPOVEDANO«.
 *
 * Gost dobi v enem tednu tri sporočila o isti rezervaciji in vsa se
 * začnejo enako. Naslov je stavek, ki ga je treba prebrati; značka je
 * podatek, ki ga vidi v pol sekunde — in v nabiralniku, kjer se odloča
 * med desetimi sporočili, je ta pol sekunde vse, kar imamo.
 *
 * Barva ni okras: zelena, jantarna in rdeča pomenijo isto kot povsod
 * drugod, zato je ni treba brati.
 */
export function Znacka({
  stanje = "nevtralno",
  children,
}: {
  stanje?: Stanje;
  children: ReactNode;
}) {
  const { ploskev, crnilo } = STANJE[stanje];
  return (
    <Section style={{ margin: "0 0 14px" }}>
      <Text
        style={{
          margin: 0,
          display: "inline-block",
          backgroundColor: ploskev,
          color: crnilo,
          fontSize: "11px",
          lineHeight: "16px",
          fontWeight: 700,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          padding: "6px 12px",
          borderRadius: "999px",
        }}
      >
        {children}
      </Text>
    </Section>
  );
}

// ── Izpostavljen podatek ──────────────────────────────────────────────────

/**
 * Ena številka, zaradi katere je sporočilo prišlo — ura prevzema, znesek.
 *
 * V tabeli podatkov je vsaka vrstica enako pomembna, v resnici pa ni: gost
 * odpre potrdilo o naročilu zaradi ENE stvari, in to je ura. Zato stoji nad
 * tabelo, velika, in je prvo, kar oko najde. Ostalo je pod njo, za tistega,
 * ki bere naprej.
 */
export function Poudarek({
  oznaka,
  vrednost,
  opomba,
}: {
  oznaka: string;
  vrednost: string;
  opomba?: string;
}) {
  return (
    <Section
      style={{
        margin: "26px 0 0",
        backgroundColor: barva.noga,
        border: `1px solid ${barva.crta}`,
        borderRadius: "10px",
        padding: "20px 22px",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontSize: "11px",
          lineHeight: "16px",
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          fontWeight: 700,
          color: barva.priduseno,
        }}
      >
        {oznaka}
      </Text>
      <Text
        style={{
          margin: "8px 0 0",
          fontSize: "34px",
          lineHeight: "40px",
          fontWeight: 700,
          letterSpacing: "-0.8px",
          color: barva.poudarek,
        }}
      >
        {vrednost}
      </Text>
      {opomba ? (
        <Text
          style={{
            margin: "4px 0 0",
            fontSize: "14px",
            lineHeight: "22px",
            color: barva.priduseno,
          }}
        >
          {opomba}
        </Text>
      ) : null}
    </Section>
  );
}

// ── Dnevi v tednu ─────────────────────────────────────────────────────────

export type DanZJedmi = {
  dan: string;
  jedi: string[];
  /**
   * Kako se reče postavki tega dne — »Malica« ali »Kosilo«. Številko doda
   * seznam sam, po mestu v njem.
   */
  vrsta?: string;
};

/**
 * Teden malic — vsak dan svoja vrstica, med njimi lasna črta.
 *
 * Prej je bil to niz krepkih naslovov in pik pod njimi, kar je na zaslonu
 * telefona ena sama sled besedila: pet dni je bilo videti kot en odstavek in
 * naročnik je moral iskati, kje se dan konča. Zdaj je dan oznaka v barvi
 * znamke, jedi pa stojijo pod njo v svojem polju — isti okvir kot pri
 * podatkih v potrdilih, da pošta ostane ena družina.
 *
 * Nad vsako jedjo stoji »Malica 1«, »Malica 2«. To je oznaka, po kateri gost
 * naroči po telefonu; ime jedi je predolgo, da bi ga kdo bral na glas.
 */
export function Dnevi({ dnevi }: { dnevi: readonly DanZJedmi[] }) {
  return (
    <Section
      style={{
        margin: "26px 0 0",
        border: `1px solid ${barva.crta}`,
        borderRadius: "10px",
        backgroundColor: barva.noga,
      }}
    >
      {dnevi.map((d, i) => (
        <Row key={d.dan}>
          <Column
            style={{
              padding: "14px 18px",
              borderTop: i === 0 ? "none" : `1px solid ${barva.crta}`,
            }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: "11px",
                lineHeight: "16px",
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                fontWeight: 700,
                color: barva.poudarek,
              }}
            >
              {d.dan}
            </Text>
            {d.jedi.length === 0 ? (
              <Text
                style={{
                  margin: "6px 0 0",
                  fontSize: "15px",
                  lineHeight: "23px",
                  color: barva.drobno,
                }}
              >
                Ta dan malic ni.
              </Text>
            ) : (
              d.jedi.map((jed, j) => (
                <Text
                  key={jed}
                  style={{
                    margin: "10px 0 0",
                    fontSize: "15px",
                    lineHeight: "23px",
                    color: barva.crnilo,
                    fontWeight: 600,
                  }}
                >
                  {/* Oznaka v drobnem nad imenom — dan ostane najmočnejši
                      zapis v vrstici, ime jedi drugi, oznaka tretji. */}
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      lineHeight: "16px",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: barva.drobno,
                    }}
                  >
                    {`${d.vrsta ?? "Malica"} ${j + 1}`}
                  </span>
                  {jed}
                </Text>
              ))
            )}
          </Column>
        </Row>
      ))}
    </Section>
  );
}
