"use client";

import { FileText, Globe, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminSaveBar } from "@/components/admin/kit/AdminSaveBar";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import { FieldGroup, FieldGroupAligned } from "@/components/admin/kit/FieldGroup";
import { RichTextEditor } from "@/components/admin/kit/RichTextEditor";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { Textarea } from "@/components/ui/Textarea";
import { useActionForm } from "@/lib/forms/useActionForm";
import { slugify } from "@/lib/validation/slug";
import { savePageAction } from "@/lib/pages/actions";
import { PAGE_MAX } from "@/lib/pages/validation";

// ============================================================================
// <PageForm /> — urejanje strani (pravna besedila in vse ostalo)
// ----------------------------------------------------------------------------
// Isti vzorec kot na zanmeke.com in second-home.hr: nadzorovana polja v enem
// zapisu, `FieldGroup` s števcem znakov, na dnu `AdminSaveBar`, ki se prilepi
// takoj, ko so spremembe neshranjene — da gumba nikoli ne iščeš z drsnikom.
//
// SEO polji imata števec, ker sta meji Googlovi in ne naši: kar je čez, se v
// rezultatih iskanja ne pokaže.
// ============================================================================

export type PageFormInitial = {
  id: string;
  slug: string;
  title: string;
  body: string;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: "DRAFT" | "PUBLISHED";
  showInFooter: boolean;
  showInMenu: boolean;
  sortOrder: number;
  menuOrder: number;
};

type Values = {
  slug: string;
  title: string;
  body: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  status: "DRAFT" | "PUBLISHED";
  showInFooter: boolean;
  showInMenu: boolean;
  sortOrder: string;
  menuOrder: string;
};

function toValues(initial?: PageFormInitial): Values {
  return {
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    body: initial?.body ?? "",
    excerpt: initial?.excerpt ?? "",
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
    status: initial?.status ?? "DRAFT",
    showInFooter: initial?.showInFooter ?? false,
    showInMenu: initial?.showInMenu ?? false,
    sortOrder: String(initial?.sortOrder ?? 0),
    menuOrder: String(initial?.menuOrder ?? 0),
  };
}

/**
 * Strani, katerih besedilo sestavi `scripts/posodobi-pravne-strani.ts`.
 *
 * Ročni popravek tu naslednji zagon skripta povozi — to je treba povedati
 * VNAPREJ in ne šele takrat, ko besedilo izgine.
 */
const SESTAVLJENE = new Set(["piskotki", "zasebnost", "pogoji-uporabe"]);

