import { Drobno, Gumb, Naslov, Odstavek, PostniOvoj } from "./_components";

// ============================================================================
// emails/GesloPonastavitev.tsx — povezava za novo geslo
// ----------------------------------------------------------------------------
// Povezava velja kratko in samo enkrat. Pošta ostane v predalu, predal pa je
// pogosto odprt tudi na tujem računalniku.
//
// Sporočilo pove tudi, kaj naj stori, kdor ponastavitve NI zahteval — takrat
// nekdo pozna naslov in poskuša vstopiti.
// ============================================================================

export type GesloPonastavitevProps = {
  ime: string;
  ponastavitevUrl: string;
  /** Koliko časa velja povezava — »60 minut«. */
  veljavnost: string;
};

export default function GesloPonastavitev({
  ime,
  ponastavitevUrl,
  veljavnost,
}: GesloPonastavitevProps) {
  return (
    <PostniOvoj
      predogled="Povezava za novo geslo"
      razlog="To sporočilo ste prejeli, ker je nekdo zahteval ponastavitev gesla."
    >
      <Naslov>Novo geslo</Naslov>
      <Odstavek>
        Pozdravljeni, {ime}. S spodnjo povezavo nastavite novo geslo za administracijo.
      </Odstavek>

      <Gumb href={ponastavitevUrl}>Nastavi novo geslo</Gumb>

      <Drobno>
        Povezava velja {veljavnost} in samo enkrat. Če ponastavitve niste zahtevali, je ne
        odpirajte — geslo ostane nespremenjeno.
      </Drobno>
    </PostniOvoj>
  );
}

GesloPonastavitev.PreviewProps = {
  ime: "Žan",
  ponastavitevUrl: "https://zanmeke.com/prijava/geslo/abc123",
  veljavnost: "60 minut",
} satisfies GesloPonastavitevProps;
