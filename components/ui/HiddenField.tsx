/**
 * HiddenField — `<input type="hidden">` kot komponenta.
 *
 * Ni kontrolnik in nima videza; obstaja zato, da v `app/` in `components/`
 * ni nobenega surovega `<input>`. Pravilo »vse skozi primitive« je potem
 * preverljivo z enim iskanjem, brez izjem, ki jih je treba pomniti:
 *
 * ```bash
 * grep -rE "<(button|input|label|textarea|select)[ >/]" app components | grep -v "^components/ui/"
 * ```
 *
 * Uporaba — nosilec vrednosti za `FormData`, ki je uporabnik ne ureja
 * (slug, žeton, sestavljena vrednost čarovnika):
 *
 * ```tsx
 * <HiddenField name="unitSlug" value={unitSlug} />
 * ```
 *
 * `value` sprejme tudi `null` / `undefined` / `boolean` / `number`, ker so
 * skoraj vsi klicatelji prej pisali `String(x)` ali `x ?? ""`. Pretvorbo
 * naredimo tu, enkrat: `null` in `undefined` postaneta prazen niz (Zod na
 * strežniku ju obravnava kot manjkajočo vrednost), `boolean` pa `"true"` /
 * `"false"` — NIKOLI prazen niz, ker `z.coerce.boolean()` vsak neprazen niz
 * prebere kot `true` (glej `references/pitfalls.md`, vnos 39).
 */

type HiddenFieldProps = {
  name: string;
  value: string | number | boolean | null | undefined;
  /** Preslikava nativnega `required` — brskalnik prepreči oddajo praznega. */
  required?: boolean;
};

export function HiddenField({ name, value, required }: HiddenFieldProps) {
  const serialized =
    value == null ? "" : typeof value === "boolean" ? String(value) : String(value);

  return (
    <input type="hidden" name={name} value={serialized} required={required} readOnly />
  );
}
