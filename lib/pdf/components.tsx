import { Document, Image as PdfImage, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import * as React from "react";

import { type PdfLabels, pdfLabelsSl } from "./labels.sl";
import {
  color,
  font,
  hasScriptFont,
  leading,
  page,
  qr as qrToken,
  registerPdfFonts,
  space,
  tracking,
  type as typeScale,
} from "./theme";

// ============================================================================
// Skupne PDF komponente — en videz za vse dokumente (račun, predračun,
// dobropis, ponudba, DMCA …). second-home.hr kopira to mapo 1:1: spremeni
// samo `labels` (prevodi) in doda fiskalne podatke prek `footer.fiscal`.
// ----------------------------------------------------------------------------
// Pravila (glej README.md):
//   • ena barva črnila (`color.ink`), sivine samo za drugoten pomen;
//   • vse številke so mono in desno poravnane;
//   • QR/2D koda nikoli manjša od `qr.minSize` (30 mm);
//   • seštevki in podpis se ne smejo prelomiti čez stran (`wrap={false}`);
//   • vsi vidni nizi pridejo iz `labels` ali iz props — nič trdo kodiranega.
// ============================================================================

// ----------------------------------------------------------------------------
// Tipi
// ----------------------------------------------------------------------------

/** Ena stranka na dokumentu (izdajatelj ali prejemnik). */
export type PdfParty = {
  name: string;
  /** Naslov, e-pošta, telefon … — vsaka vrstica svoj niz. */
  lines?: Array<string | null | undefined>;
  taxNumber?: string | null;
  vatId?: string | null;
  /** Že oblikovan IBAN (`formatIban`). */
  iban?: string | null;
  bic?: string | null;
  register?: string | null;
  /** Dodatne mono vrstice (SH: OIB, fiskalni podatki …). */
  extra?: Array<{ label: string; value: string }>;
};

/** En podatek v meta pasu (datum, sklic, način plačila …). */
export type PdfMetaItem = {
  label: string;
  value: string;
  /** Mono pisava — za sklice, kode in številke. */
  mono?: boolean;
  /** Poudarjeno (npr. datum plačila na plačanem računu). */
  strong?: boolean;
};

/** Stolpci tabele postavk; vrstni red v `columns` določa vrstni red na strani. */
export type PdfTableColumn =
  | "description"
  | "quantity"
  | "unit"
  | "unitPrice"
  | "discount"
  | "vat"
  | "total";

/** Vrstica tabele — vse vrednosti so ŽE oblikovani nizi (glej `format.ts`). */
export type PdfTableRow = {
  description: string;
  /** Druga, siva vrstica pod opisom (podnaslov, licenca, obdobje …). */
  meta?: string | null;
  quantity?: string | null;
  unit?: string | null;
  unitPrice?: string | null;
  discount?: string | null;
  vat?: string | null;
  total: string;
};

/** Vrstica v bloku seštevkov. */
export type PdfTotalsRow = {
  label: string;
  value: string;
  /** Manj pomembna vrstica (popust, razčlenitev DDV). */
  muted?: boolean;
};

export type PdfQr = {
  /** PNG Buffer (ali data URL) — react-pdf sprejme oboje. */
  image: Buffer | string;
  caption?: string | null;
  /** Širina v pt; nikoli manj od `qr.minSize` (30 mm). Kvadratna koda = tudi višina. */
  size?: number;
  /**
   * Eksplicitna višina v pt — samo za nekvadratne 2D kode (HUB-3 PDF417 na SH).
   * Ne velja zanjo najmanjša stranica 30 mm, ki je pravilo za kvadratne kode.
   */
  height?: number;
};

const DEFAULT_COLUMNS: PdfTableColumn[] = ["description", "quantity", "unitPrice", "total"];

/** Razmerja širin stolpcev — opis dobi ves preostanek. */
const COLUMN_FLEX: Record<PdfTableColumn, number> = {
  description: 4.6,
  quantity: 1,
  unit: 0.9,
  unitPrice: 1.7,
  discount: 1.1,
  vat: 0.9,
  total: 1.8,
};

// ----------------------------------------------------------------------------
// Slogi
// ----------------------------------------------------------------------------

const s = StyleSheet.create({
  page: {
    paddingTop: page.marginTop,
    paddingBottom: page.marginBottom,
    paddingHorizontal: page.marginX,
    fontFamily: font.sans,
    fontSize: typeScale.body,
    color: color.ink,
    backgroundColor: color.paper,
    // POZOR: `lineHeight` NE sme biti na Page — react-pdf 4.5 potem ne izriše
    // absolutno pozicionirane tekoče noge. Višino vrstice nastavljamo na
    // posameznih slogih besedila.
  },

  // ---- tekoča glava ----
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 0.5,
    borderBottomColor: color.rule,
    paddingBottom: space.s2,
    marginBottom: space.s4,
  },
  headerIssuer: { fontSize: typeScale.h3, fontWeight: 600, letterSpacing: tracking.heading },
  headerTagline: { fontSize: typeScale.small, color: color.muted, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  headerDocType: {
    fontSize: typeScale.eyebrow,
    color: color.muted,
    textTransform: "uppercase",
    letterSpacing: tracking.eyebrow,
    fontWeight: 500,
  },
  headerDocNumber: {
    fontFamily: font.mono,
    fontSize: typeScale.mono,
    color: color.ink,
    marginTop: 3,
  },

  // ---- naslovni blok ----
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: space.s4,
  },
  titleLeft: { flex: 1, paddingRight: space.s4 },
  title: {
    fontSize: typeScale.h1,
    fontWeight: 600,
    letterSpacing: tracking.heading,
    lineHeight: leading.heading,
  },
  titleNumber: {
    fontFamily: font.mono,
    fontSize: typeScale.mono,
    color: color.muted,
    marginTop: space.s1,
  },
  titleRight: { alignItems: "flex-end" },
  titleStatus: {
    fontSize: typeScale.small,
    color: color.muted,
    marginBottom: 3,
    lineHeight: leading.tight,
  },
  titleAmountLabel: {
    fontSize: typeScale.eyebrow,
    color: color.muted,
    textTransform: "uppercase",
    letterSpacing: tracking.eyebrow,
    fontWeight: 500,
    marginBottom: 3,
  },
  titleAmount: {
    fontFamily: font.mono,
    fontSize: typeScale.monoLarge,
    fontWeight: 500,
    letterSpacing: tracking.number,
    // Edina velika barvna stvar na listini. Oko išče znesek — in ko ga najde
    // v barvi znamke, se listina poveže z izdajateljem brez logotipa.
    color: color.accent,
  },

  // ---- odsek ----
  section: { marginBottom: space.s4 },
  sectionHead: { flexDirection: "row", alignItems: "center", marginBottom: space.s2 },
  sectionNumber: {
    fontFamily: font.mono,
    fontSize: typeScale.eyebrow,
    color: color.subtle,
    width: 16,
  },
  sectionEyebrow: {
    fontSize: typeScale.eyebrow,
    color: color.muted,
    textTransform: "uppercase",
    letterSpacing: tracking.eyebrow,
    fontWeight: 500,
    marginBottom: space.s1,
  },
  sectionTitle: { fontSize: typeScale.h3, fontWeight: 600, letterSpacing: tracking.heading },

  // ---- stranki ----
  parties: { flexDirection: "row", marginBottom: space.s3 },
  party: { flex: 1 },
  partyGap: { width: space.s5 },
  partyName: {
    fontSize: typeScale.h3,
    fontWeight: 600,
    letterSpacing: tracking.heading,
    marginTop: space.s1,
    marginBottom: 3,
  },
  partyLine: { fontSize: typeScale.small, color: color.muted, lineHeight: leading.tight },
  partyMono: {
    fontFamily: font.mono,
    fontSize: typeScale.small,
    color: color.muted,
    lineHeight: leading.tight,
  },

  // ---- meta pas ----
  meta: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: color.rule,
    borderBottomWidth: 0.5,
    borderBottomColor: color.rule,
    paddingVertical: space.s2,
    marginBottom: space.s3,
  },
  metaItem: { flex: 1, paddingRight: space.s3 },
  metaLabel: {
    fontSize: typeScale.eyebrow,
    color: color.muted,
    textTransform: "uppercase",
    letterSpacing: tracking.eyebrow,
    fontWeight: 500,
    marginBottom: 3,
  },
  metaValue: { fontSize: typeScale.body, color: color.ink, lineHeight: leading.tight },
  metaValueMono: { fontFamily: font.mono, fontSize: typeScale.mono, color: color.ink },
  metaValueStrong: { fontWeight: 600 },

  // ---- tabela ----
  table: { marginBottom: space.s3 },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: color.ink,
    paddingBottom: space.s1,
  },
  tableHeadCell: {
    fontSize: typeScale.eyebrow,
    color: color.muted,
    textTransform: "uppercase",
    letterSpacing: tracking.eyebrow,
    fontWeight: 500,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: space.s2,
    borderBottomWidth: 0.5,
    borderBottomColor: color.rule,
  },
  tableRowZebra: { backgroundColor: color.surface },
  cellText: { fontSize: typeScale.body, color: color.ink, lineHeight: leading.tight },
  cellMeta: {
    fontSize: typeScale.small,
    color: color.muted,
    lineHeight: leading.tight,
    marginTop: 2,
  },
  cellMono: {
    fontFamily: font.mono,
    fontSize: typeScale.mono,
    color: color.ink,
    textAlign: "right",
  },
  cellRight: { textAlign: "right" },
  padLeft: { paddingLeft: space.s2 },
  padRight: { paddingRight: space.s2 },

  // ---- seštevki ----
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginBottom: space.s3 },
  totals: { width: 248 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingVertical: 3,
  },
  totalsLabel: { fontSize: typeScale.body, color: color.muted },
  totalsLabelMuted: { fontSize: typeScale.small, color: color.subtle },
  totalsValue: { fontFamily: font.mono, fontSize: typeScale.mono, color: color.ink },
  totalsValueMuted: { fontFamily: font.mono, fontSize: typeScale.small, color: color.muted },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderTopWidth: 1,
    borderTopColor: color.accent,
    marginTop: space.s1,
    paddingTop: space.s2,
  },
  grandLabel: {
    fontSize: typeScale.h3,
    fontWeight: 600,
    letterSpacing: tracking.heading,
  },
  grandValue: {
    fontFamily: font.mono,
    fontSize: typeScale.monoLarge,
    fontWeight: 500,
    letterSpacing: tracking.number,
    color: color.accent,
  },
  afterRule: {
    borderTopWidth: 0.5,
    borderTopColor: color.rule,
    marginTop: space.s2,
    paddingTop: space.s2,
  },

  // ---- plačilo ----
  payment: { flexDirection: "row", alignItems: "flex-start", marginBottom: space.s3 },
  paymentLines: { flex: 1, paddingRight: space.s4 },
  paymentRow: { flexDirection: "row", marginBottom: 2 },
  paymentLabel: {
    fontSize: typeScale.small,
    color: color.muted,
    width: 104,
    lineHeight: leading.tight,
  },
  paymentValue: { flex: 1, fontSize: typeScale.body, color: color.ink, lineHeight: leading.tight },
  paymentValueMono: { flex: 1, fontFamily: font.mono, fontSize: typeScale.mono, color: color.ink },
  qrBlock: { alignItems: "center" },
  qrCaption: {
    fontSize: typeScale.eyebrow,
    color: color.muted,
    textAlign: "center",
    marginTop: space.s1,
    maxWidth: 130,
    lineHeight: leading.tight,
  },

  // ---- opomba ----
  note: { marginBottom: space.s2 },
  notePanel: {
    backgroundColor: color.surface,
    borderLeftWidth: 2,
    borderLeftColor: color.ink,
    paddingVertical: space.s1,
    paddingHorizontal: space.s3,
  },
  noteOutline: {
    borderWidth: 0.5,
    borderColor: color.rule,
    paddingVertical: space.s1,
    paddingHorizontal: space.s3,
  },
  noteTitle: {
    fontSize: typeScale.eyebrow,
    color: color.ink,
    textTransform: "uppercase",
    letterSpacing: tracking.eyebrow,
    fontWeight: 600,
    marginBottom: space.s1,
  },
  noteBody: { fontSize: typeScale.small, color: color.muted, lineHeight: leading.body },

  // ---- podpis ----
  signature: {
    borderWidth: 0.5,
    borderColor: color.rule,
    paddingVertical: space.s3,
    paddingHorizontal: space.s3,
    marginBottom: space.s3,
  },
  signatureLabel: {
    fontSize: typeScale.eyebrow,
    color: color.muted,
    textTransform: "uppercase",
    letterSpacing: tracking.eyebrow,
    fontWeight: 500,
    marginBottom: space.s2,
  },
  signatureRow: { flexDirection: "row", alignItems: "flex-end" },
  signaturePrefix: {
    fontFamily: font.mono,
    fontSize: typeScale.mono,
    color: color.muted,
    marginRight: space.s2,
    marginBottom: 3,
  },
  signatureScript: { fontFamily: font.script, fontSize: 26, color: color.ink, lineHeight: 1 },
  signaturePlain: { fontSize: typeScale.h2, fontWeight: 500, color: color.ink },
  signatureMeta: { fontSize: typeScale.small, color: color.muted, marginTop: space.s2 },

  // ---- žig ----
  stampSolid: {
    alignSelf: "flex-start",
    backgroundColor: color.accent,
    color: color.paper,
    fontSize: typeScale.eyebrow,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: tracking.eyebrow,
    paddingVertical: 3,
    paddingHorizontal: space.s2,
  },
  stampOutline: {
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderColor: color.ink,
    color: color.ink,
    fontSize: typeScale.eyebrow,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: tracking.eyebrow,
    paddingVertical: 3,
    paddingHorizontal: space.s2,
  },

  // ---- tekoča noga ----
  footer: {
    position: "absolute",
    bottom: 26,
    left: page.marginX,
    right: page.marginX,
    borderTopWidth: 0.5,
    borderTopColor: color.rule,
    paddingTop: space.s2,
  },
  footerFiscal: {
    fontFamily: font.mono,
    fontSize: typeScale.eyebrow,
    color: color.muted,
    marginBottom: 3,
  },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  // POZOR: nobenega `lineHeight` v nogi — react-pdf 4.5 pri absolutno
  // pozicionirani `fixed` nogi z nastavljeno višino vrstice ne izriše ničesar.
  footerText: { fontSize: typeScale.eyebrow, color: color.subtle, flex: 2.2 },
  footerMono: {
    fontFamily: font.mono,
    fontSize: typeScale.eyebrow,
    color: color.subtle,
    textAlign: "right",
    flex: 1.2,
    paddingRight: space.s3,
  },
  footerPage: {
    fontSize: typeScale.eyebrow,
    color: color.subtle,
    textAlign: "right",
    width: 62,
  },
});

