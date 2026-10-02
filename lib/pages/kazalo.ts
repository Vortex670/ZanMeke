import { slugify } from "@/lib/validation/slug";

// ============================================================================
// lib/pages/kazalo.ts — kazalo vsebine iz naslovov v besedilu
// ----------------------------------------------------------------------------
// Pravna besedila so dolga in jih nihče ne bere od začetka do konca; gost
// išče eno stvar — kako dolgo hranimo podatke, kako se odjavi, kdo je
// upravljavec. Kazalo ob strani je edino, kar to omogoča.
//
// Sidra se izpeljejo iz NASLOVOV in ne vpisujejo ročno: besedilo nastane v
// skriptu ali v urejevalniku, kjer nihče ne piše `id`. Kadar naslov `id` že
// ima, ostane njegov — sicer bi se povezave, ki krožijo, pretrgale.
//
// Delo je z nizom in ne z razčlenjevalnikom HTML: vhod je naš (saniran ob
// shranjevanju), naloga pa ena sama.
// ============================================================================

export type Sekcija = { id: string; naslov: string };

const NASLOV = /<h2([^>]*)>([\s\S]*?)<\/h2>/gi;

/** Besedilo brez oznak — za napis v kazalu in za izpeljavo sidra. */
function golo(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function pripraviVsebino(html: string): { html: string; sekcije: Sekcija[] } {
  const sekcije: Sekcija[] = [];
  const zasedeni = new Set<string>();

  const izhod = html.replace(NASLOV, (_cel, atributi: string, vsebina: string) => {
    const naslov = golo(vsebina);
    const obstojec = /\sid="([^"]+)"/i.exec(atributi)?.[1];

    let id = obstojec ?? slugify(naslov);
    if (!id) return `<h2${atributi}>${vsebina}</h2>`;

    // Dva enaka naslova na strani bi dala dve enaki sidri; druga povezava bi
    // vodila na prvo mesto.
    if (zasedeni.has(id)) {
      let n = 2;
      while (zasedeni.has(`${id}-${n}`)) n += 1;
      id = `${id}-${n}`;
    }
    zasedeni.add(id);
    sekcije.push({ id, naslov });

    const brezId = atributi.replace(/\sid="[^"]*"/i, "");
    return `<h2 id="${id}"${brezId}>${vsebina}</h2>`;
  });

  return { html: izhod, sekcije };
}