export function PageForm({ initial }: { initial?: PageFormInitial }) {
  const zacetne = useMemo(() => toValues(initial), [initial]);
  const [values, setValues] = useState<Values>(zacetne);
  // Ko naslov enkrat popraviš na roko, ga preimenovanje strani ne povozi —
  // spletni naslov je morda že kje objavljen.
  const [slugRocno, setSlugRocno] = useState(Boolean(initial));

  const form = useActionForm(savePageAction, {
    redirectTo: "/admin/strani",
    refreshOnSuccess: true,
  });

  const dirty = useMemo(
    () =>
      (Object.keys(zacetne) as Array<keyof Values>).some(
        (k) => values[k] !== zacetne[k],
      ),
    [values, zacetne],
  );
  const busy = form.pending;

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function onTitle(value: string) {
    setValues((prev) => ({
      ...prev,
      title: value,
      slug: slugRocno ? prev.slug : slugify(value),
    }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.submit({
          id: initial?.id,
          ...values,
          sortOrder: Number(values.sortOrder || 0),
          menuOrder: Number(values.menuOrder || 0),
        });
      }}
      className="flex flex-col gap-(--s3)"
    >
      <AdminSection
        icon={<FileText className="h-5 w-5" aria-hidden />}
        title="Vsebina"
        description="Naslov, spletni naslov in besedilo strani."
      >
        <div className="grid gap-(--s3) sm:grid-cols-2">
          <FieldGroup
            label="Naslov"
            htmlFor="title"
            required
            error={form.fieldErrors.title}
            charCount={values.title.length}
            charMax={PAGE_MAX.title}
          >
            <Input
              id="title"
              value={values.title}
              onChange={(e) => onTitle(e.target.value)}
              maxLength={PAGE_MAX.title}
              required
              disabled={busy}
              placeholder="Politika zasebnosti"
            />
          </FieldGroup>

          <FieldGroup
            label="Spletni naslov"
            htmlFor="slug"
            required
            error={form.fieldErrors.slug}
            hint={
              values.slug
                ? `gostilnica-plus.si/${values.slug}`
                : "Se izpolni sam iz naslova."
            }
          >
            <Input
              id="slug"
              value={values.slug}
              onChange={(e) => {
                setSlugRocno(true);
                set("slug", e.target.value);
              }}
              required
              disabled={busy}
              placeholder="politika-zasebnosti"
            />
          </FieldGroup>
        </div>

        <FieldGroup
          label="Povzetek"
          htmlFor="excerpt"
          error={form.fieldErrors.excerpt}
          hint="Ena ali dve vrstici. Uporabi se v seznamih in kot zasilni opis za iskalnike."
          charCount={values.excerpt.length}
          charMax={PAGE_MAX.excerpt}
        >
          <Textarea
            id="excerpt"
            value={values.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            maxLength={PAGE_MAX.excerpt}
            rows={2}
            disabled={busy}
          />
        </FieldGroup>

        {SESTAVLJENE.has(values.slug) ? (
          <p className="border-warning/30 bg-warning/10 text-text type-small rounded-xl border px-(--s3) py-(--s2)">
            Besedilo te strani sestavi skript iz seznama piškotkov, obdelovalcev in
            rokov hrambe (<code className="font-mono">npm run pravne</code>). Kar
            popraviš tukaj, bo naslednji zagon povozil — trajne spremembe vpiši v{" "}
            <code className="font-mono">lib/legal/content.ts</code>.
          </p>
        ) : null}

        <FieldGroup label="Besedilo" error={form.fieldErrors.body}>
          <RichTextEditor
            value={values.body}
            onChange={(html) => set("body", html)}
            ariaLabel="Besedilo strani"
            placeholder="Napiši vsebino strani…"
            minHeightRem={20}
            disabled={busy}
          />
        </FieldGroup>
      </AdminSection>

      <AdminSection
        icon={<Globe className="h-5 w-5" aria-hidden />}
        title="Objava in povezave"
        description="Kje se povezava do strani pokaže. Osnutka ne vidi nihče."
      >
        <div className="grid gap-(--s3) sm:grid-cols-2">
          <FieldGroup label="Stanje">
            <SelectMenu
              value={values.status}
              onValueChange={(v) => set("status", v as Values["status"])}
              disabled={busy}
              options={[
                {
                  value: "DRAFT",
                  label: "Osnutek",
                  description: "Vidna samo tu v adminu",
                },
                {
                  value: "PUBLISHED",
                  label: "Objavljeno",
                  description: "Dosegljiva vsem",
                },
              ]}
            />
          </FieldGroup>
        </div>

        <div className="grid grid-cols-1 gap-(--s3) sm:grid-cols-2 sm:items-start">
          <FieldGroupAligned>
            <Checkbox
              name="showInFooter"
              checked={values.showInFooter}
              onChange={(e) => set("showInFooter", e.target.checked)}
              hint="Tu stojijo piškotki, zasebnost in pogoji uporabe."
              disabled={busy}
            >
              Povezava v nogi
            </Checkbox>
          </FieldGroupAligned>
          <FieldGroup
            label="Vrstni red v nogi"
            htmlFor="sortOrder"
            error={form.fieldErrors.sortOrder}
            hint="Manjša številka je bolj levo."
          >
            <Input
              id="sortOrder"
              type="number"
              min={0}
              max={999}
              value={values.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
              className="tabular-nums"
              disabled={busy || !values.showInFooter}
            />
          </FieldGroup>
        </div>

        <div className="border-border/60 grid grid-cols-1 gap-(--s3) border-t pt-(--s3) sm:grid-cols-2 sm:items-start">
          <FieldGroupAligned>
            <Checkbox
              name="showInMenu"
              checked={values.showInMenu}
              onChange={(e) => set("showInMenu", e.target.checked)}
              hint="Za strani, ki jih ima gostilna po meri."
              disabled={busy}
            >
              Povezava v glavnem meniju
            </Checkbox>
          </FieldGroupAligned>
          <FieldGroup
            label="Vrstni red v meniju"
            htmlFor="menuOrder"
            error={form.fieldErrors.menuOrder}
            hint="Manjša številka je prej."
          >
            <Input
              id="menuOrder"
              type="number"
              min={0}
              max={999}
              value={values.menuOrder}
              onChange={(e) => set("menuOrder", e.target.value)}
              className="tabular-nums"
              disabled={busy || !values.showInMenu}
            />
          </FieldGroup>
        </div>
      </AdminSection>

      <AdminSection
        icon={<Search className="h-5 w-5" aria-hidden />}
        title="Iskalniki"
        description="Prazno polje pomeni, da se uporabita naslov in povzetek od zgoraj."
        collapsible
        defaultOpen={Boolean(initial?.seoTitle || initial?.seoDescription)}
      >
        <FieldGroup
          label="Naslov za iskalnik"
          htmlFor="seoTitle"
          error={form.fieldErrors.seoTitle}
          hint="Google daljše odreže."
          charCount={values.seoTitle.length}
          charMax={PAGE_MAX.seoTitle}
        >
          <Input
            id="seoTitle"
            value={values.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
            maxLength={PAGE_MAX.seoTitle}
            disabled={busy}
          />
        </FieldGroup>

        <FieldGroup
          label="Opis za iskalnik"
          htmlFor="seoDescription"
          error={form.fieldErrors.seoDescription}
          hint="Google daljše odreže."
          charCount={values.seoDescription.length}
          charMax={PAGE_MAX.seoDescription}
        >
          <Textarea
            id="seoDescription"
            value={values.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
            maxLength={PAGE_MAX.seoDescription}
            rows={2}
            disabled={busy}
          />
        </FieldGroup>
      </AdminSection>

      <AdminSaveBar
        dirty={dirty || !initial}
        pending={form.pending}
        onReset={() => setValues(zacetne)}
        saveLabel={initial ? "Shrani" : "Ustvari stran"}
        savingLabel="Shranjujem…"
        cancelLabel="Razveljavi"
        dirtyHint="Neshranjene spremembe"
      />
    </form>
  );
}
