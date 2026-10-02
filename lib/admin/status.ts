import type { AdminListRowTone } from "@/components/admin/kit/StatusRail";
import type { BadgeVariant } from "@/components/ui/Badge";

// ============================================================================
// lib/admin/status.ts — POMEN barv stanj. Ena tabela za cel admin.
// ----------------------------------------------------------------------------
// Barva v adminu nikoli ni okras: pove, ali je treba kaj narediti. Pomenov je
// pet in so zapisani TU, enkrat; posamezna domena pove samo, kateri pomen ima
// njeno stanje (`lib/<domena>/status.ts`), barve ne izbira.
//
//   🔴 action    terja ukrepanje   neplačano po roku, preklicano, zavrnjeno,
//                                  napaka pošte, spam, gost ni prišel
//   🟡 waiting   čaka              čaka plačilo v roku, čaka potrditev,
//                                  kampanja se pošilja, v vrsti
//   🟢 done      zaključeno        plačano, potrjeno, poslano, objavljeno
//   🔵 new       novo / aktivno    novo povpraševanje, nova rezervacija,
//                                  načrtovana kampanja
//   ⚪ archived  arhivirano        zaključeno, odjavljen naročnik, skrito
//
// Zakaj ne barva neposredno v strani: ko se odločiš, da je »preklicano« rdeče
// in ne sivo, se to popravi na enem mestu in velja povsod — v znački, v traku
// vrstice in v vsakem novem seznamu.
//
// Ista datoteka na zanmeke.com (`lib/admin/status.ts`).
// ============================================================================

/** Pomen stanja. Strani in komponente govorijo v POMENIH, ne v barvah. */
export type StatusMeaning = "action" | "waiting" | "done" | "new" | "archived";

/**
 * Edina preslikava pomena v barvo. Tip je presek obeh unij, zato prevajalnik
 * ne dovoli barve, ki je značka ali trak vrstice ne pozna.
 */
export const STATUS_TONE: Record<StatusMeaning, BadgeVariant & AdminListRowTone> = {
  action: "danger",
  waiting: "warning",
  done: "success",
  new: "accent",
  archived: "muted",
};

/** Barva za pomen — uporabi jo značka IN trak vrstice. */
export function toneOf(meaning: StatusMeaning): BadgeVariant & AdminListRowTone {
  return STATUS_TONE[meaning];
}

/**
 * Pomočnik za domeno: iz karte `stanje → pomen` naredi funkcijo `stanje →
 * barva`. Neznano stanje je »arhivirano« — nikoli napaka izrisa.
 *
 * ```ts
 * const BOOKING_MEANING: Record<BookingStatus, StatusMeaning> = { … };
 * export const bookingStatusTone = toneMap(BOOKING_MEANING);
 * ```
 */
export function toneMap<K extends string>(
  meanings: Record<K, StatusMeaning>,
): (status: K | string | null | undefined) => BadgeVariant & AdminListRowTone {
  return (status) => toneOf(meanings[status as K] ?? "archived");
}
