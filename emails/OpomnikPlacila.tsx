import { Drobno, Gumb, Naslov, Odstavek, Poudarek, PostniOvoj } from "./_components";

// ============================================================================
// emails/OpomnikPlacila.tsx — račun je zapadel
// ----------------------------------------------------------------------------
// Ton je miren in brez očitka. Najpogostejši razlog za neplačan račun ni
// nepripravljenost, ampak to, da je pismo padlo med druga — in pismo, ki to
// predpostavlja, se plača hitreje od tistega, ki obtožuje.
//
// Znesek in rok sta izpostavljena, povezava pelje naravnost na plačilo.
// Vsak korak več med opomnikom in plačilom je en dan več.
// ============================================================================

export type OpomnikPlacilaProps = {
  stranka: string;
  stevilka: string;
  znesek: string;
  zapadlost: string;
  placilnaUrl: string;
  telefon: string;
};

export default function OpomnikPlacila({
  stranka,
  stevilka,
  znesek,
  zapadlost,
  placilnaUrl,
  telefon,
}: OpomnikPlacilaProps) {
  return (
    <PostniOvoj
      predogled={`Opomnik — račun ${stevilka}`}
      razlog="To sporočilo ste prejeli, ker je račun zapadel v plačilo."
    >
      <Naslov>Račun {stevilka}</Naslov>
      <Odstavek>
        Pozdravljeni, {stranka}. Spodnji račun je zapadel {zapadlost} — verjetno je
        pismo padlo med druga, zato pošiljam povezavo še enkrat.
      </Odstavek>

      <Poudarek oznaka="Za plačilo" vrednost={znesek} opomba={`Rok je bil ${zapadlost}`} />

      <Gumb href={placilnaUrl}>Plačaj zdaj</Gumb>

      <Drobno>
        Če je plačilo že odšlo, to pismo prezrite. Če je kaj narobe z računom,
        pokličite na {telefon} in uredimo.
      </Drobno>
    </PostniOvoj>
  );
}

OpomnikPlacila.PreviewProps = {
  stranka: "Gostilna Pri Treh Lipah",
  stevilka: "2026-001",
  znesek: "895,00 €",
  zapadlost: "15. oktobra",
  placilnaUrl: "https://zanmeke.com/racun/abc123",
  telefon: "041 401 521",
} satisfies OpomnikPlacilaProps;
