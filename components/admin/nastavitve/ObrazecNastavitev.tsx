"use client";

import { AtSign, Building2, Landmark, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminSaveBar } from "@/components/admin/kit/AdminSaveBar";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import { FieldGroup } from "@/components/admin/kit/FieldGroup";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { shraniNastavitveAction } from "@/lib/nastavitve/actions";
import type { NastavitveStanje } from "@/lib/nastavitve/queries";

// ============================================================================
// <ObrazecNastavitev /> — podatki izdajatelja
// ----------------------------------------------------------------------------
// Ti podatki gredo na RAČUN in v UPN kodo. Zato jih ni v kodi: vrednost v
// kodi bi bilo treba spremeniti, prevesti in objaviti — davčno številko pa
// se vpiše enkrat in se je nihče več ne dotakne.
//
// Klavzula o oprostitvi DDV se pokaže SAMO, kadar nisi zavezanec. Polje, ki
// pri zavezancu ne pomeni ničesar, je vprašanje, na katero ni pravega
// odgovora — in nekdo ga bo izpolnil.
// ============================================================================

/**
 * Tri omrežja, ena vrstica kode na vsako.
 *
 * `https://` ni treba vpisati — shema ga doda sama. Vpisan `instagram.com/ime`
 * brez sheme bi sicer v nogi peljal na `zanmeke.com/instagram.com/ime`.
 */
const OMREZJA = [
  {
    kljuc: "instagramUrl",
    oznaka: "Instagram",
    primer: "instagram.com/uporabnisko_ime",
    namig: "Celoten naslov profila.",
  },
  {
    kljuc: "facebookUrl",
    oznaka: "Facebook",
    primer: "facebook.com/ImeStrani",
    namig: undefined,
  },
  {
    kljuc: "linkedinUrl",
    oznaka: "LinkedIn",
    primer: "linkedin.com/in/ime-priimek",
    namig: undefined,
  },
  {
    kljuc: "googleUrl",
    oznaka: "Google",
    primer: "g.page/…  ali  maps.app.goo.gl/…",
    namig: "Vpis na Zemljevidu. Pri lokalnem izvajalcu je to najmočnejši zunanji signal.",
  },
] satisfies ReadonlyArray<{
  kljuc: "instagramUrl" | "facebookUrl" | "linkedinUrl" | "googleUrl";
  oznaka: string;
  primer: string;
  namig?: string;
}>;

