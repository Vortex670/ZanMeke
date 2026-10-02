"use server";

import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { zahtevajPrijavo } from "@/lib/auth/straza";
import { DOVOLJENE_VRSTE, NAJVEC_BAJTOV, NAJVEC_MB } from "@/lib/media/limits";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import type { ActionResult } from "@/lib/actions/helpers";

// ============================================================================
// lib/media/actions.ts — nalaganje slik
// ----------------------------------------------------------------------------
// Ena pot za vse slike v adminu (jedi, novice, galerija). Vsaka gre skozi
// isto obdelavo:
//
//   1. preveri vrsto in velikost,
//   2. pretvori v WebP in omeji na 2000 px (fotografija iz telefona ima 4 MB
//      in 4000 px — na jedilniku se izriše na 400 px, razlika je samo v tem,
//      koliko gost čaka),
//   3. shrani v javno vedro na Cloudflare R2,
//   4. zapiše `MediaAsset`, da se da pozneje pobrisati sirote.
//
// Ime datoteke je naključno: dve »slika.jpg« se ne moreta povoziti, obenem pa
// se ne razkrije, kako je bila datoteka na disku poimenovana.
// ============================================================================

const DOVOLJENE = new Set<string>(DOVOLJENE_VRSTE);

/** Najdaljša stranica po pomanjšanju. */
const NAJVECJA_STRANICA = 2000;

export type UploadedImage = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
};

export async function uploadImageAction(
  formData: FormData,
): Promise<ActionResult<UploadedImage>> {
  const user = await zahtevajPrijavo();

  const file = formData.get("file");
  const mapa = String(formData.get("folder") ?? "splosno");

  if (!(file instanceof File)) {
    return { ok: false, message: "Datoteka manjka." };
  }
  if (!DOVOLJENE.has(file.type)) {
    return { ok: false, message: "Dovoljene so slike JPEG, PNG, WebP ali AVIF." };
  }
  if (file.size > NAJVEC_BAJTOV) {
    return { ok: false, message: `Slika je prevelika — največ ${NAJVEC_MB} MB.` };
  }

  const vhod = Buffer.from(await file.arrayBuffer());

  let webp: Buffer;
  let sirina: number | null = null;
  let visina: number | null = null;
  try {
    const pipeline = sharp(vhod).rotate().resize({
      width: NAJVECJA_STRANICA,
      height: NAJVECJA_STRANICA,
      fit: "inside",
      withoutEnlargement: true,
    });
    const { data, info } = await pipeline
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    webp = data;
    sirina = info.width;
    visina = info.height;
  } catch {
    // Datoteka se predstavlja kot slika, a je sharp ne prebere — pokvarjena
    // ali preoblečena. Ne shranimo je.
    return {
      ok: false,
      message: "Slike ni bilo mogoče prebrati. Poskusi z drugo datoteko.",
    };
  }

  const varnaMapa = mapa.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "splosno";
  const key = `${varnaMapa}/${randomUUID()}.webp`;

  const rezultat = await storage.upload({
    key,
    body: webp,
    contentType: "image/webp",
    visibility: "public",
    cacheControl: "public, max-age=31536000, immutable",
  });

  if (!rezultat.publicUrl) {
    return {
      ok: false,
      message: "Nalaganje je uspelo, javnega naslova pa ni. Preveri nastavitve R2.",
    };
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      bucket: varnaMapa,
      path: key,
      url: rezultat.publicUrl,
      kind: "IMAGE",
      mimeType: "image/webp",
      sizeBytes: rezultat.size,
      width: sirina,
      height: visina,
      uploadedById: user.id,
    },
  });

  return {
    ok: true,
    message: "Slika je naložena.",
    data: { id: asset.id, url: asset.url, width: asset.width, height: asset.height },
  };
}

/**
 * Odstrani sliko iz R2 in iz zapisa. Tiho uspe, če je že ni.
 *
 * Vrstni red je bil prej obrnjen in napaka iz shrambe požrta: ob zavrnitvi
 * iz R2 je datoteka ostala javno dosegljiva, edini zapis o njej — in s tem
 * edina pot do ponovnega brisanja — pa je izginil. Admin je ob tem prebral
 * »Slika je odstranjena.«
 *
 * Zdaj gre najprej shramba. Če ta ne uspe, zapis ostane in lahko poskusimo
 * znova; osiroteli zapis brez datoteke je manjša škoda od datoteke brez
 * zapisa.
 */
export async function deleteImageAction(url: string): Promise<ActionResult> {
  await zahtevajPrijavo();

  const asset = await prisma.mediaAsset.findFirst({ where: { url } });
  if (!asset) return { ok: true, message: "Slika je odstranjena." };

  try {
    await storage.delete(asset.path);
  } catch (e) {
    console.error("[media] brisanje iz shrambe ni uspelo:", asset.path, e);
    return {
      ok: false,
      message: "Slike ni bilo mogoče izbrisati iz shrambe. Poskusi znova.",
    };
  }

  await prisma.mediaAsset.delete({ where: { id: asset.id } });

  return { ok: true, message: "Slika je odstranjena." };
}
