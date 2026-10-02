import { Drobno, Naslov, Odstavek, PostniOvoj } from "./_components";

// ============================================================================
// emails/PovprasevanjePotrditev.tsx — potrdilo STRANKI
// ----------------------------------------------------------------------------
// Kratko nalašč. Človek je pravkar oddal obrazec in ne želi brati — želi
// vedeti dvoje: da je prišlo in kdaj dobi odgovor.
//
// Obljuba je ena sama in izpolnljiva: isti dan. Obljuba »v 24 urah«, ki se
// ne drži, je slabša od nobene.
// ============================================================================

export type PovprasevanjePotrditevProps = {
  ime: string;
  telefon: string;
};

export default function PovprasevanjePotrditev({
  ime,
  telefon,
}: PovprasevanjePotrditevProps) {
  return (
    <PostniOvoj
      predogled="Povpraševanje je prispelo"
      razlog="To sporočilo ste prejeli, ker ste oddali povpraševanje na zanmeke.com."
    >
      <Naslov>Hvala za sporočilo</Naslov>
      <Odstavek>
        Pozdravljeni, {ime}. Vaše povpraševanje je prišlo in oglasim se še danes.
      </Odstavek>
      <Odstavek>
        Če je nujno, pokličite na {telefon} — se oglasim, razen če sem pri stranki, takrat
        pokličem nazaj.
      </Odstavek>

      <Drobno>Na to sporočilo lahko odgovorite; pride naravnost k meni.</Drobno>
    </PostniOvoj>
  );
}

PovprasevanjePotrditev.PreviewProps = {
  ime: "Marko",
  telefon: "041 401 521",
} satisfies PovprasevanjePotrditevProps;
