// ============================================================================
// Napisi za PDF komponente v vseh štirih jezikih strani (hr · sl · de · en).
// Ključi so ISTI kot v `zan-meke/lib/pdf/labels.sl.ts` — komponente iz
// `components.tsx` so na obeh straneh identične, razlikuje se samo jezik.
//
// Dokument se izriše v **jeziku gosta** (`Guest.language`), zato `pdfLabels`
// vzame locale; izdajatelj je hrvaški, zato je davčna številka povsod OIB.
// ============================================================================

import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

export const pdfLabelsHr = {
  // Dokumenti
  docInvoice: "Račun",
  docReceipt: "Potvrda o plaćanju",
  docProforma: "Predračun",
  docCreditNote: "Odobrenje",
  docQuote: "Ponuda",

  // Stranki
  issuer: "Izdavatelj",
  recipient: "Kupac",
  taxNumber: "OIB",
  vatId: "PDV ID",
  iban: "IBAN",
  bic: "SWIFT / BIC",
  register: "MBS",

  // Meta
  issuedAt: "Datum izdavanja",
  dueAt: "Rok plaćanja",
  validUntil: "Vrijedi do",
  paidAt: "Datum plaćanja",
  serviceDate: "Datum usluge",
  reference: "Poziv na broj",
  paymentMethod: "Način plaćanja",
  orderNumber: "Rezervacija",
  relatedInvoice: "Odnosi se na račun",

  // Tabela
  description: "Opis",
  quantity: "Količina",
  unit: "Jed.",
  unitPrice: "Cijena / jed.",
  discount: "Popust",
  vat: "PDV",
  lineTotal: "Ukupno",

  // Seštevki
  subtotal: "Osnovica (bez PDV-a)",
  discounts: "Popusti",
  vatAt: "PDV",
  total: "Ukupno",
  totalDue: "Za platiti",
  alreadyPaid: "Plaćeno",
  remaining: "Preostalo za platiti",
  refund: "Za povrat",

  // Plačilo
  payment: "Plaćanje",
  payTo: "Primatelj",
  scanToPay: "Skenirajte i platite",
  qrCaption: "mobilno bankarstvo",
  amount: "Iznos",

  // Stanje dokumenta
  status: "Status",
  statusPaid: "Plaćeno",
  statusAwaiting: "Čeka plaćanje",
  statusIssued: "Izdano",
  dueOn: "rok",

  // Ostalo
  contact: "Kontakt",
  note: "Napomena",
  notes: "Napomene",
  page: "Stranica",
  pageOf: "od",
  signature: "Potpis",
  stampPaid: "PLAĆENO",
  stampProforma: "PREDRAČUN",
  stampCreditNote: "ODOBRENJE",
  stampStorno: "STORNO",
  stampDraft: "NACRT",
  stampCopy: "KOPIJA",
} as const;

/** Oblika napisov — ista na zanmeke.com in second-home.hr. */
export type PdfLabels = { -readonly [K in keyof typeof pdfLabelsHr]: string };

export const pdfLabelsSl: PdfLabels = {
  docInvoice: "Račun",
  docReceipt: "Potrdilo o plačilu",
  docProforma: "Predračun",
  docCreditNote: "Dobropis",
  docQuote: "Ponudba",

  issuer: "Izdajatelj",
  recipient: "Kupec",
  // Ne »OIB« — to je hrvaška oznaka in je ostala iz prepisa s second-home.hr.
  taxNumber: "Davčna št.",
  vatId: "ID za DDV",
  iban: "IBAN",
  bic: "SWIFT / BIC",
  register: "Matična št.",

  issuedAt: "Datum izdaje",
  dueAt: "Rok plačila",
  validUntil: "Velja do",
  paidAt: "Datum plačila",
  serviceDate: "Datum storitve",
  reference: "Sklic",
  paymentMethod: "Način plačila",
  orderNumber: "Rezervacija",
  relatedInvoice: "Nanaša se na račun",

  description: "Opis",
  quantity: "Količina",
  unit: "Enota",
  unitPrice: "Cena / enota",
  discount: "Popust",
  vat: "DDV",
  lineTotal: "Skupaj",

  subtotal: "Neto (brez DDV)",
  discounts: "Popusti",
  vatAt: "DDV",
  total: "Skupaj",
  totalDue: "Za plačilo",
  alreadyPaid: "Plačano",
  remaining: "Preostane za plačilo",
  refund: "Za vračilo",

  payment: "Plačilo",
  payTo: "Prejemnik",
  scanToPay: "Skenirajte in plačajte",
  qrCaption: "mobilna banka",
  amount: "Znesek",

  status: "Status",
  statusPaid: "Plačano",
  statusAwaiting: "Čaka na plačilo",
  statusIssued: "Izdano",
  dueOn: "rok",

  contact: "Kontakt",
  note: "Opomba",
  notes: "Opombe",
  page: "Stran",
  pageOf: "od",
  signature: "Podpis",
  stampPaid: "PLAČANO",
  stampProforma: "PREDRAČUN",
  stampCreditNote: "DOBROPIS",
  stampStorno: "STORNO",
  stampDraft: "OSNUTEK",
  stampCopy: "KOPIJA",
};

