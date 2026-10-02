import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminIconLink } from "@/components/admin/kit/AdminIconLink";
import { EntityRowActions } from "@/components/admin/kit/EntityRowActions";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { PageForm } from "@/components/admin/strani/PageForm";
import { deletePageAction } from "@/lib/pages/actions";
import { getPageById } from "@/lib/pages/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const POSODOBLJENO = new Intl.DateTimeFormat("sl-SI", {
  timeZone: "Europe/Ljubljana",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function UrediStranPage({ params }: Props) {
  const { id } = await params;
  const stran = await getPageById(id);
  if (!stran) notFound();

  const objavljena = stran.status === "PUBLISHED";

  return (
    <AdminPage
      eyebrow="Strani"
      title={stran.title}
      description={`gostilnica-plus.si/${stran.slug} · ${
        objavljena ? "objavljena" : "osnutek"
      } · nazadnje urejeno ${POSODOBLJENO.format(stran.updatedAt)}`}
      backHref="/admin/strani"
      backLabel="Strani"
      footerActions={
        <>
          {/* Pogled na stran, kot jo vidi gost — brez tega se popravek
              preverja z ročnim tipkanjem naslova v drug zavihek. */}
          <AdminIconLink
            href={`/${stran.slug}`}
            label="Poglej stran"
            icon={<ExternalLink className="h-4 w-4" aria-hidden />}
            newTab
            disabledReason={objavljena ? undefined : "Osnutek še ni objavljen."}
          />
          <EntityRowActions
            id={stran.id}
            variant="detail"
            listHref="/admin/strani"
            remove={{
              action: deletePageAction,
              successToast: "Stran je izbrisana.",
              confirmTitle: "Izbrišem stran?",
              confirmDescription: `»${stran.title}« bo za vedno izbrisana, skupaj z besedilom.`,
            }}
          />
        </>
      }
    >
      <PageForm
        initial={{
          id: stran.id,
          slug: stran.slug,
          title: stran.title,
          body: stran.body,
          excerpt: stran.excerpt,
          seoTitle: stran.seoTitle,
          seoDescription: stran.seoDescription,
          status: stran.status,
          showInFooter: stran.showInFooter,
          showInMenu: stran.showInMenu,
          sortOrder: stran.sortOrder,
          menuOrder: stran.menuOrder,
        }}
      />
    </AdminPage>
  );
}