// ----------------------------------------------------------------------------
// PdfDocument — ovoj strani (A4, tekoča glava in noga)
// ----------------------------------------------------------------------------

export type PdfDocumentProps = {
  /** Naslov v metapodatkih PDF-ja (okno bralnika, ime datoteke ob shranjevanju). */
  title: string;
  author?: string;
  subject?: string;
  creator?: string;
  /** Tekoča glava — na VSAKI strani. */
  header: {
    issuer: string;
    tagline?: string | null;
    docType: string;
    docNumber: string;
  };
  /** Tekoča noga — na VSAKI strani. */
  footer: {
    /** Pravna vrstica izdajatelja (ime · naslov · davčna). */
    legal: string;
    /** Že oblikovan IBAN — sredina noge. */
    iban?: string | null;
    /** Fiskalni podatki (SH: JIR/ZKI); na ZM prazno. */
    fiscal?: string | null;
  };
  labels?: PdfLabels;
  children: React.ReactNode;
};

export function PdfDocument({
  title,
  author,
  subject,
  creator,
  header,
  footer,
  labels = pdfLabelsSl,
  children,
}: PdfDocumentProps) {
  registerPdfFonts();
  return (
    <Document title={title} author={author} subject={subject} creator={creator}>
      <Page size={page.size} style={s.page} wrap>
        <View style={s.header} fixed>
          <View>
            <Text style={s.headerIssuer}>{header.issuer}</Text>
            {header.tagline ? <Text style={s.headerTagline}>{header.tagline}</Text> : null}
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerDocType}>{header.docType}</Text>
            <Text style={s.headerDocNumber}>{header.docNumber}</Text>
          </View>
        </View>

        {children}

        <View style={s.footer} fixed>
          {footer.fiscal ? <Text style={s.footerFiscal}>{footer.fiscal}</Text> : null}
          <View style={s.footerRow}>
            <Text style={s.footerText}>{footer.legal}</Text>
            <Text style={s.footerMono}>{footer.iban ?? ""}</Text>
            <Text
              style={s.footerPage}
              render={({ pageNumber, totalPages }) =>
                `${labels.page} ${pageNumber} ${labels.pageOf} ${totalPages}`
              }
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ----------------------------------------------------------------------------
// PdfTitle — naslovni blok prve strani (vrsta, številka, znesek, status)
// ----------------------------------------------------------------------------

export type PdfTitleProps = {
  docType: string;
  docNumber: string;
  /** Kratek status ("Plačano 11. 9. 2026", "Velja do …"). */
  status?: string | null;
  amount?: string | null;
  amountLabel?: string | null;
  /** Žig desno zgoraj (PLAČANO, PREDRAČUN …). */
  stamp?: React.ReactNode;
};

export function PdfTitle({
  docType,
  docNumber,
  status,
  amount,
  amountLabel,
  stamp,
}: PdfTitleProps) {
  return (
    <View style={s.titleRow} wrap={false}>
      <View style={s.titleLeft}>
        {stamp ? <View style={{ marginBottom: space.s2 }}>{stamp}</View> : null}
        <Text style={s.title}>{docType}</Text>
        <Text style={s.titleNumber}>{docNumber}</Text>
      </View>
      <View style={s.titleRight}>
        {status ? <Text style={s.titleStatus}>{status}</Text> : null}
        {amount ? (
          <>
            {amountLabel ? <Text style={s.titleAmountLabel}>{amountLabel}</Text> : null}
            <Text style={s.titleAmount}>{amount}</Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

// ----------------------------------------------------------------------------
// PdfSection
// ----------------------------------------------------------------------------

export type PdfSectionProps = {
  title?: string | null;
  eyebrow?: string | null;
  /** Oštevilčen odsek (pravni dokumenti: 1, 2, 3 …). */
  number?: string | null;
  /** `false` prepreči prelom odseka čez stran. */
  wrap?: boolean;
  children: React.ReactNode;
};

export function PdfSection({ title, eyebrow, number, wrap = true, children }: PdfSectionProps) {
  return (
    <View style={s.section} wrap={wrap}>
      {eyebrow ? <Text style={s.sectionEyebrow}>{eyebrow}</Text> : null}
      {title ? (
        <View style={s.sectionHead}>
          {number ? <Text style={s.sectionNumber}>{number}</Text> : null}
          <Text style={s.sectionTitle}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

// ----------------------------------------------------------------------------
// PdfParties — izdajatelj | prejemnik
// ----------------------------------------------------------------------------

export type PdfPartiesProps = {
  issuer: PdfParty;
  recipient: PdfParty;
  /** Napisa nad stolpcema; privzeto `labels.issuer` / `labels.recipient`. */
  issuerLabel?: string;
  recipientLabel?: string;
  labels?: PdfLabels;
};

function PartyColumn({
  label,
  party,
  labels,
}: {
  label: string;
  party: PdfParty;
  labels: PdfLabels;
}) {
  const mono: Array<{ label: string; value: string }> = [
    ...(party.taxNumber ? [{ label: labels.taxNumber, value: party.taxNumber }] : []),
    ...(party.vatId ? [{ label: labels.vatId, value: party.vatId }] : []),
    ...(party.register ? [{ label: labels.register, value: party.register }] : []),
    ...(party.iban ? [{ label: labels.iban, value: party.iban }] : []),
    ...(party.bic ? [{ label: labels.bic, value: party.bic }] : []),
    ...(party.extra ?? []),
  ];
  return (
    <View style={s.party}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.partyName}>{party.name}</Text>
      {(party.lines ?? []).filter(Boolean).map((line, i) => (
        <Text key={`l${i}`} style={s.partyLine}>
          {line}
        </Text>
      ))}
      {mono.map((row, i) => (
        <Text key={`m${i}`} style={s.partyMono}>
          {row.label}: {row.value}
        </Text>
      ))}
    </View>
  );
}

export function PdfParties({
  issuer,
  recipient,
  issuerLabel,
  recipientLabel,
  labels = pdfLabelsSl,
}: PdfPartiesProps) {
  return (
    <View style={s.parties} wrap={false}>
      <PartyColumn label={issuerLabel ?? labels.issuer} party={issuer} labels={labels} />
      <View style={s.partyGap} />
      <PartyColumn label={recipientLabel ?? labels.recipient} party={recipient} labels={labels} />
    </View>
  );
}

// ----------------------------------------------------------------------------
// PdfMeta — pas z datumi, sklicem in načinom plačila
// ----------------------------------------------------------------------------

export function PdfMeta({ items }: { items: PdfMetaItem[] }) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <View style={s.meta} wrap={false}>
      {visible.map((item, i) => (
        <View key={i} style={s.metaItem}>
          <Text style={s.metaLabel}>{item.label}</Text>
          <Text
            style={[
              item.mono ? s.metaValueMono : s.metaValue,
              item.strong ? s.metaValueStrong : {},
            ]}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ----------------------------------------------------------------------------
// PdfTable — postavke
// ----------------------------------------------------------------------------

export type PdfTableProps = {
  rows: PdfTableRow[];
  /** Privzeto opis · količina · cena/enota · skupaj. */
  columns?: PdfTableColumn[];
  /** Izmenično sivo ozadje vrstic (privzeto vklopljeno). */
  zebra?: boolean;
  labels?: PdfLabels;
};

function columnLabel(col: PdfTableColumn, labels: PdfLabels): string {
  switch (col) {
    case "description":
      return labels.description;
    case "quantity":
      return labels.quantity;
    case "unit":
      return labels.unit;
    case "unitPrice":
      return labels.unitPrice;
    case "discount":
      return labels.discount;
    case "vat":
      return labels.vat;
    case "total":
      return labels.lineTotal;
  }
}

function cellValue(col: PdfTableColumn, row: PdfTableRow): string {
  switch (col) {
    case "description":
      return row.description;
    case "quantity":
      return row.quantity ?? "—";
    case "unit":
      return row.unit ?? "—";
    case "unitPrice":
      return row.unitPrice ?? "—";
    case "discount":
      return row.discount ?? "—";
    case "vat":
      return row.vat ?? "—";
    case "total":
      return row.total;
  }
}

export function PdfTable({
  rows,
  columns = DEFAULT_COLUMNS,
  zebra = true,
  labels = pdfLabelsSl,
}: PdfTableProps) {
  return (
    <View style={s.table}>
      {/* Glava tabele se ponovi na vsaki strani (`fixed`). */}
      <View style={s.tableHead} fixed>
        {columns.map((col) => (
          <Text
            key={col}
            style={[
              s.tableHeadCell,
              { flex: COLUMN_FLEX[col] },
              col === "description" ? s.padRight : s.cellRight,
              col === "description" ? {} : s.padLeft,
            ]}
          >
            {columnLabel(col, labels)}
          </Text>
        ))}
      </View>

      {rows.map((row, idx) => (
        <View
          key={idx}
          style={[s.tableRow, zebra && idx % 2 === 1 ? s.tableRowZebra : {}]}
          wrap={false}
        >
          {columns.map((col) =>
            col === "description" ? (
              <View key={col} style={[{ flex: COLUMN_FLEX[col] }, s.padRight]}>
                <Text style={s.cellText}>{row.description}</Text>
                {row.meta ? <Text style={s.cellMeta}>{row.meta}</Text> : null}
              </View>
            ) : (
              <Text key={col} style={[s.cellMono, { flex: COLUMN_FLEX[col] }, s.padLeft]}>
                {cellValue(col, row)}
              </Text>
            ),
          )}
        </View>
      ))}
    </View>
  );
}

// ----------------------------------------------------------------------------
// PdfTotals — seštevki (nikoli prelomljeni čez stran)
// ----------------------------------------------------------------------------

export type PdfTotalsProps = {
  /** Neto, popusti, razčlenitev DDV po stopnjah. */
  rows?: PdfTotalsRow[];
  /** Glavna vrstica — »Za plačilo«. */
  total: { label: string; value: string };
  /** Pod črto: že plačano, preostane, za vračilo. */
  after?: PdfTotalsRow[];
};

export function PdfTotals({ rows = [], total, after = [] }: PdfTotalsProps) {
  return (
    <View style={s.totalsWrap} wrap={false}>
      <View style={s.totals}>
        {rows.map((row, i) => (
          <View key={i} style={s.totalsRow}>
            <Text style={row.muted ? s.totalsLabelMuted : s.totalsLabel}>{row.label}</Text>
            <Text style={row.muted ? s.totalsValueMuted : s.totalsValue}>{row.value}</Text>
          </View>
        ))}
        <View style={s.grandRow}>
          <Text style={s.grandLabel}>{total.label}</Text>
          <Text style={s.grandValue}>{total.value}</Text>
        </View>
        {after.length > 0 ? (
          <View style={s.afterRule}>
            {after.map((row, i) => (
              <View key={i} style={s.totalsRow}>
                <Text style={row.muted ? s.totalsLabelMuted : s.totalsLabel}>{row.label}</Text>
                <Text style={row.muted ? s.totalsValueMuted : s.totalsValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ----------------------------------------------------------------------------
// PdfPaymentBlock — bančni podatki + QR
// ----------------------------------------------------------------------------

export type PdfPaymentBlockProps = {
  title?: string | null;
  lines: Array<{ label: string; value: string; mono?: boolean }>;
  qr?: PdfQr | null;
  note?: string | null;
  labels?: PdfLabels;
};

export function PdfPaymentBlock({
  title,
  lines,
  qr: qrProp,
  note,
  labels = pdfLabelsSl,
}: PdfPaymentBlockProps) {
  const width = Math.max(qrProp?.size ?? qrToken.size, qrToken.minSize);
  const height = qrProp?.height ?? width;
  return (
    <View wrap={false}>
      <Text style={s.metaLabel}>{title ?? labels.payment}</Text>
      <View style={s.payment}>
        <View style={s.paymentLines}>
          {lines.map((line, i) => (
            <View key={i} style={s.paymentRow}>
              <Text style={s.paymentLabel}>{line.label}</Text>
              <Text style={line.mono ? s.paymentValueMono : s.paymentValue}>{line.value}</Text>
            </View>
          ))}
          {note ? <Text style={[s.noteBody, { marginTop: space.s2 }]}>{note}</Text> : null}
        </View>
        {qrProp ? (
          <View style={s.qrBlock}>
            <PdfImage src={qrProp.image as unknown as string} style={{ width, height }} />
            <Text style={s.qrCaption}>{qrProp.caption ?? labels.qrCaption}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ----------------------------------------------------------------------------
// PdfNote — opomba / klavzula / pravno besedilo
// ----------------------------------------------------------------------------

export type PdfNoteProps = {
  title?: string | null;
  /** `panel` = sivo ozadje z ink robom; `outline` = tanek rob; `plain` = brez okvirja. */
  variant?: "panel" | "outline" | "plain";
  children: React.ReactNode;
};

export function PdfNote({ title, variant = "panel", children }: PdfNoteProps) {
  const box = variant === "panel" ? s.notePanel : variant === "outline" ? s.noteOutline : {};
  return (
    <View style={[s.note, box]} wrap={false}>
      {title ? <Text style={s.noteTitle}>{title}</Text> : null}
      {typeof children === "string" ? <Text style={s.noteBody}>{children}</Text> : children}
    </View>
  );
}

/** Slog za besedilo znotraj `PdfNote` (ko klicatelj poda lasten `<Text>`). */
export const pdfNoteTextStyle = s.noteBody;
/** Poudarek znotraj opombe — brez barve, samo teža. */
export const pdfStrongStyle = { color: color.ink, fontWeight: 600 } as const;

// ----------------------------------------------------------------------------
// PdfSignature
// ----------------------------------------------------------------------------

export type PdfSignatureProps = {
  name: string;
  /** Vrstica pod podpisom (e-pošta, datum, funkcija). */
  meta?: string | null;
  /** `null` = brez oznake (ko je naslov že v odseku); privzeto `labels.signature`. */
  label?: string | null;
  /** `/s/` pred imenom (elektronski podpis pravnih dokumentov). */
  prefix?: string | null;
  labels?: PdfLabels;
};

export function PdfSignature({
  name,
  meta,
  label,
  prefix,
  labels = pdfLabelsSl,
}: PdfSignatureProps) {
  return (
    <View style={s.signature} wrap={false}>
      {label === null ? null : <Text style={s.signatureLabel}>{label ?? labels.signature}</Text>}
      <View style={s.signatureRow}>
        {prefix ? <Text style={s.signaturePrefix}>{prefix}</Text> : null}
        <Text style={hasScriptFont() ? s.signatureScript : s.signaturePlain}>{name}</Text>
      </View>
      {meta ? <Text style={s.signatureMeta}>{meta}</Text> : null}
    </View>
  );
}

// ----------------------------------------------------------------------------
// PdfStamp — PREDRAČUN / DOBROPIS / STORNO / PLAČANO
// ----------------------------------------------------------------------------

export function PdfStamp({
  text,
  variant = "outline",
}: {
  text: string;
  variant?: "solid" | "outline";
}) {
  return <Text style={variant === "solid" ? s.stampSolid : s.stampOutline}>{text}</Text>;
}

// ----------------------------------------------------------------------------
// Drobni pomočniki, ki jih dokumenti pogosto potrebujejo
// ----------------------------------------------------------------------------

/** Mreža parov oznaka/vrednost (2 stolpca) — za pravne in tehnične dokumente. */
export function PdfFieldGrid({
  fields,
  columns = 2,
}: {
  fields: Array<{ label: string; value: string; mono?: boolean }>;
  columns?: number;
}) {
  const width = `${100 / columns}%`;
  return (
    <View style={[s.notePanel, { flexDirection: "row", flexWrap: "wrap", borderLeftWidth: 0 }]}>
      {fields.map((f, i) => (
        <View key={i} style={{ width, marginBottom: space.s1, paddingRight: space.s2 }}>
          <Text style={s.metaLabel}>{f.label}</Text>
          <Text style={f.mono ? s.metaValueMono : s.metaValue}>{f.value}</Text>
        </View>
      ))}
    </View>
  );
}
