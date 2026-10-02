"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AdminSaveBar } from "@/components/admin/kit/AdminSaveBar";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import { FieldGroup } from "@/components/admin/kit/FieldGroup";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/Input";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { Textarea } from "@/components/ui/Textarea";
import { ustvariRacunAction } from "@/lib/racuni/actions";
import { NAJVEC_EUR, NAJMANJ_EUR } from "@/lib/racuni/validation";

// ============================================================================
// <RacunForm /> — nov račun
// ----------------------------------------------------------------------------
// Pet polj in nič več. Vsako dodatno polje je ena stvar več, ki jo je treba
// izpolniti, preden se povezava sploh lahko pošlje — in račun, ki ga ni, se
// ne plača.
//
// Znesek se vpisuje v EVRIH, shrani pa v centih. Pretvorba je na enem mestu
// (`vCente`), ker je zaokroževanje denarja v JavaScriptu redna past: 19,99 je
// v resnici 19,989999999999998.
//
// Številka računa se ne vpisuje — določi jo strežnik po zaporedju v letu.
// Dve ročno vpisani isti številki bi bili za računovodstvo težava, ki se
// odkrije mesece pozneje.
// ============================================================================

export function RacunForm() {
  const router = useRouter();
  const [tece, nastaviTece] = useState(false);
  const [zapadlost, nastaviZapadlost] = useState("");
  const [vrsta, nastaviVrsto] = useState<"RACUN" | "PREDRACUN">("RACUN");
  // Rok v preteklosti nima pomena — račun z njim je že ob izdaji zapadel.
  const danes = new Date().toISOString().slice(0, 10);
  const [napake, nastaviNapake] = useState<Record<string, string[]>>({});

  async function oddaj(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    nastaviTece(true);
    nastaviNapake({});

    const izid = await ustvariRacunAction({
      vrsta,
      stranka: String(f.get("stranka") ?? ""),
      podjetje: String(f.get("podjetje") ?? ""),
      epota: String(f.get("epota") ?? ""),
      opis: String(f.get("opis") ?? ""),
      znesek: Number(String(f.get("znesek") ?? "").replace(",", ".")),
      zapadlost,
    });

    nastaviTece(false);
    if (izid.ok) {
      toast.success(izid.message ?? "Račun je pripravljen.");
      router.push("/admin/racuni");
      router.refresh();
    } else {
      nastaviNapake(izid.fieldErrors ?? {});
      toast.error(izid.message);
    }
  }

  const napaka = (polje: string) => napake[polje]?.[0];

  return (
    <form onSubmit={oddaj} className="space-y-6 sm:space-y-8">
      <AdminSection
        icon={<FileText className="h-5 w-5" aria-hidden />}
        title="Vrsta listine"
        description="Predračun je ponudba za plačilo, račun je davčni dokument. Zaporedji sta ločeni."
      >
        <FieldGroup label="Kaj izdajaš">
          <SelectMenu
            value={vrsta}
            onValueChange={nastaviVrsto}
            disabled={tece}
            options={[
              { value: "RACUN", label: "Račun" },
              { value: "PREDRACUN", label: "Predračun" },
            ]}
          />
        </FieldGroup>
      </AdminSection>

      <AdminSection
        icon={<FileText className="h-5 w-5" aria-hidden />}
        title="Komu in za kaj"
        description="To vidi stranka na plačilni strani."
      >
        <FieldGroup label="Stranka" hint="Ime osebe ali hiše." error={napaka("stranka")}>
          <Input name="stranka" required maxLength={120} disabled={tece} />
        </FieldGroup>

        <FieldGroup label="Podjetje" error={napaka("podjetje")}>
          <Input name="podjetje" maxLength={160} disabled={tece} />
        </FieldGroup>

        <FieldGroup
          label="E-pošta"
          hint="Nanjo Stripe pošlje potrdilo o plačilu. Brez nje ga stranka vpiše sama."
          error={napaka("epota")}
        >
          <Input name="epota" type="email" maxLength={160} disabled={tece} />
        </FieldGroup>

        <FieldGroup
          label="Kaj se plačuje"
          hint="Na primer: »Spletna stran za Gostilnico Plus — prva polovica«."
          error={napaka("opis")}
        >
          <Textarea name="opis" required maxLength={300} rows={3} disabled={tece} />
        </FieldGroup>
      </AdminSection>

      <AdminSection
        icon={<FileText className="h-5 w-5" aria-hidden />}
        title="Znesek in rok"
        description="Znesek v evrih, z DDV, kakor ga stranka plača."
      >
        <FieldGroup label="Znesek (€)" error={napaka("znesek")}>
          <Input
            name="znesek"
            type="number"
            step="0.01"
            min={NAJMANJ_EUR}
            max={NAJVEC_EUR}
            required
            disabled={tece}
            inputMode="decimal"
          />
        </FieldGroup>

        <FieldGroup
          label="Rok plačila"
          hint="Neobvezno. Prazno pomeni brez roka."
          error={napaka("zapadlost")}
        >
          {/* NAŠ KOLEDAR in ne `input type="date"`: brskalnikov koledar je v
              vsakem drugačen, v Safariju na Macu pa je zgolj tri drsna
              kolesca. Primitiv je isti kot na gostilnica-plus.si, zato je
              izbira datuma povsod enaka. */}
          <DatePicker
            name="zapadlost"
            value={zapadlost}
            onValueChange={nastaviZapadlost}
            placeholder="Brez roka"
            disabled={tece}
            min={danes}
          />
        </FieldGroup>
      </AdminSection>

      <AdminSaveBar
        dirty
        pending={tece}
        saveLabel={vrsta === "PREDRACUN" ? "Ustvari predračun" : "Ustvari račun"}
        savingLabel="Ustvarjam …"
        cancelLabel="Prekliči"
        onReset={() => router.push("/admin/racuni")}
        dirtyHint="Listina nastane kot osnutek — povezavo pošlješ ti."
      />
    </form>
  );
}
