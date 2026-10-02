import { z } from "zod";

// ============================================================================
// lib/analytics/validation.ts — kaj sme v tabelo obiska
// ----------------------------------------------------------------------------
// Beleženje je ENO OD DVEH strežniških dejanj, ki ju sproži NEPRIJAVLJEN
// obiskovalec (drugo je povpraševanje). Pot in naslov prideta z odjemalca,
// torej iz brskalnika, ki mu ne moremo verjeti: brez meje bi lahko kdo v
// tabelo zapisal poljubno dolg niz, in to tolikokrat, kolikor želi.
//
// Niz se ne zavrne, ampak PRIREŽE. Zavrnjen ogled je izgubljen podatek zaradi
// predolgega naslova strani — kar je slabša zamenjava od prirezanega naslova.
// Zavrnemo samo tisto, kar sploh ni pot.
// ============================================================================

/** Pot mora biti pot na tej strani: začne se s »/« in nima gostitelja. */
export const potShema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .refine((v) => v.startsWith("/") && !v.startsWith("//"), {
    message: "Pot mora biti relativna.",
  });

/** Naslov dokumenta — samo za berljivost v adminu, zato le prirez. */
export const naslovShema = z.string().trim().max(200).optional();

/** Ime dogodka je iz zaprtega seznama; poljubno ime bi tabelo spremenilo v smetnjak. */
export const IMENA_DOGODKOV = ["klic", "povprasevanje", "ponudba"] as const;
export const imeDogodkaShema = z.enum(IMENA_DOGODKOV);

export const ogledShema = z.object({ pot: potShema, naslov: naslovShema });
