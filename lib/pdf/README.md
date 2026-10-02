# `lib/pdf/` — oblikovni sistem za PDF dokumente

En videz za vse dokumente, ki jih projekt izda: račun, potrdilo o nakupu, predračun, dobropis,
ponudba, DMCA zahtevek. Knjižnica je `@react-pdf/renderer` (standard §13 — brez Chromiuma na
Vercelu), pisavi Inter + JetBrains Mono iz `lib/invoice/fonts/`, podpis Great Vibes iz
`public/fonts/`.

**second-home.hr to mapo kopira 1:1.** Vse, kar je specifično za projekt, je zunaj nje:
napisi v `labels`, pravna besedila v dokumentu (`lib/invoice/pdf.tsx`), fiskalni podatki v
`footer.fiscal`. V `lib/pdf/` se ne sme pojaviti nič, kar velja samo za eno stran.

## Datoteke

| Datoteka         | Vsebina                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| `theme.ts`       | A4 stran in robovi, φ razmiki, tipografska lestvica, paleta, `registerPdfFonts()` |
| `components.tsx` | komponente dokumenta (`PdfDocument`, `PdfTable`, `PdfTotals` …)                   |
| `format.ts`      | zneski, datumi, števila, DDV, IBAN (sl-SI privzeto, locale je parameter)          |
| `labels.sl.ts`   | privzeti slovenski napisi + tip `PdfLabels`                                       |

Dokumenti sami živijo pri svoji domeni: `lib/invoice/pdf.tsx` (račun/predračun/dobropis/ponudba),
`lib/dmca/pdf.tsx`. Te datoteke samo preslikajo podatke v komponente — v njih ni `StyleSheet`
razen za par res dokumentnih posebnosti (npr. tabela dokazov o prenosu v DMCA).

## Anatomija dokumenta

```
┌ tekoča glava (fixed, na vsaki strani) ──────────────────────────────┐
│ izdajatelj + slogan            vrsta dokumenta · številka (mono)    │
├─────────────────────────────────────────────────────────────────────┤
│ PdfTitle      žig · naslov (h1) · številka   |  status · znesek     │
│ PdfParties    izdajatelj            |  prejemnik                     │
│ PdfMeta       datum izdaje · rok · plačano · sklic                   │
│ PdfTable      opis · količina · enota · cena · popust · DDV · skupaj │
│ PdfTotals     neto · popusti · DDV po stopnjah ║ SKUPAJ ║ plačano    │
│ PdfNote       klavzula DDV / licenca / veljavnost                    │
│ PdfPaymentBlock  način · IBAN · sklic · znesek       [ QR ≥ 30 mm ]  │
│ PdfSignature  (pravni dokumenti)                                     │
├ tekoča noga (fixed, na vsaki strani) ───────────────────────────────┤
│ pravna vrstica     IBAN     Stran X od Y       (+ fiskalna vrstica)  │
└─────────────────────────────────────────────────────────────────────┘
```

Vrstni red je vedno isti; odsek, za katerega ni podatka, se ne izriše (nič praznih okvirjev).

### Komponente

- **`PdfDocument`** — `Document` + `Page` (A4), tekoča glava in noga, metapodatki PDF-ja.
  `header: { issuer, tagline?, docType, docNumber }`, `footer: { legal, iban?, fiscal? }`,
  `labels?`.
- **`PdfTitle`** — naslovni blok prve strani: `docType`, `docNumber`, `status?`, `amount?`,
  `amountLabel?`, `stamp?`.
- **`PdfSection`** — `title?`, `eyebrow?`, `number?` (oštevilčeni pravni odseki), `wrap`.
- **`PdfParties`** — `issuer` in `recipient` tipa `PdfParty`
  (`name`, `lines[]`, `taxNumber`, `vatId`, `iban`, `bic`, `register`, `extra[]`).