export const pdfLabelsDe: PdfLabels = {
  docInvoice: "Rechnung",
  docReceipt: "Zahlungsbestätigung",
  docProforma: "Proformarechnung",
  docCreditNote: "Gutschrift",
  docQuote: "Angebot",

  issuer: "Aussteller",
  recipient: "Kunde",
  taxNumber: "OIB (Steuernummer)",
  vatId: "USt-IdNr.",
  iban: "IBAN",
  bic: "SWIFT / BIC",
  register: "Handelsregister-Nr.",

  issuedAt: "Ausstellungsdatum",
  dueAt: "Fälligkeitsdatum",
  validUntil: "Gültig bis",
  paidAt: "Zahlungsdatum",
  serviceDate: "Leistungsdatum",
  reference: "Verwendungszweck (Referenz)",
  paymentMethod: "Zahlungsart",
  orderNumber: "Buchung",
  relatedInvoice: "Bezieht sich auf Rechnung",

  description: "Beschreibung",
  quantity: "Menge",
  unit: "Einheit",
  unitPrice: "Preis / Einheit",
  discount: "Rabatt",
  vat: "MwSt.",
  lineTotal: "Gesamt",

  subtotal: "Netto (ohne MwSt.)",
  discounts: "Rabatte",
  vatAt: "MwSt.",
  total: "Gesamt",
  totalDue: "Zu zahlen",
  alreadyPaid: "Bezahlt",
  remaining: "Offener Betrag",
  refund: "Zu erstatten",

  payment: "Zahlung",
  payTo: "Empfänger",
  scanToPay: "Scannen und bezahlen",
  qrCaption: "Banking-App",
  amount: "Betrag",

  status: "Status",
  statusPaid: "Bezahlt",
  statusAwaiting: "Zahlung ausstehend",
  statusIssued: "Ausgestellt",
  dueOn: "fällig am",

  contact: "Kontakt",
  note: "Hinweis",
  notes: "Hinweise",
  page: "Seite",
  pageOf: "von",
  signature: "Unterschrift",
  stampPaid: "BEZAHLT",
  stampProforma: "PROFORMA",
  stampCreditNote: "GUTSCHRIFT",
  stampStorno: "STORNO",
  stampDraft: "ENTWURF",
  stampCopy: "KOPIE",
};

export const pdfLabelsEn: PdfLabels = {
  docInvoice: "Invoice",
  docReceipt: "Payment receipt",
  docProforma: "Proforma invoice",
  docCreditNote: "Credit note",
  docQuote: "Quote",

  issuer: "Issuer",
  recipient: "Customer",
  taxNumber: "OIB (tax ID)",
  vatId: "VAT ID",
  iban: "IBAN",
  bic: "SWIFT / BIC",
  register: "Reg. no.",

  issuedAt: "Issue date",
  dueAt: "Due date",
  validUntil: "Valid until",
  paidAt: "Payment date",
  serviceDate: "Service date",
  reference: "Payment reference",
  paymentMethod: "Payment method",
  orderNumber: "Booking",
  relatedInvoice: "Relates to invoice",

  description: "Description",
  quantity: "Quantity",
  unit: "Unit",
  unitPrice: "Unit price",
  discount: "Discount",
  vat: "VAT",
  lineTotal: "Total",

  subtotal: "Net (excl. VAT)",
  discounts: "Discounts",
  vatAt: "VAT",
  total: "Total",
  totalDue: "Amount due",
  alreadyPaid: "Paid",
  remaining: "Balance due",
  refund: "To be refunded",

  payment: "Payment",
  payTo: "Beneficiary",
  scanToPay: "Scan and pay",
  qrCaption: "banking app",
  amount: "Amount",

  status: "Status",
  statusPaid: "Paid",
  statusAwaiting: "Awaiting payment",
  statusIssued: "Issued",
  dueOn: "due",

  contact: "Contact",
  note: "Note",
  notes: "Notes",
  page: "Page",
  pageOf: "of",
  signature: "Signature",
  stampPaid: "PAID",
  stampProforma: "PROFORMA",
  stampCreditNote: "CREDIT NOTE",
  stampStorno: "VOID",
  stampDraft: "DRAFT",
  stampCopy: "COPY",
};

// zanmeke.com je enojezičen; na second-home.hr ima ta zemljevid štiri
// jezike. Ko bo stran večjezična, se tu doda vrstica in nič drugega.
const BY_LOCALE: Record<Locale, PdfLabels> = {
  sl: pdfLabelsSl,
};

/** Napisi dokumenta; neznan jezik pade na privzetega. */
export function pdfLabels(locale: Locale | string | null | undefined): PdfLabels {
  return BY_LOCALE[locale && isLocale(locale) ? locale : defaultLocale];
}
