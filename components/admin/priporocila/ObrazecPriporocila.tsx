"use client";

import { Quote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AdminSaveBar } from "@/components/admin/kit/AdminSaveBar";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import { FieldGroup } from "@/components/admin/kit/FieldGroup";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { shraniPriporociloAction } from "@/lib/priporocila/actions";
import type { Priporocilo } from "@/lib/priporocila/queries";

// ============================================================================
// <ObrazecPriporocila /> — vnos tega, kar je povedala stranka
// ----------------------------------------------------------------------------
// Besedilo se NE popravlja v lep slovenski knjižni jezik. Priporočilo, ki
// zveni kot oglas, bralec prebere kot oglas; tisto, ki zveni kot gostilničar,
// prebere kot gostilničarja. Edino, kar je dovoljeno, je skrajšati.
// ============================================================================

const PRAZNO: Priporocilo = {
  id: "",
  ime: "",
  hisa: null,
  vloga: null,
  kraj: null,
  besedilo: "",
  url: null,
  objavljeno: false,
  sortOrder: 0,
};

export function ObrazecPriporocila({ zacetno }: { zacetno?: Priporocilo }) {
  const router = useRouter();
  const [v, nastavi] = useState<Priporocilo>(zacetno ?? PRAZNO);
  const [tece, nastaviTece] = useState(false);
  const [napake, nastaviNapake] = useState<Record<string, string[]>>({});
  const [umazano, nastaviUmazano] = useState(false);

  function polje<K extends keyof Priporocilo>(k: K, vrednost: Priporocilo[K]) {
    nastavi((p) => ({ ...p, [k]: vrednost }));
    nastaviUmazano(true);
  }

  async function oddaj(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    nastaviTece(true);
    nastaviNapake({});

    const izid = await shraniPriporociloAction(zacetno?.id ?? null, {
      ime: v.ime,
      hisa: v.hisa ?? "",
      vloga: v.vloga ?? "",
      kraj: v.kraj ?? "",
      besedilo: v.besedilo,
      url: v.url ?? "",
      objavljeno: v.objavljeno,
      sortOrder: v.sortOrder,
    });
    nastaviTece(false);

    if (izid.ok) {
      toast.success(izid.message ?? "Shranjeno.");
      nastaviUmazano(false);
      router.push("/admin/priporocila");
      router.refresh();
    } else {
      nastaviNapake(izid.fieldErrors ?? {});
      toast.error(izid.message);
    }
  }

  const n = (k: string) => napake[k]?.[0];

  return (
    <form onSubmit={oddaj} className="space-y-6 sm:space-y-8">
      <AdminSection
        icon={<Quote className="h-5 w-5" aria-hidden />}
        title="Priporočilo"
        description="Besedilo pusti tako, kot ga je povedala stranka. Lahko ga skrajšaš, ne pa prepišeš."
      >
        <FieldGroup
          label="Besedilo"
          error={n("besedilo")}
          hint="Vsaj ena cela poved. Najbolj prepriča tista, ki pove, kaj se je pri njih spremenilo."
        >
          <Textarea
            value={v.besedilo}
            onChange={(e) => polje("besedilo", e.target.value)}
            rows={5}
            maxLength={600}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup label="Ime in priimek" error={n("ime")}>
          <Input
            value={v.ime}
            onChange={(e) => polje("ime", e.target.value)}
            maxLength={80}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup label="Hiša ali podjetje" error={n("hisa")}>
          <Input
            value={v.hisa ?? ""}
            onChange={(e) => polje("hisa", e.target.value)}
            maxLength={120}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup label="Vloga" error={n("vloga")} hint="Na primer »lastnik«. Prazno je v redu.">
          <Input
            value={v.vloga ?? ""}
            onChange={(e) => polje("vloga", e.target.value)}
            maxLength={80}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup
          label="Kraj"
          error={n("kraj")}
          hint="Pri lokalnem izvajalcu je bližina del dokaza."
        >
          <Input
            value={v.kraj ?? ""}
            onChange={(e) => polje("kraj", e.target.value)}
            maxLength={80}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup
          label="Povezava na njihovo stran"
          error={n("url")}
          hint="Ime hiše postane povezava. Preverljivo priporočilo je močnejše od preprostega."
        >
          <Input
            value={v.url ?? ""}
            onChange={(e) => polje("url", e.target.value)}
            inputMode="url"
            maxLength={200}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup label="Vrstni red" error={n("sortOrder")} hint="Manjša številka je prej.">
          <Input
            type="number"
            min={0}
            max={999}
            value={v.sortOrder}
            onChange={(e) => polje("sortOrder", Number(e.target.value))}
            disabled={tece}
            className="max-w-28"
          />
        </FieldGroup>

        <FieldGroup label="Objava">
          <Checkbox
            checked={v.objavljeno}
            onChange={(e) => polje("objavljeno", e.target.checked)}
            disabled={tece}
            hint="Neobjavljeno priporočilo na strani ne obstaja. Odsek se pokaže šele, ko je objavljeno vsaj eno."
          >
            Pokaži na strani
          </Checkbox>
        </FieldGroup>
      </AdminSection>

      <AdminSaveBar
        dirty={umazano}
        pending={tece}
        onReset={() => {
          nastavi(zacetno ?? PRAZNO);
          nastaviUmazano(false);
        }}
        saveLabel={zacetno ? "Shrani" : "Dodaj priporočilo"}
        savingLabel="Shranjujem …"
        cancelLabel="Razveljavi"
      />
    </form>
  );
}