- **`PdfMeta`** — `items: PdfMetaItem[]` (`label`, `value`, `mono?`, `strong?`); pas s črto zgoraj
  in spodaj, stolpci enake širine.
- **`PdfTable`** — `rows: PdfTableRow[]`, `columns?: PdfTableColumn[]`
  (`description | quantity | unit | unitPrice | discount | vat | total`), `zebra?`, `labels?`.
  Glava tabele je `fixed` (ponovi se na vsaki strani tabele), vrstice `wrap={false}`.
- **`PdfTotals`** — `rows?` (neto, popusti, DDV po stopnjah), `total` (glavna vrstica),
  `after?` (že plačano, preostane, za vračilo). Cel blok je `wrap={false}`.
- **`PdfPaymentBlock`** — `lines[]`, `qr?: { image, caption?, size? }`, `note?`.
- **`PdfNote`** — `title?`, `variant: "panel" | "outline" | "plain"`; otrok je niz ali `<Text>`
  (za poudarke uporabi `pdfStrongStyle`, za besedilo `pdfNoteTextStyle`).
- **`PdfSignature`** — `name`, `prefix?` (`/s/`), `meta?`, `label?` (`null` = brez oznake).
  Rokopisna pisava, če je `public/fonts/great-vibes.ttf` na voljo, sicer Inter.
- **`PdfStamp`** — `text`, `variant: "outline" | "solid"`. PLAČANO je `solid`, ostali `outline`.
- **`PdfFieldGrid`** — mreža parov oznaka/vrednost za pravne in tehnične dokumente.

Vse vrednosti, ki gredo v komponente, so **že oblikovani nizi** — številke skozi `format.ts`,
nikoli surove `number` vrednosti.

## Pravila

1. **Ena barva črnila.** `color.ink` za vsebino, `color.muted` za drugotno, `color.subtle` za nogo,
   `color.rule` za črte, `color.surface` za zebro in panele. Nobene druge barve — tudi ne rdeče za
   opozorila; poudarek se doseže s težo, velikostjo in žigom.
2. **Številke so mono in desno poravnane.** Vsi stolpci razen opisa, vsi zneski, sklici, IBAN,
   datumi v tehničnih tabelah. Besedilo je Inter, številke JetBrains Mono.
3. **Denar in datumi samo iz `format.ts`.** `formatMoney` (nedeljivi presledek pred €),
   `formatMoneySigned` (pravi minus U+2212 za dobropis), `formatDate` (`11. 9. 2026`),
   `formatIban` (skupine po 4), `formatVatRate`, `formatQuantity`.
4. **QR najmanj 30 mm** (`qr.minSize = 85 pt`). `PdfPaymentBlock` manjše vrednosti ignorira.
   Mobilne banke manjših kod ne preberejo zanesljivo.
5. **Prelomi strani.** Vrstica tabele, blok seštevkov, stranki, meta pas, plačilo, opomba in podpis
   so `wrap={false}` — nikoli razpolovljeni. Glava tabele se ponovi na vsaki strani tabele.
6. **Brez deljenja besed.** `Font.registerHyphenationCallback` vrne besedo nespremenjeno —
   slovenščina nima vgrajenih pravil deljenja in vezaji sredi besed bi bili napačni.
7. **Razmiki samo iz `space`** (φ lestvica 5 · 8 · 13 · 21 · 34 pt), velikosti samo iz `type`.
   Nobenih ročnih vrednosti v dokumentih.
8. **Vsi vidni nizi pridejo iz `labels`** ali iz props. V `components.tsx` ni trdo kodiranega
   besedila.

### Pasti `@react-pdf/renderer` 4.5 (drago plačane)

- **`lineHeight` se ne sme pojaviti v tekoči nogi** — ne na `Page` (deduje se) ne na besedilu v
  nogi. Absolutno pozicionirana `fixed` noga se v tem primeru sploh ne izriše, brez napake.
  Zato `s.page` nima `lineHeight`; višino vrstice nastavljamo na posameznih slogih besedila.
