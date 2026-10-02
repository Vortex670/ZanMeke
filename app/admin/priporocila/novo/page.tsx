import { ObrazecPriporocila } from "@/components/admin/priporocila/ObrazecPriporocila";
import { AdminPage } from "@/components/admin/shell/AdminPage";

export const dynamic = "force-dynamic";

export default function NovoPriporocilo() {
  return (
    <AdminPage
      eyebrow="Priporočila"
      title="Novo priporočilo"
      description="Vprašaj stranko, kaj se je pri njej spremenilo, odkar stran dela. Ena poved zadošča."
      backHref="/admin/priporocila"
      backLabel="Priporočila"
    >
      <ObrazecPriporocila />
    </AdminPage>
  );
}
