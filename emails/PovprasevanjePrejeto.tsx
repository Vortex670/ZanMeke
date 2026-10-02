import { Drobno, Naslov, Odstavek, Podatki, PostniOvoj } from "./_components";

// ============================================================================
// emails/PovprasevanjePrejeto.tsx — novo povpraševanje, MENI
// ----------------------------------------------------------------------------
// Edina pošta, ki pomeni delo. Zato nosi vse, kar je treba vedeti pred
// klicem, in nič drugega: ime, hišo, telefon in kaj človek sploh potrebuje.
//
// Telefonska številka je v podatkih in ne v besedilu — v predalu na telefonu
// je tako klikljiva in klic je en dotik stran.
//
// `Reply-To` je naslov stranke (nastavi ga `lib/kontakt/actions.ts`), zato
// odgovor iz predala pristane pri njej in ne pri meni.
// ============================================================================

export type PovprasevanjePrejetoProps = {
  ime: string;
  podjetje?: string;
  telefon: string;
  epota?: string;
  zanimanje: string;
  sporocilo: string;
};

export default function PovprasevanjePrejeto({
  ime,
  podjetje,
  telefon,
  epota,
  zanimanje,
  sporocilo,
}: PovprasevanjePrejetoProps) {
  return (
    <PostniOvoj
      predogled={`Povpraševanje — ${ime}${podjetje ? `, ${podjetje}` : ""}`}
      razlog="To sporočilo je oddal obiskovalec prek obrazca na zanmeke.com."
    >
      <Naslov>Novo povpraševanje</Naslov>

      <Podatki
        vrstice={[
          ["Ime", ime],
          ...(podjetje ? ([["Hiša", podjetje]] as [string, string][]) : []),
          ["Telefon", telefon],
          ...(epota ? ([["E-pošta", epota]] as [string, string][]) : []),
          ["Zanima ga", zanimanje],
        ]}
      />

      <Odstavek>{sporocilo}</Odstavek>

      <Drobno>
        Odgovor na to sporočilo gre naravnost stranki. Povpraševanje je shranjeno v
        administraciji tudi, če ta pošta ne bi prišla skozi.
      </Drobno>
    </PostniOvoj>
  );
}

PovprasevanjePrejeto.PreviewProps = {
  ime: "Marko Novak",
  podjetje: "Gostilna Pri Treh Lipah",
  telefon: "041 234 567",
  epota: "marko@trilipe.si",
  zanimanje: "Spletna stran",
  sporocilo:
    "Vsak dan dvajset klicev za malico. Zanima me, koliko bi stala stran z jedilnikom in malicami.",
} satisfies PovprasevanjePrejetoProps;
