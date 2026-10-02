// ============================================================================
// <JsonLd /> — strukturirani podatki za iskalnike IN za jezikovne modele
// ----------------------------------------------------------------------------
// Doslej je bilo to vprašanje Googla. Odkar na »kdo mi v Posavju naredi
// spletno stran« odgovarja tudi jezikovni model, je vprašanje obojega: model
// povzame tisto, kar na strani najde zapisano nedvoumno. Ime, kraj, storitev,
// cena in odgovori na vprašanja so tu zapisani v obliki, ki je ni treba
// ugibati iz besedila.
//
// `dangerouslySetInnerHTML` je tu pravilna pot in ne bližnjica: vsebina je
// naš objekt, pretvorjen z `JSON.stringify`, nikoli vnos obiskovalca. Znak
// `<` zapremo, da niza ni mogoče predčasno zapreti.
// ============================================================================

export function JsonLd({ podatki }: { podatki: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(podatki).replace(/</g, "\\u003c"),
      }}
    />
  );
}
