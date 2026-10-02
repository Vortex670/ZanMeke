import { z } from "zod";

/**
 * Skupni Zod gradniki za vhod obrazcev in API-jev (e-mail, geslo, slug,
 * locale, cuid). Domenske sheme živijo v `lib/<domena>/validation.ts`;
 * `ActionResult` in `formatZodErrors` sta v `lib/actions/helpers.ts`.
 */

/**
 * Dolžinske omejitve polj, ki nastopijo v več domenah. **Edini vir** —
 * prej jih je vsaka domena napisala zase (`MAX_NAME` v štirih datotekah,
 * `MAX_MESSAGE` v štirih, `MAX_EMAIL` v treh) in ena se je razšla:
 * rezervacije so imele `MAX_EMAIL = 120`, kar bi zavrnilo gosta z daljšim
 * naslovom, čeprav RFC 5321 dovoljuje 254 znakov.
 *
 * Klientski obrazci JIH SMEJO uvoziti (ta datoteka ni `server-only`) — s
 * tem se `maxLength` v polju ujema s shemo na strežniku. Prej je
 * `BookingRequestForm` svojo mejo prepisal.
 */
export const FIELD_MAX = {
  /** Ime in priimek gosta. */
  name: 80,
  /** E-naslov — zgornja meja po RFC 5321. */
  email: 254,
  /** Prosto sporočilo v obrazcu. */
  message: 2000,
} as const;

export const emailSchema = z.string().trim().toLowerCase().min(3).max(254).email();

export const passwordSchema = z
  .string()
  .min(12, "Geslo mora imeti vsaj 12 znakov")
  .max(256);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Neveljaven slug");

export const localeSchema = z.enum(["hr", "sl", "de", "en"]);

/** Prisma cuid ID (~25 znakov, začne s `c`). */
export const cuidSchema = z.string().cuid("Neveljaven ID");