- `Font.register` mora teči **enkrat na proces** — `registerPdfFonts()` je zaščiten z `globalThis`.
- Pisave morajo biti TTF; PDFKit ne podpira WOFF/WOFF2. Inter in JetBrains Mono imata Latin
  Extended-A, torej č/š/ž delajo. Privzeta Helvetica jih NIMA.
- `Image src` sprejme `Buffer`; TypeScript tipi zahtevajo `as unknown as string`.

## Kako second-home doda fiskalne podatke (HR)

1. Kopiraj `lib/pdf/` v SH nespremenjeno.
2. Naredi `lib/pdf/labels.hr.ts` (in `labels.de.ts`, `labels.en.ts`) po vzoru `labels.sl.ts` —
   isti ključi, prevedene vrednosti — in ga podaj komponentam prek `labels`. Javna stran je 100 %
   prevedena, zato se dokument izriše v jeziku gosta.
3. **JIR / ZKI**: podaj `footer.fiscal`, npr.
   `` `JIR: ${jir} · ZKI: ${zki} · ${formatDateTime(fiscalizedAt)}` `` — izriše se kot mono vrstica
   nad pravno vrstico noge, na vsaki strani. Če fiskalizacija še ni uspela, pusti `null`.
4. **OIB in poslovni prostor/naplatni uređaj** gresta v `PdfParty.extra`:
   `extra: [{ label: "OIB", value: oib }, { label: "Poslovni prostor", value: "POSL1/1" }]`.
5. **HUB-3 / PDF417** (`bwip-js`) in **EPC QR** (`qrcode`): obe sta samo slika v
   `PdfPaymentBlock` — `qr={{ image: epcQrPng, caption: labels.qrCaption }}` za kvadratni EPC,
   `qr={{ image: pdf417Png, size: 180, height: 56 }}` za PDF417. Najmanjša stranica 30 mm velja
   samo za kvadratne kode; ko podaš `height`, se ta upošteva takšna, kot je.
6. Stopnje DDV po postavkah: uporabi stolpec `vat` v `PdfTable` in razčlenitev v `PdfTotals.rows`
   (ena vrstica na stopnjo, `muted: true`).
7. Ničesar drugega ne spreminjaj. Če SH potrebuje novo komponento, gre ta v `lib/pdf/` na obeh
   straneh hkrati — ne v en projekt.

## Kaj je v second-home drugače

Mapa je kopija `zan-meke/lib/pdf/`; `components.tsx` in `theme.ts` sta **enaka bajt za bajt**.
Razlike so samo tri in vse so predvidene zgoraj:

| Datoteka       | Razlika                                                                             |
| -------------- | ----------------------------------------------------------------------------------- |
| `format.ts`    | `locale` je jezik gosta (`hr`/`sl`/`de`/`en`); denar gre skozi `Intl.NumberFormat`, |
|                | datumi se računajo v `Europe/Zagreb`. Imena funkcij so nespremenjena.               |
| `labels.ts`    | vsi štirje jeziki + `pdfLabels(locale)`; ključi so isti kot v ZM `labels.sl.ts`.    |
| `labels.sl.ts` | samo `export { pdfLabelsSl, type PdfLabels } from "./labels"` — da ostane           |
|                | `components.tsx` identičen ZM različici (ta uvaža `./labels.sl`).                   |

Fiskalni podatki (JIR · ZKI · operater · način plaćanja) gredo v `footer.fiscal`, OIB obeh strank
v `PdfParty.extra`, HUB-3 PDF417 v `PdfPaymentBlock` `qr` z eksplicitno `height`. Dokument je
`lib/invoice/pdf.tsx` (`generateInvoicePdf`), podatki zanj pa `lib/invoice/document-data.ts` —
isti vir kot admin HTML predogled, zato sta predogled in PDF vsebinsko enaka.
