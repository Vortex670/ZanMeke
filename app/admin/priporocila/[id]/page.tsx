import { notFound } from "next/navigation";

import { ObrazecPriporocila } from "@/components/admin/priporocila/ObrazecPriporocila";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { getPriporocilo } from "@/lib/priporocila/queries";

export const dynamic = "force-dynamic";

export default async function UrediPriporocilo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getPriporocilo(id);
  if (!p) notFound();

  return (
    <AdminPage
      eyebrow="Priporočila"
      title={p.ime}
      description={[p.hisa, p.kraj].filter(Boolean).join(" · ") || undefined}
      backHref="/admin/priporocila"
      backLabel="Priporočila"
    >
      <ObrazecPriporocila zacetno={p} />
    </AdminPage>
  );
}
