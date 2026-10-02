"use client";

import { Image as ImageIcon, Type } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AdminSaveBar } from "@/components/admin/kit/AdminSaveBar";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import { FieldGroup } from "@/components/admin/kit/FieldGroup";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { saveBlokBesediloAction } from "@/lib/domov/actions";
import type { BlokDef, StranKljuc } from "@/lib/domov/bloki";

/**
 * Urejanje besedil enega odseka domače strani.
 *
 * Prazno polje pomeni PRIVZETO besedilo iz kode — ne prazen odsek. Tako
 * odsek nikoli ne ostane brez naslova, urednik pa lahko svojo različico
 * kadarkoli umakne tako, da polje izprazni.
 */
export function BlokForm({
  stran,
  def,
  initial,
  backHref,
}: {
  stran: StranKljuc;
  def: BlokDef;
  initial: Record<string, string>;
  backHref: string;
}) {
  const zacetne = useMemo(
    () => Object.fromEntries(def.polja.map((p) => [p.kljuc, initial[p.kljuc] ?? ""])),
    [def.polja, initial],
  );
  const [values, setValues] = useState<Record<string, string>>(zacetne);
  const [pending, start] = useTransition();
  const router = useRouter();

  // Besedila in mediji gresta v svoja odseka: vpisovanje naslova in
  // nalaganje fotografije sta dve različni opravili.
  const besedilna = def.polja.filter(
    (p) => p.vrsta === "besedilo" || p.vrsta === "odstavek",
  );
  const medijska = def.polja.filter((p) => p.vrsta === "slika" || p.vrsta === "video");

  const dirty = def.polja.some(
    (p) => (values[p.kljuc] ?? "") !== (zacetne[p.kljuc] ?? ""),
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const izid = await saveBlokBesediloAction(stran, def.kljuc, values);
          if (izid.ok) {
            toast.success(izid.message ?? "Shranjeno.");
            router.push(backHref);
            router.refresh();
          } else {
            toast.error(izid.message ?? "Ni šlo.");
          }
        });
      }}
      className="flex flex-col gap-(--s3)"
    >
      <AdminSection
        icon={<Type className="h-5 w-5" aria-hidden />}
        title="Besedila"
        description="Prazno polje pomeni privzeto besedilo iz kode — odsek nikoli ne ostane brez naslova."
      >
        {besedilna.map((polje) => (
          <FieldGroup
            key={polje.kljuc}
            label={polje.label}
            htmlFor={polje.kljuc}
            hint={polje.hint}
            charCount={(values[polje.kljuc] ?? "").length}
            charMax={polje.najvec}
          >
            {polje.vrsta === "odstavek" ? (
              <Textarea
                id={polje.kljuc}
                value={values[polje.kljuc] ?? ""}
                onChange={(e) =>
                  setValues((p) => ({ ...p, [polje.kljuc]: e.target.value }))
                }
                maxLength={polje.najvec}
                rows={3}
                disabled={pending}
              />
            ) : (
              <Input
                id={polje.kljuc}
                value={values[polje.kljuc] ?? ""}
                onChange={(e) =>
                  setValues((p) => ({ ...p, [polje.kljuc]: e.target.value }))
                }
                maxLength={polje.najvec}
                disabled={pending}
              />
            )}
          </FieldGroup>
        ))}
      </AdminSection>

      {medijska.length > 0 ? (
        <AdminSection
          icon={<ImageIcon className="h-5 w-5" aria-hidden />}
          title="Fotografija in video"
          description="Neobvezno. Dokler ju ni, odsek obdrži barvno ploskev — ta ni napaka, ampak privzeti videz."
        >
          {medijska.map((polje) => (
            <FieldGroup key={polje.kljuc} label={polje.label} hint={polje.hint}>
              {/* NALAGANJA SLIK TU (ŠE) NI: shramba nima ključev, dokler
                  R2 ni priklopljen. Zato se vpiše naslov datoteke, ki že
                  nekje stoji — tako odsek lahko dobi sliko, ne da bi čakal
                  na nalagalnik. Ko bo shramba na mestu, pride sem
                  `ImageField`, polja pa ostanejo ista. */}
              <Input
                id={polje.kljuc}
                value={values[polje.kljuc] ?? ""}
                onChange={(e) =>
                  setValues((p) => ({ ...p, [polje.kljuc]: e.target.value }))
                }
                maxLength={polje.najvec}
                disabled={pending}
                placeholder={
                  polje.vrsta === "slika" ? "/dela/primer.png" : "https://…/posnetek.mp4"
                }
              />
            </FieldGroup>
          ))}
        </AdminSection>
      ) : null}

      <AdminSaveBar
        dirty={dirty}
        pending={pending}
        onReset={() => setValues(zacetne)}
        saveLabel="Shrani odsek"
        savingLabel="Shranjujem…"
        cancelLabel="Razveljavi"
        dirtyHint="Neshranjene spremembe"
      />
    </form>
  );
}