export function ObrazecNastavitev({ zacetne }: { zacetne: NastavitveStanje }) {
  const [v, nastavi] = useState<NastavitveStanje>(zacetne);
  const [tece, nastaviTece] = useState(false);
  const [napake, nastaviNapake] = useState<Record<string, string[]>>({});
  const [umazano, nastaviUmazano] = useState(false);

  function polje<K extends keyof NastavitveStanje>(k: K, vrednost: NastavitveStanje[K]) {
    nastavi((p) => ({ ...p, [k]: vrednost }));
    nastaviUmazano(true);
  }

  async function oddaj(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    nastaviTece(true);
    nastaviNapake({});

    const izid = await shraniNastavitveAction(v);
    nastaviTece(false);

    if (izid.ok) {
      toast.success(izid.message ?? "Shranjeno.");
      nastaviUmazano(false);
    } else {
      nastaviNapake(izid.fieldErrors ?? {});
      toast.error(izid.message);
    }
  }

  const n = (k: string) => napake[k]?.[0];

  return (
    <form onSubmit={oddaj} className="space-y-6 sm:space-y-8">
      <AdminSection
        icon={<Building2 className="h-5 w-5" aria-hidden />}
        title="Izdajatelj računov"
        description="Kar po zakonu stoji na vsakem računu. Brez tega se PDF ne izdela."
      >
        <FieldGroup
          label="Ime izdajatelja"
          hint="Kakor je v poslovnem registru — tvoje ime ali ime podjetja."
          error={n("izdajateljIme")}
        >
          <Input
            value={v.izdajateljIme}
            onChange={(e) => polje("izdajateljIme", e.target.value)}
            maxLength={160}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup label="Ulica in hišna številka" error={n("izdajateljUlica")}>
          <Input
            value={v.izdajateljUlica}
            onChange={(e) => polje("izdajateljUlica", e.target.value)}
            maxLength={160}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup
          label="Pošta in kraj"
          hint="Na primer »8290 Sevnica«."
          error={n("izdajateljPosta")}
        >
          <Input
            value={v.izdajateljPosta}
            onChange={(e) => polje("izdajateljPosta", e.target.value)}
            maxLength={120}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup
          label="Davčna številka"
          hint="Osem števk. S predpono SI, če si zavezanec za DDV."
          error={n("davcnaStevilka")}
        >
          <Input
            value={v.davcnaStevilka}
            onChange={(e) => polje("davcnaStevilka", e.target.value)}
            maxLength={20}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup label="Matična številka" error={n("maticnaStevilka")}>
          <Input
            value={v.maticnaStevilka}
            onChange={(e) => polje("maticnaStevilka", e.target.value)}
            maxLength={40}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup label="DDV">
          <Checkbox
            checked={v.zavezanecZaDdv}
            onChange={(e) => polje("zavezanecZaDdv", e.target.checked)}
            disabled={tece}
            hint="Če nisi, mora na računu stati klavzula o oprostitvi."
          >
            Sem zavezanec za DDV
          </Checkbox>
        </FieldGroup>

        {v.zavezanecZaDdv ? (
          <FieldGroup
            label="Stopnja DDV"
            hint="Splošna stopnja je 22 %, nižja 9,5 %. Račun mora pokazati osnovo, stopnjo in znesek davka — ne samo vsote."
            error={n("stopnjaDdv")}
          >
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              value={v.stopnjaDdv}
              onChange={(e) => polje("stopnjaDdv", Number(e.target.value))}
              disabled={tece}
              className="max-w-28"
            />
          </FieldGroup>
        ) : null}

        {!v.zavezanecZaDdv ? (
          <FieldGroup
            label="Klavzula o oprostitvi"
            hint="Natisne se na vsak račun. Besedilo je standardno za male davčne zavezance."
            error={n("klavzulaBrezDdv")}
          >
            <Textarea
              value={v.klavzulaBrezDdv}
              onChange={(e) => polje("klavzulaBrezDdv", e.target.value)}
              rows={2}
              maxLength={300}
              disabled={tece}
            />
          </FieldGroup>
        ) : null}
      </AdminSection>

      <AdminSection
        icon={<Landmark className="h-5 w-5" aria-hidden />}
        title="Banka"
        description="Brez IBAN-a stranka nima kam nakazati in na računu ni UPN kode."
      >
        <FieldGroup
          label="IBAN"
          hint="Preverim tudi kontrolno številko — zamenjani števki gresta sicer skozi."
          error={n("iban")}
        >
          <Input
            value={v.iban}
            onChange={(e) => polje("iban", e.target.value)}
            maxLength={40}
            disabled={tece}
            placeholder="SI56 1910 0000 1234 567"
          />
        </FieldGroup>

        <FieldGroup label="Banka" error={n("banka")}>
          <Input
            value={v.banka}
            onChange={(e) => polje("banka", e.target.value)}
            maxLength={120}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup label="BIC / SWIFT" error={n("bic")}>
          <Input
            value={v.bic}
            onChange={(e) => polje("bic", e.target.value)}
            maxLength={20}
            disabled={tece}
          />
        </FieldGroup>
      </AdminSection>

      <AdminSection
        icon={<Phone className="h-5 w-5" aria-hidden />}
        title="Stik"
        description="Na računu in v nogi. Prazno pomeni, da velja to, kar je v kodi."
      >
        <FieldGroup label="Telefon" error={n("telefon")}>
          <Input
            value={v.telefon}
            onChange={(e) => polje("telefon", e.target.value)}
            maxLength={40}
            disabled={tece}
          />
        </FieldGroup>

        <FieldGroup label="E-pošta" error={n("epota")}>
          <Input
            value={v.epota}
            onChange={(e) => polje("epota", e.target.value)}
            type="email"
            maxLength={160}
            disabled={tece}
          />
        </FieldGroup>
      </AdminSection>

      <AdminSection
        icon={<AtSign className="h-5 w-5" aria-hidden />}
        title="Družbena omrežja"
        description="Ikone v nogi strani. Prazno polje pomeni, da se tista ikona ne pokaže — povezava na prazen profil je slabša od povezave, ki je ni."
      >
        {OMREZJA.map((o) => (
          <FieldGroup key={o.kljuc} label={o.oznaka} error={n(o.kljuc)} hint={o.namig}>
            <Input
              value={v[o.kljuc]}
              onChange={(e) => polje(o.kljuc, e.target.value)}
              inputMode="url"
              placeholder={o.primer}
              maxLength={200}
              disabled={tece}
            />
          </FieldGroup>
        ))}
      </AdminSection>

      <AdminSaveBar
        dirty={umazano}
        pending={tece}
        onReset={() => {
          nastavi(zacetne);
          nastaviUmazano(false);
        }}
        saveLabel="Shrani nastavitve"
        savingLabel="Shranjujem …"
        cancelLabel="Razveljavi"
        dirtyHint="Neshranjene spremembe"
      />
    </form>
  );
}
