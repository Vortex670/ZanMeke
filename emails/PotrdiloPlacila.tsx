import { Drobno, Naslov, Odstavek, Podatki, PostniOvoj, Znacka } from "./_components";

// ============================================================================
// emails/PotrdiloPlacila.tsx — denar je prišel
// ----------------------------------------------------------------------------
// Potrdilo pošljem sam, čeprav ga pošlje tudi Stripe: njegovo je v angleščini
// in z njihovo znamko, in stranka ga pogosto ne poveže z menoj.
//
// Pove tudi, KAJ SLEDI. Potrdilo brez naslednjega koraka pusti stranko v
// čakanju, in naslednji stik je potem njen klic z vprašanjem »kdaj začneva«.
// ============================================================================

export type PotrdiloPlacilaProps = {
  stranka: string;
  stevilka: string;
  znesek: string;
  datum: string;
  naslednjiKorak: string;
};

export default function PotrdiloPlacila({
  stranka,
  stevilka,
  znesek,
  datum,
  naslednjiKorak,
}: PotrdiloPlacilaProps) {
  return (
    <PostniOvoj
      predogled={`Plačilo prejeto — ${znesek}`}
      razlog="To sporočilo ste prejeli, ker je bilo plačilo računa zabeleženo."
    >
      <Naslov>Plačilo je prejeto</Naslov>
      <Znacka stanje="potrjeno">Plačano</Znacka>

      <Odstavek>Hvala, {stranka}. Spodaj je potrdilo za vaše knjigovodstvo.</Odstavek>

      <Podatki
        vrstice={[
          ["Račun", stevilka],
          ["Znesek", znesek],
          ["Plačano", datum],
        ]}
      />

      <Odstavek>{naslednjiKorak}</Odstavek>

      <Drobno>
        Za vprašanja odgovorite na to sporočilo — pride naravnost k meni.
      </Drobno>
    </PostniOvoj>
  );
}

PotrdiloPlacila.PreviewProps = {
  stranka: "Gostilna Pri Treh Lipah",
  stevilka: "2026-001",
  znesek: "895,00 €",
  datum: "3. oktober 2026",
  naslednjiKorak:
    "Jutri se oglasim po fotografije in vsebino; stran bo živa v tednu dni.",
} satisfies PotrdiloPlacilaProps;
