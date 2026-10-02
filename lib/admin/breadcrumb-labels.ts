// ============================================================================
// lib/admin/breadcrumb-labels.ts — oznake poti v drobtinah.
// ----------------------------------------------------------------------------
// To je NASTAVITEV STRANI, ne komponenta: `AdminBreadcrumbs` je na vseh
// projektih ista, imena poti pa so od projekta do projekta druga. Nova stran
// prinese svojo karto in nič drugega.
//
// Neznan del poti (ID, slug) pade nazaj na naslov, dokler ga ne povozi
// `<BreadcrumbLabel>` na strani.
// ============================================================================

export const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  statistike: "Statistike",
  vsebina: "Vsebina",
  domov: "Domov",
  ponudba: "Ponudba",
  dela: "Dela",
  kontakt: "Kontakt",
  racuni: "Računi",
  posta: "Pošta",
  nov: "Nov",
  sporocila: "Sporočila",
  strani: "Strani",
  mediji: "Mediji",
  racun: "Račun",
  nastavitve: "Nastavitve",
  nova: "Nova",
  novo: "Novo",
  uredi: "Uredi",
};
