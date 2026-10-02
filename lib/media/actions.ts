"use server";

import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { zahtevajPrijavo } from "@/lib/auth/straza";
import { mapaShema, slikaShema, urlSlikeShema } from "@/lib/media/validation";
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

  // Shema namesto zaporedja `if`-ov: sporočila so ista, pravilo pa stoji v
  // `validation.ts` kot pri vseh drugih domenah.
  const preverjena = slikaShema.safeParse(formData.get("file"));
  if (!preverjena.success) {
    return {
      ok: false,
      message: preverjena.error.issues[0]?.message ?? "Datoteka manjka.",
    };
  }
  const file = preverjena.data;
  const mapa = mapaShema.parse(formData.get("folder") ?? "splosno");

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

  const key = `${mapa}/${randomUUID()}.webp`;

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
      bucket: mapa,
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

  const naslov = urlSlikeShema.safeParse(url);
  if (!naslov.success) return { ok: false, message: "Naslov slike ni veljaven." };

  const asset = await prisma.mediaAsset.findFirst({ where: { url: naslov.data } });
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
