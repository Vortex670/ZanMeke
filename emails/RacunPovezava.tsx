import { Drobno, Gumb, Naslov, Odstavek, Podatki, PostniOvoj } from "./_components";

// ============================================================================
// emails/RacunPovezava.tsx — račun ali predračun s povezavo za plačilo
// ----------------------------------------------------------------------------
// Gumb pelje na plačilno stran, kjer stranka plača s kartico. Pod njim stoji
// tudi IBAN — nekateri plačajo z nakazilom in za to ne smejo nikogar klicati.
//
// Znesek je v podatkih in ne v besedilu: je edina številka, ki jo prejemnik
// išče, in mora biti najti brez branja.
// ============================================================================

export type RacunPovezavaProps = {
  /** »Račun« ali »Predračun«. */
  vrsta: string;
  stevilka: string;
  stranka: string;
  opis: string;
  znesek: string;
  placilnaUrl: string;
  iban?: string;
  rok?: string;
};

export default function RacunPovezava({
  vrsta,
  stevilka,
  stranka,
  opis,
  znesek,
  placilnaUrl,
  iban,
  rok,
}: RacunPovezavaProps) {
  return (
    <PostniOvoj
      predogled={`${vrsta} ${stevilka} — ${znesek}`}
      razlog={`To sporočilo ste prejeli, ker je bil za vas izdan ${vrsta.toLowerCase()}.`}
    >
      <Naslov>
        {vrsta} {stevilka}
      </Naslov>
      <Odstavek>
        Pozdravljeni, {stranka}. Spodaj je povzetek in povezava za plačilo.
      </Odstavek>

      <Podatki
        vrstice={[
          ["Za", opis],
          ["Znesek", znesek],
          ...(rok ? ([["Rok plačila", rok]] as [string, string][]) : []),
        ]}
      />

      <Gumb href={placilnaUrl}>Plačaj s kartico</Gumb>

      {iban ? (
        <Drobno>
          Če vam je ljubše nakazilo: {iban}, sklic {stevilka}. Plačilo s kartico poteka
          pri Stripu — podatki o kartici ne gredo skozi mojo stran.
        </Drobno>
      ) : (
        <Drobno>
          Plačilo poteka pri Stripu — podatki o kartici ne gredo skozi mojo stran.
        </Drobno>
      )}
    </PostniOvoj>
  );
}

RacunPovezava.PreviewProps = {
  vrsta: "Račun",
  stevilka: "2026-001",
  stranka: "Gostilna Pri Treh Lipah",
  opis: "Spletna stran z malicami in naročanjem — prva polovica",
  znesek: "895,00 €",
  placilnaUrl: "https://zanmeke.com/racun/abc123",
  iban: "SI56 1910 0000 1234 567",
  rok: "15. oktober 2026",
} satisfies RacunPovezavaProps;
